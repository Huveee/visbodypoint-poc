import Link from 'next/link'
import { HydrationBadge } from '../components/HydrationBadge'
import { MapView } from '../components/MapView'
import { listAll } from '../lib/points'

export const revalidate = 3600

export default async function Home() {
  const points = await listAll()
  return (
    <>
      <h1>Visbodypoint PoC</h1>
      <HydrationBadge />
      <MapView points={points} />
      <ul>
        {points.map((p) => (
          <li key={p.slug}>
            <Link href={`/${p.il}/${p.slug}`}>{p.name}</Link> · {p.district}
          </li>
        ))}
      </ul>
    </>
  )
}
