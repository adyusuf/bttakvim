# Dış Servis Entegrasyonları — Araştırma ve Uygulama Rehberi

Bu belge, BTTakvim / Batı Trakya Takvimi backend'inde (ASP.NET Core, .NET 10,
`/backend`) şu an **mock** olarak çalışan dış-veri kaynaklarının, **arayüz
sözleşmelerini değiştirmeden** gerçek entegrasyonlara nasıl dönüştürüleceğini
özetler.

## Genel mimari notları

Mevcut tasarım entegrasyon için zaten doğru kurgulanmış:

- Tüm sağlayıcılar bir **arayüzün** (`IPrayerTimesProvider`, `IMoonPhaseProvider`,
  `IQuoteProvider`, `INameProvider`) arkasında. Gerçek implementasyonu yazıp
  `Program.cs`'teki `AddSingleton/AddScoped` kaydını değiştirmek yeterli; çağıran
  kod (`LeafService`, `PrayerTimesController`) hiç değişmez.
- **Yaprak motoru anlık görüntü (snapshot) mantığı kullanıyor.** `LeafService.GenerateAsync`
  bir tarih ilk ziyaret edildiğinde özlü söz, isim ve ay evresini `CalendarLeaf`
  satırına yazar; kaynak sonradan değişse bile yaprak değişmez (`Models/Entities.cs`).
  Yani Söz / İsim / Ay evresi entegrasyonları **yalnızca üretim anında bir kez**
  çağrılır — gerçek-zaman performansı kritik değildir.
- **Namaz vakitleri konuma bağlı** olduğu için yaprağa gömülmez; `PrayerTimesController`
  her istekte `provider.GetTimes(date, city)` çağırır. Burada önbellek ve
  performans önemlidir.
- **Dikkat — senkron arayüzler:** `IPrayerTimesProvider.GetTimes` ve
  `IMoonPhaseProvider.GetPhase` `Task` döndürmüyor; senkrondur. Gerçek HTTP API'leri
  asenkron olduğundan, bunları arayüzü bozmadan kullanmanın yolu, HTTP çağrısını
  **arka planda doldurulan bir önbelleğin** (`IMemoryCache` / DB tablosu) gerisine
  koymaktır. Senkron metot yalnızca önbellekten okur. (Aşağıda her domende anlatıldı.)

---

## 1. Namaz Vakitleri (namaz vakitleri)

### Mevcut arayüz

`backend/Services/Providers/PrayerTimesProvider.cs`

```csharp
public interface IPrayerTimesProvider
{
    PrayerTimesResult GetTimes(DateOnly date, City city);
}
```

Dönen DTO'lar:

```csharp
public record PrayerTimesDto(
    string Imsak, string Gunes, string Ogle, string Ikindi, string Aksam, string Yatsi);

public record PrayerTimesResult(
    string Date, string CitySlug, string CityName, PrayerTimesDto Times,
    string DayLength, string NightLength,
    int DayLengthDeltaMinutes, int DayLengthDeltaSeconds, string DayLengthDeltaText,
    double DayFraction, string QiblaTime, string Source);
```

Mevcut mock (`MockDiyanetPrayerTimesProvider`) tüm değerleri yerel
astronomik hesapla (`SolarMath.cs`) üretir: İmsak -18°, Yatsı -17°, İkindi gölge
katsayısı 1 — yani **zaten Diyanet açı kriterlerine yakın** çalışıyor. Ayrıca
gündüz süresi, gündüzün uzama/kısalma farkı ve kıble saati gibi yaprağa özgü
alanları da üretiyor.

### Önemli gerçek: Diyanet'in resmî açık API'si yok

T.C. Diyanet İşleri Başkanlığı'nın geliştiricilere açık, sözleşmeli bir namaz
vakitleri API'si **yoktur**. namazvakitleri.diyanet.gov.tr scraping'i kırılgan,
resmî onaysız ve hizmet şartlarına aykırı olabilir. Gerçekçi seçenekler aşağıdadır.

### Önerilen yaklaşım

**Birincil: yerel astronomik hesabı koru (mevcut `SolarMath`), Diyanet temkin/açı
parametrelerini doğrula; ikincil/doğrulama kaynağı olarak Aladhan API (method=13).**

