using BTTakvim.Api.Data;
using BTTakvim.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BTTakvim.Api.Controllers;

public record CreateCommentRequest(
    TargetType TargetType, int TargetId, int? ParentId,
    string AuthorName, string DeviceKey, string Body);

public record CommentDto(
    int Id, int? ParentId, string AuthorName, string Body,
    int Likes, DateTime CreatedAtUtc, List<CommentDto> Replies);

[ApiController]
[Route("api/comments")]
public class CommentsController(AppDbContext db) : ControllerBase
{
    /// <summary>Hedefin yorumlarını iç içe (yoruma yorum) ağaç olarak döner.</summary>
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] TargetType targetType, [FromQuery] int targetId, CancellationToken ct)
    {
        var comments = await db.Comments
            .Where(c => c.TargetType == targetType && c.TargetId == targetId &&
                        c.Status == CommentStatus.Visible)
            .OrderBy(c => c.CreatedAtUtc)
            .ToListAsync(ct);

        var ids = comments.Select(c => c.Id).ToList();
        var likes = await db.Reactions
            .Where(r => r.TargetType == TargetType.Comment && ids.Contains(r.TargetId) &&
                        r.Kind == ReactionKind.Like)
            .GroupBy(r => r.TargetId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);

        List<CommentDto> Build(int? parentId) =>
            comments.Where(c => c.ParentId == parentId)
                .Select(c => new CommentDto(
                    c.Id, c.ParentId, c.AuthorName, c.Body,
                    likes.GetValueOrDefault(c.Id), c.CreatedAtUtc, Build(c.Id)))
                .ToList();

        return Ok(Build(null));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCommentRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Body) || req.Body.Length > 2000)
            return BadRequest(new { error = "Yorum 1-2000 karakter olmalı." });
        if (string.IsNullOrWhiteSpace(req.DeviceKey))
            return BadRequest(new { error = "deviceKey gerekli." });

        if (req.ParentId.HasValue)
        {
            var parentExists = await db.Comments.AnyAsync(c => c.Id == req.ParentId.Value, ct);
            if (!parentExists) return NotFound(new { error = "Üst yorum bulunamadı." });
        }

        var comment = new Comment
        {
            TargetType = req.TargetType,
            TargetId = req.TargetId,
            ParentId = req.ParentId,
            AuthorName = string.IsNullOrWhiteSpace(req.AuthorName) ? "Misafir" : req.AuthorName.Trim(),
            DeviceKey = req.DeviceKey,
            Body = req.Body.Trim(),
            CreatedAtUtc = DateTime.UtcNow,
        };
        db.Comments.Add(comment);
        await db.SaveChangesAsync(ct);

        return Ok(new CommentDto(
            comment.Id, comment.ParentId, comment.AuthorName, comment.Body, 0,
            comment.CreatedAtUtc, []));
    }
}
