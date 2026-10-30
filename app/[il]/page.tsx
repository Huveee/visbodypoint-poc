import Link from 'next/link'
import { listCity } from '../../lib/points'
import { readAll } from '../../lib/store'

export const revalidate = 3600

export function generateStaticParams() {
  return [...new Set(readAll().map((p) => p.il))].map((il) => ({ il }))
}

export default async function CityPage({ params }: { params: Promise<{ il: string }> }) {
  const { il } = await params
  const points = await listCity(il)
  return (
    <>
      <h1>{il}</h1>
      <ul id="city-list">
        {points.map((p) => (
          <li key={p.slug}>
            <Link href={`/${p.il}/${p.slug}`}>{p.name}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
