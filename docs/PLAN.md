# BTTakvim — Geliştirme Planı

> Klasik yaprak takvim (Saatli Maarif / Vasıf Ülkü tarzı) deneyimini web + mobil uygulamaya taşıyan,
> blog ve forum içeren, admin panelinden yönetilen platform.

## 1. Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Backend API | ASP.NET Core Web API (.NET 8 LTS), EF Core (code-first migrations) |
| Veritabanı | PostgreSQL |
| Mobil | React Native (Expo) — iOS + Android |
| Web (site + admin) | React (Vite + TypeScript), React Router |
| Kimlik | Admin: JWT. Son kullanıcı: önce anonim cihaz kimliği (beğeni/kaydet için), ileride hesap sistemi |

## 2. Depo Yapısı (monorepo)

```
BTTakvim/
├── backend/          # ASP.NET Core Web API + EF Core + PostgreSQL
├── mobile/           # React Native (Expo)
├── web/              # React (Vite) — kamuya açık site + /admin paneli
└── docs/             # plan, tasarım notları
```

## 3. Veri Modeli (PostgreSQL)

### Takvim
- **calendar_leaves** — *sadece ziyaret edilen tarihler kaydedilir.*
  `date (unique)`, hicri tarih, rumi tarih, kasım/hızır günü, zemheri/hamsin,
  ay evresi (snapshot), özlü söz (snapshot), kız/erkek isim (snapshot),
  kategori içerik seçimleri (JSONB: category → content_item_id), `created_at`.
  İlk ziyarette üretilir → DB'ye yazılır → **bir daha değişmez**. Admin "reset" ederse silinir,
  sonraki ziyarette yeniden üretilir.
  Namaz vakitleri yaprağa **gömülmez** (konuma bağlı olduğu için istek anında hesaplanır).
- **settings** — `content_mode: random | fixed` (bilgilerin hangi gün gösterileceği),
  sağlayıcı seçimleri (mock/gerçek), vb.

### İçerik
- **content_categories** — slug, ad, ikon, sıra, aktif. Seed: geçmişte bugün, biraz da felsefe,
  gastronomi, ilginç bilgiler, bir kelime, coğrafya, efsaneler, özel günler, bir şiir, sudoku,
  bulmaca, rüya tabiri, faydalı bilgiler, demografik bilgiler, yer adları. **Admin yeni kategori ekleyebilir.**
- **content_items** — category_id, başlık, gövde, sabitleme (ay-gün ya da tam tarih → "fixed" modda
  o gün gösterilir; boşsa random havuzunda), aktif, kaynak (internal | imported).
