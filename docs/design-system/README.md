# BTTakvim — Tasarım Sistemi

**BTTakvim**, geleneksel Türk **günlük yaprak takvimini** (Vasıf Ülkü, Büyük Saatli Maarif tarzı) dijitale taşıyan bir ürün ailesidir. Kullanıcı, uygulamayı/siteyi tıpkı duvardaki bir takvim gibi okur: açılışta tek bir **takvim yaprağı** durur.

- **Ön yüz** — günün sözü, ay durumu, "yavrunuza isim", mini ay takvimi, dev gün sayısı + gün adı, Hicrî/Rûmî tarihler, Kasım günleri/Zemheri/Kıble saati, çok şehirli namaz vakitleri, gece-gündüz kadranı ve günün fotoğrafı.
- **Arka yüz** — günün sohbeti, "geçmişte bugün", biraz da felsefe, yemek kültürü (günün menüsü). Yaprak fiziksel takvim gibi **çevrilerek** okunur.
- **Blog / Keşfet** — tarihî olaylar, gelenekler, kültür, şehirler, önemli şahsiyetler ve **interaktif haritalar**.

## Ürünler
| Ürün | Durum | Konum |
|------|-------|-------|
| Mobil uygulama (iOS) | ✅ İlk sürüm | `BTTakvim — Mobil.html` + `ui_kits/mobil/` |
| Web sitesi | ✅ İlk sürüm | `ui_kits/web/index.html` |

## Kaynaklar
Bu sistem aşağıdaki referans yapraklardan çıkarılmıştır (kullanıcı tarafından sağlanan görseller):
- **2026 Vasıf Ülkü Duvar Takvimi** (365 yapraklı, renkli resimli) — ön/arka yüz. Renkli, krem kâğıt, kırmızı rakam, defne çelengi logo, gül fotoğrafı.
- **2026 Büyük Saatli Maarif Takvimi** (12×16 cm, 365 yapraklı) — ön/arka yüz. Yıldız çerçeve, iki saat kadranı, çok şehirli vakitler.

> Not: Kullanıcı bir referans bağlantısından söz etti ancak bağlantı/dosya iletilmedi. İçerik modeli yukarıdaki iki yapraktan birebir çıkarıldı. Vasıf Ülkü / Maarif **markaları birebir kopyalanmadı**; BTTakvim aynı geleneksel dili kullanan kendi kimliğidir. Namaz vakitleri ve takvim verileri (1 Ocak 2026) referanstan alınmıştır.

---

## İÇERİK TEMELLERİ (Content Fundamentals)
- **Dil:** Türkçe. Tam Türkçe glif desteği şart (ğ ş ı İ ç ö ü).
- **Ses tonu:** Sıcak, bilge, "büyükten gelen" bir almanak sesi — öğretici ama gösterişsiz. Atasözü/özdeyiş kıvamında kısa cümleler. Okuyucuya çoğunlukla **dolaylı** hitap ("herkes eşittir", "kendimize dair düşündüğümüzde"); yer yer şefkatli **siz** ("Yeni yılınız kutlu olsun", "Yavrunuza isim").
- **Büyük harf kullanımı:** Etiketler ve bölüm sekmeleri TAMAMI BÜYÜK + geniş harf aralığı (GÜNÜN SOHBETİ, GEÇMİŞTE BUGÜN, NAMAZ VAKİTLERİ). Gün adı yaprakta büyük harf (PERŞEMBE). Başlıklar (blog) cümle/başlık düzeni.
- **Bölüm adlandırması (yaprak arka yüzü):** "Günün/Cuma Sohbeti", "Geçmişte Bugün", "Biraz da Felsefe", "Yemek Kültürü", "Yavrunuza İsim", "Gündüzün Uzaması". Her bölümün koyu etiketi + altında **kırmızı italik** bir alt başlık (ör. "İnsanlar Eşittir").
- **Sayılar yazıyla değil rakamla**, ama gün sayısı dev ve simgesel.
- **Emoji yok.** Süsleme için ikon/altın çiçek motifi kullanılır. Tarih, alıntı ve menü gibi somut bilgiler öne çıkar; gereksiz istatistik/etiket yığılması yapılmaz.
- **Örnek alıntı stili:** "Güzellik kısa ömürlü bir istibdattır. — George B. Shaw" / "Ya ben İstanbul'u alırım, ya İstanbul beni alır. — Fatih Sultan Mehmet".

