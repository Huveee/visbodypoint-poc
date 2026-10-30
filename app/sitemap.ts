import type { MetadataRoute } from 'next'
import { listSitemap } from '../lib/points'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const points = await listSitemap()
  return points.map((p) => ({ url: `https://visbodypoint.localhost/${p.il}/${p.slug}` }))
}
