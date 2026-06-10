using BTTakvim.Api.Data;
using BTTakvim.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BTTakvim.Api.Controllers;

public record ToggleReactionRequest(TargetType TargetType, int TargetId, ReactionKind Kind, string DeviceKey);

[ApiController]
[Route("api/reactions")]
public class ReactionsController(AppDbContext db) : ControllerBase
{
    /// <summary>Tepkiyi açar/kapatır (like, save). Report tek yönlüdür, geri alınmaz.</summary>
    [HttpPost("toggle")]
    public async Task<IActionResult> Toggle([FromBody] ToggleReactionRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.DeviceKey))
            return BadRequest(new { error = "deviceKey gerekli." });

        var existing = await db.Reactions.FirstOrDefaultAsync(r =>
            r.TargetType == req.TargetType && r.TargetId == req.TargetId &&
            r.Kind == req.Kind && r.DeviceKey == req.DeviceKey, ct);

        bool active;
        if (existing is null)
        {
            db.Reactions.Add(new Reaction
            {
                TargetType = req.TargetType,
                TargetId = req.TargetId,
                Kind = req.Kind,
                DeviceKey = req.DeviceKey,
                CreatedAtUtc = DateTime.UtcNow,
            });
            active = true;
        }
        else if (req.Kind == ReactionKind.Report)
        {
            active = true; // raporlar geri çekilemez
        }
        else
        {
            db.Reactions.Remove(existing);
            active = false;
        }
        await db.SaveChangesAsync(ct);

        var count = await db.Reactions.CountAsync(r =>
            r.TargetType == req.TargetType && r.TargetId == req.TargetId && r.Kind == req.Kind, ct);

        return Ok(new { active, count });
    }

    /// <summary>Bir hedef için sayılar + bu cihazın durumu.</summary>
    [HttpGet("status")]
    public async Task<IActionResult> Status(
        [FromQuery] TargetType targetType, [FromQuery] int targetId,
        [FromQuery] string? deviceKey, CancellationToken ct)
    {
        var counts = await db.Reactions
            .Where(r => r.TargetType == targetType && r.TargetId == targetId)
            .GroupBy(r => r.Kind)
            .Select(g => new { Kind = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Kind, x => x.Count, ct);

        var mine = string.IsNullOrEmpty(deviceKey)
            ? []
            : await db.Reactions
                .Where(r => r.TargetType == targetType && r.TargetId == targetId && r.DeviceKey == deviceKey)
                .Select(r => r.Kind)
                .ToListAsync(ct);

        return Ok(new
        {
            likes = counts.GetValueOrDefault(ReactionKind.Like),
            saves = counts.GetValueOrDefault(ReactionKind.Save),
            reports = counts.GetValueOrDefault(ReactionKind.Report),
            myLike = mine.Contains(ReactionKind.Like),
            mySave = mine.Contains(ReactionKind.Save),
        });
    }

    /// <summary>Cihazın kaydettikleri (kaydedilenler ekranı için).</summary>
    [HttpGet("saved")]
    public async Task<IActionResult> Saved([FromQuery] string deviceKey, CancellationToken ct)
    {
        var saved = await db.Reactions
            .Where(r => r.DeviceKey == deviceKey && r.Kind == ReactionKind.Save)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new { r.TargetType, r.TargetId, r.CreatedAtUtc })
            .ToListAsync(ct);
        return Ok(saved);
    }
}