## GÖRSEL TEMELLER (Visual Foundations)
- **Renk vibe'ı:** Kanonik palet **Osmanlı Çini / İznik**: tavlanmış ivory kâğıt zemin (`--paper-1`), sıcak mürekkep metin (`--ink-0`), **bole kırmızısı** (`--red-0`) rakam ve vurgularda, **tezhip altını** (`--gold-0`) süslemelerde, **kobalt mavisi** (`--blue-0`) çerçeve/yıl rozeti/bağlantıda, **İznik zümrüt yeşili** (`--green-0`) namaz vakitlerinde. Sıcak, vakur, el yazması hissi. Alternatif paletler (Klasik Maarif, Gül Bahçesi, Ege Sahili, Zeytin & Bakır, Lacivert Mührü, Antrasit, Hünkâr Sarayı) Tweaks ile seçilir.
- **Tipografi:** *Bitter* (slab serif) — dev rakamlar; *Amiri* (`--font-ottoman`, Osmanlı/naskh esinli serif) — display başlıklar, söz markası, ay/gün adları (el yazması hissi); *Lora* (eski usul serif) — editoryal gövde; *Hanken Grotesk* (humanist sans) — UI etiketleri, sekmeler. *(Orijinal baskı fontlarınız varsa iletin.)*
- **Osmanlı motifleri:** 8 kollu **yıldız mührü** (Rosette, geometrik), **tezhip ayracı** (altın elmas + lotus bandı), **altın köşebent çerçeve** (yaprağın varsayılan "altın" çerçevesi: çift altın cetvel + köşe medalyon noktaları). Bunlar `bt-bits.jsx` içinde `Rosette` ve `Ornament` bileşenleri + `[data-bt-frame="altin"]` CSS'i ile gelir.
- **Zemin:** Düz krem kâğıt + çok ince grenli doku (`--paper-grain`, neredeyse görünmez radyal lekeler). Fotoğraf yalnızca "günün fotoğrafı" ve blog kapaklarında; gerisi tipografi ve süsleme ile kurulur. **Gradyan zemin kullanılmaz** (yalnızca harita ve yeşil vakit kartında çok hafif).
- **Süsleme:** Altın çiçek (lotus) motifli ince ayraçlar; noktalı (dotted) ayraç çizgileri (almanak hissi); köşe çerçeveleri. Yıldız bordür opsiyonel (Maarif tarzı).
- **Kart:** Krem yüzey, 1px sıcak çizgi kenarlık (`--rule`), yumuşak gölge. Yaprak kartı daha güçlü gölgeyle (`--shadow-leaf`) "kâğıt" gibi yüzer.
- **Köşe yarıçapı:** Küçük bilgi kutuları 8px, kartlar 16px, yaprak 16px, haplar tam yuvarlak. Aşırı yuvarlatma yok; kâğıt dikdörtgenliğini korur.
- **Gölge sistemi:** Sıcak/mürekkep tonlu, düşük opaklık. `--shadow-sm` (satır), `--shadow-card` (kart), `--shadow-leaf` (yaprak), `--shadow-pop` (yüzen düğme).
- **Hareket/animasyon:** Sade. Yaprak değişiminde ince yukarı-kayma (`leafIn`); ön/arka geçişinde 3B çevirme (rotateY) + opaklık geçişi. Sonsuz/dekoratif döngü yok. `cubic-bezier(0.22,0.61,0.36,1)` yumuşamalı.
- **Etkileşim durumları:** Aktif sekme/cip dolu zemin + koyu metin tersine döner (kırmızı/yeşil/mürekkep dolu, krem metin). Basışta hafif gölge azalır. Bağlantılar klasik mavi.
- **Şeffaflık/blur:** Çok az. iOS cam (liquid glass) yalnızca cihaz çerçevesi öğelerinde; yaprak ve içerik opak kâğıt.
- **Görsel sıcaklığı:** Sıcak, hafif sepya; fotoğraflar doğal/sıcak tonlu (referans gül fotoğrafı gibi).