Gerekçe: Batı Trakya + Türkiye kitlesi için en önemli kriter Diyanet'le tutarlılık.
Aladhan, Diyanet yöntemini **method 13** ("Diyanet İşleri Başkanlığı, Turkey —
Fajr 18°, Isha 17°") olarak destekliyor; bu, mevcut mock'taki açılarla birebir
örtüşüyor. Yani mevcut yerel hesap zaten doğru ailede. Aladhan'ı çevrimdışı
çalışabilirlik ve hız için ana motor yapmak yerine **referans/kalibrasyon** olarak
kullanmak en sağlam yol.

### Seçenekler tablosu

| Seçenek | Artılar | Eksiler |
|---|---|---|
| **Yerel hesap (mevcut `SolarMath`)** | Çevrimdışı, sıfır maliyet, hız limiti yok, anında, dış bağımlılık yok, kıble saati/gündüz farkı gibi özel alanları zaten üretiyor | Diyanet temkin dakikalarıyla birebir tutmak için kalibrasyon gerekir; kutup bölgesi uç durumları |
| **Aladhan API** (api.aladhan.com, method=13) | Ücretsiz, API anahtarı yok, Diyanet yöntemi hazır (method 13), `calendar` ile aylık toplu çekim, dünya geneli | İnternet gerektirir (çevrimdışı zaafı), ~12 istek/sn IP limiti, GPL-3.0 + 3. taraf SLA'sı yok, kıble saati/gündüz farkı alanlarını döndürmez (yine yerel hesap gerekir) |
| **PrayerTimes.Library / PrayTimes (NuGet)** | Çevrimdışı, praytimes.org portu, açı/yöntem parametreli | Bakımı sınırlı; mevcut `SolarMath` zaten aynı işi yapıyor, eklemek tekrar olur |
| **Diyanet sitesi scraping** | "Resmî" değerlere en yakın | Resmî onay yok, kırılgan, ToS riski, bakım yükü — **önerilmez** |

### Uygulama adımları (arayüzü bozmadan)

1. Mevcut `SolarMath` tabanlı sınıfı **birincil** sağlayıcı olarak koru; ismini
   `LocalAstronomicalPrayerTimesProvider` yapıp `Source = "local-astro"` döndür.
2. (İsteğe bağlı, doğrulama) `AladhanPrayerTimesProvider`'ı yaz:
   - `HttpClient`'ı `IHttpClientFactory` üzerinden ekle (`Program.cs`'te
     `builder.Services.AddHttpClient("aladhan", ...)`).
   - **Aylık toplu çekim:** `GET https://api.aladhan.com/v1/calendar/{yıl}/{ay}?latitude={lat}&longitude={lng}&method=13`
     ile bir şehrin tüm ayını **tek istekte** al; sonucu DB'ye veya `IMemoryCache`'e
     `(citySlug, yıl-ay)` anahtarıyla yaz. Böylece `GetTimes` senkron kalır,
     yalnızca önbellekten okur.
   - Aladhan **İmsak/Güneş/Öğle/İkindi/Akşam/Yatsı** verir; **kıble saati,
     gündüz süresi, gündüzün uzama farkı** alanlarını yine `SolarMath` ile hesapla
     ve birleştir.
3. **Hibrit / kalibrasyon:** Aladhan değerleriyle yerel hesabı karşılaştırıp
   şehir başına temkin ofseti (dakika) çıkar; bunu `appsettings`/DB `AppSetting`
   tablosunda sakla. Üretimde **çevrimdışı yerel hesap + ofset** kullan, böylece
   internet gerekmeden Diyanet'e yakın sonuç elde et.
4. `Program.cs` kaydını değiştir:
   `builder.Services.AddSingleton<IPrayerTimesProvider, LocalAstronomicalPrayerTimesProvider>();`

---

## 2. Ay Evresi / Ay Durumu (ayın evresi)

### Mevcut arayüz

`backend/Services/Providers/MoonPhaseProvider.cs`

```csharp
public record MoonInfo(string Key, string Name, string Emoji, double Illumination, string Source);

public interface IMoonPhaseProvider
{
    MoonInfo GetPhase(DateOnly date);
}
```

Mevcut mock (`MockMoonPhaseProvider`) sinodik ay (29.53059 gün) + bilinen yeni-ay
epoch'u (JD 2451550.26) ile evre ve aydınlanma yüzdesi üretir; 8 evreyi Türkçe
adları + emoji ile döndürür. Bu yöntem zaten **±birkaç saat** doğrulukta, yaprak
takvim için fazlasıyla yeterli.

### Önerilen yaklaşım

