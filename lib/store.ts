import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export type Point = {
  il: string
  slug: string
  name: string
  district: string
  lat: number
  lng: number
  status: 'yayinda' | 'arsiv'
}

// Veritabanının yerini tutan JSON dosyası.
const dataFile = () =>
  path.join(process.env.POC_DATA_DIR ?? path.join(process.cwd(), 'data'), 'points.json')

export const readAll = (): Point[] => JSON.parse(readFileSync(dataFile(), 'utf8'))

export function updatePoint(il: string, slug: string, patch: Partial<Point>) {
  const all = readAll().map((p) => (p.il === il && p.slug === slug ? { ...p, ...patch } : p))
  writeFileSync(dataFile(), JSON.stringify(all, null, 2))
}

export const isArchived = (il: string, slug: string) =>
  readAll().some((p) => p.il === il && p.slug === slug && p.status === 'arsiv')
