#!/bin/bash
# Rychlá aktualizace emailových adres v .env
# Spusťte: chmod +x update-email-config.sh && ./update-email-config.sh

set -e

echo "📧 Aktualizace emailové konfigurace"
echo "===================================="
echo ""

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Soubor .env neexistuje!"
    echo "   Spusťte nejprve: ./setup-env.sh"
    exit 1
fi

# Backup
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ENV_FILE" "$BACKUP_FILE"
echo "📦 Záloha vytvořena: $BACKUP_FILE"
echo ""

# Aktualizace emailů
echo "📝 Aktualizuji emailové adresy..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' 's|^EMAIL_RESERVATIONS=.*|EMAIL_RESERVATIONS=rezervace@pricna.cz|' "$ENV_FILE"
    sed -i '' 's|^EMAIL_INFO=.*|EMAIL_INFO=info@pricna.cz|' "$ENV_FILE"
    sed -i '' 's|^EMAIL_OWNER=.*|EMAIL_OWNER=j.stachovsky@gmail.com|' "$ENV_FILE"
else
    # Linux
    sed -i 's|^EMAIL_RESERVATIONS=.*|EMAIL_RESERVATIONS=rezervace@pricna.cz|' "$ENV_FILE"
    sed -i 's|^EMAIL_INFO=.*|EMAIL_INFO=info@pricna.cz|' "$ENV_FILE"
    sed -i 's|^EMAIL_OWNER=.*|EMAIL_OWNER=j.stachovsky@gmail.com|' "$ENV_FILE"
fi

echo "✅ Emailové adresy aktualizovány!"
echo ""
echo "📋 Nová konfigurace:"
echo "   Rezervace: rezervace@pricna.cz"
echo "   Formuláře: info@pricna.cz"
echo "   Notifikace: j.stachovsky@gmail.com"
echo ""
echo "🔄 Restartujte server pro aplikování změn"
echo ""
