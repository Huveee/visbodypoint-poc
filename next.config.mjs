const sri = process.env.POC_SRI === '1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ADR-043: çıktı standalone olmalı.
  output: 'standalone',
  distDir: sri ? '.next-sri' : '.next',
  ...(sri ? { experimental: { sri: { algorithm: 'sha256' } } } : {}),
  async headers() {
    // §7.6: HTML ve JSON için paylaşılan önbellek yok.
    const fresh = [
      { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=0, must-revalidate' },
    ]
    const il = ':il((?!api|maplibre|tiles|_next|poc-admin)[^/.]+)'
    return ['/', `/${il}`, `/${il}/:slug`, '/api/points', '/sitemap.xml'].map((source) => ({
      source,
      headers: fresh,
    }))
  },
}

export default nextConfig
