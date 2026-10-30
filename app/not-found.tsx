// Next.js'in hazır 404 sayfası satır içi stil kullanır ve style-src 'self' kuralını ihlal eder.
export default function NotFound() {
  return (
    <>
      <h1>Sayfa bulunamadı</h1>
      <p>Aradığınız sayfa yok.</p>
    </>
  )
}
