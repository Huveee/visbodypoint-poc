import { unstable_cache } from 'next/cache'
import { readAll } from './store'

// §7.5'teki etiketler: her yüzey kendi etiketiyle önbelleğe alınır.
export const getPoint = (il: string, slug: string) =>
  unstable_cache(
    async () => readAll().find((p) => p.il === il && p.slug === slug) ?? null,
    ['point', il, slug],
    { tags: [`point.${slug}`] },
  )()

export const listCity = (il: string) =>
  unstable_cache(
    async () => readAll().filter((p) => p.il === il && p.status === 'yayinda'),
    ['city', il],
    { tags: [`city.${il}`] },
  )()

export const listAll = () =>
  unstable_cache(async () => readAll().filter((p) => p.status === 'yayinda'), ['map'], {
    tags: ['map'],
  })()

export const listSitemap = () =>
  unstable_cache(async () => readAll().filter((p) => p.status === 'yayinda'), ['sitemap'], {
    tags: ['sitemap'],
  })()

export const tagsFor = (il: string, slug: string) => [
  `point.${slug}`,
  `city.${il}`,
  'map',
  'sitemap',
]
