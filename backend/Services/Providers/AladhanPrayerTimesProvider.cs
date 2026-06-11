using System.Diagnostics;
using System.Text.Json;
using BTTakvim.Api.Services;
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
    IntegrationCallLog callLog,
    ILogger<AladhanPrayerTimesProvider> logger) : IPrayerTimesProvider
{
    private const string BaseUrl = "https://api.aladhan.com/v1/timings";
    private const string ServiceName = "aladhan-timings";
    private static readonly TimeZoneInfo IstanbulTz = ResolveIstanbulTz();

    public async Task<PrayerTimesResult> GetTimesAsync(
        DateOnly date, City city, PrayerCalcOptions options, CancellationToken ct = default)
    {
        int[] tune = options.TuneOrDefault;
        string requestSummary = $"city={city.Slug} date={date:dd-MM-yyyy} method={options.Method} school={options.School}";
        string cacheKey = $"aladhan:{date:yyyy-MM-dd}:{city.Slug}:{options.Method}:{options.School}:{string.Join(',', tune)}";
        if (cache.TryGetValue(cacheKey, out PrayerTimesResult? cached) && cached is not null)
        {
            callLog.Add(new IntegrationCallEntry(
                DateTime.UtcNow, ServiceName, requestSummary, "cache", "aladhan",
                CacheHit: true, DurationMs: 0, StatusCode: null,
                ResponseSummary: TimesSummary(cached), Error: null));
            return cached;
        }

        var sw = Stopwatch.StartNew();
        int? statusCode = null;
        try
        {
            var (times, status) = await FetchAsync(date, city, options, tune, ct);
            statusCode = status;
            var result = PrayerTimesCompute.FromTimings(date, city, times, $"aladhan-{options.Method}");
            cache.Set(cacheKey, result, EndOfIstanbulDay());
            sw.Stop();
            callLog.Add(new IntegrationCallEntry(
                DateTime.UtcNow, ServiceName, requestSummary, "success", "aladhan",
                CacheHit: false, DurationMs: sw.ElapsedMilliseconds, StatusCode: statusCode,
                ResponseSummary: TimesSummary(result), Error: null));
            return result;
        }
        catch (Exception ex)
        {
            sw.Stop();
            if (statusCode is null && ex is HttpRequestException { StatusCode: { } hs })
                statusCode = (int)hs;
            logger.LogWarning(ex, "Aladhan isteği başarısız ({City} {Date}); yerel hesaba düşülüyor.", city.Slug, date);
            var local = PrayerTimesCompute.Local(date, city, options);
            callLog.Add(new IntegrationCallEntry(
                DateTime.UtcNow, ServiceName, requestSummary, "fallback", "local",
                CacheHit: false, DurationMs: sw.ElapsedMilliseconds, StatusCode: statusCode,
                ResponseSummary: TimesSummary(local), Error: ex.Message));
            return local;
        }
    }

    private static string TimesSummary(PrayerTimesResult r) =>
        $"{r.Times.Imsak} {r.Times.Gunes} {r.Times.Ogle} {r.Times.Ikindi} {r.Times.Aksam} {r.Times.Yatsi}";

    private async Task<(PrayerTimesDto Times, int Status)> FetchAsync(
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

        var http = httpClientFactory.CreateClient("aladhan");

        using var resp = await http.GetAsync(url, ct);
        int status = (int)resp.StatusCode;
        resp.EnsureSuccessStatusCode();

        await using var stream = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        var root = doc.RootElement;

        // Aladhan zarfı: { code, status, data: { timings: {...} } }
        if (!root.TryGetProperty("code", out var codeEl) ||
            !codeEl.TryGetInt32(out int code) || code != 200)
            throw new InvalidOperationException($"Aladhan code != 200 (gelen: {(codeEl.ValueKind == JsonValueKind.Number ? codeEl.ToString() : "yok")}).");

        if (!root.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Object)
            throw new InvalidOperationException("Aladhan data alanı eksik.");
        if (!data.TryGetProperty("timings", out var timings) || timings.ValueKind != JsonValueKind.Object)
            throw new InvalidOperationException("Aladhan data.timings alanı eksik.");

        // Aladhan → DTO: imsak=Fajr, gunes=Sunrise, ogle=Dhuhr,
        //                ikindi=Asr, aksam=Maghrib, yatsi=Isha
        var dto = new PrayerTimesDto(
            Clean(timings, "Fajr"),
            Clean(timings, "Sunrise"),
            Clean(timings, "Dhuhr"),
            Clean(timings, "Asr"),
            Clean(timings, "Maghrib"),
            Clean(timings, "Isha"));
        return (dto, status);
    }

    /// <summary>
    /// timings içinden bir vakti (örn. "05:12 (+03)") okur, "HH:MM" kısmını döndürür.
    /// Alan eksik/boş/biçimsizse net bir hata fırlatır (IntegrationCallLog'a anlamlı mesaj düşer
    /// ve dıştaki try/catch yerel hesaba geçer).
    /// </summary>
    private static string Clean(JsonElement timings, string field)
    {
        if (!timings.TryGetProperty(field, out var el) || el.ValueKind != JsonValueKind.String)
            throw new InvalidOperationException($"Aladhan timings.{field} eksik.");

        string? raw = el.GetString();
        if (string.IsNullOrWhiteSpace(raw))
            throw new InvalidOperationException($"Aladhan timings.{field} boş.");

        string trimmed = raw.Trim();
        int space = trimmed.IndexOf(' ');
        if (space >= 0) trimmed = trimmed[..space];

        if (!TimeOnly.TryParseExact(trimmed, "HH:mm", System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out _))
            throw new InvalidOperationException($"Aladhan timings.{field} geçersiz saat biçimi: '{trimmed}'.");

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
