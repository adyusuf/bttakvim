namespace BTTakvim.Api.Models;

/// <summary>
/// Ziyaret edilen her tarih için bir kez üretilen, bir daha değişmeyen takvim yaprağı.
/// Konuma bağlı veriler (namaz vakitleri, kıble saati, gündüz süresi) burada TUTULMAZ.
/// </summary>
public class CalendarLeaf
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }

    public int HijriDay { get; set; }
    public string HijriMonthName { get; set; } = "";
    public int HijriYear { get; set; }

    public int RumiDay { get; set; }
    public string RumiMonthName { get; set; } = "";
    public int RumiYear { get; set; }

    /// <summary>"Kasım" veya "Hızır" dönemi</summary>
    public string SeasonalLabel { get; set; } = "";
    public int SeasonalDay { get; set; }

    /// <summary>"Zemheri" / "Hamsin" veya null</summary>
    public string? ColdPeriodLabel { get; set; }
    public int? ColdPeriodDay { get; set; }

    public string MoonPhaseKey { get; set; } = "";
    public string MoonPhaseName { get; set; } = "";
    public string MoonEmoji { get; set; } = "";
    public double MoonIllumination { get; set; }
    public string MoonSource { get; set; } = "";

    // Üretim anında alınan anlık görüntüler — kaynak değişse de yaprak değişmez.
    public string QuoteText { get; set; } = "";
    public string? QuoteAuthor { get; set; }
    public string GirlName { get; set; } = "";
    public string? GirlNameMeaning { get; set; }
    public string BoyName { get; set; } = "";
    public string? BoyNameMeaning { get; set; }
    public string? SpecialDayNote { get; set; }

    /// <summary>JSONB: [{"categoryId":1,"contentItemId":5}]</summary>
    public string ContentSelectionsJson { get; set; } = "[]";

    /// <summary>JSONB: [{"year":1959,"text":"..."}] — üretim anında snapshot.</summary>
    public string HistoryEventsJson { get; set; } = "[]";

    public DateTime CreatedAtUtc { get; set; }
}

public class ContentCategory
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public List<ContentItem> Items { get; set; } = [];
}

public class ContentItem
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public ContentCategory? Category { get; set; }
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";

    /// <summary>Her yıl aynı ay-güne sabitleme (özel günler vb.)</summary>
    public int? PinnedMonth { get; set; }
    public int? PinnedDay { get; set; }
    /// <summary>Tek seferlik tam tarihe sabitleme</summary>
    public DateOnly? PinnedDate { get; set; }

    public bool IsActive { get; set; } = true;
    /// <summary>internal | imported</summary>
    public string Source { get; set; } = "internal";
    public DateTime CreatedAtUtc { get; set; }
}

/// <summary>"Geçmişte Bugün" — bizim veritabanımızda.</summary>
public class HistoryEvent
{
    public int Id { get; set; }
    public int Month { get; set; }
    public int Day { get; set; }
    public int Year { get; set; }
    public string Text { get; set; } = "";
    public bool IsActive { get; set; } = true;
}

public class Quote
{
    public int Id { get; set; }
    public string Text { get; set; } = "";
    public string? Author { get; set; }
    public bool IsActive { get; set; } = true;
}

public class BabyName
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    /// <summary>K | E</summary>
    public string Gender { get; set; } = "K";
    public string? Meaning { get; set; }
    public bool IsActive { get; set; } = true;
}

public class BlogCategory
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public List<BlogPost> Posts { get; set; } = [];
}

public class BlogPost
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public BlogCategory? Category { get; set; }
    public string Slug { get; set; } = "";
    public string Title { get; set; } = "";
    public string Summary { get; set; } = "";
    public string Body { get; set; } = "";
    public string? CoverImageUrl { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class ForumTopic
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public string AuthorName { get; set; } = "";
    public string DeviceKey { get; set; } = "";
    public bool IsLocked { get; set; }
    public bool IsHidden { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public enum TargetType
{
    Leaf = 1,
    BlogPost = 2,
    ForumTopic = 3,
    Comment = 4,
    ContentItem = 5,
}

public enum CommentStatus { Visible = 1, Hidden = 2 }

public class Comment
{
    public int Id { get; set; }
    public TargetType TargetType { get; set; }
    public int TargetId { get; set; }
    public int? ParentId { get; set; }
    public Comment? Parent { get; set; }
    public string AuthorName { get; set; } = "";
    public string DeviceKey { get; set; } = "";
    public string Body { get; set; } = "";
    public CommentStatus Status { get; set; } = CommentStatus.Visible;
    public DateTime CreatedAtUtc { get; set; }
}

public enum ReactionKind { Like = 1, Save = 2, Report = 3 }

public class Reaction
{
    public int Id { get; set; }
    public TargetType TargetType { get; set; }
    public int TargetId { get; set; }
    public ReactionKind Kind { get; set; }
    public string DeviceKey { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; }
}

public class AppSetting
{
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
}

public class AdminUser
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Name { get; set; } = "";
}
