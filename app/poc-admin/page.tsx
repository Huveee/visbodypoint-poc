import { readAll } from '../../lib/store'
import { archivePoint } from './actions'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return (
    <>
      <h1>Deneme paneli</h1>
      <ul>
        {readAll().map((p) => (
          <li key={p.slug}>
            {p.name} · {p.status}{' '}
            {p.status === 'yayinda' && (
              <form action={archivePoint}>
                <input type="hidden" name="il" value={p.il} />
                <input type="hidden" name="slug" value={p.slug} />
                <button id={`archive-${p.slug}`}>Arşivle</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
