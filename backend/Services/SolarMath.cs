namespace BTTakvim.Api.Services;

/// <summary>
/// NOAA güneş konumu formülleri — gün doğumu/batımı, belirli yükseklik açısı için vakit,
/// güneş azimutu (kıble saati için). Takvim hassasiyeti için yeterlidir.
/// </summary>
public static class SolarMath
{
    private static double Rad(double deg) => deg * Math.PI / 180.0;
    private static double Deg(double rad) => rad * 180.0 / Math.PI;

    public record SolarDay(double DeclinationDeg, double EquationOfTimeMin, double SolarNoonMin);

    /// <summary>Verilen tarih için (öğlen değerleriyle) güneş parametreleri. tz: saat cinsinden (TR=3).</summary>
    public static SolarDay Compute(DateOnly date, double lngEast, double tzHours)
    {
        double jd = JulianDay(date) + 0.5 - lngEast / 360.0; // yerel öğlene yakın
        double t = (jd - 2451545.0) / 36525.0;

        double l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360.0;
        if (l0 < 0) l0 += 360.0;
        double m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
        double e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
        double c = Math.Sin(Rad(m)) * (1.914602 - t * (0.004817 + 0.000014 * t))
                 + Math.Sin(Rad(2 * m)) * (0.019993 - 0.000101 * t)
                 + Math.Sin(Rad(3 * m)) * 0.000289;
        double trueLong = l0 + c;
        double omega = 125.04 - 1934.136 * t;
        double lambda = trueLong - 0.00569 - 0.00478 * Math.Sin(Rad(omega));

        double seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
        double e0 = 23.0 + (26.0 + seconds / 60.0) / 60.0;
        double epsilon = e0 + 0.00256 * Math.Cos(Rad(omega));

        double declination = Deg(Math.Asin(Math.Sin(Rad(epsilon)) * Math.Sin(Rad(lambda))));

        double y = Math.Tan(Rad(epsilon / 2));
        y *= y;
        double eot = 4.0 * Deg(
            y * Math.Sin(2 * Rad(l0))
            - 2.0 * e * Math.Sin(Rad(m))
            + 4.0 * e * y * Math.Sin(Rad(m)) * Math.Cos(2 * Rad(l0))
            - 0.5 * y * y * Math.Sin(4 * Rad(l0))
            - 1.25 * e * e * Math.Sin(2 * Rad(m)));

        double solarNoon = 720.0 - 4.0 * lngEast + tzHours * 60.0 - eot;
        return new SolarDay(declination, eot, solarNoon);
    }

    /// <summary>
    /// Güneşin verilen yükseklik açısında (derece, ufuk altı negatif) olduğu vakit.
    /// morning=true sabah tarafı. Dakika cinsinden yerel saat; kutup durumlarında null.
    /// </summary>
    public static double? TimeAtAltitude(SolarDay day, double latDeg, double altitudeDeg, bool morning)
    {
        double cosHa = (Math.Sin(Rad(altitudeDeg)) - Math.Sin(Rad(latDeg)) * Math.Sin(Rad(day.DeclinationDeg)))
                     / (Math.Cos(Rad(latDeg)) * Math.Cos(Rad(day.DeclinationDeg)));
        if (cosHa is < -1 or > 1) return null;
        double haDeg = Deg(Math.Acos(cosHa));
        return morning ? day.SolarNoonMin - 4.0 * haDeg : day.SolarNoonMin + 4.0 * haDeg;
    }

    /// <summary>İkindi: gölge boyu = cisim + öğle gölgesi (Diyanet, gölge katsayısı 1).</summary>
    public static double? AsrTime(SolarDay day, double latDeg, double shadowFactor = 1.0)
    {
        double zenithNoon = Math.Abs(latDeg - day.DeclinationDeg);
        double altitude = Deg(Math.Atan(1.0 / (shadowFactor + Math.Tan(Rad(zenithNoon)))));
        return TimeAtAltitude(day, latDeg, altitude, morning: false);
    }

    /// <summary>Verilen dakikadaki güneş azimutu (kuzeyden saat yönünde, derece).</summary>
    public static double AzimuthAt(SolarDay day, double latDeg, double minutesLocal)
    {
        double haDeg = (minutesLocal - day.SolarNoonMin) / 4.0;
        double ha = Rad(haDeg);
        double lat = Rad(latDeg);
        double dec = Rad(day.DeclinationDeg);
        double az = Math.Atan2(Math.Sin(ha), Math.Cos(ha) * Math.Sin(lat) - Math.Tan(dec) * Math.Cos(lat));
        return (Deg(az) + 180.0) % 360.0;
    }

    /// <summary>Kâbe'ye büyük daire yönü (kuzeyden saat yönünde, derece).</summary>
    public static double QiblaBearing(double latDeg, double lngDeg)
    {
        const double kaabaLat = 21.4225, kaabaLng = 39.8262;
        double dLng = Rad(kaabaLng - lngDeg);
        double lat1 = Rad(latDeg), lat2 = Rad(kaabaLat);
        double yy = Math.Sin(dLng);
        double xx = Math.Cos(lat1) * Math.Tan(lat2) - Math.Sin(lat1) * Math.Cos(dLng);
        return (Deg(Math.Atan2(yy, xx)) + 360.0) % 360.0;
    }

    public static double JulianDay(DateOnly date)
    {
        int a = (14 - date.Month) / 12;
        int y = date.Year + 4800 - a;
        int m = date.Month + 12 * a - 3;
        return date.Day + (153 * m + 2) / 5 + 365.0 * y + Math.Floor(y / 4.0)
             - Math.Floor(y / 100.0) + Math.Floor(y / 400.0) - 32045;
    }

    public static string FormatMinutes(double minutes)
    {
        int total = (int)Math.Round(minutes);
        total = ((total % 1440) + 1440) % 1440;
        return $"{total / 60:00}:{total % 60:00}";
    }
}
