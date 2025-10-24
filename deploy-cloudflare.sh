#!/bin/bash
# Deployment na Cloudflare Pages
# Spusťte: chmod +x deploy-cloudflare.sh && ./deploy-cloudflare.sh

set -e

echo "☁️  Cloudflare Pages Deployment"
echo "================================"
echo ""

# Kontrola wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler není nainstalovaný!"
    echo ""
    echo "📦 Instalace Wrangler:"
    echo "   npm install -g wrangler"
    echo ""
    echo "Nainstalovat nyní? (y/N): "
    read -r INSTALL_WRANGLER
    
    if [[ "$INSTALL_WRANGLER" =~ ^[Yy]$ ]]; then
        npm install -g wrangler
        echo "✅ Wrangler nainstalován!"
    else
        exit 1
    fi
fi

echo "🔐 Přihlášení do Cloudflare..."
wrangler login

echo ""
echo "📋 Název projektu (např. 'pricna-offices'): "
read -r PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
    PROJECT_NAME="pricna-offices"
fi

echo ""
echo "🚀 Deployment na Cloudflare Pages..."
echo "   Projekt: $PROJECT_NAME"
echo ""

# Deploy frontend
wrangler pages deploy . \
    --project-name="$PROJECT_NAME" \
    --branch=main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Frontend úspěšně nasazen!"
    echo ""
    echo "📋 Další kroky:"
    echo ""
    echo "1️⃣  Nastavte custom doménu v Cloudflare Pages dashboard:"
    echo "    - pricna.cz"
    echo "    - www.pricna.cz"
    echo "    - rezervace.pricna.cz (pro admin)"
    echo ""
    echo "2️⃣  Nasaďte Backend API:"
    echo "    cd api"
    echo "    ./deploy-api.sh"
    echo ""
    echo "3️⃣  Aktualizujte API URL v js/api.js"
    echo ""
else
    echo ""
    echo "❌ Deployment selhal!"
    exit 1
fi
