namespace BTTakvim.Api.Services;

public record City(string Slug, string Name, double Lat, double Lng);

public static class CityCatalog
{
    public static readonly IReadOnlyList<City> Cities =
    [
        new("adana", "Adana", 37.0000, 35.3213),
        new("ankara", "Ankara", 39.9334, 32.8597),
        new("antalya", "Antalya", 36.8969, 30.7133),
        new("bursa", "Bursa", 40.1885, 29.0610),
        new("diyarbakir", "Diyarbakır", 37.9144, 40.2306),
        new("edirne", "Edirne", 41.6818, 26.5623),
        new("erzurum", "Erzurum", 39.9043, 41.2679),
        new("eskisehir", "Eskişehir", 39.7767, 30.5206),
        new("gaziantep", "Gaziantep", 37.0662, 37.3833),
        new("istanbul", "İstanbul", 41.0082, 28.9784),
        new("izmir", "İzmir", 38.4192, 27.1287),
        new("kayseri", "Kayseri", 38.7312, 35.4787),
        new("konya", "Konya", 37.8667, 32.4833),
        new("samsun", "Samsun", 41.2928, 36.3313),
        new("trabzon", "Trabzon", 41.0015, 39.7178),
        new("van", "Van", 38.4891, 43.4089),
    ];

    public static City Default => Cities.First(c => c.Slug == "istanbul");

    public static City? BySlug(string slug) =>
        Cities.FirstOrDefault(c => c.Slug.Equals(slug, StringComparison.OrdinalIgnoreCase));

    /// <summary>GPS koordinatına en yakın şehir (haversine).</summary>
    public static City Nearest(double lat, double lng) =>
        Cities.MinBy(c => Haversine(lat, lng, c.Lat, c.Lng))!;

    private static double Haversine(double lat1, double lng1, double lat2, double lng2)
    {
        double Rad(double d) => d * Math.PI / 180.0;
        double dLat = Rad(lat2 - lat1), dLng = Rad(lng2 - lng1);
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                 + Math.Cos(Rad(lat1)) * Math.Cos(Rad(lat2)) * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return 6371.0 * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
