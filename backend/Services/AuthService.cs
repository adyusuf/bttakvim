using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BTTakvim.Api.Data;
using BTTakvim.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace BTTakvim.Api.Services;

public record AuthResult(string Token, string Name, string Email, DateTime ExpiresAtUtc);

/// <summary>
/// Admin kimlik doğrulama: e-posta + parola → JWT.
/// NOT: Parola karması şimdilik SHA256 (geliştirme); üretimde BCrypt/Argon2'ye geçilecek.
/// </summary>
public class AuthService(AppDbContext db, IConfiguration config)
{
    public static string HashPassword(string password) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes("bttakvim-salt::" + password)));

    public async Task<AuthResult?> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        var user = await db.AdminUsers.FirstOrDefaultAsync(u => u.Email == email.Trim().ToLower(), ct);
        if (user is null || user.PasswordHash != HashPassword(password)) return null;

        var key = config["Jwt:Key"] ?? "bttakvim-dev-secret-key-change-in-production-please-32+";
        var creds = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddDays(7);

        var token = new JwtSecurityToken(
            issuer: "bttakvim",
            audience: "bttakvim-admin",
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, "admin"),
            ],
            expires: expires,
            signingCredentials: creds);

        return new AuthResult(
            new JwtSecurityTokenHandler().WriteToken(token), user.Name, user.Email, expires);
    }
}
