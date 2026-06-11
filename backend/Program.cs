using System.Text;
using System.Text.Json.Serialization;
using BTTakvim.Api.Data;
using BTTakvim.Api.Services;
using BTTakvim.Api.Services.Providers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Takvim hesapları ve sağlayıcılar: namaz Aladhan API (yerel yedek), hicrî Aladhan gToH (yerel yedek),
// ay bilimsel hesap (Meeus), söz/isim veritabanından. Tümü arayüz arkasında soyut.
builder.Services.AddSingleton<TurkishCalendarService>();
builder.Services.AddSingleton<IMoonPhaseProvider, AstronomicalMoonPhaseProvider>();
builder.Services.AddHttpClient();
// Aladhan dış API'leri için 5sn zaman aşımlı adlandırılmış istemci (timeout kayıtta bir kez
// ayarlanır; SINGLETON sağlayıcılar eşzamanlılık altında .Timeout mutasyonu yapmamalı).
builder.Services.AddHttpClient("aladhan", c => c.Timeout = TimeSpan.FromSeconds(5));
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IntegrationCallLog>();
builder.Services.AddSingleton<IPrayerTimesProvider, AladhanPrayerTimesProvider>();
builder.Services.AddSingleton<IHijriDateProvider, AladhanHijriDateProvider>();
builder.Services.AddScoped<IQuoteProvider, DbQuoteProvider>();
builder.Services.AddScoped<INameProvider, DbNameProvider>();
builder.Services.AddScoped<LeafService>();
builder.Services.AddScoped<AuthService>();

// Admin JWT kimlik doğrulama
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (builder.Environment.IsProduction())
        throw new InvalidOperationException(
            "Jwt:Key (ortam değişkeni Jwt__Key) üretimde zorunludur ve en az 32 karakter olmalıdır.");
    jwtKey = "bttakvim-dev-secret-key-change-in-production-please-32+";
}
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "bttakvim",
            ValidAudience = "bttakvim-admin",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddOpenApi();

var app = builder.Build();

// Geliştirme: migration + seed otomatik uygulanır.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db);
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapOpenApi();
app.MapControllers();
app.MapGet("/", () => Results.Ok(new
{
    name = "BTTakvim API",
    endpoints = new[]
    {
        "GET /api/leaves/today",
        "GET /api/leaves/{yyyy-MM-dd}",
        "GET /api/prayer-times?city=istanbul | ?lat=..&lng=..",
        "GET /api/prayer-times/cities",
        "GET /api/comments?targetType=Leaf&targetId=1",
        "POST /api/comments",
        "POST /api/reactions/toggle",
        "GET /api/admin/leaves",
        "DELETE /api/admin/leaves/{date}",
    },
}));

app.Run();
