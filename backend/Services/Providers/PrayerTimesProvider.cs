namespace BTTakvim.Api.Services.Providers;

public record PrayerTimesDto(
    string Imsak, string Gunes, string Ogle, string Ikindi, string Aksam, string Yatsi);

public record PrayerTimesResult(
    string Date,
    string CitySlug,
    string CityName,
    PrayerTimesDto Times,
    string DayLength,
    string NightLength,
    int DayLengthDeltaMinutes,
    int DayLengthDeltaSeconds,
    string DayLengthDeltaText,
    double DayFraction,
    string QiblaTime,
    string Source);

/// <summary>
/// Namaz vakti hesap tercihleri. İstemci sorgu parametreleriyle gönderir;
/// varsayılanlar mevcut Diyanet davranışını birebir tekrarlar.
/// </summary>
/// <param name="Method">Aladhan hesap metodu (varsayılan 13 = Diyanet İşleri Başkanlığı).</param>
/// <param name="School">İkindi içtihadı: 0 = Şâfiî/standart, 1 = Hanefî.</param>
/// <param name="Tune">Altı dakika ofseti, sırayla: imsak, gunes, ogle, ikindi, aksam, yatsi.</param>
public record PrayerCalcOptions(int Method = 13, int School = 0, int[]? Tune = null)
{
    public int[] TuneOrDefault => Tune ?? new int[6];
}

/// <summary>
/// Namaz vakitleri sağlayıcısı. Üretimde Aladhan API (method=13 Diyanet) kullanılır;
/// API erişilemezse yerel astronomik hesap (SolarMath) yedek olarak devreye girer.
/// </summary>
public interface IPrayerTimesProvider
{
    Task<PrayerTimesResult> GetTimesAsync(DateOnly date, City city, PrayerCalcOptions options, CancellationToken ct = default);
}

/// <summary>
/// Yerel astronomik hesap (offline yedek). Diyanet kriterlerine yakın değerler üretir
/// (İmsak -18°, Yatsı -17°, İkindi gölge katsayısı 1). tune ofsetlerini ve school'u
/// (Hanefî ikindi için gölge katsayısı 2) uygular.
/// </summary>
public class MockDiyanetPrayerTimesProvider : IPrayerTimesProvider
{
    public Task<PrayerTimesResult> GetTimesAsync(DateOnly date, City city, PrayerCalcOptions options, CancellationToken ct = default) =>
        Task.FromResult(PrayerTimesCompute.Local(date, city, options));
}

/// <summary>
/// SolarMath tabanlı yerel hesap ve yardımcı alanlar (kıble saati, gündüz/gece uzunluğu).
/// Hem yerel yedek sağlayıcı hem de Aladhan sağlayıcısının yardımcı alanları bunu kullanır.
/// </summary>
public static class PrayerTimesCompute
{
    public const double TzHours = 3.0; // Türkiye (UTC+3, yaz saati uygulanmıyor)

    /// <summary>Yerel hesapla tam sonuç (offline yedek). Source = "mock-diyanet".</summary>
    public static PrayerTimesResult Local(DateOnly date, City city, PrayerCalcOptions options)
    {
        int[] tune = options.TuneOrDefault;
        var day = SolarMath.Compute(date, city.Lng, TzHours);
        double shadowFactor = options.School == 1 ? 2.0 : 1.0; // Hanefî = 2 katı gölge

        double imsak = (SolarMath.TimeAtAltitude(day, city.Lat, -18.0, morning: true) ?? day.SolarNoonMin - 360) + tune[0];
        double gunes = (SolarMath.TimeAtAltitude(day, city.Lat, -0.833, morning: true) ?? day.SolarNoonMin - 300) + tune[1];
        double ogle = (day.SolarNoonMin + 6) + tune[2]; // Diyanet temkini
        double ikindi = (SolarMath.AsrTime(day, city.Lat, shadowFactor) ?? day.SolarNoonMin + 180) + tune[3];
        double aksam = (SolarMath.TimeAtAltitude(day, city.Lat, -0.833, morning: false) ?? day.SolarNoonMin + 300) + tune[4];
        double yatsi = (SolarMath.TimeAtAltitude(day, city.Lat, -17.0, morning: false) ?? day.SolarNoonMin + 360) + tune[5];

        var times = new PrayerTimesDto(
            SolarMath.FormatMinutes(imsak),
            SolarMath.FormatMinutes(gunes),
            SolarMath.FormatMinutes(ogle),
            SolarMath.FormatMinutes(ikindi),
            SolarMath.FormatMinutes(aksam),
            SolarMath.FormatMinutes(yatsi));

        return Assemble(date, city, times, gunes, aksam, "mock-diyanet");
    }

