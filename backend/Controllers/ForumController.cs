using BTTakvim.Api.Data;
using BTTakvim.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BTTakvim.Api.Controllers;

public record CreateTopicRequest(string Title, string Body, string AuthorName, string DeviceKey);

[ApiController]
[Route("api/forum")]
public class ForumController(AppDbContext db) : ControllerBase
{
    /// <summary>Forum konuları — yorum ve beğeni sayılarıyla.</summary>
    [HttpGet("topics")]
    public async Task<IActionResult> Topics(CancellationToken ct)
    {
        var topics = await db.ForumTopics
            .Where(t => !t.IsHidden)
            .OrderByDescending(t => t.CreatedAtUtc)
            .Select(t => new { t.Id, t.Title, t.Body, t.AuthorName, t.IsLocked, t.CreatedAtUtc })
            .ToListAsync(ct);

        var ids = topics.Select(t => t.Id).ToList();
        var commentCounts = await db.Comments
            .Where(c => c.TargetType == TargetType.ForumTopic && ids.Contains(c.TargetId) && c.Status == CommentStatus.Visible)
            .GroupBy(c => c.TargetId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);
        var likeCounts = await db.Reactions
            .Where(r => r.TargetType == TargetType.ForumTopic && ids.Contains(r.TargetId) && r.Kind == ReactionKind.Like)
            .GroupBy(r => r.TargetId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);

        return Ok(topics.Select(t => new
        {
            t.Id, t.Title, t.Body, t.AuthorName, t.IsLocked, t.CreatedAtUtc,
            commentCount = commentCounts.GetValueOrDefault(t.Id),
            likeCount = likeCounts.GetValueOrDefault(t.Id),
        }));
    }

    [HttpGet("topics/{id:int}")]
    public async Task<IActionResult> Topic(int id, CancellationToken ct)
    {
        var t = await db.ForumTopics.FirstOrDefaultAsync(x => x.Id == id && !x.IsHidden, ct);
        if (t is null) return NotFound();
        return Ok(new { t.Id, t.Title, t.Body, t.AuthorName, t.IsLocked, t.CreatedAtUtc });
    }

    [HttpPost("topics")]
    public async Task<IActionResult> Create([FromBody] CreateTopicRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Title) || req.Title.Length > 200)
            return BadRequest(new { error = "Başlık 1-200 karakter olmalı." });
        if (string.IsNullOrWhiteSpace(req.DeviceKey))
            return BadRequest(new { error = "deviceKey gerekli." });

        var topic = new ForumTopic
        {
            Title = req.Title.Trim(),
            Body = (req.Body ?? "").Trim(),
            AuthorName = string.IsNullOrWhiteSpace(req.AuthorName) ? "Misafir" : req.AuthorName.Trim(),
            DeviceKey = req.DeviceKey,
            CreatedAtUtc = DateTime.UtcNow,
        };
        db.ForumTopics.Add(topic);
        await db.SaveChangesAsync(ct);
        return Ok(new { topic.Id });
    }
}
