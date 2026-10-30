import type { ReactNode } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import './globals.css'

export const metadata = { title: 'Visbodypoint PoC' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
