using System.Collections.Concurrent;

namespace BTTakvim.Api.Services;

/// <summary>
/// Bir dış API çağrısının (gelen/giden trafik) tek kaydı. Hassas veri (token vb.)
/// asla saklanmaz; sadece teşhis için gereken alanlar tutulur.
/// </summary>
public record IntegrationCallEntry(
    DateTime TimestampUtc,
    string Service,
    string Request,
    string Outcome,
    string Source,
    bool CacheHit,
    long DurationMs,
    int? StatusCode,
    string? ResponseSummary,
    string? Error);

/// <summary>Çağrı türlerine göre özet (toplam ve son hata zamanı).</summary>
public record IntegrationCallSummary(
    int Total,
    int Success,
    int Cache,
    int Fallback,
    int Error,
    DateTime? LastErrorUtc);

/// <summary>
/// Dış API çağrılarını bellek içi bir halka tamponunda (ring buffer) tutan,
/// iş parçacığı güvenli (thread-safe) tekil (singleton) servis. Yalnızca son
/// ~200 çağrıyı saklar; sunucu yeniden başlatıldığında sıfırlanır. EF/DB yok.
/// </summary>
public class IntegrationCallLog
{
    private const int Capacity = 200;
    private const int SummaryMaxLen = 120;
    private const int ErrorMaxLen = 240;

    private readonly ConcurrentQueue<IntegrationCallEntry> _entries = new();

    /// <summary>Yeni bir kayıt ekler; kapasiteyi aşan en eski kayıtları atar. Asla istisna fırlatmaz.</summary>
    public void Add(IntegrationCallEntry entry)
    {
        try
        {
            var trimmed = entry with
            {
                ResponseSummary = Truncate(entry.ResponseSummary, SummaryMaxLen),
                Error = Truncate(entry.Error, ErrorMaxLen),
            };
            _entries.Enqueue(trimmed);
            while (_entries.Count > Capacity && _entries.TryDequeue(out _)) { }
        }
        catch
        {
            // Kayıt tutma asla sağlayıcı davranışını bozmamalı.
        }
    }

    /// <summary>En yeni önce olmak üzere son <paramref name="n"/> kaydı döndürür.</summary>
    public IReadOnlyList<IntegrationCallEntry> Recent(int n = Capacity)
    {
        if (n <= 0) n = Capacity;
        return _entries.Reverse().Take(n).ToList();
    }

    /// <summary>Çağrı türlerine göre toplamlar ve son hata zamanı.</summary>
    public IntegrationCallSummary Summary()
    {
        var snapshot = _entries.ToArray();
        DateTime? lastError = null;
        int success = 0, cache = 0, fallback = 0, error = 0;
        foreach (var e in snapshot)
        {
            switch (e.Outcome)
            {
                case "success": success++; break;
                case "cache": cache++; break;
                case "fallback": fallback++; break;
                case "error": error++; break;
            }
            if (e.Outcome is "error" or "fallback")
            {
                if (lastError is null || e.TimestampUtc > lastError) lastError = e.TimestampUtc;
            }
        }
        return new IntegrationCallSummary(snapshot.Length, success, cache, fallback, error, lastError);
    }

    private static string? Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value)) return value;
        return value.Length <= max ? value : value[..max] + "…";
    }
}
