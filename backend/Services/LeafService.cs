using System.Text.Json;
using BTTakvim.Api.Data;
using BTTakvim.Api.Dtos;
using BTTakvim.Api.Models;
using BTTakvim.Api.Services.Providers;
using Microsoft.EntityFrameworkCore;

namespace BTTakvim.Api.Services;

/// <summary>
/// Yaprak motoru: bir tarih ilk kez ziyaret edildiğinde yaprağı üretir ve kaydeder.
/// Kaydedilen yaprak bir daha değişmez; admin reset ederse silinir ve sonraki
/// ziyarette yeniden üretilir. Ziyaret edilmeyen tarihler veritabanına yazılmaz.
/// </summary>
public class LeafService(
    AppDbContext db,
    TurkishCalendarService calendar,
    IMoonPhaseProvider moonProvider,
    IQuoteProvider quoteProvider,
    INameProvider nameProvider)
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    public async Task<LeafDto> GetOrCreateAsync(DateOnly date, CancellationToken ct = default)
    {
        var leaf = await db.CalendarLeaves.FirstOrDefaultAsync(l => l.Date == date, ct);
        leaf ??= await GenerateAsync(date, ct);
        return await ToDtoAsync(leaf, ct);
    }

    public async Task<bool> ResetAsync(DateOnly date, CancellationToken ct = default)
    {
        var leaf = await db.CalendarLeaves.FirstOrDefaultAsync(l => l.Date == date, ct);
        if (leaf is null) return false;
        db.CalendarLeaves.Remove(leaf);
        await db.SaveChangesAsync(ct);
        return true;
    }

    private async Task<CalendarLeaf> GenerateAsync(DateOnly date, CancellationToken ct)
    {
        var hijri = calendar.GetHijri(date);
        var rumi = calendar.GetRumi(date);
        var seasonal = calendar.GetSeasonalDay(date);
        var cold = calendar.GetColdPeriod(date);
        var moon = moonProvider.GetPhase(date);
        var (quoteText, quoteAuthor) = await quoteProvider.GetRandomAsync(ct);
        var (girl, boy) = await nameProvider.GetRandomAsync(ct);

        var contentMode = await GetContentModeAsync(ct); // random | fixed
        var selections = await SelectContentsAsync(date, contentMode, ct);
        var specialDay = await FindSpecialDayAsync(date, selections, ct);

        var historyEvents = await db.HistoryEvents
            .Where(h => h.IsActive && h.Month == date.Month && h.Day == date.Day)
            .OrderBy(h => h.Year)
            .Select(h => new HistoryEventDto(h.Year, h.Text))
            .ToListAsync(ct);

        var leaf = new CalendarLeaf
        {
            Date = date,
            HijriDay = hijri.Day, HijriMonthName = hijri.MonthName, HijriYear = hijri.Year,
            RumiDay = rumi.Day, RumiMonthName = rumi.MonthName, RumiYear = rumi.Year,
            SeasonalLabel = seasonal.Label, SeasonalDay = seasonal.Day,
            ColdPeriodLabel = cold?.Label, ColdPeriodDay = cold?.Day,
            MoonPhaseKey = moon.Key, MoonPhaseName = moon.Name,
            MoonEmoji = moon.Emoji, MoonIllumination = moon.Illumination,
            QuoteText = quoteText, QuoteAuthor = quoteAuthor,
            GirlName = girl?.Name ?? "İzel", GirlNameMeaning = girl?.Meaning,
            BoyName = boy?.Name ?? "Acun", BoyNameMeaning = boy?.Meaning,
            SpecialDayNote = specialDay,
            ContentSelectionsJson = JsonSerializer.Serialize(selections, JsonOpts),
            HistoryEventsJson = JsonSerializer.Serialize(historyEvents, JsonOpts),
            CreatedAtUtc = DateTime.UtcNow,
        };

        db.CalendarLeaves.Add(leaf);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Yarış durumu: aynı tarih eşzamanlı üretildiyse mevcut olanı kullan.
            db.Entry(leaf).State = EntityState.Detached;
            leaf = await db.CalendarLeaves.FirstAsync(l => l.Date == date, ct);
        }
        return leaf;
    }

    /// <summary>
    /// Kategori başına içerik seçimi:
    /// - O tarihe sabitlenmiş öğe (tam tarih ya da her yıl ay-gün) varsa her modda o gösterilir.
    /// - "random" modda sabitlenmemiş öğelerden rastgele seçilir.
    /// - "fixed" modda sabitleme yoksa kategori o gün boş geçer.
    /// Seçim yaprakla birlikte kalıcıdır.
    /// </summary>
    private async Task<List<ContentSelection>> SelectContentsAsync(DateOnly date, string mode, CancellationToken ct)
    {
        var categories = await db.ContentCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .Select(c => c.Id)
            .ToListAsync(ct);

        var selections = new List<ContentSelection>();
        foreach (var categoryId in categories)
        {
            var pinned = await db.ContentItems
                .Where(i => i.IsActive && i.CategoryId == categoryId &&
                            (i.PinnedDate == date ||
                             (i.PinnedMonth == date.Month && i.PinnedDay == date.Day)))
                .OrderBy(i => i.Id)
                .FirstOrDefaultAsync(ct);

            if (pinned is not null)
            {
                selections.Add(new ContentSelection(categoryId, pinned.Id));
                continue;
            }

            if (mode == "random")
            {
                var random = await db.ContentItems
                    .Where(i => i.IsActive && i.CategoryId == categoryId &&
                                i.PinnedDate == null && i.PinnedMonth == null)
                    .OrderBy(_ => EF.Functions.Random())
                    .FirstOrDefaultAsync(ct);
                if (random is not null)
                    selections.Add(new ContentSelection(categoryId, random.Id));
            }
        }
        return selections;
    }

    private async Task<string?> FindSpecialDayAsync(DateOnly date, List<ContentSelection> selections, CancellationToken ct)
    {
        var specialCategory = await db.ContentCategories
            .FirstOrDefaultAsync(c => c.Slug == "ozel-gunler", ct);
        if (specialCategory is null) return null;

        var selection = selections.FirstOrDefault(s => s.CategoryId == specialCategory.Id);
        if (selection is null) return null;

        return await db.ContentItems
            .Where(i => i.Id == selection.ContentItemId)
            .Select(i => i.Title)
            .FirstOrDefaultAsync(ct);
    }

    private async Task<string> GetContentModeAsync(CancellationToken ct)
    {
        var setting = await db.Settings.FindAsync(["content_mode"], ct);
        return setting?.Value == "fixed" ? "fixed" : "random";
    }

    private async Task<LeafDto> ToDtoAsync(CalendarLeaf leaf, CancellationToken ct)
    {
        var selections = JsonSerializer.Deserialize<List<ContentSelection>>(leaf.ContentSelectionsJson, JsonOpts) ?? [];
        var historyEvents = JsonSerializer.Deserialize<List<HistoryEventDto>>(leaf.HistoryEventsJson, JsonOpts) ?? [];

        var itemIds = selections.Select(s => s.ContentItemId).ToList();
        var items = await db.ContentItems
            .Include(i => i.Category)
            .Where(i => itemIds.Contains(i.Id))
            .ToListAsync(ct);

        var itemLikes = await ReactionCountsAsync(TargetType.ContentItem, itemIds, ReactionKind.Like, ct);
        var itemComments = await db.Comments
            .Where(c => c.TargetType == TargetType.ContentItem && itemIds.Contains(c.TargetId) &&
                        c.Status == CommentStatus.Visible)
            .GroupBy(c => c.TargetId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);

        var contents = selections
            .Select(s => items.FirstOrDefault(i => i.Id == s.ContentItemId))
            .Where(i => i is not null && i.Category is not null)
            .Select(i => new LeafContentDto(
                i!.Id, i.Category!.Slug, i.Category.Name, i.Category.Icon,
                i.Title, i.Body,
                itemLikes.GetValueOrDefault(i.Id),
                itemComments.GetValueOrDefault(i.Id)))
            .OrderBy(c => items.First(i => i.Id == c.ItemId).Category!.SortOrder)
            .ToList();

        var leafLikes = await ReactionCountsAsync(TargetType.Leaf, [leaf.Id], ReactionKind.Like, ct);
        var leafSaves = await ReactionCountsAsync(TargetType.Leaf, [leaf.Id], ReactionKind.Save, ct);
        var leafComments = await db.Comments.CountAsync(
            c => c.TargetType == TargetType.Leaf && c.TargetId == leaf.Id &&
                 c.Status == CommentStatus.Visible, ct);

        return new LeafDto(
            leaf.Id,
            leaf.Date.ToString("yyyy-MM-dd"),
            leaf.Date.Day,
            TurkishCalendarService.MonthName(leaf.Date.Month),
            leaf.Date.Year,
            TurkishCalendarService.WeekdayName(leaf.Date),
            leaf.Date.DayOfYear,
            new DatePartDto(leaf.HijriDay, leaf.HijriMonthName, leaf.HijriYear,
                $"{leaf.HijriDay} {leaf.HijriMonthName} {leaf.HijriYear}"),
            new DatePartDto(leaf.RumiDay, leaf.RumiMonthName, leaf.RumiYear,
                $"{leaf.RumiDay} {leaf.RumiMonthName} {leaf.RumiYear}"),
            new SeasonalDto(leaf.SeasonalLabel, leaf.SeasonalDay),
            leaf.ColdPeriodLabel is null ? null : new SeasonalDto(leaf.ColdPeriodLabel, leaf.ColdPeriodDay ?? 0),
            new MoonDto(leaf.MoonPhaseKey, leaf.MoonPhaseName, leaf.MoonEmoji, leaf.MoonIllumination, "mock"),
            new QuoteDto(leaf.QuoteText, leaf.QuoteAuthor),
            new NamesDto(
                new NameDto(leaf.GirlName, leaf.GirlNameMeaning),
                new NameDto(leaf.BoyName, leaf.BoyNameMeaning)),
            leaf.SpecialDayNote,
            historyEvents,
            contents,
            new LeafStatsDto(
                leafLikes.GetValueOrDefault(leaf.Id),
                leafSaves.GetValueOrDefault(leaf.Id),
                leafComments),
            leaf.CreatedAtUtc);
    }

    private async Task<Dictionary<int, int>> ReactionCountsAsync(
        TargetType type, List<int> targetIds, ReactionKind kind, CancellationToken ct) =>
        await db.Reactions
            .Where(r => r.TargetType == type && targetIds.Contains(r.TargetId) && r.Kind == kind)
            .GroupBy(r => r.TargetId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);
}
