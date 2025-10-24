#!/bin/bash
# Setup Cloudflare Workers + D1 pro backend API
# Spusťte: chmod +x setup-cloudflare.sh && ./setup-cloudflare.sh

set -e

echo "☁️  Cloudflare Workers + D1 Setup"
echo "=================================="
echo ""

# Kontrola wrangler
if ! command -v wrangler &> /dev/null; then
    echo "📦 Instalace Wrangler CLI..."
    npm install -g wrangler
fi

echo "🔐 Přihlášení do Cloudflare..."
wrangler login

echo ""
echo "📊 Vytvoření D1 databáze..."
wrangler d1 create pricna-db

echo ""
echo "📋 Zkopírujte database_id z výstupu výše a vložte sem:"
read -r DB_ID

# Aktualizace wrangler.toml
sed -i.bak "s/database_id = \"\"/database_id = \"$DB_ID\"/" wrangler-d1.toml

echo ""
echo "🏗️  Vytvoření databázových tabulek..."

# SQL pro D1
cat > schema.sql << 'EOF'
-- Reservations table
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

-- Inquiries table
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
CREATE INDEX idx_reservations_email ON reservations(email);
CREATE INDEX idx_inquiries_type ON inquiries(type);
EOF

wrangler d1 execute pricna-db --file=schema.sql --remote

echo ""
echo "🔐 Nastavení secrets..."

echo "📧 Email pro rezervace (rezervace@pricna.cz):"
wrangler secret put EMAIL_RESERVATIONS

echo "📧 Email pro formuláře (info@pricna.cz):"
wrangler secret put EMAIL_INFO

echo "📧 Email majitele (j.stachovsky@gmail.com):"
wrangler secret put EMAIL_OWNER

echo "📨 MailTrap Host (live.smtp.mailtrap.io):"
wrangler secret put MAILTRAP_HOST

echo "📨 MailTrap Port (587):"
wrangler secret put MAILTRAP_PORT

echo "📨 MailTrap User (api):"
wrangler secret put MAILTRAP_USER

echo "📨 MailTrap Password:"
wrangler secret put MAILTRAP_PASS

echo "🔑 JWT Secret (min 32 znaků):"
wrangler secret put JWT_SECRET

echo "👤 Admin username (admin):"
wrangler secret put ADMIN_USERNAME

echo "🔐 Admin password hash (z hash-password.js):"
wrangler secret put ADMIN_PASSWORD_HASH

echo ""
echo "✅ Setup dokončen!"
echo ""
echo "🚀 Deployment:"
echo "   wrangler deploy"
echo ""