## İKONOGRAFİ (Iconography)
- **İkon seti:** [Phosphor Icons](https://phosphoricons.com) (web font) — CDN'den `regular`, `bold`, `fill`, `duotone` ağırlıkları yükleniyor. Sıcak, hafif yuvarlatılmış uçlu çizgi karakteri geleneksel-modern tona oturuyor. Kullanım: `<i class="ph ph-mosque"></i>` veya `<Icon name="mosque" weight="fill" />`.
  - ⚠️ **İkame uyarısı:** Marka kendi ikon setini sağlamadığı için Phosphor seçildi. Markaya özel bir ikon dili isteniyorsa iletin, değiştirelim.
- **Sık kullanılan ikonlar:** `calendar-dots` (takvim), `compass` (keşfet), `mosque`/`moon-stars`/`sun-horizon`/`cloud-sun` (vakitler), `flower-lotus` (süsleme), `quotes` (söz), `scroll` (geçmişte bugün), `brain` (felsefe), `fork-knife`/`cooking-pot` (yemek), `map-trifold` (harita), `flower-tulip` (sohbet).
- **Logo:** "BT" kırmızı kare + altın harf, yanında *Bitter* ile "BTTakvim" söz markası ve "GÜNLÜK YAPRAK TAKVİMİ" alt etiketi. (Defne çelengi opsiyonel süsleme olarak eklenebilir; mevcut logoyu iletirseniz onu kullanırız.)
- **Ay evresi & gece-gündüz kadranı:** SVG ile çizilen veri/diyagram öğeleri (illüstrasyon değil) — gerçek aydınlanma oranına göre.
- **Harita:** Soyut parşömen zemin + noktalı rota + tıklanabilir konum iğneleri (gerçek ülke silüeti değil, etkileşimli şema).

---

## İndeks / Manifest
**Kök**
- `styles.css` — global giriş (yalnızca `@import`). Tüketiciler bunu bağlar.
- `BTTakvim — Mobil.html` — mobil uygulama prototipi (iOS çerçeve).
- `README.md` (bu dosya), `SKILL.md` (Agent Skill paketi).

**tokens/**
- `colors.css`, `typography.css`, `spacing.css`, `fonts.css`, `effects.css`, `base.css`

**components/** — paylaşılan React primitive'ler (`window.<Namespace>`)
- `core/` — `Button`, `IconButton`, `Badge`, `Card`, `SegmentedControl`
- `calendar/` — `SectionHead`, `StatList`

**ui_kits/web/** — web ürün (blog omurgası + yaprak yan sütun)
- `index.html` — yerleşim/CSS, script yükleme, tweaks (Ege paleti varsayılan)
- `web-app.jsx` — WebApp (liste↔yazı↔vakitler yönlendirme), Footer
- `web-blog.jsx` — WebHeader, BlogMain, FeaturedPost, PostCard, CategoryBar, WebKapak (ikon **veya** gerçek-foto kapak)
- `web-article.jsx` — ArticleView (editoryal), ReadingProgress, ilgili/prev-next
- `web-extra.jsx` — SearchOverlay (canlı arama), VakitlerPage (Namaz Vakitleri), CityPicker (şehir seçimi)
- `web-leaf.jsx` — LeafAside (ön+arka istifli); mobil leaf.jsx'i yeniden kullanır

**ui_kits/mobil/** — mobil ürün
- `data.js` — demo gün verisi (1 Ocak 2026) + blog içeriği
- `palettes.js` — 6 renk paleti (Tweaks): Klasik Maarif, Gül Bahçesi, Ege Sahili, Zeytin & Bakır, Lacivert Mührü, Antrasit
- `tweaks.jsx` / `tweaks-panel.jsx` — Tweaks paneli (palet + köşe + yaprak çerçevesi + kâğıt dokusu)
- `bt-bits.jsx` — Icon, Label, Ornament, SectionHead, MoonPhase, MiniMonth, DayNightDial, VakitSerit
- `leaf.jsx` — LeafCard (ön/arka çevirme), LeafFront, LeafBack
- `blog.jsx` — BlogScreen, ArticleScreen, InteraktifHarita
- `app.jsx` — App, TakvimScreen, VakitlerScreen, DahaScreen, TabBar
- `ios-frame.jsx`, `image-slot.js` — starter bileşenler

**guidelines/** — Tasarım Sistemi sekmesi foundation kartları (renk, tipografi, boşluk, marka)

## Yapılacaklar / Açık konular
- **Web UI kit** (takvim yaprağı + blog) — sırada.
- Gerçek **günün fotoğrafları**, logo dosyası ve (varsa) orijinal baskı fontları bekleniyor.
- Mobil UI kit kendi içinde bütünleşik bileşenler kullanır; `components/` altındaki paylaşılan primitive'ler (Button, Card, SegmentedControl, Badge, SectionHead, StatList) hem web hem mobilde ortak kullanılabilir.
