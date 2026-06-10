using BTTakvim.Api.Data;
using BTTakvim.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BTTakvim.Api.Services.Providers;

/// <summary>
/// Özlü söz sağlayıcısı. İleride dış API'ye bağlanabilir; şimdilik DB seed havuzundan rastgele seçer.
/// </summary>
public interface IQuoteProvider
{
    Task<(string Text, string? Author)> GetRandomAsync(CancellationToken ct = default);
}

public class DbQuoteProvider(AppDbContext db) : IQuoteProvider
{
    public async Task<(string Text, string? Author)> GetRandomAsync(CancellationToken ct = default)
    {
        var quote = await db.Quotes.Where(q => q.IsActive)
            .OrderBy(_ => EF.Functions.Random()).FirstOrDefaultAsync(ct);
        return quote is null
            ? ("Erdem servetlerin en büyüğüdür.", "Naci Kasım")
            : (quote.Text, quote.Author);
    }
}

/// <summary>
/// Günün ismi sağlayıcısı (kız + erkek). İleride dış API; şimdilik DB seed havuzundan rastgele.
/// </summary>
public interface INameProvider
{
    Task<(BabyName? Girl, BabyName? Boy)> GetRandomAsync(CancellationToken ct = default);
}

public class DbNameProvider(AppDbContext db) : INameProvider
{
    public async Task<(BabyName? Girl, BabyName? Boy)> GetRandomAsync(CancellationToken ct = default)
    {
        var girl = await db.BabyNames.Where(n => n.IsActive && n.Gender == "K")
            .OrderBy(_ => EF.Functions.Random()).FirstOrDefaultAsync(ct);
        var boy = await db.BabyNames.Where(n => n.IsActive && n.Gender == "E")
            .OrderBy(_ => EF.Functions.Random()).FirstOrDefaultAsync(ct);
        return (girl, boy);
    }
}
