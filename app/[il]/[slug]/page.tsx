import { notFound } from 'next/navigation'
import { HydrationBadge } from '../../../components/HydrationBadge'
import { getPoint } from '../../../lib/points'
import { readAll } from '../../../lib/store'

export const revalidate = 3600

export function generateStaticParams() {
  return readAll().map(({ il, slug }) => ({ il, slug }))
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ il: string; slug: string }>
}) {
  const { il, slug } = await params
  const point = await getPoint(il, slug)
  if (!point || point.status === 'arsiv') notFound()
  return (
    <>
      <h1 id="point-name">{point.name}</h1>
      <p>
        {point.district}, {point.il}
      </p>
      <p>Üretim zamanı: {new Date().toISOString()}</p>
      <HydrationBadge />
    </>
  )
}
