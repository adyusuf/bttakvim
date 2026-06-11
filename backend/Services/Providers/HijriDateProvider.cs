using System.Diagnostics;
using System.Text.Json;
using BTTakvim.Api.Services;
using Microsoft.Extensions.Caching.Memory;

namespace BTTakvim.Api.Services.Providers;

/// <summary>
/// Bir Gregoryen tarihe karşılık gelen hicrî tarihi sağlar. Esas (yerel) kaynak
/// daima kullanılabilir; gerçek/resmî bir kaynak (Aladhan) istenirse arayüz
/// arkasında değiştirilebilir. Hiçbir zaman istisna fırlatmaz.
/// </summary>
public interface IHijriDateProvider
{
    /// <summary>
    /// Resmî (Aladhan gToH) hicrî tarihi getirmeye çalışır; her türlü hata,
    /// zaman aşımı veya çevrimdışı durumunda yerel UmAlQura+ofset hesabına düşer.
    /// </summary>
    Task<HijriDate> GetHijriAsync(DateOnly date, CancellationToken ct = default);
}

/// <summary>
/// Hicrî tarihi Aladhan gToH API'sinden
/// (<c>https://api.aladhan.com/v1/gToH/{DD-MM-YYYY}</c>) alır. Yanıttaki
/// <c>data.hijri</c> alanından gün/ay/yıl okunur. Eşleme zamanla değişmediğinden
/// tarih başına uzun süreli önbelleğe alınır. Herhangi bir hata/zaman aşımı(5sn)/
/// çevrimdışı durumda yerel <see cref="TurkishCalendarService.GetHijri"/> (UmAlQura
/// + yapılandırılmış gün-ofseti) hesabına düşer; metot asla istisna fırlatmaz.
/// </summary>
public class AladhanHijriDateProvider(
    IHttpClientFactory httpClientFactory,
    IMemoryCache cache,
    TurkishCalendarService calendar,
    IntegrationCallLog callLog,
    ILogger<AladhanHijriDateProvider> logger) : IHijriDateProvider
{
    private const string BaseUrl = "https://api.aladhan.com/v1/gToH";
    private const string ServiceName = "aladhan-gtoh";

    public async Task<HijriDate> GetHijriAsync(DateOnly date, CancellationToken ct = default)
    {
        var local = calendar.GetHijri(date);
        string requestSummary = $"date={date:dd-MM-yyyy}";

        string cacheKey = $"hijri:gToH:{date:yyyy-MM-dd}";
        if (cache.TryGetValue(cacheKey, out HijriDate? cached) && cached is not null)
        {
            callLog.Add(new IntegrationCallEntry(
                DateTime.UtcNow, ServiceName, requestSummary, "cache", "aladhan",
                CacheHit: true, DurationMs: 0, StatusCode: null,
                ResponseSummary: HijriSummary(cached), Error: null));
            return cached;
        }

        var sw = Stopwatch.StartNew();
        int? statusCode = null;
        try
        {
            var (remote, status) = await FetchAsync(date, ct);
            statusCode = status;

            // Yerel hesapla farkı görünür kıl (kalibrasyon/sürüklenme izleme).
            if (remote.Day != local.Day || remote.MonthName != local.MonthName || remote.Year != local.Year)
            {
                logger.LogInformation(
                    "Hicrî sürüklenme {Date}: yerel={LocalDay} {LocalMonth} {LocalYear}, Aladhan={RemoteDay} {RemoteMonth} {RemoteYear}",
                    date, local.Day, local.MonthName, local.Year, remote.Day, remote.MonthName, remote.Year);
            }

            // Eşleme stabil; uzun süreli önbelleğe al.
            cache.Set(cacheKey, remote, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(30),
            });
            sw.Stop();
            callLog.Add(new IntegrationCallEntry(
                DateTime.UtcNow, ServiceName, requestSummary, "success", "aladhan",
                CacheHit: false, DurationMs: sw.ElapsedMilliseconds, StatusCode: statusCode,
                ResponseSummary: HijriSummary(remote), Error: null));
            return remote;
        }
        catch (Exception ex)
        {
            sw.Stop();
            if (statusCode is null && ex is HttpRequestException { StatusCode: { } hs })
                statusCode = (int)hs;
            logger.LogWarning(ex, "Aladhan gToH isteği başarısız ({Date}); yerel hicrî hesaba düşülüyor.", date);
            callLog.Add(new IntegrationCallEntry(
                DateTime.UtcNow, ServiceName, requestSummary, "fallback", "local",
                CacheHit: false, DurationMs: sw.ElapsedMilliseconds, StatusCode: statusCode,
                ResponseSummary: HijriSummary(local), Error: ex.Message));
            return local;
        }
    }

    private static string HijriSummary(HijriDate h) => $"{h.Day} {h.MonthName} {h.Year}";

    private async Task<(HijriDate Hijri, int Status)> FetchAsync(DateOnly date, CancellationToken ct)
    {
        string url = $"{BaseUrl}/{date:dd-MM-yyyy}";

        var http = httpClientFactory.CreateClient("aladhan");

        using var resp = await http.GetAsync(url, ct);
        int status = (int)resp.StatusCode;
        resp.EnsureSuccessStatusCode();

        await using var stream = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        var root = doc.RootElement;

        // Aladhan zarfı: { code, status, data: { hijri: {...} } }
        if (!root.TryGetProperty("code", out var codeEl) ||
            !codeEl.TryGetInt32(out int code) || code != 200)
            throw new InvalidOperationException($"Aladhan code != 200 (gelen: {(codeEl.ValueKind == JsonValueKind.Number ? codeEl.ToString() : "yok")}).");

        if (!root.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Object ||
            !data.TryGetProperty("hijri", out var hijri) || hijri.ValueKind != JsonValueKind.Object)
            throw new InvalidOperationException("Aladhan data.hijri alanı eksik.");

        int day = ParseIntField(hijri, "day");
        int year = ParseIntField(hijri, "year");

        if (!hijri.TryGetProperty("month", out var monthEl) || monthEl.ValueKind != JsonValueKind.Object ||
            !monthEl.TryGetProperty("number", out var numberEl) || !numberEl.TryGetInt32(out int monthNumber) ||
            monthNumber is < 1 or > 12)
            throw new InvalidOperationException("Aladhan data.hijri.month.number eksik/geçersiz.");

        // Ay adını yerel Türkçe adlandırmayla eşle (Aladhan İngilizce/Arapça döndürür).
        return (new HijriDate(day, TurkishCalendarService.HijriMonthName(monthNumber), year), status);
    }

    /// <summary>
    /// Aladhan hicrî sayısal alanlarını (string olarak döner) güvenle okur; alan eksik/boş/
    /// biçimsizse net bir hata fırlatır (dıştaki try/catch yerel hesaba düşer).
    /// </summary>
    private static int ParseIntField(JsonElement obj, string field)
    {
        if (!obj.TryGetProperty(field, out var el) || el.ValueKind != JsonValueKind.String)
            throw new InvalidOperationException($"Aladhan data.hijri.{field} eksik.");
        var raw = el.GetString();
        if (!int.TryParse(raw, System.Globalization.NumberStyles.Integer,
                System.Globalization.CultureInfo.InvariantCulture, out int value))
            throw new InvalidOperationException($"Aladhan data.hijri.{field} geçersiz sayı: '{raw}'.");
        return value;
    }
}