- **history_events** — "geçmişte bugün": ay, gün, yıl, metin. (Bizim veritabanımızda.)
- **quotes** — özlü sözler (mock provider'ın arkasındaki seed; ileride dış API).
- **baby_names** — isim, cinsiyet, anlam (mock seed; ileride dış API).

### Blog & Forum & Sosyal
- **blog_categories** — önemli şahsiyetler, tarihi olaylar, şehirler, faydalı bilgiler, haritalar.
- **blog_posts** — başlık, slug, gövde (markdown), kategori, kapak görseli, yayın durumu.
- **forum_topics** — başlık, gövde, yazar; yaprak/blog yorum dizileri de forumda görünür.
- **comments** — polimorfik: `target_type (leaf | blog | topic)`, `target_id`, `parent_id`
  (yoruma yorum), gövde, takma ad, durum (görünür/gizli).
- **reactions** — `target_type`, `target_id`, `kind (like | save | report)`, cihaz kimliği.
  Paylaşma istemci tarafında (native share / web share API).
- **admin_users** — admin girişi.

## 4. Sağlayıcılar (mock-first, arayüzle değiştirilebilir)

| Arayüz | Mock (Faz 0) | Gerçek (Faz 5) |
|---|---|---|
| `IMoonPhaseProvider` | Yerel astronomik hesap (sinodik ay) + statik görsel | Bilimsel API (NASA/USNO) |
| `IPrayerTimesProvider` | Şehir bazlı tablo (İstanbul, Ankara, İzmir, Adana, Edirne, Erzurum…) | **T.C. Diyanet İşleri Başkanlığı** servisi |
| `IQuoteProvider` | DB seed | Dış API |
| `INameProvider` | DB seed | Dış API |

Hesaplananlar (provider değil, bizim kod):
- **Hicri tarih** — .NET `UmAlQuraCalendar`
- **Rumi tarih** — Jülyen takvimi dönüşümü (13 gün geri) + 584 yıl farkı
- **Kasım günleri** (8 Kasım başlangıç), **Hızır günleri** (6 Mayıs), **Zemheri/Hamsin**, gündüz/gece süresi, kıble saati

## 5. API Yüzeyi (özet)

```
GET  /api/leaves/{date}             → yaprak (yoksa üret + kaydet)
GET  /api/prayer-times?date&city    → veya ?lat&lng (en yakın şehir)
GET  /api/blog, /api/blog/{slug}
GET/POST /api/forum/topics, /api/comments (parent_id ile iç içe)
POST /api/reactions                 → like | save | report (cihaz kimliği ile)
--- Admin (JWT) ---
DELETE /api/admin/leaves/{date}     → reset
CRUD  /api/admin/{categories|content-items|history-events|quotes|names|blog|blog-categories}
GET   /api/admin/reports            → bildirilen içerik moderasyonu
PUT   /api/admin/settings           → random/sabit mod vb.
```

## 6. Mobil Ekran Tasarımı (yaprak)

Referans görsellerdeki yaprak düzeni, tek sütun mobil akışa uyarlanır:

- **Ön yüz (üst kart):** üstte hicri/rumi tarih şeridi → ay adı (OCAK) → **büyük gün rakamı** →
  gün adı (PERŞEMBE) → özel gün notu → ay evresi ikonu + mini ay takvimi → kıble saati,
  gündüz/gece süresi → namaz vakitleri tablosu (konum seçici: GPS veya şehir) → altta özlü söz.
- **Arka yüz (kaydırınca):** günün isimleri (kız/erkek), "Geçmişte Bugün", kategori kartları
  (felsefe, gastronomi, bir kelime…), her kartta like/save/share/report + yorum sayısı.
- **Navigasyon:** sağa/sola kaydırma veya ok butonları ile gün gün ileri/geri; tarih seçici.
- Sekmeler: **Takvim | Blog | Forum | Kaydedilenler**

## 7. Fazlar (mobil önce)

1. **Faz 0 — Temel altyapı:** monorepo yapısı, backend skeleton, PostgreSQL + migrations + seed
   (kategoriler, örnek içerik, geçmişte bugün, sözler, isimler), mock provider'lar,
   **yaprak üretim motoru**, `GET /api/leaves/{date}`, namaz vakti endpoint'i.
2. **Faz 1 — Mobil takvim (Expo):** yaprak ekranı (ön + arka yüz), gün gezinme, konum/şehir seçimi,
   tarih seçici. Backend'e bağlanır; backend yoksa mobil içi mock servis.
3. **Faz 2 — Mobil sosyal:** yorumlar (iç içe), like/save/share/report, kaydedilenler ekranı.
4. **Faz 3 — Web sitesi (React):** takvim sayfası, blog listesi + detay, forum (konu aç/tartış,
   yaprak & blog yorum dizileri).
5. **Faz 4 — Admin paneli (web /admin):** dashboard, kategori & içerik CRUD, geçmişte bugün CRUD,
   blog CRUD, yaprak listesi + reset, yorum/rapor moderasyonu, ayarlar (random/sabit), dış kaynaktan içe aktarma.
6. **Faz 5 — Gerçek entegrasyonlar (✅ tamamlandı):** namaz vakitleri Aladhan API (method=13, Diyanet açıları;
   yerel astronomik yedek), hicrî tarih Aladhan gToH ile doğrulanan yerel UmAlQura, ay evresi yerel bilimsel
   hesap (Meeus), söz/isim PostgreSQL veri kümeleri. Admin: Entegrasyonlar (varsayılanlar) + Entegrasyon İzleme.

## 8. Açık Noktalar / Varsayılanlar

- Mobilde **Expo** varsayıldı (hızlı geliştirme + EAS build; gerekirse bare'e geçilebilir).
- .NET sürümü: **8 LTS** (makinede farklı sürüm kuruluysa ona uyarlanır).
- Son kullanıcı hesapları ilk fazlarda yok; takma ad + cihaz kimliği ile yorum/beğeni.
- Tasarım dosyası linki (api.anthropic.com/v1/design/…) 404 veriyor; tasarım, paylaşılan iki
  referans görsel üzerinden uygulanacak.