    /// <summary>
    /// Aladhan'dan gelen vakitlerle (HH:MM) tam sonucu kurar; yardımcı alanları SolarMath ile hesaplar.
    /// Gündüz/gece uzunluğu için Aladhan'ın gunes→aksam değerleri kullanılır.
    /// </summary>
    public static PrayerTimesResult FromTimings(DateOnly date, City city, PrayerTimesDto times, string source)
    {
        double gunes = ParseHhmm(times.Gunes);
        double aksam = ParseHhmm(times.Aksam);
        return Assemble(date, city, times, gunes, aksam, source);
    }

    private static PrayerTimesResult Assemble(
        DateOnly date, City city, PrayerTimesDto times, double gunesMin, double aksamMin, string source)
    {
        var day = SolarMath.Compute(date, city.Lng, TzHours);

        double dayLen = aksamMin - gunesMin;
        var (prevGunes, prevAksam) = SunriseSunset(date.AddDays(-1), city);
        double deltaMin = dayLen - (prevAksam - prevGunes);
        int deltaSeconds = (int)Math.Round(deltaMin * 60);

        return new PrayerTimesResult(
            date.ToString("yyyy-MM-dd"),
            city.Slug,
            city.Name,
            times,
            FormatDuration(dayLen),
            FormatDuration(1440 - dayLen),
            (int)Math.Round(deltaMin),
            deltaSeconds,
            FormatDeltaText(deltaSeconds),
            Math.Round(dayLen / 1440.0, 4),
            QiblaTime(day, city),
            source);
    }

    private static double ParseHhmm(string hhmm)
    {
        if (!TimeOnly.TryParseExact(hhmm?.Trim(), "HH:mm",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var t))
            throw new FormatException($"Beklenmeyen saat biçimi: '{hhmm}'.");
        return t.Hour * 60 + t.Minute;
    }

    private static (double Sunrise, double Sunset) SunriseSunset(DateOnly date, City city)
    {
        var day = SolarMath.Compute(date, city.Lng, TzHours);
        double sunrise = SolarMath.TimeAtAltitude(day, city.Lat, -0.833, morning: true) ?? day.SolarNoonMin - 300;
        double sunset = SolarMath.TimeAtAltitude(day, city.Lat, -0.833, morning: false) ?? day.SolarNoonMin + 300;
        return (sunrise, sunset);
    }

    /// <summary>Güneş azimutunun kıble yönüyle çakıştığı an.</summary>
    private static string QiblaTime(SolarMath.SolarDay day, City city)
    {
        double bearing = SolarMath.QiblaBearing(city.Lat, city.Lng);
        double bestMinute = day.SolarNoonMin;
        double bestDiff = double.MaxValue;
        for (double m = day.SolarNoonMin - 360; m <= day.SolarNoonMin + 360; m += 1)
        {
            double az = SolarMath.AzimuthAt(day, city.Lat, m);
            double diff = Math.Abs(((az - bearing + 540) % 360) - 180);
            if (diff < bestDiff) { bestDiff = diff; bestMinute = m; }
        }
        return SolarMath.FormatMinutes(bestMinute);
    }

    private static string FormatDuration(double minutes)
    {
        int total = (int)Math.Round(minutes);
        return $"{total / 60:00} s {total % 60:00} d";
    }

    /// <summary>Yaprak takvimdeki "Gündüzün uzaması: 0 dakika 41 saniye" biçimi.</summary>
    private static string FormatDeltaText(int deltaSeconds)
    {
        int abs = Math.Abs(deltaSeconds);
        return $"{abs / 60} dakika {abs % 60} saniye";
    }
}
