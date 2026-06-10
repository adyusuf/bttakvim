using BTTakvim.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BTTakvim.Api.Controllers;

public record LoginRequest(string Email, string Password);

[ApiController]
[Route("api/admin/auth")]
public class AuthController(AuthService auth) : ControllerBase
{
    /// <summary>Admin girişi — başarılıysa JWT döner. Geliştirme: admin@bttakvim.local / admin123!</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var result = await auth.LoginAsync(req.Email ?? "", req.Password ?? "", ct);
        if (result is null) return Unauthorized(new { error = "E-posta veya parola hatalı." });
        return Ok(result);
    }
}
