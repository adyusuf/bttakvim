# BTTakvim

Klasik yaprak takvim (Saatli Maarif / Vasıf Ülkü tarzı) deneyimini web + mobil uygulamaya taşıyan platform.
Ayrıntılı plan: [docs/PLAN.md](docs/PLAN.md)

## Yapı

| Dizin | İçerik |
|---|---|
| `backend/` | ASP.NET Core Web API (.NET 10) + EF Core + PostgreSQL — yaprak motoru, namaz vakitleri, blog/yorum/tepki API'leri |
| `mobile/` | React Native (Expo) — Osmanlı Çini tasarımıyla yaprak (ön/arka), Keşfet, Vakitler, Daha |
| `web/` | React + Vite — blog omurgalı site, yaprak yan sütunu, yazı görünümü, Namaz Vakitleri (admin: Faz 4) |
| `docs/` | Plan, tasarım sistemi tokenları (`docs/design-system/`) |

## Çalıştırma

### 1. PostgreSQL (Docker)

```bash
docker run -d --name bttakvim-postgres \
  -e POSTGRES_USER=bttakvim -e POSTGRES_PASSWORD=bttakvim -e POSTGRES_DB=bttakvim \
  -p 5432:5432 --restart unless-stopped postgres:16
```

### 2. Backend

```bash
cd backend
dotnet run --launch-profile http   # http://localhost:5210
```

İlk açılışta migration + seed otomatik uygulanır.
Hızlı test: `curl http://localhost:5210/api/leaves/today`

### 3. Mobil

```bash
cd mobile
npx expo start          # Expo Go ile telefonda; w = web önizleme
```

API adresi otomatik olarak Metro sunucusunun IP'sinden türetilir (fiziksel cihazda da çalışır).
Farklı bir backend için: `EXPO_PUBLIC_API_URL=http://1.2.3.4:5210 npx expo start`

### 4. Web sitesi

```bash
cd web
npm run dev          # http://localhost:5173
```

Backend `localhost:5210`'da değilse: `web/.env` içine `VITE_API_URL=http://...:5210`.

## Temel kurallar

- Yaprak, bir tarih **ilk kez ziyaret edildiğinde** üretilir ve veritabanına yazılır; bir daha değişmez.
- Admin sıfırlayabilir: `DELETE /api/admin/leaves/{yyyy-MM-dd}` → sonraki ziyarette yeniden üretilir.
- Gezilmeyen tarihler veritabanına yazılmaz.
- Namaz vakitleri/kıble saati/gündüz süresi konuma bağlıdır; yaprağa gömülmez, istek anında hesaplanır.
- Ay evresi, namaz vakitleri, özlü söz ve isim sağlayıcıları **mock-first** arayüzlerin arkasındadır;
  Faz 5'te gerçek servislere (Diyanet, bilimsel ay API'si) bağlanacak.
