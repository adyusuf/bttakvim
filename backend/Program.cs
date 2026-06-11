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

// Takvim hesapları ve sağlayıcılar (mock-first; Faz 5'te gerçek servislerle değiştirilecek)
builder.Services.AddSingleton<TurkishCalendarService>();
builder.Services.AddSingleton<IMoonPhaseProvider, AstronomicalMoonPhaseProvider>();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IPrayerTimesProvider, AladhanPrayerTimesProvider>();
builder.Services.AddSingleton<IHijriDateProvider, AladhanHijriDateProvider>();
builder.Services.AddScoped<IQuoteProvider, DbQuoteProvider>();
builder.Services.AddScoped<INameProvider, DbNameProvider>();
builder.Services.AddScoped<LeafService>();
builder.Services.AddScoped<AuthService>();

// Admin JWT kimlik doğrulama
var jwtKey = builder.Configuration["Jwt:Key"] ?? "bttakvim-dev-secret-key-change-in-production-please-32+";
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
