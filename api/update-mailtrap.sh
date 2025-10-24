#!/bin/bash
# Rychlá aktualizace MailTrap credentials v .env
# Spusťte: chmod +x update-mailtrap.sh && ./update-mailtrap.sh

set -e

echo "📧 Aktualizace MailTrap konfigurace"
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

# Aktualizace MailTrap credentials
echo "📝 Aktualizuji MailTrap credentials..."

# Produkční MailTrap nastavení
MAILTRAP_HOST="live.smtp.mailtrap.io"
MAILTRAP_PORT="587"
MAILTRAP_USER="api"
MAILTRAP_PASS="5dce093e9b7f5a24a77fd170fa520c41"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^MAILTRAP_HOST=.*|MAILTRAP_HOST=$MAILTRAP_HOST|" "$ENV_FILE"
    sed -i '' "s|^MAILTRAP_PORT=.*|MAILTRAP_PORT=$MAILTRAP_PORT|" "$ENV_FILE"
    sed -i '' "s|^MAILTRAP_USER=.*|MAILTRAP_USER=$MAILTRAP_USER|" "$ENV_FILE"
    sed -i '' "s|^MAILTRAP_PASS=.*|MAILTRAP_PASS=$MAILTRAP_PASS|" "$ENV_FILE"
else
    # Linux
    sed -i "s|^MAILTRAP_HOST=.*|MAILTRAP_HOST=$MAILTRAP_HOST|" "$ENV_FILE"
    sed -i "s|^MAILTRAP_PORT=.*|MAILTRAP_PORT=$MAILTRAP_PORT|" "$ENV_FILE"
    sed -i "s|^MAILTRAP_USER=.*|MAILTRAP_USER=$MAILTRAP_USER|" "$ENV_FILE"
    sed -i "s|^MAILTRAP_PASS=.*|MAILTRAP_PASS=$MAILTRAP_PASS|" "$ENV_FILE"
fi

echo "✅ MailTrap konfigurace aktualizována!"
echo ""
echo "📋 Nastavení:"
echo "   Host: $MAILTRAP_HOST"
echo "   Port: $MAILTRAP_PORT"
echo "   User: $MAILTRAP_USER"
echo "   Pass: ••••••••••••••••••••••••••"
echo ""
echo "⚠️  PRODUKČNÍ konfigurace - emaily se budou skutečně odesílat!"
echo ""
echo "🔄 Restartujte server pro aplikování změn"
echo ""
