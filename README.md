# 🏢 Příčná Offices & Apartments - Webová Aplikace

Kompletní webová aplikace pro Příčná Offices s.r.o. a Příčná Apartments s.r.o. zahrnující:
- Prezentační web
- Kontaktní formuláře s email notifikacemi
- Rezervační systém pro sdílené kanceláře
- Admin panel pro správu rezervací

## 📁 Struktura Projektu

```
Web/
├── index.html                 # Hlavní stránka
├── kancelare.html            # Kanceláře k pronájmu
├── sdilene-kancelare.html    # Sdílené kanceláře + rezervace
├── byty.html                 # Byty k pronájmu
├── kontakt.html              # Kontaktní stránka
│
├── css/
│   └── style.css             # Hlavní styly
│
├── js/
│   ├── api.js                # API helper funkce
│   ├── script.js             # Hlavní JavaScript (menu, formuláře, rezervace)
│   ├── apartments.js         # Byty modal & galerie
│   └── offices.js            # Kanceláře modal
│
├── images/                   # Obrázky
│
├── admin/                    # Admin rozhraní (rezervace.pricna.cz)
│   ├── index.html           # Admin dashboard
│   ├── css/
│   │   └── admin.css        # Admin styly
│   └── js/
│       └── admin.js         # Admin funkcionalita
│
├── api/                      # Backend API (Node.js + Express)
│   ├── server.js            # Hlavní server
│   ├── package.json         # Závislosti
│   ├── .env.example         # Šablona konfigurace
│   │
│   ├── database/
│   │   └── db.js            # Databázové operace (SQLite)
│   │
│   ├── routes/
│   │   ├── auth.js          # Autentizace
│   │   ├── reservations.js  # Rezervace endpoints
│   │   └── inquiries.js     # Poptávky endpoints
│   │
│   ├── middleware/
│   │   └── auth.js          # JWT autentizace
│   │
│   ├── emails/
│   │   ├── emailService.js  # Email odesílání (MailTrap)
│   │   └── templates/       # HTML email šablony
│   │       ├── reservation-confirmation.html
│   │       ├── reservation-notification.html
│   │       ├── inquiry-confirmation.html
│   │       └── inquiry-notification.html
│   │
│   └── scripts/
│       └── hash-password.js # Generování hash hesel
│
├── _redirects               # Cloudflare Pages redirects
├── DEPLOYMENT.md            # Deployment návod
└── README.md                # Tento soubor
```

## ✨ Funkce

### 1. Prezentační Web
- **Responzivní design** pro desktop, tablet i mobil
- **SEO optimalizace** s meta tagy a strukturovanými daty
- **Galerie obrázků** s lightbox funkcionalitou
- **Moderní UI** s plynulými animacemi

### 2. Kontaktní Formuláře
- **3 typy formulářů:**
  - Obecný kontakt (kontakt.html)
  - Poptávka bytu (modal v byty.html)
  - Poptávka kanceláře (modal v kancelare.html)
  
- **Automatické emaily:**
  - ✅ Potvrzení klientovi
  - ✅ Notifikace na recepci/majitele
  - ✅ Profesionální HTML šablony

### 3. Rezervační Systém
- **Interaktivní kalendář** s dostupností
- **Výběr časových slotů** (7:00-19:00)
- **Automatický výpočet ceny:**
  - 99 Kč/hodina (1-3 hodiny)
  - 399 Kč celý den (4+ hodin)
- **Blokování víkendů a svátků**
- **Email potvrzení** pro klienta i recepci

### 4. Admin Panel (rezervace.pricna.cz)
- **Přihlášení** s JWT autentizací
- **Dashboard** se statistikami
- **Kalendář rezervací** s přehledem
- **Správa rezervací:**
  - Vytvoření nové
  - Úprava existující
  - Zrušení rezervace
- **Seznam všech rezervací** s filtrováním

## 🚀 Quick Start

### 1. Backend API

```bash
# Přejděte do API složky
cd api

# Instalace závislostí
npm install

# Konfigurace
cp .env.example .env
# Upravte .env soubor s vašimi hodnotami

# Generování hash hesla pro admina
node scripts/hash-password.js VaseSilneHeslo
# Zkopírujte hash do .env jako ADMIN_PASSWORD_HASH

# Spuštění (development)
npm run dev

# Nebo (production)
npm start
```

Server poběží na `http://localhost:3000`

### 2. Frontend

Pro development můžete použít jakýkoliv local server:

