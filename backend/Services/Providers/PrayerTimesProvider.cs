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
/// Namaz vakitleri sağlayıcısı. Gerçek uygulamada T.C. Diyanet İşleri Başkanlığı
/// servisine bağlanacak; şimdilik mock: astronomik hesapla Diyanet kriterlerine
/// yakın değerler üretir (İmsak -18°, Yatsı -17°, İkindi gölge katsayısı 1).
/// </summary>
public interface IPrayerTimesProvider
{
    PrayerTimesResult GetTimes(DateOnly date, City city);
}

public class MockDiyanetPrayerTimesProvider : IPrayerTimesProvider
{
    private const double TzHours = 3.0; // Türkiye (UTC+3, yaz saati uygulanmıyor)

    public PrayerTimesResult GetTimes(DateOnly date, City city)
    {
        var day = SolarMath.Compute(date, city.Lng, TzHours);

        double imsak = SolarMath.TimeAtAltitude(day, city.Lat, -18.0, morning: true) ?? day.SolarNoonMin - 360;
        double gunes = SolarMath.TimeAtAltitude(day, city.Lat, -0.833, morning: true) ?? day.SolarNoonMin - 300;
        double ogle = day.SolarNoonMin + 6; // Diyanet temkini
        double ikindi = SolarMath.AsrTime(day, city.Lat) ?? day.SolarNoonMin + 180;
        double aksam = SolarMath.TimeAtAltitude(day, city.Lat, -0.833, morning: false) ?? day.SolarNoonMin + 300;
        double yatsi = SolarMath.TimeAtAltitude(day, city.Lat, -17.0, morning: false) ?? day.SolarNoonMin + 360;

        double dayLen = aksam - gunes;
        var (prevGunes, prevAksam) = SunriseSunset(date.AddDays(-1), city);
        double deltaMin = dayLen - (prevAksam - prevGunes);
        int deltaSeconds = (int)Math.Round(deltaMin * 60);

        return new PrayerTimesResult(
            date.ToString("yyyy-MM-dd"),
            city.Slug,
            city.Name,
            new PrayerTimesDto(
                SolarMath.FormatMinutes(imsak),
                SolarMath.FormatMinutes(gunes),
                SolarMath.FormatMinutes(ogle),
                SolarMath.FormatMinutes(ikindi),
                SolarMath.FormatMinutes(aksam),
                SolarMath.FormatMinutes(yatsi)),
            FormatDuration(dayLen),
            FormatDuration(1440 - dayLen),
            (int)Math.Round(deltaMin),
            deltaSeconds,
            FormatDeltaText(deltaSeconds),
            Math.Round(dayLen / 1440.0, 4),
            QiblaTime(day, city),
            "mock-diyanet");
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
