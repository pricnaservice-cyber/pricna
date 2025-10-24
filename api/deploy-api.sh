#!/bin/bash
# Deployment Backend API
# Podporuje: Railway, Render, vlastní VPS
# Spusťte: chmod +x deploy-api.sh && ./deploy-api.sh

set -e

echo "🚀 Backend API Deployment"
echo "=========================="
echo ""

echo "Vyberte deployment platformu:"
echo ""
echo "1) Railway (doporučeno - snadné, $5/měsíc)"
echo "2) Render (zdarma/platba, snadné)"
echo "3) Vlastní VPS (pokročilé)"
echo "4) Cloudflare Workers (experimentální)"
echo ""
echo "Volba (1-4): "
read -r PLATFORM

case $PLATFORM in
    1)
        echo ""
        echo "📦 Railway Deployment"
        echo "====================="
        echo ""
        echo "1️⃣  Vytvořte účet na railway.app"
        echo "2️⃣  Nainstalujte Railway CLI:"
        echo "    npm install -g @railway/cli"
        echo "3️⃣  Přihlaste se:"
        echo "    railway login"
        echo "4️⃣  Inicializujte projekt:"
        echo "    railway init"
        echo "5️⃣  Nasaďte:"
        echo "    railway up"
        echo "6️⃣  Nastavte environment variables v Railway dashboard:"
        echo "    - MAILTRAP_HOST, MAILTRAP_PORT, MAILTRAP_USER, MAILTRAP_PASS"
        echo "    - EMAIL_RESERVATIONS, EMAIL_INFO, EMAIL_OWNER"
        echo "    - JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD_HASH"
        echo "7️⃣  Připojte doménu: api.pricna.cz"
        echo ""
        ;;
    2)
        echo ""
        echo "📦 Render Deployment"
        echo "===================="
        echo ""
        echo "1️⃣  Vytvořte účet na render.com"
        echo "2️⃣  Pushněte kód do Git repozitáře (GitHub/GitLab)"
        echo "3️⃣  V Render dashboard:"
        echo "    - New → Web Service"
        echo "    - Připojte Git repo"
        echo "    - Build command: npm install"
        echo "    - Start command: npm start"
        echo "4️⃣  Nastavte environment variables"
        echo "5️⃣  Připojte doménu: api.pricna.cz"
        echo ""
        ;;
    3)
        echo ""
        echo "📦 VPS Deployment"
        echo "=================="
        echo ""
        echo "Použijte deployment návod v DEPLOYMENT.md"
        echo ""
        echo "Rychlý přehled:"
        echo "1️⃣  Připojte se na VPS: ssh user@your-vps-ip"
        echo "2️⃣  Nainstalujte Node.js"
        echo "3️⃣  Upload kódu na server"
        echo "4️⃣  Spusťte: npm install"
        echo "5️⃣  Nastavte .env soubor"
        echo "6️⃣  Spusťte s PM2: pm2 start server.js"
        echo "7️⃣  Nastavte Nginx reverse proxy"
        echo "8️⃣  Nastavte SSL s certbot"
        echo ""
        ;;
    4)
        echo ""
        echo "⚠️  Cloudflare Workers Deployment"
        echo "=================================="
        echo ""
        echo "Cloudflare Workers má omezení pro native Node.js moduly."
        echo "better-sqlite3 a bcrypt nebudou fungovat."
        echo ""
        echo "Doporučujeme použít Railway nebo Render místo toho."
        echo ""
        ;;
    *)
        echo "Neplatná volba!"
        exit 1
        ;;
esac

echo ""
echo "📚 Kompletní návod: DEPLOYMENT.md"
echo ""