```bash
# Příklad s Python
python3 -m http.server 8080

# Nebo s Node.js http-server
npx http-server -p 8080
```

Web bude dostupný na `http://localhost:8080`

## 🔧 Konfigurace

### API (.env)

```env
# Server
PORT=3000

# MailTrap SMTP
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_username
MAILTRAP_PASS=your_password

# Email adresy
EMAIL_FROM=noreply@pricna.cz
EMAIL_RECEPTION_PRICNA=recepce.pricna@pricna.cz
EMAIL_RECEPTION_DELNICKA=recepce.delnicka@pricna.cz
EMAIL_OWNER=j.stachovsky@gmail.com

# Admin autentizace
JWT_SECRET=your_secret_key_min_32_chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$...

# Frontend URLs (pro CORS)
FRONTEND_URL=https://pricna.cz
ADMIN_URL=https://rezervace.pricna.cz
```

### Frontend (js/api.js)

```javascript
const API_CONFIG = {
    baseURL: 'http://localhost:3000/api', // Změňte na produkční URL
    timeout: 10000
};
```

### Admin (admin/js/admin.js)

```javascript
const API_URL = 'http://localhost:3000/api'; // Změňte na produkční URL
```

## 📧 MailTrap Konfigurace

1. Registrace na [mailtrap.io](https://mailtrap.io)
2. Vytvoření nového inboxu
3. Zkopírování SMTP credentials do `.env`
4. Pro produkci: Nastavení Sending Domains a ověření domény

## 🔐 Bezpečnost

- **JWT autentizace** pro admin panel
- **bcrypt** hashování hesel
- **Rate limiting** na API endpoints
- **Helmet** security headers
- **CORS** konfigurace
- **Input validace** na všech formulářích

## 📱 API Endpoints

### Public Endpoints

```
POST   /api/reservations                    # Vytvoření rezervace
POST   /api/reservations/check-availability # Kontrola dostupnosti
GET    /api/reservations/by-date/:date      # Rezervace pro datum
POST   /api/inquiries                       # Odeslání poptávky
POST   /api/auth/login                      # Přihlášení
```

### Protected Endpoints (vyžadují JWT token)

```
GET    /api/reservations                    # Všechny rezervace
PUT    /api/reservations/:id                # Aktualizace
POST   /api/reservations/:id/cancel         # Zrušení
DELETE /api/reservations/:id                # Smazání
GET    /api/inquiries                       # Všechny poptávky
```

## 🎨 Styly & Design

- **Barevné schéma:**
  - Primary: `#2c5f8d` (modrá)
  - Secondary: `#1a3a54` (tmavší modrá)
  - Success: `#28a745` (zelená)
  
- **Fonty:** Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Ikony:** Font Awesome 6.0
- **Responzivní:** Mobile-first přístup

## 📦 Technologie

### Frontend
- HTML5
- CSS3 (Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- Font Awesome Icons

### Backend
- Node.js
- Express.js
- SQLite (better-sqlite3)
- Nodemailer (MailTrap)
- JWT (jsonwebtoken)
- bcrypt

### Deployment
- Cloudflare Pages (frontend)
- Cloudflare Workers nebo VPS (API)
- MailTrap (emails)

## 🧪 Testování

### Test API

```bash
# Health check
curl http://localhost:3000/api/health

# Test rezervace
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-25",
    "timeSlots": ["09:00", "10:00"],
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+420123456789",
    "totalPrice": 198
  }'

# Test emailu (development only)
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "reservation-confirmation"}'
```

## 📝 TODO / Budoucí vylepšení

- [ ] Integrace platební brány (GoPay, Stripe)
- [ ] SMS notifikace přes Twilio
- [ ] Export rezervací do CSV/Excel
- [ ] Kalendář export (iCal)
- [ ] Multi-language podpora (EN)
- [ ] Dark mode
- [ ] Progressive Web App (PWA)
- [ ] Analytics dashboard v admin panelu

## 🤝 Přispívání

Pro větší změny prosím otevřete issue pro diskuzi o tom, co byste chtěli změnit.

## 📄 Licence

© 2025 Příčná Offices s.r.o. Všechna práva vyhrazena.

## 📞 Kontakt

- **Web:** https://pricna.cz
- **Email:** recepce.pricna@pricna.cz
- **Telefon:** +420 234 567 890
- **Majitel:** Ing. Jan Stachovský, +420 608 429 100

---

**Vytvořeno s ❤️ pro Příčná Offices & Apartments**
