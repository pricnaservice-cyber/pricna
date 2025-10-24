#!/bin/bash
# Změna admin hesla
# Spusťte: chmod +x change-admin-password.sh && ./change-admin-password.sh

set -e

echo "🔐 Změna admin hesla"
echo "====================="
echo ""

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Soubor .env neexistuje!"
    echo "   Spusťte nejprve: ./setup-env.sh"
    exit 1
fi

# Kontrola node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Instaluji závislosti..."
    npm install --silent
fi

echo "📝 Zadejte nové admin heslo:"
read -s NEW_PASSWORD

if [ -z "$NEW_PASSWORD" ]; then
    echo "❌ Heslo nemůže být prázdné!"
    exit 1
fi

echo ""
echo "🔐 Generuji hash hesla..."

# Generování hashe
HASH=$(node scripts/hash-password.js "$NEW_PASSWORD" 2>/dev/null | grep '^\$2b\$10\$' || echo "")

if [ -z "$HASH" ]; then
    echo "❌ Chyba při generování hashe!"
    exit 1
fi

# Backup
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ENV_FILE" "$BACKUP_FILE"
echo "📦 Záloha vytvořena: $BACKUP_FILE"

# Aktualizace .env
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^ADMIN_PASSWORD_HASH=.*|ADMIN_PASSWORD_HASH=$HASH|" "$ENV_FILE"
else
    # Linux
    sed -i "s|^ADMIN_PASSWORD_HASH=.*|ADMIN_PASSWORD_HASH=$HASH|" "$ENV_FILE"
fi

echo "✅ Admin heslo bylo změněno!"
echo ""
echo "🔄 Restartujte server pro aplikování změn"
echo ""
