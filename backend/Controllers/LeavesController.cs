using BTTakvim.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BTTakvim.Api.Controllers;

[ApiController]
[Route("api/leaves")]
public class LeavesController(LeafService leafService) : ControllerBase
{
    /// <summary>Yaprağı getirir; tarih ilk kez ziyaret ediliyorsa üretip kaydeder.</summary>
    [HttpGet("{date}")]
    public async Task<IActionResult> Get(string date, CancellationToken ct)
    {
        if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", out var d))
            return BadRequest(new { error = "Tarih biçimi yyyy-MM-dd olmalı." });
        if (d.Year is < 1900 or > 2200)
            return BadRequest(new { error = "Tarih 1900-2200 aralığında olmalı." });

        return Ok(await leafService.GetOrCreateAsync(d, ct));
    }

    [HttpGet("today")]
    public Task<IActionResult> Today(CancellationToken ct)
    {
        // Türkiye saati (UTC+3)
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3));
        return Get(today.ToString("yyyy-MM-dd"), ct);
    }
}
