# Příčná Offices - Backend API

Backend API pro webové stránky Příčná Offices poskytující:
- Správu kontaktních formulářů
- Rezervační systém pro sdílené kanceláře
- Email notifikace přes MailTrap
- Admin rozhraní pro správu rezervací

## 🚀 Instalace

### 1. Instalace závislostí

```bash
cd api
npm install
```

### 2. Konfigurace prostředí

Zkopírujte `.env.example` na `.env`:

```bash
cp .env.example .env
```

### 3. Nastavení MailTrap

1. Zaregistrujte se na [mailtrap.io](https://mailtrap.io)
2. Vytvořte nový inbox
3. Zkopírujte SMTP credentials do `.env`:

```env
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_username
MAILTRAP_PASS=your_password
```

### 4. Nastavení admin hesla

Vygenerujte hash hesla:

```bash
node scripts/hash-password.js vase-silne-heslo
```

Zkopírujte vygenerovaný hash do `.env`:

```env
ADMIN_PASSWORD_HASH=$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Konfigurace emailových adres

V `.env` nastavte:

```env
EMAIL_FROM=noreply@pricna.cz
EMAIL_RECEPTION_PRICNA=recepce.pricna@pricna.cz
EMAIL_RECEPTION_DELNICKA=recepce.delnicka@pricna.cz
EMAIL_OWNER=j.stachovsky@gmail.com
```

### 6. JWT Secret

Nastavte silný JWT secret pro autentizaci:

```env
JWT_SECRET=vygenerujte-nahodny-retezec-aspon-32-znaku
```

## 📦 Spuštění

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

Server poběží na `http://localhost:3000`

## 📡 API Endpoints

### Public Endpoints

#### Rezervace

- `POST /api/reservations` - Vytvoření nové rezervace
- `POST /api/reservations/check-availability` - Kontrola dostupnosti
- `GET /api/reservations/by-date/:date` - Rezervace podle data
- `GET /api/reservations/range?start=YYYY-MM-DD&end=YYYY-MM-DD` - Rezervace v rozmezí

#### Poptávky

- `POST /api/inquiries` - Odeslání poptávky (kontakt, byty, kanceláře)

#### Autentizace

- `POST /api/auth/login` - Přihlášení admin uživatele
- `GET /api/auth/verify` - Ověření tokenu
- `POST /api/auth/logout` - Odhlášení

#### Utility

- `GET /api/health` - Health check

### Protected Endpoints (vyžadují JWT token)

- `GET /api/reservations` - Všechny rezervace
- `PUT /api/reservations/:id` - Aktualizace rezervace
- `POST /api/reservations/:id/cancel` - Zrušení rezervace
- `DELETE /api/reservations/:id` - Smazání rezervace
- `GET /api/inquiries` - Všechny poptávky

## 📧 Email Šablony

API automaticky odesílá HTML emaily:

### Pro klienty:
- **Potvrzení rezervace** - Při vytvoření rezervace sdílené kanceláře
- **Potvrzení poptávky** - Při odeslání formuláře (byty, kanceláře, kontakt)

### Pro recepci:
- **Notifikace o nové rezervaci** - S detaily a odkazem do admin systému
- **Notifikace o nové poptávce** - S kontaktními údaji klienta

## 🗄️ Databáze

Projekt používá SQLite databázi (`pricna.db`), která se automaticky vytvoří při prvním spuštění.

### Struktura:

**Tabulka `reservations`:**
- id, date, time_slots (JSON), name, email, phone, company, message, total_price, status, created_at, updated_at

**Tabulka `inquiries`:**
- id, type, item_name, name, email, phone, service, message, created_at

## 🔒 Bezpečnost

- **Helmet** - HTTP security headers
- **CORS** - Konfigurovatelné allowed origins
- **Rate Limiting** - Ochrana proti DDoS
- **JWT** - Token-based autentizace
- **bcrypt** - Hashování hesel

## 🧪 Testování

### Test SMTP připojení

Server automaticky testuje SMTP připojení při startu.

### Test email šablon (development mode)

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "reservation-confirmation"}'
```

Dostupné typy:
- `reservation-confirmation`
- `reservation-notification`
- `inquiry-confirmation`
- `inquiry-notification`

## 📝 Příklady API volání

### Vytvoření rezervace

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-25",
    "timeSlots": ["09:00", "10:00", "11:00"],
    "name": "Jan Novák",
    "email": "jan.novak@example.com",
    "phone": "+420123456789",
    "company": "ABC s.r.o.",
    "message": "Potřebuji klidné místo",
    "totalPrice": 297
  }'
```

### Odeslání poptávky

```bash
curl -X POST http://localhost:3000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "apartment",
    "itemName": "Byt 1+kk",
    "name": "Jana Nováková",
    "email": "jana@example.com",
    "phone": "+420987654321",
    "message": "Mám zájem o tento byt"
  }'
```

### Přihlášení

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "vase-heslo"
  }'
```

## 🌐 Cloudflare Workers Deployment

Pro deployment na Cloudflare Workers:

1. Upravte `wrangler.toml` pro Cloudflare Workers
2. Nastavte environment variables v Cloudflare dashboard
3. Deploy: `wrangler publish`

## 📞 Podpora

Pro problémy a dotazy kontaktujte vývojáře nebo otevřete issue.

## 📄 Licence

© 2025 Příčná Offices s.r.o.
