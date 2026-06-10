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
    public IActionResult Get(
        [FromQuery] string? date,
        [FromQuery] string? city,
        [FromQuery] double? lat,
        [FromQuery] double? lng)
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

        return Ok(provider.GetTimes(d, selected));
    }

    [HttpGet("cities")]
    public IActionResult Cities() =>
        Ok(CityCatalog.Cities.Select(c => new { c.Slug, c.Name }));
}
