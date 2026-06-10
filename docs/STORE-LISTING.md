# BTTakvim — Google Play Mağaza Listesi

Aşağıdaki metinleri Play Console → **Store listing (Ana mağaza girişi)** alanlarına yapıştırın.

## Uygulama adı (max 30)
```
BTTakvim — Yaprak Takvim
```

## Kısa açıklama (max 80)
```
Günlük yaprak takvim: namaz vakitleri, hicri-rumi tarih, söz, blog ve forum.
```

## Tam açıklama (max 4000)
```
BTTakvim, geleneksel günlük yaprak takvimini (Maarif / Vasıf Ülkü tarzı) cebinize taşır.
Her günü, tıpkı duvardaki bir takvim gibi okursunuz: tek bir yaprak açılır, çevirerek
arka yüzüne bakarsınız.

ÖN YÜZ
• Dev gün rakamı, ay ve gün adı
• Hicrî ve Rûmî tarihler, Kasım/Hızır günleri, Zemheri
• Ayın durumu ve evresi
• Mini ay takvimi
• Yavrunuza isim önerileri (kız/erkek)
• Çok şehirli namaz vakitleri — konumunuza göre veya seçtiğiniz şehre göre
• Gece/gündüz süresi, kıble saati, günün sözü ve fotoğrafı

ARKA YÜZ
• Günün Sohbeti
• Geçmişte Bugün
• Biraz da Felsefe
• Yemek Kültürü ve günün menüsü
• İlginç bilgiler, coğrafya, efsaneler, bir kelime, bir şiir ve daha fazlası

KEŞFET (BLOG)
Tarihî olaylar, şehirler, önemli şahsiyetler, gelenekler, kültür ve interaktif haritalar.

FORUM & ETKİLEŞİM
Yapraklara ve yazılara yorum yapın, yorumlara yanıt verin; beğenin, kaydedin, paylaşın.
Forumda yeni konular açıp tartışmalara katılın.

KİŞİSELLEŞTİRME
Sekiz farklı renk paleti (Osmanlı Çini, Hünkâr Sarayı, Klasik Maarif, Gül Bahçesi,
Ege Sahili ve daha fazlası) ile takvimin görünümünü dilediğiniz gibi ayarlayın.

Geçmiş ve gelecek günler arasında gezinin; her günün yaprağını okuyun.

Not: Namaz vakitleri ve ay verileri sürekli geliştirilmektedir.
```

## Kategori
- **Uygulama türü:** Uygulama
- **Kategori:** Yaşam Tarzı (Lifestyle) — alternatif: Kitaplar ve Referans
- **Etiketler:** takvim, namaz vakitleri, hicri takvim, yaprak takvim

## İletişim
- **E-posta:** (kendi destek e-postanız)
- **Web sitesi:** https://batitrakyatakvimi.com (varsa)
- **Gizlilik politikası URL'si:** docs/PRIVACY.md içeriğini bir sayfada yayınlayın
  (ör. https://batitrakyatakvimi.com/gizlilik) ve URL'yi buraya girin — **zorunlu**.

## Grafik varlıklar (Play Console gereksinimleri)
| Varlık | Boyut | Not |
|---|---|---|
| Uygulama simgesi | 512×512 PNG | `mobile/assets/images/icon.png` üzerinden üretin |
| Öne çıkan grafik | 1024×500 PNG | Kırmızı zemin + "BTTakvim" + yaprak görseli |
| Telefon ekran görüntüleri | en az 2, 1080×1920+ | Yaprak ön yüz, arka yüz, Keşfet, Vakitler, Forum |

Ekran görüntüleri için: `cd mobile && npx expo start` → cihaz/emülatörde aç → her ekranın
görüntüsünü al. (Yaprak ön yüz + arka yüz + Keşfet + Vakitler + Forum önerilir.)
