using BTTakvim.Api.Services;
using BTTakvim.Api.Services.Providers;
using Microsoft.AspNetCore.Mvc;

namespace BTTakvim.Api.Controllers;

[ApiController]
[Route("api/prayer-times")]
public class PrayerTimesController(IPrayerTimesProvider provider) : ControllerBase
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

        if (!TryParseOptions(method, school, tune, out var options, out var error))
            return BadRequest(new { error });

        return Ok(await provider.GetTimesAsync(d, selected, options, ct));
    }

    /// <summary>
    /// Hesap tercihlerini doğrular. method (varsayılan 13), school (0|1, varsayılan 0),
    /// tune ("imsak,gunes,ogle,ikindi,aksam,yatsi" — 6 tam sayı dakika, varsayılan sıfır).
    /// </summary>
    private static bool TryParseOptions(
        int? method, int? school, string? tune,
        out PrayerCalcOptions options, out string error)
    {
        options = new PrayerCalcOptions();
        error = "";

        int m = method ?? 13;

        int s = school ?? 0;
        if (s is not (0 or 1))
        {
            error = "school yalnızca 0 (Şâfiî/standart) veya 1 (Hanefî) olabilir.";
            return false;
        }

        int[] offsets = new int[6];
        if (!string.IsNullOrWhiteSpace(tune))
        {
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
