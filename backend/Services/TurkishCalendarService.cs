using System.Globalization;

namespace BTTakvim.Api.Services;

public record HijriDate(int Day, string MonthName, int Year);
public record RumiDate(int Day, string MonthName, int Year);
public record SeasonalDay(string Label, int Day);
public record ColdPeriod(string Label, int Day);

/// <summary>
/// Hicri, Rumi, Kasım/Hızır günleri ve Zemheri/Hamsin hesapları.
/// Bunlar dış servis değil; klasik takvim yapraklarındaki kurallarla yerel hesaplanır.
/// </summary>
public class TurkishCalendarService
{
    private static readonly UmAlQuraCalendar Hijri = new();

    private static readonly string[] HijriMonths =
    [
        "Muharrem", "Safer", "Rebiülevvel", "Rebiülahir", "Cemaziyelevvel", "Cemaziyelahir",
        "Recep", "Şaban", "Ramazan", "Şevval", "Zilkade", "Zilhicce"
    ];

    private static readonly string[] TurkishMonths =
    [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    private static readonly string[] TurkishDays =
    [
        "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"
    ];

    public static string MonthName(int month) => TurkishMonths[month - 1];

    public static string WeekdayName(DateOnly date) => TurkishDays[(int)date.DayOfWeek];

    public HijriDate GetHijri(DateOnly date)
    {
        var dt = date.ToDateTime(TimeOnly.MinValue);
        return new HijriDate(
            Hijri.GetDayOfMonth(dt),
            HijriMonths[Hijri.GetMonth(dt) - 1],
            Hijri.GetYear(dt));
    }

    /// <summary>
    /// Rumi tarih: Jülyen takvimine dönüştürülür (modern dönemde 13 gün geri),
    /// yıl = Jülyen yılı - 584 (Mart öncesinde - 585; Rumi yılbaşı 1 Mart'tır).
    /// Ay adları, güncel takvim yapraklarındaki gibi modern Türkçe ay adlarıdır.
    /// </summary>
    public RumiDate GetRumi(DateOnly date)
    {
        var (jy, jm, jd) = GregorianToJulianCalendar(date);
        var rumiYear = jm >= 3 ? jy - 584 : jy - 585;
        return new RumiDate(jd, TurkishMonths[jm - 1], rumiYear);
    }

    /// <summary>Kasım günleri 8 Kasım'da, Hızır günleri 6 Mayıs'ta başlar.</summary>
    public SeasonalDay GetSeasonalDay(DateOnly date)
    {
        var hizirStart = new DateOnly(date.Year, 5, 6);
        var kasimStartThisYear = new DateOnly(date.Year, 11, 8);

        if (date < hizirStart)
        {
            var kasimStart = new DateOnly(date.Year - 1, 11, 8);
            return new SeasonalDay("Kasım", date.DayNumber - kasimStart.DayNumber + 1);
        }
        if (date < kasimStartThisYear)
            return new SeasonalDay("Hızır", date.DayNumber - hizirStart.DayNumber + 1);

        return new SeasonalDay("Kasım", date.DayNumber - kasimStartThisYear.DayNumber + 1);
    }

    /// <summary>Zemheri (Erbain): 22 Aralık'tan 40 gün; Hamsin: 31 Ocak'tan 50 gün.</summary>
    public ColdPeriod? GetColdPeriod(DateOnly date)
    {
        var zemheriStart = date.Month == 12
            ? new DateOnly(date.Year, 12, 22)
            : new DateOnly(date.Year - 1, 12, 22);
        var zemheriDay = date.DayNumber - zemheriStart.DayNumber + 1;
        if (zemheriDay is >= 1 and <= 40) return new ColdPeriod("Zemheri", zemheriDay);

        if (date.Year >= 1 && date.Month <= 3)
        {
            var hamsinStart = new DateOnly(date.Year, 1, 31);
            var hamsinDay = date.DayNumber - hamsinStart.DayNumber + 1;
            if (hamsinDay is >= 1 and <= 50) return new ColdPeriod("Hamsin", hamsinDay);
        }
        return null;
    }

    /// <summary>Gregoryen tarihi Jülyen takvim tarihine çevirir (JDN üzerinden).</summary>
    private static (int Year, int Month, int Day) GregorianToJulianCalendar(DateOnly g)
    {
        // Gregoryen -> Jülyen Gün Numarası
        int a = (14 - g.Month) / 12;
        int y = g.Year + 4800 - a;
        int m = g.Month + 12 * a - 3;
        long jdn = g.Day + (153 * m + 2) / 5 + 365L * y + y / 4 - y / 100 + y / 400 - 32045;

        // JDN -> Jülyen takvim tarihi
        long c = jdn + 32082;
        long d = (4 * c + 3) / 1461;
        long e = c - 1461 * d / 4;
        long mm = (5 * e + 2) / 153;
        int day = (int)(e - (153 * mm + 2) / 5 + 1);
        int month = (int)(mm + 3 - 12 * (mm / 10));
        int year = (int)(d - 4800 + mm / 10);
        return (year, month, day);
    }
}
