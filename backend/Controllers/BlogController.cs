using BTTakvim.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BTTakvim.Api.Controllers;

[ApiController]
[Route("api/blog")]
public class BlogController(AppDbContext db) : ControllerBase
{
    [HttpGet("categories")]
    public async Task<IActionResult> Categories(CancellationToken ct) =>
        Ok(await db.BlogCategories
            .OrderBy(c => c.Id)
            .Select(c => new { c.Slug, c.Name })
            .ToListAsync(ct));

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? category, CancellationToken ct)
    {
        var query = db.BlogPosts.Include(p => p.Category).Where(p => p.IsPublished);
        if (!string.IsNullOrEmpty(category))
            query = query.Where(p => p.Category!.Slug == category);

        var posts = await query
            .OrderByDescending(p => p.PublishedAtUtc)
            .Select(p => new
            {
                p.Slug,
                p.Title,
                p.Summary,
                CategorySlug = p.Category!.Slug,
                CategoryName = p.Category.Name,
                p.CoverImageUrl,
                p.PublishedAtUtc,
                ReadingMinutes = Math.Max(1, p.Body.Length / 1100),
            })
            .ToListAsync(ct);
        return Ok(posts);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> Get(string slug, CancellationToken ct)
    {
        var post = await db.BlogPosts.Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsPublished, ct);
        if (post is null) return NotFound();

        return Ok(new
        {
            post.Slug,
            post.Title,
            post.Summary,
            post.Body,
            CategorySlug = post.Category!.Slug,
            CategoryName = post.Category.Name,
            post.CoverImageUrl,
            post.PublishedAtUtc,
            ReadingMinutes = Math.Max(1, post.Body.Length / 1100),
        });
    }
}
