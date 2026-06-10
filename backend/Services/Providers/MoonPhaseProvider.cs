namespace BTTakvim.Api.Services.Providers;

public record MoonInfo(string Key, string Name, string Emoji, double Illumination, string Source);

/// <summary>
/// Ay evresi sağlayıcısı. Gerçek uygulamada bilimsel bir veritabanına (NASA/USNO) bağlanacak;
/// şimdilik mock: sinodik ay hesabıyla yerel yaklaşık değer üretir.
/// </summary>
public interface IMoonPhaseProvider
{
    MoonInfo GetPhase(DateOnly date);
}

public class MockMoonPhaseProvider : IMoonPhaseProvider
{
    private const double SynodicMonth = 29.53058867;
    private const double NewMoonEpochJd = 2451550.26; // 6 Ocak 2000 ~18:14 UTC yeni ay

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
        double jd = SolarMath.JulianDay(date) + 0.5; // gece yarısı UTC
        double age = (jd - NewMoonEpochJd) % SynodicMonth;
        if (age < 0) age += SynodicMonth;

        double fraction = age / SynodicMonth; // 0..1
        double illumination = (1 - Math.Cos(2 * Math.PI * fraction)) / 2.0;

        // 8 evreye böl: her evre 1/8'lik dilim, yeni ay dilimi -1/16..+1/16 arası
        int index = (int)Math.Floor((fraction + 1.0 / 16.0) * 8.0) % 8;
        var (key, name, emoji) = Phases[index];

        return new MoonInfo(key, name, emoji, Math.Round(illumination, 3), "mock");
    }
}
