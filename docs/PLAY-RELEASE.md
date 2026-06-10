# BTTakvim — Google Play Yayın Rehberi

Bu doküman, imzalı AAB üretip Play Console'a göndermek için izlenecek adımları içerir.
Uygulama Console'da tanımlı: `com.bttakvim.app`.

## 0. Ön koşul: backend yayında olmalı
Mobil uygulama üretim derlemesinde **`https://testapi.batitrakyatakvimi.com`** adresine bağlanır
(`mobile/src/lib/api.ts` → `PROD_API_URL`; ayrıca `eas.json` production env'inde tanımlı).
AAB üretmeden önce bu adresin canlı ve erişilebilir olduğundan emin olun:

```bash
curl -s https://testapi.batitrakyatakvimi.com/api/leaves/today | head -c 200
```

CORS zaten tüm origin'lere açık. (Üretimde origin kısıtlaması önerilir.)

## 1. Araçlar
```bash
npm i -g eas-cli       # veya: npx eas-cli@latest
cd mobile
eas login              # Expo hesabınızla
eas init               # projeyi Expo'ya bağlar, app.json'a extra.eas.projectId ekler
```

## 2. İmzalı AAB üret (siz yükleyeceksiniz)
```bash
eas build -p android --profile production
```
- İlk derlemede Android keystore'u EAS sizin için üretip saklamayı önerir → **Yes** deyin
  (Play App Signing ile uyumlu). İsterseniz kendi keystore'unuzu da yükleyebilirsiniz.
- Derleme bitince EAS bir **.aab** indirme bağlantısı verir. Bu dosyayı indirin.

`eas.json` profilleri:
- **production** → `app-bundle` (.aab, Play için), prod API, otomatik versionCode artışı
- **preview** → `apk` (cihazda hızlı test), prod API
- **development** → dev client

## 3. AAB'yi Play Console'a yükleyin
Console → **Test ve yayın → Üretim** (veya önce **İç test**) → **Yeni sürüm oluştur**
→ AAB'yi yükleyin → sürüm notlarını girin → kaydedin.

> İlk yüklemede Play App Signing'i kabul edin.

## 4. Mağaza girişi
`docs/STORE-LISTING.md` içindeki metinleri ve grafikleri girin. Gizlilik politikası URL'si
zorunlu — `docs/PRIVACY.md` içeriğini bir sayfada yayınlayıp URL'yi girin.

## 5. İçerik derecelendirmesi (anket)
- Şiddet/cinsellik/kumar: **Hayır**.
- Kullanıcı etkileşimi: **Evet** — kullanıcılar yorum/forum ile içerik paylaşır ve iletişim kurar.
- Beklenen derecelendirme: **Herkes / 3+**.

## 6. Veri güvenliği (Data safety) formu
`docs/PRIVACY.md` ile tutarlı şekilde:
- **Konum (yaklaşık + kesin):** Toplanır. Amaç: **Uygulama işlevi** (namaz vakti). İsteğe bağlı.
  Paylaşılmaz. (Sunucuda kimliğe bağlı saklanmaz.)
- **Kullanıcı içeriği (yorum/forum metni, isteğe bağlı takma ad):** Toplanır. Amaç:
  **Uygulama işlevi**. Paylaşılmaz. Herkese açık gösterilir.
- **Uygulama içi tanımlayıcılar (anonim cihaz anahtarı):** Toplanır. Amaç: Uygulama işlevi.
- Reklam kimliği: **Hayır**. Üçüncü taraf analitik/reklam: **Hayır**.
- Aktarım sırasında şifreleme: **Evet (HTTPS)**.

## 7. Hedef kitle ve diğer formlar
- Hedef yaş: **13+** (genel kitle).
- Reklam içerir: **Hayır**.
- Ülkeler: Türkiye (+ dilediğiniz ülkeler).

## 8. İncelemeye gönder
Tüm bölümler yeşil olunca **Gözden geçirmeye gönder**.

---

### Sürüm artırma
Sonraki sürümlerde `app.json` → `version` değerini güncelleyin. `versionCode`,
`eas.json` production profilinde `autoIncrement: true` ile EAS tarafında otomatik artar.
