namespace BTTakvim.Api.Services.Providers;

/// <summary>
/// Yaprağa gömülen ay durumu. Alanlar geriye dönük uyumludur; <see cref="Age"/>
/// (yeni aydan bu yana geçen gün) eklenen opsiyonel/additive bir alandır.
/// </summary>
public record MoonInfo(string Key, string Name, string Emoji, double Illumination, string Source, double Age = 0);

/// <summary>
/// Ay evresi sağlayıcısı. Tamamen yerel, çevrimdışı ve deterministik astronomik
/// hesap kullanır (ağ bağımlılığı yoktur), böylece bir kez üretilip yaprağa
/// snapshot edilen değer her ortamda aynı kalır.
/// </summary>
public interface IMoonPhaseProvider
{
    MoonInfo GetPhase(DateOnly date);
}

/// <summary>
/// Jean Meeus, "Astronomical Algorithms" (2. baskı) yöntemiyle Ay'ın aydınlanma
/// oranını ve yaşını hesaplar. Güneş ve Ay'ın görünür boylamları üzerinden
/// faz açısı (i) bulunur; aydınlanan kesir k = (1 + cos i) / 2 ile elde edilir.
/// Bu, basit sinodik yaklaşıma göre çok daha doğrudur (evre geçişleri ±birkaç
/// saat yerine birkaç dakika hassasiyetinde sınıflandırılır).
/// </summary>
public class AstronomicalMoonPhaseProvider : IMoonPhaseProvider
{
    private const double Deg2Rad = Math.PI / 180.0;
    private const double SynodicMonth = 29.530588853; // ortalama sinodik ay (gün)

    private static readonly (string Key, string Name, string Emoji)[] Phases =
    [
        ("new_moon", "Yeni Ay", "🌑"),
        ("waxing_crescent", "Büyüyen Hilal", "🌒"),
        ("first_quarter", "İlk Dördün", "🌓"),
        ("waxing_gibbous", "Büyüyen Şişkin Ay", "🌔"),
        ("full_moon", "Dolunay", "🌕"),
        ("waning_gibbous", "Küçülen Şişkin Ay", "🌖"),
        ("last_quarter", "Son Dördün", "🌗"),
        ("waning_crescent", "Küçülen Hilal", "🌘"),
    ];