**Yerel hesapta kal — dış API'ye gerek yok.** Ay evresi tamamen deterministik bir
astronomik hesaptır; doğruluğu artırmak istenirse mevcut basit sinodik formül,
daha hassas bir NuGet kütüphanesiyle (SunCalcNet / CoordinateSharp / Astronomy)
değiştirilebilir. Hatırlatma: bu alan yaprağa **snapshot** edildiği için (üretim
anında bir kez çağrılır) performans hiç sorun değil.

### Seçenekler tablosu

| Seçenek | Artılar | Eksiler |
|---|---|---|
| **Mevcut sinodik hesap** | Çevrimdışı, sıfır bağımlılık, yaprak için yeterli doğruluk, Türkçe ad+emoji hazır | Çok küçük sapma (evre geçiş gününde ±birkaç saat) |
| **SunCalcNet / SunCalcSharp (NuGet)** | BSD lisans, küçük, ay evresi + aydınlanma + konum bazlı | Yine yaklaşık; evre adı/emoji eşleşmesini yine kendin yaparsın |
| **CoordinateSharp (NuGet)** | Ay doğuş/batış, evre, daha zengin gök mekaniği | Daha ağır; ihtiyacın çok ötesinde |
| **NASA/USNO API** | "Bilimsel" kaynak | İnternet gerekir, hız limiti, aşırı mühendislik — **gereksiz** |

### Uygulama adımları

1. Doğruluk yeterli görülüyorsa **hiçbir şey yapma**; mock zaten üretim-kalitesinde.
2. Daha hassas isteniyorsa `SunCalcMoonPhaseProvider` yaz: NuGet'ten `SunCalcNet`
   ekle, `MoonIllumination.GetMoonIllumination(date)` ile `phase`/`fraction` al,
   bu değeri mevcut 8-evre `Phases` tablosuyla (Türkçe ad+emoji) eşleştir,
   `Source = "suncalc"` döndür.
3. `Program.cs`: `AddSingleton<IMoonPhaseProvider, SunCalcMoonPhaseProvider>();`
4. Arayüz senkron ve dış çağrı olmadığı için önbellek/secret gerekmez.

---

## 3. Günün Sözü (özlü söz)

### Mevcut arayüz

`backend/Services/Providers/ContentProviders.cs`

```csharp
public interface IQuoteProvider
{
    Task<(string Text, string? Author)> GetRandomAsync(CancellationToken ct = default);
}
```

Mevcut implementasyon (`DbQuoteProvider`) **zaten gerçek**: kendi PostgreSQL
`Quotes` tablosundan (`IsActive`) rastgele bir kayıt seçer. Bu bir mock değil,
sahipli-DB yaklaşımıdır.

### Önerilen yaklaşım

**Sahipli DB tablosunu koru; admin paneliyle yönet.** Özlü sözler telif/üslup
açısından hassastır ve yaprak takvimin kimliğinin parçasıdır; dış API'ye bağlamak
hem gereksiz hem riskli olur. En doğru "entegrasyon" buradaki **içerik akışını
zenginleştirmek**: admin panelinden toplu içe aktarma (CSV/JSON) ve moderasyon.

### Seçenekler tablosu

| Seçenek | Artılar | Eksiler |
|---|---|---|
| **Sahipli DB (mevcut) + admin yönetimi** | Tam kontrol, telifsiz/küratörlü, çevrimdışı, deterministik snapshot | İçeriği elle/toplu beslemek gerekir |
| **Toplu içe aktarma (CSV/JSON seed)** | Hızlı başlangıç, tek seferlik | Kaynak telifine dikkat |
| **Dış alıntı API'si (örn. genel quote API'leri)** | Otomatik tazelik | Türkçe/kültürel uyum zayıf, telif belirsiz, internet bağımlılığı, kalite kontrolü yok — **önerilmez** |

### Uygulama adımları

1. Yeni kod gerekmez — arayüz ve implementasyon hâlihazırda üretim-hazır.
2. İçerik zenginleştirme: `AdminController`'a `Quotes` için toplu içe aktarma
   uç noktası ekle (mevcut admin JWT korumasıyla). DTO mevcut (`Models/Entities.cs`
   `Quote`).
3. İstenirse bir kez çalışan bir seed betiği (`DbSeeder`) ile küratörlü söz havuzu yükle.

---

## 4. Bebek / Yavru İsimleri (kız / erkek isimleri)

### Mevcut arayüz

`backend/Services/Providers/ContentProviders.cs`

```csharp
public interface INameProvider
{
    Task<(BabyName? Girl, BabyName? Boy)> GetRandomAsync(CancellationToken ct = default);
}
```

