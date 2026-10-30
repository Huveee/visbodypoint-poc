// nginx yerine geçen küçük ters vekil. Her portta farklı bir CSP sunar.
//   kati       : şartnamedeki hali (§8.2) script-src 'self', style-src 'self'
//   hash       : aynı kural + yalnız Next.js kalıplarına uyan betiklerin SHA-256 özeti
//   unsafe     : Next.js'in nonce'suz resmî örneği, 'unsafe-inline'
//   hash-saf   : aynı kural + sayfadaki HER satır içi betiğin özeti (güvensiz, karşılaştırma için)
import { createHash } from 'node:crypto'
import http from 'node:http'

const UPSTREAM_PORT = Number(process.env.POC_UPSTREAM_PORT ?? 3000)
const PORTS = (process.env.POC_EDGE_PORTS ?? '3101,3102,3103,3104').split(',').map(Number)
const VARIANTS = ['kati', 'hash', 'unsafe', 'hash-saf']

// Next.js'in ürettiği satır içi betikler. Son kalıp yalnız bir JSON metni taşır, kod çalıştıramaz.
const NEXT_INLINE = [
  /^\(globalThis\["TURBOPACK"\] \|\| \(globalThis\["TURBOPACK"\] = \[\]\)\)\.push\(\{"otherChunks":\[(?:"static\/chunks\/[\w.-]+\.js",?)+\],"runtimeModuleIds":\[[\d,]+\]\}\);$/,
  /^\(self\.__next_f=self\.__next_f\|\|\[\]\)\.push\(\[0\]\)$/,
  /^self\.__next_f\.push\(\[\d+,"(?:[^"\\]|\\.)*"\]\)$/,
]
const isNextInline = (body) => NEXT_INLINE.some((re) => re.test(body))

const csp = (scriptExtra = '', styleExtra = '') =>
  [
    `script-src 'self'${scriptExtra}`,
    `style-src 'self'${styleExtra}`,
    `worker-src 'self' blob:`,
    `child-src blob:`,
    `img-src 'self' data: blob:`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
  ].join('; ')

const sha = (text) => ` 'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`

const inlineScripts = (html) =>
  [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attrs, body]) => !/\bsrc=/.test(attrs) && body.length > 0)
    .map(([, , body]) => body)

const policyFor = (variant, html) => {
  const scripts = inlineScripts(html)
  if (variant === 'hash') return csp(scripts.filter(isNextInline).map(sha).join(''))
  if (variant === 'hash-saf') return csp(scripts.map(sha).join(''))
  if (variant === 'unsafe') return csp(` 'unsafe-inline'`, ` 'unsafe-inline'`)
  return csp()
}

const handler = (variant) => (req, res) => {
  // Next.js, Server Action'larda origin ile bu başlığı karşılaştırır (CSRF koruması).
  // ADR-044: başlığı istemci değil, vekil yazar.
  const headers = { ...req.headers, 'x-forwarded-host': req.headers.host }
  delete headers['x-middleware-subrequest'] // ADR-042
  delete headers['accept-encoding']

  const upstream = http.request(
    { host: '127.0.0.1', port: UPSTREAM_PORT, path: req.url, method: req.method, headers },
    (up) => {
      const chunks = []
      up.on('data', (c) => chunks.push(c))
      up.on('end', () => {
        const body = Buffer.concat(chunks)
        const out = { ...up.headers }
        delete out['transfer-encoding']
        out['content-length'] = body.length

        if (String(up.headers['content-type'] ?? '').includes('text/html')) {
          const html = body.toString('utf8')
          const scripts = inlineScripts(html)
          out['x-edge-inline-scripts'] = String(scripts.length)
          out['x-edge-rejected-inline'] = String(scripts.filter((s) => !isNextInline(s)).length)
          out['content-security-policy'] = policyFor(variant, html)
        }
        res.writeHead(up.statusCode, out)
        res.end(body)
      })
    },
  )
  upstream.on('error', (e) => {
    res.writeHead(502)
    res.end(String(e))
  })
  req.pipe(upstream)
}

PORTS.forEach((port, i) => {
  http
    .createServer(handler(VARIANTS[i]))
    .listen(port, '127.0.0.1', () => console.log(`edge ${VARIANTS[i]} -> :${port}`))
})
