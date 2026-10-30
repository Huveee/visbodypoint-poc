// Derlenmiş standalone uygulamayı ve ters vekili birlikte başlatır.
//   node scripts/serve.mjs        -> uygulama :3000, vekil :3101-3104
//   node scripts/serve.mjs --sri  -> SRI derlemesi :3200, vekil :3201-3204
import { spawn } from 'node:child_process'
import { cpSync, existsSync } from 'node:fs'
import path from 'node:path'

const sri = process.argv.includes('--sri')
const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, sri ? '.next-sri' : '.next')
const standalone = path.join(dist, 'standalone')
const appPort = sri ? 3200 : 3000

if (!existsSync(path.join(standalone, 'server.js'))) {
  console.error(`Derleme yok: ${standalone}. Önce npm run build.`)
  process.exit(1)
}

// Standalone çıktısı statik dosyaları kendiliğinden kopyalamaz.
const staticTarget = path.join(standalone, path.basename(dist), 'static')
cpSync(path.join(dist, 'static'), staticTarget, { recursive: true })
cpSync(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true })

const app = spawn(process.execPath, ['server.js'], {
  cwd: standalone,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: String(appPort),
    HOSTNAME: '127.0.0.1',
    POC_DATA_DIR: path.join(root, 'data'),
    POC_PROXY_410: process.argv.includes('--no-410') ? '0' : '1',
  },
})
const edge = spawn(process.execPath, [path.join(root, 'scripts', 'edge.mjs')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    POC_UPSTREAM_PORT: String(appPort),
    POC_EDGE_PORTS: sri ? '3201,3202,3203,3204' : '3101,3102,3103,3104',
  },
})

const stop = () => {
  app.kill()
  edge.kill()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
app.on('exit', stop)