    public MoonInfo GetPhase(DateOnly date)
    {
        // Günün ortasını (12:00 UTC) referans alalım; tarih bazlı tek değer için makul.
        double jd = JulianDay(date) + 0.5; // gece yarısı UTC -> +0.5 ile öğlen UTC
        double t = (jd - 2451545.0) / 36525.0; // J2000'den itibaren Julian yüzyıl

        // --- Güneş'in ortalama anomalisi (M) ve ekliptik boylamı (Meeus, böl. 25) ---
        double sunM = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
        double sunL0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
        double sunC =
            (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.Sin(sunM * Deg2Rad) +
            (0.019993 - 0.000101 * t) * Math.Sin(2 * sunM * Deg2Rad) +
            0.000289 * Math.Sin(3 * sunM * Deg2Rad);
        double sunLongitude = NormalizeDeg(sunL0 + sunC); // Güneş'in görünür ekliptik boylamı (λ☉)

        // --- Ay'ın temel argümanları (Meeus, böl. 47) ---
        double moonL = 218.3164477 + 481267.88123421 * t
                       - 0.0015786 * t * t + t * t * t / 538841.0 - t * t * t * t / 65194000.0; // ort. boylam L'
        double moonD = 297.8501921 + 445267.1114034 * t
                       - 0.0018819 * t * t + t * t * t / 545868.0 - t * t * t * t / 113065000.0; // elongasyon D
        double moonM = 134.9633964 + 477198.8675055 * t
                       + 0.0087414 * t * t + t * t * t / 69699.0 - t * t * t * t / 14712000.0;    // ay anomalisi M'
        double moonF = 93.2720950 + 483202.0175233 * t
                       - 0.0036539 * t * t - t * t * t / 3526000.0 + t * t * t * t / 863310000.0; // arg. enlem F

        double d = moonD * Deg2Rad;
        double m = sunM * Deg2Rad;
        double mp = moonM * Deg2Rad;
        double f = moonF * Deg2Rad;

        // Ay'ın boylam (Σl) ve enlem (Σb) için başlıca periyodik terimler (derece).
        double sumL =
            6.288774 * Math.Sin(mp)
            + 1.274027 * Math.Sin(2 * d - mp)
            + 0.658314 * Math.Sin(2 * d)
            + 0.213618 * Math.Sin(2 * mp)
            - 0.185116 * Math.Sin(m)
            - 0.114332 * Math.Sin(2 * f)
            + 0.058793 * Math.Sin(2 * d - 2 * mp)
            + 0.057066 * Math.Sin(2 * d - m - mp)
            + 0.053322 * Math.Sin(2 * d + mp)
            + 0.045758 * Math.Sin(2 * d - m)
            - 0.040923 * Math.Sin(m - mp)
            - 0.034720 * Math.Sin(d)
            - 0.030383 * Math.Sin(m + mp);

        double sumB =
            5.128122 * Math.Sin(f)
            + 0.280602 * Math.Sin(mp + f)
            + 0.277693 * Math.Sin(mp - f)
            + 0.173237 * Math.Sin(2 * d - f)
            + 0.055413 * Math.Sin(2 * d - mp + f)
            + 0.046271 * Math.Sin(2 * d - mp - f);

        double moonLongitude = NormalizeDeg(moonL + sumL); // Ay'ın görünür ekliptik boylamı (λ☾)
        double moonLatitude = sumB;                        // Ay'ın ekliptik enlemi (β)

        // --- Faz açısı (Meeus, böl. 48). ψ: jeosentrik elongasyon, i: faz açısı ---
        double psi = Math.Acos(
            Math.Cos(moonLatitude * Deg2Rad) *
            Math.Cos((moonLongitude - sunLongitude) * Deg2Rad));

        // Güneş-Dünya ve Ay-Dünya uzaklıkları (km). i'yi düzeltir.
        double sunDistance = 149_598_000.0; // ~1 AU
        double moonDistance = 385_000.0;    // ortalama Ay uzaklığı
        double phaseAngle = Math.Atan2(
            sunDistance * Math.Sin(psi),
            moonDistance - sunDistance * Math.Cos(psi)); // i (radyan)

        double illumination = (1 + Math.Cos(phaseAngle)) / 2.0; // aydınlanan kesir k (0..1)

        // --- Evre yönü: Ay-Güneş elongasyonu büyüyor mu (waxing) küçülüyor mu (waning) ---
        double elongation = NormalizeDeg(moonLongitude - sunLongitude); // 0..360
        // 0 ≈ yeni ay, 180 ≈ dolunay. elongation/360 -> sinodik faz oranı.

        // Ay yaşı (gün): yeni aydan (elongation = 0) bu yana geçen süre.
        double age = elongation / 360.0 * SynodicMonth;

        var (key, name, emoji) = Classify(elongation, illumination);

        return new MoonInfo(
            key, name, emoji,
            Math.Round(illumination, 3),
            "astronomical",
            Math.Round(age, 2));
    }

    /// <summary>
    /// Ay-Güneş elongasyonuna (0..360°) ve aydınlanma oranına göre 8 evreden birini
    /// seçer. Dördün/dolunay/yeni ay için dar bir bant; aradaki geniş bölgeler için
    /// hilal/şişkin ay sınıfları kullanılır.
    /// </summary>
    private static (string, string, string) Classify(double elongation, double illumination)
    {
        // İnce eşik bantları (derece). Sınıflandırma elongasyon temelli ve simetriktir.
        const double band = 7.0; // yeni ay / dördün / dolunay için ±band

        if (elongation < band || elongation > 360 - band) return Phases[0];        // Yeni Ay
        if (Math.Abs(elongation - 90) < band) return Phases[2];                     // İlk Dördün
        if (Math.Abs(elongation - 180) < band) return Phases[4];                    // Dolunay
        if (Math.Abs(elongation - 270) < band) return Phases[6];                    // Son Dördün

        if (elongation < 90) return Phases[1];   // Büyüyen Hilal
        if (elongation < 180) return Phases[3];  // Büyüyen Şişkin Ay
        if (elongation < 270) return Phases[5];  // Küçülen Şişkin Ay
        return Phases[7];                         // Küçülen Hilal
    }

    private static double NormalizeDeg(double deg)
    {
        deg %= 360.0;
        if (deg < 0) deg += 360.0;
        return deg;
    }

    /// <summary>
    /// Gregoryen tarihten (00:00 UTC) Julian Day. Meeus böl. 7.
    /// MoonPhaseProvider'ı kendi kendine yeterli kılmak için yerelde tutulur.
    /// </summary>
    private static double JulianDay(DateOnly date)
    {
        int year = date.Year;
        int month = date.Month;
        int day = date.Day;
        if (month <= 2)
        {
            year -= 1;
            month += 12;
        }
        int a = year / 100;
        int b = 2 - a + a / 4;
        return Math.Floor(365.25 * (year + 4716))
             + Math.Floor(30.6001 * (month + 1))
             + day + b - 1524.5;
    }
}
