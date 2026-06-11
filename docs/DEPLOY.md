# BTTakvim — Dağıtım (Deploy) Kılavuzu

Bu kılavuz, backend'i **testapi.batitrakyatakvimi.com**'a almak ve yeni mobil sürümü
yayınlamak için adımları içerir. Sıra önemlidir.

## 0) Önkoşul: PR'ları birleştir
1. `#1` (statik analiz) → `main`
2. `#2` (entegrasyonlar + admin) → `main`

## 1) Backend dağıtımı (.NET 10)

### Yayın paketi
```bash
cd backend
dotnet publish -c Release -o ./publish
# Çıktı self-contained değil; sunucuda .NET 10 ASP.NET Core runtime gerekir.
# Data/Seed/*.json paketle birlikte kopyalanır.
```

### Zorunlu ortam değişkenleri (üretim)
| Değişken | Açıklama |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__Default` | PostgreSQL: `Host=...;Port=5432;Database=bttakvim;Username=...;Password=...` |
| `Jwt__Key` | **Zorunlu** — en az 32 karakter rastgele gizli anahtar. Üretimde tanımlı değilse uygulama açılışta hata verir (güvenlik). |
| `ASPNETCORE_URLS` | ör. `http://0.0.0.0:8080` (ters proxy arkasında) |
| `Calendar__HijriDayOffset` | İsteğe bağlı; DB Settings `hijri_day_offset` bunu geçersiz kılar. |

> JWT anahtarı üretmek için: `openssl rand -base64 48`

### Veritabanı
- Uygulama açılışta **EF migration'ları otomatik uygular** (`Database.MigrateAsync`) ve
  boş tabloları seed eder. Yeni/boş bir DB ile başlıyorsanız ekstra adım gerekmez:
  219 söz + 239 isim otomatik yüklenir.
- **Mevcut/dolu bir DB**'de seed yalnızca boş tablolara çalışır. Sözleri/isimleri
  almak için: admin panel → **Sözler / İsimler → "Veri kümesini içe aktar"**
  (eksikleri ekler, mevcutları değiştirmez) ya da `POST /api/admin/quotes/import`,
  `POST /api/admin/names/import`.

### Ters proxy (nginx örneği)
```
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
TLS (Let's Encrypt) sertifikasını `testapi.batitrakyatakvimi.com` için tanımlayın.

### Doğrulama (deploy sonrası)
```bash
curl https://testapi.batitrakyatakvimi.com/                       # API kimlik kartı
curl "https://testapi.batitrakyatakvimi.com/api/prayer-times?city=istanbul"   # source: aladhan-13
curl https://testapi.batitrakyatakvimi.com/api/leaves/today
```
Admin panel → **Entegrasyon İzleme**: Aladhan çağrılarının `success`/`cache` olarak
düştüğünü görmelisiniz. Yerele düşüyorsa (mock) sunucudan dış internet erişimini kontrol edin.

## 2) Admin ilk yapılandırma (deploy sonrası)
1. **Sözler / İsimler** → "Veri kümesini içe aktar" (mevcut DB ise).
2. **Entegrasyonlar** → hicrî gün ofseti (Diyanet ilanına göre 0/±1), varsayılan
   namaz yöntemi (13 = Diyanet) ve gerekiyorsa temkin.
3. **Entegrasyon İzleme** ile trafiği doğrula.

## 3) Mobil yeni sürüm (v4 — namaz hesap kontrolleri dahil)
Backend **canlıya alındıktan sonra** (aksi halde yeni parametreler eski API'de işe yaramaz):
```bash
cd mobile
# mobile/src/lib/api.ts → PROD_API_URL zaten https://testapi.batitrakyatakvimi.com
npx eas-cli build --platform android --profile production
```
- `versionCode` EAS tarafından otomatik artar (v3 → v4). Aynı keystore kullanılır.
- Çıkan `.aab`'yi **siz** Google Play Console → Kapalı test → Yeni sürüm oluştur'a yükleyin.
- Mağaza listesi/ikon zaten hazır; yalnızca yeni AAB + sürüm notları gerekir.

## Notlar
- **Entegrasyon İzleme** kayıtları bellek içidir; sunucu yeniden başlayınca sıfırlanır.
- Aladhan ücretsiz/anahtarsızdır ama oran sınırlı olabilir; sonuçlar gün sonuna kadar
  önbelleğe alınır ve hata/çevrimdışı durumda yerel astronomik hesaba düşülür.