Mevcut implementasyon (`DbNameProvider`) **zaten gerçek**: `BabyNames` tablosundan
(`IsActive`, `Gender == "K"` / `"E"`) rastgele birer kız ve erkek ismi seçer.
`BabyName` entity'sinde `Name`, `Gender`, `Meaning` alanları var.

### Önerilen yaklaşım

**Sahipli DB tablosunu koru; veriyi resmî/açık bir kaynaktan tek seferlik
besle.** İsim listesi statik ve büyük bir veri kümesidir; çalışma anında bir API'ye
gitmek anlamsız. En iyi yol, kaliteli bir isim+anlam veri kümesini bir kez içe
aktarıp DB'de tutmak ve admin panelinden düzenlemek.

### Seçenekler tablosu

| Seçenek | Artılar | Eksiler |
|---|---|---|
| **Sahipli DB (mevcut) + toplu içe aktarma** | Çevrimdışı, hızlı, anlamlarıyla küratörlü, snapshot uyumlu | Veri kümesini bir kez bulup yüklemek gerekir |
| **Açık veri kümesi içe aktarma** (TÜİK/açık isim+anlam listeleri, CSV) | Geniş kapsam, tek seferlik | Anlam alanı (`Meaning`) çoğu kaynakta eksik; temizlik gerekir |
| **Çalışma-anı isim API'si** | Bakım yok | Türkçe anlam/kültür uyumu zayıf, internet bağımlılığı, gereksiz — **önerilmez** |

### Uygulama adımları

1. Yeni kod gerekmez — arayüz/implementasyon üretim-hazır.
2. `AdminController`'a `BabyNames` toplu içe aktarma (CSV/JSON) uç noktası ekle.
3. Bir isim+anlam veri kümesini `Gender` (K/E) ve `Meaning` ile eşleyip `DbSeeder`
   üzerinden yükle. Anlamı olmayan kayıtlar için `Meaning = null` bırakılabilir
   (entity nullable).

---

## 5. Hicrî / Rûmî Tarih Dönüşümü (hicrî / rûmî tarih)

### Mevcut servis (arayüz değil, somut sınıf)

`backend/Services/TurkishCalendarService.cs`

```csharp
public record HijriDate(int Day, string MonthName, int Year);
public record RumiDate(int Day, string MonthName, int Year);

public HijriDate GetHijri(DateOnly date);   // System.Globalization.UmAlQuraCalendar
public RumiDate  GetRumi(DateOnly date);    // Gregoryen -> Jülyen takvim, yıl-584/585
// ayrıca: GetSeasonalDay (Kasım/Hızır), GetColdPeriod (Zemheri/Hamsin)
```

Bu bir dış servis değil; tamamen **yerel ve deterministik** hesaptır. Hicrî için
.NET'in yerleşik `UmAlQuraCalendar` sınıfını, Rûmî için Jülyen takvim dönüşümünü
kullanır.

### Önerilen yaklaşım

**Yerel hesapta kal.** Tek dikkat noktası: `UmAlQuraCalendar` Suudi Umm-al-Qura
tablolarına dayanır ve **Diyanet'in ilan ettiği hicrî tarihten zaman zaman 1 gün**
farklı olabilir (ay başlangıçları farklı yöntemle belirlenir). Batı Trakya +
Türkiye kitlesi için Diyanet tutarlılığı önemliyse bu fark yönetilmelidir.

### Seçenekler tablosu

| Seçenek | Artılar | Eksiler |
|---|---|---|
| **`UmAlQuraCalendar` (mevcut)** | Yerleşik, çevrimdışı, bakımsız, geniş yıl aralığı | Diyanet ilanından ara sıra ±1 gün sapabilir |
| **Sapma ofsetiyle düzeltme** | Diyanet'e hizalama, basit | Ofset elle/yıllık ayarlanmalı |
| **Diyanet/ay-gözlem tabanlı tablo** (DB) | Diyanet'le birebir | Veriyi yıllık beslemek gerekir; bakım yükü |
| **Aladhan Hijri API** | Hazır dönüşüm, `adjustment` parametresi | İnternet bağımlılığı; yerel hesap zaten yeterli — gereksiz |

### Uygulama adımları

1. Çoğu kullanım için **değişiklik gerekmez**.
2. Diyanet hizalaması gerekiyorsa `GetHijri`'ye `appsettings`/`AppSetting`'ten
   okunan bir **gün-ofseti** (genelde -1/0/+1) ekle: tarihe ofset uygulayıp
   `UmAlQuraCalendar`'a ver. Sözleşme (record) değişmez.
