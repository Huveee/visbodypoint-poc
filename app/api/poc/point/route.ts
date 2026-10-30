import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { tagsFor } from '../../../../lib/points'
import { updatePoint } from '../../../../lib/store'

// Admin işleminin yerini tutan deneme ucu. Gerçek panelde requireAdmin olur.
export async function POST(req: Request) {
  const { il, slug, op, name } = await req.json()

  if (op === 'archive' || op === 'publish') {
    updatePoint(il, slug, { status: op === 'archive' ? 'arsiv' : 'yayinda' })
    // ADR-042: route handler'dan anında düşürme.
    for (const tag of tagsFor(il, slug)) revalidateTag(tag, { expire: 0 })
  } else if (op === 'rename') {
    updatePoint(il, slug, { name })
    // ADR-042: normal profil düzenlemesi bayat sunarken yenilenir.
    for (const tag of tagsFor(il, slug)) revalidateTag(tag, 'max')
  } else {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
