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
    ILogger<AladhanHijriDateProvider> logger) : IHijriDateProvider
{
    private const string BaseUrl = "https://api.aladhan.com/v1/gToH";

    public async Task<HijriDate> GetHijriAsync(DateOnly date, CancellationToken ct = default)
    {
        var local = calendar.GetHijri(date);

        string cacheKey = $"hijri:gToH:{date:yyyy-MM-dd}";
        if (cache.TryGetValue(cacheKey, out HijriDate? cached) && cached is not null)
            return cached;

        try
        {
            var remote = await FetchAsync(date, ct);

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
            return remote;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Aladhan gToH isteği başarısız ({Date}); yerel hicrî hesaba düşülüyor.", date);
            return local;
        }
    }

    private async Task<HijriDate> FetchAsync(DateOnly date, CancellationToken ct)
    {
        string url = $"{BaseUrl}/{date:dd-MM-yyyy}";

        var http = httpClientFactory.CreateClient();
        http.Timeout = TimeSpan.FromSeconds(5);

        using var resp = await http.GetAsync(url, ct);
        resp.EnsureSuccessStatusCode();

        await using var stream = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        var hijri = doc.RootElement.GetProperty("data").GetProperty("hijri");

        int day = int.Parse(hijri.GetProperty("day").GetString()!, System.Globalization.CultureInfo.InvariantCulture);
        int monthNumber = hijri.GetProperty("month").GetProperty("number").GetInt32();
        int year = int.Parse(hijri.GetProperty("year").GetString()!, System.Globalization.CultureInfo.InvariantCulture);

        // Ay adını yerel Türkçe adlandırmayla eşle (Aladhan İngilizce/Arapça döndürür).
        return new HijriDate(day, TurkishCalendarService.HijriMonthName(monthNumber), year);
    }
}
