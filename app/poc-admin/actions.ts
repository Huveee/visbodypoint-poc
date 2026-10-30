'use server'

import { updateTag } from 'next/cache'
import { tagsFor } from '../../lib/points'
import { updatePoint } from '../../lib/store'

// ADR-042: Server Action içinden arşiv updateTag ile anında düşer.
export async function archivePoint(formData: FormData) {
  const il = String(formData.get('il'))
  const slug = String(formData.get('slug'))
  updatePoint(il, slug, { status: 'arsiv' })
  for (const tag of tagsFor(il, slug)) updateTag(tag)
}
