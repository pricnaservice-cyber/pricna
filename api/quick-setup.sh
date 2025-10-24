#!/bin/bash
# Kompletní setup projektu Příčná Offices API
# Spusťte: chmod +x quick-setup.sh && ./quick-setup.sh

set -e

echo "🚀 Příčná Offices API - Kompletní Setup"
echo "========================================"
echo ""

# Kontrola Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js není nainstalovaný!"
    echo "   Stáhněte si z: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""

# Instalace závislostí
if [ ! -d "node_modules" ]; then
    echo "📦 Instaluji závislosti..."
    npm install
    echo "✅ Závislosti nainstalovány!"
    echo ""
else
    echo "✅ Závislosti již nainstalovány"
    echo ""
fi

# Vytvoření databázové složky
if [ ! -d "database" ]; then
    echo "📁 Vytvářím složku pro databázi..."
    mkdir -p database
    echo "✅ Složka database vytvořena!"
    echo ""
fi

# Setup .env
if [ ! -f ".env" ]; then
    echo "📝 Konfiguruji .env soubor..."
    ./setup-env.sh
else
    echo "⚠️  Soubor .env již existuje"
    echo "   Chcete ho přepsat? (y/N): "
    read -r RESPONSE
    if [[ "$RESPONSE" =~ ^[Yy]$ ]]; then
        ./setup-env.sh
    else
        echo "   Ponechávám existující .env"
    fi
fi

echo ""
echo "✨ Setup dokončen!"
echo ""
echo "📋 Přehled projektu:"
echo "   📁 Database: ./database/pricna.db (vytvoří se automaticky)"
echo "   📁 Logs: PM2 bude logovat do ~/.pm2/logs/"
echo "   📁 Email šablony: ./emails/templates/"
echo ""
echo "🧪 Testování:"
echo "   1. Spusťte dev server:"
echo "      npm run dev"
echo ""
echo "   2. V novém terminálu testujte:"
echo "      curl http://localhost:3000/api/health"
echo ""
echo "   3. Test email služby:"
echo "      curl -X POST http://localhost:3000/api/test-email \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"type\": \"reservation-confirmation\"}'"
echo ""
echo "📚 Dokumentace:"
echo "   - README.md - Přehled projektu"
echo "   - QUICKSTART.md - Rychlý start"
echo "   - EMAIL_CONFIG.md - Email konfigurace"
echo "   - MAILTRAP_SETUP.md - MailTrap setup"
echo ""
echo "🎉 Projekt je připraven k použití!"
echo ""
