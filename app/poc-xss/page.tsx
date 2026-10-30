import { HydrationBadge } from '../../components/HydrationBadge'

export const revalidate = 3600

// Sızdırılmış kod denemesi: bu iki parça çalışırsa CSP korumuyor demektir.
const INJECTED =
  '<script>window.__pwnedScript = true</script>' +
  '<img src="/yok.png" alt="" onerror="window.__pwnedHandler = true">'

export default function XssProbe() {
  return (
    <>
      <h1>Sızıntı denemesi</h1>
      <HydrationBadge />
      <div dangerouslySetInnerHTML={{ __html: INJECTED }} />
    </>
  )
}
