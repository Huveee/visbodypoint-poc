// Kabul testi 5'in küçük hali: arşivden sonraki İLK istek bile eski içeriği görmemeli.
//   node scripts/test-archive.mjs http://127.0.0.1:3000
const base = process.argv[2] ?? 'http://127.0.0.1:3000'
const point = { il: 'istanbul', slug: 'ornek-kadikoy' }

const surfaces = {
  profil: `/${point.il}/${point.slug}`,
  'il sayfası': `/${point.il}`,
  'ana sayfa': '/',
  'liste API': '/api/points',
  sitemap: '/sitemap.xml',
}

const inspect = async (path) => {
  const res = await fetch(base + path, { redirect: 'manual', cache: 'no-store' })
  const body = await res.text()
  return {
    status: res.status,
    gorunuyor: body.includes(point.slug) || body.includes('Örnek Point Kadıköy'),
    onbellek: res.headers.get('x-nextjs-cache') ?? '-',
    body,
    headers: res.headers,
  }
}

const report = async (title) => {
  console.log(`\n--- ${title}`)
  for (const [name, path] of Object.entries(surfaces)) {
    const r = await inspect(path)
    console.log(
      `${name.padEnd(11)} ${r.status}  işletme görünüyor: ${r.gorunuyor ? 'EVET' : 'hayır'}  sunucu önbelleği: ${r.onbellek}`,
    )
  }
}

const admin = async (op, extra = {}) => {
  const res = await fetch(`${base}/api/poc/point`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...point, op, ...extra }),
  })
  if (!res.ok) throw new Error(`admin ${op}: ${res.status}`)
}

const warm = async () => {
  for (const path of Object.values(surfaces)) {
    await inspect(path)
    await inspect(path)
  }
}

await warm()
await report('1) Başlangıç: yayında, önbellek ısınmış')

await admin('archive')
await report('2) Arşivden hemen sonraki ilk istekler')

const gone = await inspect(surfaces.profil)
console.log('\n410 ayrıntısı:', gone.status, '| Cache-Control:', gone.headers.get('cache-control'))
console.log('X-Robots-Tag:', gone.headers.get('x-robots-tag'), '| metin:', /artık yayında değil/.test(gone.body))

await admin('publish')
await report('3) Yeniden yayından hemen sonraki ilk istekler')

await warm()
await admin('rename', { name: 'Yeni Ad Kadıköy' })
const first = await inspect(surfaces.profil)
await new Promise((r) => setTimeout(r, 1500))
const second = await inspect(surfaces.profil)
console.log('\n--- 4) Normal düzenleme (revalidateTag "max")')
console.log('ilk istek  : yeni ad görünüyor:', first.body.includes('Yeni Ad Kadıköy'), '| önbellek:', first.onbellek)
console.log('1,5 sn sonra: yeni ad görünüyor:', second.body.includes('Yeni Ad Kadıköy'), '| önbellek:', second.onbellek)

await admin('rename', { name: 'Örnek Point Kadıköy' })
