using BTTakvim.Api.Data;
using BTTakvim.Api.Models;
using BTTakvim.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BTTakvim.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController(AppDbContext db, LeafService leafService) : ControllerBase
{
    // ---- Özet (dashboard) ----

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(CancellationToken ct) => Ok(new
    {
        leaves = await db.CalendarLeaves.CountAsync(ct),
        categories = await db.ContentCategories.CountAsync(ct),
        contentItems = await db.ContentItems.CountAsync(ct),
        historyEvents = await db.HistoryEvents.CountAsync(ct),
        blogPosts = await db.BlogPosts.CountAsync(ct),
        comments = await db.Comments.CountAsync(ct),
        reports = await db.Reactions.CountAsync(r => r.Kind == ReactionKind.Report, ct),
    });

    // ---- Yapraklar ----

    /// <summary>Üretilmiş (ziyaret edilmiş) yaprakların listesi.</summary>
    [HttpGet("leaves")]
    public async Task<IActionResult> Leaves(CancellationToken ct) =>
        Ok(await db.CalendarLeaves
            .OrderByDescending(l => l.Date)
            .Select(l => new { l.Id, Date = l.Date.ToString("yyyy-MM-dd"), l.CreatedAtUtc })
            .ToListAsync(ct));

    /// <summary>
    /// Yaprağı sıfırlar (siler). Bir sonraki ziyarette güncel içerik havuzundan yeniden üretilir.
    /// </summary>
    [HttpDelete("leaves/{date}")]
    public async Task<IActionResult> ResetLeaf(string date, CancellationToken ct)
    {
        if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", out var d))
            return BadRequest(new { error = "Tarih biçimi yyyy-MM-dd olmalı." });
        var removed = await leafService.ResetAsync(d, ct);
        return removed ? Ok(new { reset = true }) : NotFound(new { error = "Bu tarih için yaprak üretilmemiş." });
    }

    // ---- Ayarlar ----

    [HttpGet("settings")]
    public async Task<IActionResult> Settings(CancellationToken ct) =>
        Ok(await db.Settings.ToDictionaryAsync(s => s.Key, s => s.Value, ct));

    public record SettingRequest(string Key, string Value);

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSetting([FromBody] SettingRequest req, CancellationToken ct)
    {
        var setting = await db.Settings.FindAsync([req.Key], ct);
        if (setting is null)
            db.Settings.Add(new AppSetting { Key = req.Key, Value = req.Value });
        else
            setting.Value = req.Value;
        await db.SaveChangesAsync(ct);
        return Ok(new { req.Key, req.Value });
    }

    // ---- Kategoriler ----

    [HttpGet("categories")]
    public async Task<IActionResult> Categories(CancellationToken ct) =>
        Ok(await db.ContentCategories.OrderBy(c => c.SortOrder)
            .Select(c => new { c.Id, c.Slug, c.Name, c.Icon, c.SortOrder, c.IsActive, ItemCount = c.Items.Count })
            .ToListAsync(ct));

    public record CategoryRequest(string Slug, string Name, string Icon, int SortOrder, bool IsActive);

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CategoryRequest req, CancellationToken ct)
    {
        if (await db.ContentCategories.AnyAsync(c => c.Slug == req.Slug, ct))
            return Conflict(new { error = "Bu slug zaten var." });
        var category = new ContentCategory
        {
            Slug = req.Slug, Name = req.Name, Icon = req.Icon,
            SortOrder = req.SortOrder, IsActive = req.IsActive,
        };
        db.ContentCategories.Add(category);
        await db.SaveChangesAsync(ct);
        return Ok(new { category.Id });
    }

    [HttpPut("categories/{id:int}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryRequest req, CancellationToken ct)
    {
        var category = await db.ContentCategories.FindAsync([id], ct);
        if (category is null) return NotFound();
        category.Slug = req.Slug; category.Name = req.Name; category.Icon = req.Icon;
        category.SortOrder = req.SortOrder; category.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    // ---- İçerik öğeleri ----

    [HttpGet("content-items")]
    public async Task<IActionResult> ContentItems([FromQuery] int? categoryId, CancellationToken ct)
    {
        var query = db.ContentItems.AsQueryable();
        if (categoryId.HasValue) query = query.Where(i => i.CategoryId == categoryId);
        return Ok(await query.OrderByDescending(i => i.Id)
            .Select(i => new
            {
                i.Id, i.CategoryId, i.Title, i.Body,
                i.PinnedMonth, i.PinnedDay, i.PinnedDate, i.IsActive, i.Source,
            })
            .ToListAsync(ct));
    }

    public record ContentItemRequest(
        int CategoryId, string Title, string Body,
        int? PinnedMonth, int? PinnedDay, DateOnly? PinnedDate, bool IsActive);

    [HttpPost("content-items")]
    public async Task<IActionResult> CreateContentItem([FromBody] ContentItemRequest req, CancellationToken ct)
    {
        var item = new ContentItem
        {
            CategoryId = req.CategoryId, Title = req.Title, Body = req.Body,
            PinnedMonth = req.PinnedMonth, PinnedDay = req.PinnedDay, PinnedDate = req.PinnedDate,
            IsActive = req.IsActive, CreatedAtUtc = DateTime.UtcNow,
        };
        db.ContentItems.Add(item);
        await db.SaveChangesAsync(ct);
        return Ok(new { item.Id });
    }

    [HttpPut("content-items/{id:int}")]
    public async Task<IActionResult> UpdateContentItem(int id, [FromBody] ContentItemRequest req, CancellationToken ct)
    {
        var item = await db.ContentItems.FindAsync([id], ct);
        if (item is null) return NotFound();
        item.CategoryId = req.CategoryId; item.Title = req.Title; item.Body = req.Body;
        item.PinnedMonth = req.PinnedMonth; item.PinnedDay = req.PinnedDay; item.PinnedDate = req.PinnedDate;
        item.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpDelete("content-items/{id:int}")]
    public async Task<IActionResult> DeleteContentItem(int id, CancellationToken ct)
    {
        var item = await db.ContentItems.FindAsync([id], ct);
        if (item is null) return NotFound();
        db.ContentItems.Remove(item);
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    // ---- Geçmişte bugün ----

    [HttpGet("history-events")]
    public async Task<IActionResult> HistoryEvents(CancellationToken ct) =>
        Ok(await db.HistoryEvents.OrderBy(h => h.Month).ThenBy(h => h.Day).ThenBy(h => h.Year).ToListAsync(ct));

    public record HistoryEventRequest(int Month, int Day, int Year, string Text, bool IsActive);

    [HttpPost("history-events")]
    public async Task<IActionResult> CreateHistoryEvent([FromBody] HistoryEventRequest req, CancellationToken ct)
    {
        var ev = new HistoryEvent { Month = req.Month, Day = req.Day, Year = req.Year, Text = req.Text, IsActive = req.IsActive };
        db.HistoryEvents.Add(ev);
        await db.SaveChangesAsync(ct);
        return Ok(new { ev.Id });
    }

    [HttpDelete("history-events/{id:int}")]
    public async Task<IActionResult> DeleteHistoryEvent(int id, CancellationToken ct)
    {
        var ev = await db.HistoryEvents.FindAsync([id], ct);
        if (ev is null) return NotFound();
        db.HistoryEvents.Remove(ev);
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    // ---- Sözler ----

    [HttpGet("quotes")]
    public async Task<IActionResult> Quotes(CancellationToken ct) =>
        Ok(await db.Quotes.OrderByDescending(q => q.Id)
            .Select(q => new { q.Id, q.Text, q.Author, q.IsActive })
            .ToListAsync(ct));

    public record QuoteRequest(string Text, string? Author, bool IsActive);

    [HttpPost("quotes")]
    public async Task<IActionResult> CreateQuote([FromBody] QuoteRequest req, CancellationToken ct)
    {
        var quote = new Quote { Text = req.Text, Author = req.Author, IsActive = req.IsActive };
        db.Quotes.Add(quote);
        await db.SaveChangesAsync(ct);
        return Ok(new { quote.Id, quote.Text, quote.Author, quote.IsActive });
    }

    [HttpPut("quotes/{id:int}")]
    public async Task<IActionResult> UpdateQuote(int id, [FromBody] QuoteRequest req, CancellationToken ct)
    {
        var quote = await db.Quotes.FindAsync([id], ct);
        if (quote is null) return NotFound();
        quote.Text = req.Text; quote.Author = req.Author; quote.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);
        return Ok(new { quote.Id, quote.Text, quote.Author, quote.IsActive });
    }

    [HttpDelete("quotes/{id:int}")]
    public async Task<IActionResult> DeleteQuote(int id, CancellationToken ct)
    {
        var quote = await db.Quotes.FindAsync([id], ct);
        if (quote is null) return NotFound();
        db.Quotes.Remove(quote);
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    // ---- Bebek isimleri ----

    [HttpGet("names")]
    public async Task<IActionResult> Names([FromQuery] string? gender, [FromQuery] string? q, CancellationToken ct)
    {
        var query = db.BabyNames.AsQueryable();
        if (gender is "K" or "E") query = query.Where(n => n.Gender == gender);
        if (!string.IsNullOrWhiteSpace(q)) query = query.Where(n => n.Name.Contains(q));
        return Ok(await query.OrderByDescending(n => n.Id)
            .Select(n => new { n.Id, n.Name, n.Gender, n.Meaning, n.IsActive })
            .ToListAsync(ct));
    }

    public record BabyNameRequest(string Name, string Gender, string? Meaning, bool IsActive);

    [HttpPost("names")]
    public async Task<IActionResult> CreateName([FromBody] BabyNameRequest req, CancellationToken ct)
    {
        if (req.Gender is not ("K" or "E"))
            return BadRequest(new { error = "Cinsiyet K veya E olmalı." });
        var name = new BabyName { Name = req.Name, Gender = req.Gender, Meaning = req.Meaning, IsActive = req.IsActive };
        db.BabyNames.Add(name);
        await db.SaveChangesAsync(ct);
        return Ok(new { name.Id, name.Name, name.Gender, name.Meaning, name.IsActive });
    }

    [HttpPut("names/{id:int}")]
    public async Task<IActionResult> UpdateName(int id, [FromBody] BabyNameRequest req, CancellationToken ct)
    {
        if (req.Gender is not ("K" or "E"))
            return BadRequest(new { error = "Cinsiyet K veya E olmalı." });
        var name = await db.BabyNames.FindAsync([id], ct);
        if (name is null) return NotFound();
        name.Name = req.Name; name.Gender = req.Gender; name.Meaning = req.Meaning; name.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);
        return Ok(new { name.Id, name.Name, name.Gender, name.Meaning, name.IsActive });
    }

    [HttpDelete("names/{id:int}")]
    public async Task<IActionResult> DeleteName(int id, CancellationToken ct)
    {
        var name = await db.BabyNames.FindAsync([id], ct);
        if (name is null) return NotFound();
        db.BabyNames.Remove(name);
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    // ---- Blog kategorileri ----

    [HttpGet("blog-categories")]
    public async Task<IActionResult> BlogCategories(CancellationToken ct) =>
        Ok(await db.BlogCategories.OrderBy(c => c.Id)
            .Select(c => new { c.Id, c.Slug, c.Name, PostCount = c.Posts.Count })
            .ToListAsync(ct));

    public record BlogCategoryRequest(string Slug, string Name);

    [HttpPost("blog-categories")]
    public async Task<IActionResult> CreateBlogCategory([FromBody] BlogCategoryRequest req, CancellationToken ct)
    {
        if (await db.BlogCategories.AnyAsync(c => c.Slug == req.Slug, ct))
            return Conflict(new { error = "Bu slug zaten var." });
        var c = new BlogCategory { Slug = req.Slug, Name = req.Name };
        db.BlogCategories.Add(c);
        await db.SaveChangesAsync(ct);
        return Ok(new { c.Id });
    }

    // ---- Blog yazıları ----

    [HttpGet("blog-posts")]
    public async Task<IActionResult> BlogPosts(CancellationToken ct) =>
        Ok(await db.BlogPosts.Include(p => p.Category)
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new
            {
                p.Id, p.Slug, p.Title, p.Summary, p.Body, p.CategoryId,
                CategoryName = p.Category!.Name, p.CoverImageUrl, p.IsPublished, p.PublishedAtUtc,
            })
            .ToListAsync(ct));

    public record BlogPostRequest(
        int CategoryId, string Slug, string Title, string Summary, string Body,
        string? CoverImageUrl, bool IsPublished);

    [HttpPost("blog-posts")]
    public async Task<IActionResult> CreateBlogPost([FromBody] BlogPostRequest req, CancellationToken ct)
    {
        if (await db.BlogPosts.AnyAsync(p => p.Slug == req.Slug, ct))
            return Conflict(new { error = "Bu slug zaten var." });
        var post = new BlogPost
        {
            CategoryId = req.CategoryId, Slug = req.Slug, Title = req.Title, Summary = req.Summary,
            Body = req.Body, CoverImageUrl = req.CoverImageUrl, IsPublished = req.IsPublished,
            PublishedAtUtc = req.IsPublished ? DateTime.UtcNow : null, CreatedAtUtc = DateTime.UtcNow,
        };
        db.BlogPosts.Add(post);
        await db.SaveChangesAsync(ct);
        return Ok(new { post.Id });
    }

    [HttpPut("blog-posts/{id:int}")]
    public async Task<IActionResult> UpdateBlogPost(int id, [FromBody] BlogPostRequest req, CancellationToken ct)
    {
        var post = await db.BlogPosts.FindAsync([id], ct);
        if (post is null) return NotFound();
        post.CategoryId = req.CategoryId; post.Slug = req.Slug; post.Title = req.Title;
        post.Summary = req.Summary; post.Body = req.Body; post.CoverImageUrl = req.CoverImageUrl;
        if (req.IsPublished && !post.IsPublished) post.PublishedAtUtc = DateTime.UtcNow;
        post.IsPublished = req.IsPublished;
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpDelete("blog-posts/{id:int}")]
    public async Task<IActionResult> DeleteBlogPost(int id, CancellationToken ct)
    {
        var post = await db.BlogPosts.FindAsync([id], ct);
        if (post is null) return NotFound();
        db.BlogPosts.Remove(post);
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    // ---- Moderasyon ----

    /// <summary>Bildirilen (report edilen) içerikler.</summary>
    [HttpGet("reports")]
    public async Task<IActionResult> Reports(CancellationToken ct) =>
        Ok(await db.Reactions
            .Where(r => r.Kind == ReactionKind.Report)
            .GroupBy(r => new { r.TargetType, r.TargetId })
            .Select(g => new { g.Key.TargetType, g.Key.TargetId, Count = g.Count(), Last = g.Max(r => r.CreatedAtUtc) })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct));

    [HttpPut("comments/{id:int}/status")]
    public async Task<IActionResult> SetCommentStatus(int id, [FromQuery] CommentStatus status, CancellationToken ct)
    {
        var comment = await db.Comments.FindAsync([id], ct);
        if (comment is null) return NotFound();
        comment.Status = status;
        await db.SaveChangesAsync(ct);
        return Ok();
    }
}
