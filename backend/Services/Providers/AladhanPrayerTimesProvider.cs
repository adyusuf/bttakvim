using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace BTTakvim.Api.Services.Providers;

/// <summary>
/// Namaz vakitlerini Aladhan API'sinden (https://aladhan.com/prayer-times-api) alır.
/// Varsayılan method=13 (Diyanet İşleri Başkanlığı). Yardımcı alanlar (kıble saati,
/// gündüz/gece uzunluğu) yerel SolarMath ile hesaplanır. Herhangi bir hata durumunda
/// yerel hesaba (mock-diyanet) düşer; GetTimesAsync asla istisna fırlatmaz.
/// </summary>
public class AladhanPrayerTimesProvider(
    IHttpClientFactory httpClientFactory,
    IMemoryCache cache,
    ILogger<AladhanPrayerTimesProvider> logger) : IPrayerTimesProvider
{
    private const string BaseUrl = "https://api.aladhan.com/v1/timings";
    private static readonly TimeZoneInfo IstanbulTz = ResolveIstanbulTz();

    public async Task<PrayerTimesResult> GetTimesAsync(
        DateOnly date, City city, PrayerCalcOptions options, CancellationToken ct = default)
    {
        int[] tune = options.TuneOrDefault;
        string cacheKey = $"aladhan:{date:yyyy-MM-dd}:{city.Slug}:{options.Method}:{options.School}:{string.Join(',', tune)}";
        if (cache.TryGetValue(cacheKey, out PrayerTimesResult? cached) && cached is not null)
            return cached;

        try
        {
            var times = await FetchAsync(date, city, options, tune, ct);
            var result = PrayerTimesCompute.FromTimings(date, city, times, $"aladhan-{options.Method}");
            cache.Set(cacheKey, result, EndOfIstanbulDay());
            return result;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Aladhan isteği başarısız ({City} {Date}); yerel hesaba düşülüyor.", city.Slug, date);
            return PrayerTimesCompute.Local(date, city, options);
        }
    }

    private async Task<PrayerTimesDto> FetchAsync(
        DateOnly date, City city, PrayerCalcOptions options, int[] tune, CancellationToken ct)
    {
        // OUR tune: imsak,gunes,ogle,ikindi,aksam,yatsi
        // Aladhan tune (9): Imsak,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Sunset,Isha,Midnight
        string aladhanTune = string.Join(',',
            0,        // Imsak (kullanılmıyor)
            tune[0],  // Fajr   = imsak
            tune[1],  // Sunrise= gunes
            tune[2],  // Dhuhr  = ogle
            tune[3],  // Asr    = ikindi
            tune[4],  // Maghrib= aksam
            0,        // Sunset (kullanılmıyor)
            tune[5],  // Isha   = yatsi
            0);       // Midnight (kullanılmıyor)

        string lat = city.Lat.ToString(System.Globalization.CultureInfo.InvariantCulture);
        string lng = city.Lng.ToString(System.Globalization.CultureInfo.InvariantCulture);
        string url = $"{BaseUrl}/{date:dd-MM-yyyy}" +
                     $"?latitude={lat}&longitude={lng}" +
                     $"&method={options.Method}&school={options.School}" +
                     $"&timezonestring=Europe/Istanbul&tune={aladhanTune}";

        var http = httpClientFactory.CreateClient();
        http.Timeout = TimeSpan.FromSeconds(5);

        using var resp = await http.GetAsync(url, ct);
        resp.EnsureSuccessStatusCode();

        await using var stream = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        var timings = doc.RootElement.GetProperty("data").GetProperty("timings");

        // Aladhan → DTO: imsak=Fajr, gunes=Sunrise, ogle=Dhuhr,
        //                ikindi=Asr, aksam=Maghrib, yatsi=Isha
        return new PrayerTimesDto(
            Clean(timings.GetProperty("Fajr").GetString()),
            Clean(timings.GetProperty("Sunrise").GetString()),
            Clean(timings.GetProperty("Dhuhr").GetString()),
            Clean(timings.GetProperty("Asr").GetString()),
            Clean(timings.GetProperty("Maghrib").GetString()),
            Clean(timings.GetProperty("Isha").GetString()));
    }

    /// <summary>"05:12 (+03)" → "05:12". İlk beş karakteri (HH:MM) alır.</summary>
    private static string Clean(string? raw)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(raw);
        string trimmed = raw.Trim();
        int space = trimmed.IndexOf(' ');
        if (space >= 0) trimmed = trimmed[..space];
        return trimmed;
    }

    private static MemoryCacheEntryOptions EndOfIstanbulDay()
    {
        var nowIst = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, IstanbulTz);
        var endOfDay = new DateTimeOffset(nowIst.Date.AddDays(1), nowIst.Offset);
        var ttl = endOfDay - nowIst;
        if (ttl > TimeSpan.FromHours(12)) ttl = TimeSpan.FromHours(12);
        if (ttl <= TimeSpan.Zero) ttl = TimeSpan.FromHours(1);
        return new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl };
    }

    private static TimeZoneInfo ResolveIstanbulTz()
    {
        foreach (var id in new[] { "Europe/Istanbul", "Turkey Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }
        return TimeZoneInfo.CreateCustomTimeZone("TR", TimeSpan.FromHours(3), "TR", "TR");
    }
}
