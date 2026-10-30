import { NextResponse, type NextRequest } from 'next/server'
import { isArchived } from './lib/store'

const GONE_HTML = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="robots" content="noindex"><title>Yayında değil</title></head>
<body><p>Bu işletme artık yayında değil.</p></body></html>`

// Sayfa bileşeni 410 dönemediği için arşiv kontrolü burada yapılır.
// POC_PROXY_410=0 ile kapatılınca sayfanın kendi davranışı (404) ölçülür.
export function proxy(req: NextRequest) {
  if (process.env.POC_PROXY_410 === '0') return NextResponse.next()
  const match = req.nextUrl.pathname.match(/^\/([^/]+)\/([^/]+)$/)
  if (match && isArchived(match[1], match[2])) {
    return new NextResponse(GONE_HTML, {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        'X-Robots-Tag': 'noindex',
      },
    })
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/((?!_next|api|maplibre|tiles).*)',
}
