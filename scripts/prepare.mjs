// Derleme öncesi: örnek veriyi sıfırlar, worker'ı kopyalar, küçük PMTiles dosyasını üretir.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const at = (...p) => path.join(root, ...p)

copyFileSync(at('data/points.seed.json'), at('data/points.json'))

mkdirSync(at('public/maplibre'), { recursive: true })
copyFileSync(
  at('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs'),
  at('public/maplibre/maplibre-gl-worker.mjs'),
)

// Türkiye'nin kaba, temsilî sınırı (lon, lat). Gerçek harita verisi değildir.
const OUTLINE = [
  [26.0, 40.0], [26.2, 41.7], [28.0, 42.0], [29.1, 41.2], [31.4, 41.3], [33.4, 42.0],
  [35.2, 42.0], [36.9, 41.3], [38.4, 40.9], [41.5, 41.5], [43.4, 41.1], [44.8, 39.7],
  [44.4, 37.6], [42.3, 37.1], [38.0, 36.8], [36.6, 36.2], [36.0, 36.6], [34.6, 36.7],
  [32.5, 36.1], [30.6, 36.8], [29.1, 36.2], [27.4, 36.7], [26.3, 38.3],
]
const EXTENT = 65536

const varint = (n) => {
  const out = []
  while (n >= 128) {
    out.push((n % 128) | 128)
    n = Math.floor(n / 128)
  }
  out.push(n)
  return Buffer.from(out)
}
const zigzag = (n) => (n << 1) ^ (n >> 31)
const lenField = (field, buf) => Buffer.concat([varint((field << 3) | 2), varint(buf.length), buf])
const intField = (field, n) => Buffer.concat([varint(field << 3), varint(n)])

const project = ([lon, lat]) => {
  const rad = (lat * Math.PI) / 180
  return [
    Math.round(((lon + 180) / 360) * EXTENT),
    Math.round(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * EXTENT),
  ]
}

// MVT dış halkası, tile koordinatlarında pozitif alan ister.
let ring = OUTLINE.map(project)
const area = ring.reduce((sum, [x, y], i) => {
  const [nx, ny] = ring[(i + 1) % ring.length]
  return sum + (nx - x) * (ny + y)
}, 0)
if (area > 0) ring = ring.reverse()

const commands = [(1 << 3) | 1]
let [cx, cy] = [0, 0]
ring.forEach(([x, y], i) => {
  commands.push(zigzag(x - cx), zigzag(y - cy))
  ;[cx, cy] = [x, y]
  if (i === 0) commands.push(((ring.length - 1) << 3) | 2)
})
commands.push((1 << 3) | 7)

const feature = Buffer.concat([
  intField(1, 1),
  intField(3, 3),
  lenField(4, Buffer.concat(commands.map(varint))),
])
const layer = Buffer.concat([
  lenField(1, Buffer.from('turkiye')),
  lenField(2, feature),
  intField(5, EXTENT),
  intField(15, 2),
])
const tile = lenField(3, layer)

// PMTiles v3: 127 baytlık başlık + kök dizin + metadata + tek tile (z0/0/0).
const dir = Buffer.concat([varint(1), varint(0), varint(1), varint(tile.length), varint(1)])
const metadata = Buffer.from(
  JSON.stringify({ vector_layers: [{ id: 'turkiye', fields: {}, minzoom: 0, maxzoom: 0 }] }),
)
const header = Buffer.alloc(127)
header.write('PMTiles', 0, 'latin1')
header.writeUInt8(3, 7)
const u64 = (offset, value) => header.writeBigUInt64LE(BigInt(value), offset)
const dirOffset = 127
const metaOffset = dirOffset + dir.length
const tileOffset = metaOffset + metadata.length
u64(8, dirOffset)
u64(16, dir.length)
u64(24, metaOffset)
u64(32, metadata.length)
u64(40, 0)
u64(48, 0)
u64(56, tileOffset)
u64(64, tile.length)
u64(72, 1)
u64(80, 1)
u64(88, 1)
header.writeUInt8(1, 96) // kümelenmiş
header.writeUInt8(1, 97) // dizin sıkıştırması yok
header.writeUInt8(1, 98) // tile sıkıştırması yok
header.writeUInt8(1, 99) // MVT
header.writeUInt8(0, 100)
header.writeUInt8(0, 101)
const e7 = (offset, value) => header.writeInt32LE(Math.round(value * 1e7), offset)
e7(102, 25)
e7(106, 35)
e7(110, 45)
e7(114, 43)
header.writeUInt8(0, 118)
e7(119, 35)
e7(123, 39)

mkdirSync(at('public/tiles'), { recursive: true })
writeFileSync(
  at('public/tiles/turkiye-fixture.pmtiles'),
  Buffer.concat([header, dir, metadata, tile]),
)
console.log('hazir: veri, worker, pmtiles')
