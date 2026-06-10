namespace BTTakvim.Api.Dtos;

public record DatePartDto(int Day, string MonthName, int Year, string Text);
public record SeasonalDto(string Label, int Day);
public record MoonDto(string Key, string Name, string Emoji, double Illumination, string Source);
public record QuoteDto(string Text, string? Author);
public record NameDto(string Name, string? Meaning);
public record NamesDto(NameDto? Girl, NameDto? Boy);
public record HistoryEventDto(int Year, string Text);

public record LeafContentDto(
    int ItemId,
    string CategorySlug,
    string CategoryName,
    string Icon,
    string Title,
    string Body,
    int Likes,
    int Comments);

public record LeafStatsDto(int Likes, int Saves, int Comments);

public record LeafDto(
    int Id,
    string Date,
    int Day,
    string MonthName,
    int Year,
    string WeekdayName,
    int DayOfYear,
    DatePartDto Hijri,
    DatePartDto Rumi,
    SeasonalDto Seasonal,
    SeasonalDto? ColdPeriod,
    MoonDto Moon,
    QuoteDto Quote,
    NamesDto Names,
    string? SpecialDay,
    List<HistoryEventDto> HistoryEvents,
    List<LeafContentDto> Contents,
    LeafStatsDto Stats,
    DateTime CreatedAtUtc);

public record ContentSelection(int CategoryId, int ContentItemId);
