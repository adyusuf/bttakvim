using BTTakvim.Api.Data;
using BTTakvim.Api.Services;
using BTTakvim.Api.Services.Providers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BTTakvim.Api.Controllers;

[ApiController]
[Route("api/prayer-times")]
public class PrayerTimesController(IPrayerTimesProvider provider, AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Namaz vakitleri: ?city=istanbul ya da ?lat=..&amp;lng=.. (en yakın şehir seçilir).
    /// Konuma bağlı olduğu için yaprağa gömülmez, her istekte hesaplanır.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? date,
        [FromQuery] string? city,
        [FromQuery] double? lat,
        [FromQuery] double? lng,
        [FromQuery] int? method,
        [FromQuery] int? school,
        [FromQuery] string? tune,
        CancellationToken ct)
    {
        DateOnly d;
        if (string.IsNullOrEmpty(date))
            d = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3));
        else if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", out d))
            return BadRequest(new { error = "Tarih biçimi yyyy-MM-dd olmalı." });

        City? selected = null;
        if (!string.IsNullOrEmpty(city))
        {
            selected = CityCatalog.BySlug(city);
            if (selected is null)
                return NotFound(new { error = $"Şehir bulunamadı: {city}" });
        }
        else if (lat.HasValue && lng.HasValue)
        {
            selected = CityCatalog.Nearest(lat.Value, lng.Value);
        }
        selected ??= CityCatalog.Default;

        var defaults = await GetPrayerDefaultsAsync(ct);
        if (!TryParseOptions(method, school, tune, defaults, out var options, out var error))
            return BadRequest(new { error });

        return Ok(await provider.GetTimesAsync(d, selected, options, ct));
    }

    /// <summary>
    /// Sunucu geneli namaz vakti varsayılanları (DB <c>Settings</c>). İstemci ilgili
    /// sorgu parametresini göndermezse bu değerler kullanılır. Tek istek = tek okuma.
    /// Parse edilemeyen/eksik ayarlar sabit yedeklere düşer (method=13, school=0, tune=0).
    /// </summary>
    private async Task<PrayerCalcOptions> GetPrayerDefaultsAsync(CancellationToken ct)
    {
        var keys = new[] { "prayer_default_method", "prayer_default_school", "prayer_default_tune" };
        var map = await db.Settings.Where(s => keys.Contains(s.Key))
            .ToDictionaryAsync(s => s.Key, s => s.Value, ct);

        int method = map.TryGetValue("prayer_default_method", out var mv) && int.TryParse(mv, out var m) ? m : 13;
        int school = map.TryGetValue("prayer_default_school", out var sv) && int.TryParse(sv, out var s) && s is (0 or 1) ? s : 0;
        int[] tune = ParseTune(map.GetValueOrDefault("prayer_default_tune")) ?? new int[6];

        return new PrayerCalcOptions(method, school, tune);
    }

    /// <summary>"a,b,c,d,e,f" → 6 tam sayı; biçim hatalıysa null (yedek sıfır ofset).</summary>
    private static int[]? ParseTune(string? tune)
    {
        if (string.IsNullOrWhiteSpace(tune)) return null;
        var parts = tune.Split(',');
        if (parts.Length != 6) return null;
        var offsets = new int[6];
        for (int i = 0; i < 6; i++)
            if (!int.TryParse(parts[i].Trim(), out offsets[i])) return null;
        return offsets;
    }

    /// <summary>
    /// Hesap tercihlerini doğrular. İstemci bir parametreyi göndermezse <paramref name="defaults"/>
    /// (sunucu geneli DB varsayılanları) devreye girer; istemci değeri her zaman geçersiz kılar.
    /// method, school (0|1), tune ("imsak,gunes,ogle,ikindi,aksam,yatsi" — 6 tam sayı dakika).
    /// </summary>
    private static bool TryParseOptions(
        int? method, int? school, string? tune, PrayerCalcOptions defaults,
        out PrayerCalcOptions options, out string error)
    {
        options = new PrayerCalcOptions();
        error = "";

        int m = method ?? defaults.Method;

        int s = school ?? defaults.School;
        if (s is not (0 or 1))
        {
            error = "school yalnızca 0 (Şâfiî/standart) veya 1 (Hanefî) olabilir.";
            return false;
        }

        int[] offsets = defaults.TuneOrDefault;
        if (!string.IsNullOrWhiteSpace(tune))
        {
            offsets = new int[6];
            var parts = tune.Split(',');
            if (parts.Length != 6)
            {
                error = "tune tam olarak 6 değer içermeli: imsak,gunes,ogle,ikindi,aksam,yatsi.";
                return false;
            }
            for (int i = 0; i < 6; i++)
            {
                if (!int.TryParse(parts[i].Trim(), out offsets[i]))
                {
                    error = "tune değerleri tam sayı dakika olmalı.";
                    return false;
                }
            }
        }

        options = new PrayerCalcOptions(m, s, offsets);
        return true;
    }

    [HttpGet("cities")]
    public IActionResult Cities() =>
        Ok(CityCatalog.Cities.Select(c => new { c.Slug, c.Name }));
}