3. İleride tam Diyanet uyumu istenirse, ay-başı tarihlerini tutan bir DB tablosu
   (`HijriMonthStart`) ekleyip `GetHijri`'yi bu tabloya bakacak şekilde
   genişlet; record imzası yine sabit kalır.

---

## Önceliklendirme — hangi entegrasyon önce yapılmalı

1. **Söz ve İsim içerikleri (öncelik: yüksek, çaba: düşük).** Kod zaten gerçek;
   sadece DB'yi kaliteli veriyle doldurmak gerekiyor. Uygulamanın günlük değerini
   en çok bu besler. Admin toplu içe aktarma + seed yeterli.
2. **Namaz vakitleri kalibrasyonu (öncelik: yüksek, çaba: orta).** Kitlenin en
   hassas olduğu veri. Mevcut yerel hesabı Aladhan method=13 ile karşılaştırıp
   şehir başına temkin ofseti çıkar; çevrimdışı kalmaya devam et.
3. **Hicrî gün-ofseti (öncelik: orta, çaba: düşük).** Diyanet ile ±1 gün farkını
   ofset ayarıyla gidermek küçük ama görünür bir kalite iyileştirmesi.
4. **Ay evresi hassasiyeti (öncelik: düşük, çaba: düşük).** Mevcut hesap zaten
   yeterli; istenirse SunCalcNet'e geçilir.

**Genel ilke:** Bu uygulamanın doğası gereği (yaprak takvim, snapshot, çevrimdışı
kullanım) **dış API'lere bağımlılık minimumda tutulmalı**; çoğu domende doğru
"entegrasyon", dış servise gitmek değil, **yerel hesabı kalibre etmek** veya
**sahipli DB'yi beslemektir**. Tek gerçekçi dış API adayı namaz vakitleri için
Aladhan'dır ve o da çalışma-anı bağımlılığı değil, **kalibrasyon/doğrulama** rolünde
önerilir.

---

## Notlar: önbellek, secret'lar, hız limitleri

### Önbellek (caching)
- **Namaz vakitleri:** Arayüz senkron olduğundan dış HTTP doğrudan `GetTimes`
  içinde çağrılamaz. Aladhan kullanılacaksa **aylık `calendar` çağrısını** bir
  arka plan/ilk-erişim adımında yapıp sonucu `IMemoryCache` veya bir DB tablosuna
  `(citySlug, yıl-ay)` anahtarıyla yaz; `GetTimes` yalnızca önbellekten okusun.
  TTL: ay verisi sabit olduğundan uzun (gün/hafta) tutulabilir.
- **Söz / İsim / Ay evresi:** Yaprağa snapshot edildikleri için ayrı önbellek
  gerekmez; üretim anında bir kez çağrılır ve `CalendarLeaf`'e yazılır.
- **Hicrî/Rûmî:** Deterministik ve ucuz; önbellek gereksiz (zaten yaprağa yazılıyor).

### Secret'lar ve konfigürasyon
- Aladhan **API anahtarı gerektirmez** — secret yönetimi gerekmez.
- Gelecekte anahtar gereken bir servis eklenirse, mevcut `Jwt:Key` deseni gibi
  `appsettings`/ortam değişkeni üzerinden okunmalı; **gizli anahtar repoya/`appsettings.json`'a
  yazılmamalı**, ortam değişkeni veya kullanıcı-secret deposunda tutulmalı.
- Kalibrasyon ofsetleri (temkin dakikası, hicrî gün-ofseti) gizli değildir;
  `appsettings` veya DB `AppSetting` tablosunda tutulabilir ve admin panelinden
  ayarlanabilir.

### Hız limitleri (rate limit)
- **Aladhan:** API anahtarı yok; IP başına **~12 istek/saniye** civarı yumuşak
  limit, "aşırı kullanımdan kaçının" tavsiyesi var; SLA yok (GPL-3.0, topluluk
  projesi). Aylık `calendar` ile şehir-ay başına tek istek yaparak istek sayısı
  doğal olarak çok düşük kalır → limit pratikte sorun olmaz.
- **HttpClient:** Mutlaka `IHttpClientFactory` (`AddHttpClient`) ile kullan,
  makul timeout ve hata durumunda **yerel hesaba geri düşüş (fallback)** ekle ki
  internet/servis kesintisi uygulamayı durdurmasın.
