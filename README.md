# Visbodypoint PoC

Visbodypoint yol haritasındaki (v1.0) en riskli teknik maddeleri, teklif vermeden önce çalışan kodla sınayan küçük bir deneme. Ürünün kendisi değildir: veritabanı yerine JSON dosyası, nginx yerine küçük bir Node vekili ve sahte veri kullanır.

`/poc-xss` bilerek açık bırakılmış bir saldırı denemesidir. `/poc-admin` ve `/api/poc/point` kimlik doğrulaması içermez. Bunlar yalnız yerel deneme içindir, internete açılmamalıdır.

Sürümler: Next.js 16.4.3, Node.js 24.22.2, MapLibre GL 6.16.0, PMTiles 4.5.0.

## Sonuçlar

### 1. Public ISR sayfasında CSP (§8.2, kabul testi 11)

Saldırı sütunları `/poc-xss` sayfasındaki sızdırılmış `<script>` ve `onerror` kodunun çalışıp çalışmadığını gösterir.

| Port | Kural | Uygulama JS'i | Sızan `<script>` | Sızan `onerror` |
|---|---|---|---|---|
| 3101 | `script-src 'self'` (şartnamedeki hali) | Çalışmıyor | Engellendi | Engellendi |
| 3201 | Aynı kural + `experimental.sri` | Çalışmıyor | Engellendi | Engellendi |
| 3102 | Kalıp kontrollü, yanıt başına SHA-256 | Çalışıyor | Engellendi | Engellendi |
| 3104 | Kalıp kontrolsüz, yanıt başına SHA-256 | Çalışıyor | **Çalıştı** | Engellendi |
| 3103 | `'unsafe-inline'` (Next.js'in nonce'suz resmî örneği) | Çalışıyor | **Çalıştı** | **Çalıştı** |

- Next.js ölçülen sayfalara 3-4 satır içi betik gömdü. İki profil sayfası karşılaştırıldığında 4 özetin 2'si farklıydı, bu yüzden özetler önceden listelenemez.
- 3201 satırı son derlemeden önce ölçüldü; diğer satırlar son derlemede tekrarlandı.
- 3102'de ana sayfa, profil ve 404 sayfası temiz sekmede 0 CSP ihlaliyle yüklendi.
- Next.js'in hazır 404 sayfası satır içi stil kullandığı için `style-src 'self'` kuralını ihlal eder. `app/not-found.tsx` bunu çözer. Hazır hata sayfasında da aynı ihlal görüldü; özel `global-error` yazılmadı ve denenmedi.

### 2. Önbellek başlığı (§7.6)

`next.config` `headers()` tek başına yeterlidir. Ana sayfa, il, profil, liste API'si ve sitemap `public, max-age=0, s-maxage=0, must-revalidate` döner; sunucu tarafındaki ISR önbelleği çalışmaya devam eder (`x-nextjs-cache: HIT`).

### 3. Arşiv yayılımı ve 410 (§7.5, kabul testi 5)

- Arşivden sonraki ilk istekte işletme beş yüzeyin hiçbirinde görünmez. Hem route handler (`revalidateTag(tag, { expire: 0 })`) hem Server Action (`updateTag`) ile doğrulandı.
- Sayfa bileşeni 410 dönemez; `notFound()` 404 verir. 410, `proxy.ts` içindeki durum kontrolüyle üretildi. Bu kontrol yönlendirme içindir, yetki için kullanılmaz.
- Normal düzenlemede (`revalidateTag(tag, 'max')`) ilk istek eski içeriği alır, sonraki istekler yenisini görür.
- Server Action'lar için vekilin `X-Forwarded-Host` değerini doğru yazması gerekir; aksi halde Next.js isteği reddeder.

### 4. Harita (§5.1, ADR-002)

MapLibre worker'ı ve PMTiles dosyası 3102'deki kuralın altında 0 ihlalle çalıştı. `setWorkerUrl` ile worker kendi origin'den yüklendi, PMTiles dosyası HTTP Range ile (206) okundu.

## Denenmeyenler

- Gerçek nginx. Yanıt başına özet için nginx'in önünde veya yanında küçük bir katman (Node ya da njs) gerekir; dağıtımda denenmedi.
- Next.js güncellemelerinde satır içi betik kalıplarının değişmesi. Kalıp dışı kalan betik engellenir ve sayfa bozulur, bu yüzden CI'da test gerekir.
- PostgreSQL, gerçek Türkiye PMTiles dosyası (buradaki sınır elle çizilmiş temsilî şekildir), yük testi, nonce ile dinamik render seçeneği.

## Çalıştırma

```bash
npm install
npm run build
npm run serve
```

Başka bir terminalde:

```bash
node scripts/test-archive.mjs http://127.0.0.1:3000
```

Uygulama `127.0.0.1:3000`, vekil `3101`-`3104` portlarındadır. SRI denemesi için `POC_SRI=1 npm run build` ve `node scripts/serve.mjs --sri` (`3201`-`3204`).

Bu kod büyük ölçüde yapay zekâ ajanıyla (Claude Code) yazıldı; ölçümler çalışan uygulama üzerinde yapıldı.
