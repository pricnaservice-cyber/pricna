# ☁️ Cloudflare Workers Deployment

Backend přepsán pro Cloudflare Workers + D1 databázi.

## 🚀 Rychlý Start

```bash
cd api

# 1. Instalace závislostí pro Workers
npm install --prefix . itty-router

# 2. Přihlášení do Cloudflare
wrangler login

# 3. Setup (vytvoří D1 databázi a nastaví secrets)
./setup-cloudflare.sh

# 4. Deploy
wrangler deploy
```

## 📋 Krok za krokem

### 1. Vytvoření D1 databáze

```bash
wrangler d1 create pricna-db
```

Zkopírujte `database_id` z výstupu.

### 2. Aktualizace wrangler-d1.toml

Otevřete `wrangler-d1.toml` a vložte `database_id`:

```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "pricna-db"
database_id = "VLOŽTE_SEM_ID"  # ← změňte
```

### 3. Vytvoření databázových tabulek

```bash
# Vytvořte schema.sql
cat > schema.sql << 'EOF'
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    message TEXT,
    totalPrice REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service TEXT,
    itemName TEXT,
    message TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_inquiries_type ON inquiries(type);
EOF

# Spusťte migrace
wrangler d1 execute pricna-db --file=schema.sql --remote
```

### 4. Nastavení Secrets

```bash
# Email adresy
echo "rezervace@pricna.cz" | wrangler secret put EMAIL_RESERVATIONS
echo "info@pricna.cz" | wrangler secret put EMAIL_INFO
echo "j.stachovsky@gmail.com" | wrangler secret put EMAIL_OWNER

# MailTrap (používá API, ne SMTP)
echo "live.smtp.mailtrap.io" | wrangler secret put MAILTRAP_HOST
echo "587" | wrangler secret put MAILTRAP_PORT
echo "api" | wrangler secret put MAILTRAP_USER
echo "VÁŠE_MAILTRAP_API_TOKEN" | wrangler secret put MAILTRAP_PASS

# JWT a Admin
echo "pricna-jwt-secret-min-32-chars-change-this" | wrangler secret put JWT_SECRET
echo "admin" | wrangler secret put ADMIN_USERNAME

# Admin heslo hash (vygenerujte pomocí)
node -e "const crypto = require('crypto'); const password = 'VaseHeslo123'; const salt = 'pricna-salt-2025'; const hash = crypto.createHash('sha256').update(password + salt).digest('hex'); console.log(hash);"
# Zkopírujte hash a vložte:
echo "VYGENEROVANÝ_HASH" | wrangler secret put ADMIN_PASSWORD_HASH
```

### 5. Deployment

```bash
wrangler deploy
```

Dostanete URL typu: `https://pricna-api.username.workers.dev`

### 6. Custom doména

```bash
# Přidání custom domény
wrangler domains add api.pricna.cz
```

Cloudflare automaticky nastaví DNS záznamy.

## 🧪 Testování

```bash
# Health check
curl https://pricna-api.username.workers.dev/api/health

# Test rezervace
curl -X POST https://pricna-api.username.workers.dev/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-01",
    "timeSlots": ["09:00"],
    "name": "Test",
    "email": "test@example.com",
    "phone": "+420123456789",
    "totalPrice": 99
  }'
```

## 📊 Monitoring

```bash
# Živé logy
wrangler tail

# Metriky
# Dashboard → Workers → Metrics
```

## 💰 Ceny

- **Workers:** Zdarma až 100,000 requestů/den
- **D1:** Zdarma až 5 GB storage + 5M reads/den
- **Celkem:** Pravděpodobně zdarma pro vaše použití

## 🔄 Aktualizace kódu

```bash
# Po změnách v kódu
wrangler deploy
```

## ⚙️ Lokální vývoj

```bash
# Spustí lokální dev server
wrangler dev

# Bude dostupné na http://localhost:8787
```

