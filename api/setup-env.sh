#!/bin/bash
# Automatické vytvoření/aktualizace .env souboru
# Spusťte: chmod +x setup-env.sh && ./setup-env.sh

set -e

echo "🔧 Setup .env souboru pro Příčná Offices API"
echo "=============================================="
echo ""

# Cesta k .env souboru
ENV_FILE=".env"

# Backup existujícího .env (pokud existuje)
if [ -f "$ENV_FILE" ]; then
    BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 Zálohuji existující .env do $BACKUP_FILE"
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo ""
fi

# Vytvoření nového .env souboru
echo "📝 Vytvářím nový .env soubor..."
cat > "$ENV_FILE" << 'EOF'
# Port pro API server
PORT=3000

# MailTrap konfigurace (PRODUKČNÍ - odesílá skutečné emaily!)
MAILTRAP_HOST=live.smtp.mailtrap.io
MAILTRAP_PORT=587
MAILTRAP_USER=api
MAILTRAP_PASS=5dce093e9b7f5a24a77fd170fa520c41

# Email adresy
# Rezervační systém
EMAIL_RESERVATIONS=rezervace@pricna.cz

# Ostatní formuláře (kontakt, byty, kanceláře)
EMAIL_INFO=info@pricna.cz

# Majitel (dostane všechny notifikace)
EMAIL_OWNER=j.stachovsky@gmail.com

# JWT Secret pro admin autentizaci
JWT_SECRET=pricna-offices-jwt-secret-2025-production-key-min-32-chars

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=

# Database
DATABASE_PATH=./database/pricna.db

# Environment
NODE_ENV=production

# Frontend URLs (pro CORS)
FRONTEND_URL=https://pricna.cz
ADMIN_URL=https://rezervace.pricna.cz
EOF

echo "✅ .env soubor vytvořen!"
echo ""

# Kontrola zda existuje admin hash
if grep -q "ADMIN_PASSWORD_HASH=$" "$ENV_FILE"; then
    echo "⚠️  ADMIN_PASSWORD_HASH není nastavený!"
    echo ""
    echo "📌 Zadejte admin heslo (nebo stiskněte Enter pro 'admin123'):"
    read -s ADMIN_PASS
    
    if [ -z "$ADMIN_PASS" ]; then
        ADMIN_PASS="admin123"
    fi
    
    echo ""
    echo "🔐 Generuji hash hesla..."
    
    # Kontrola zda existuje node
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js není nainstalovaný!"
        echo "   Nainstalujte závislosti: npm install"
        echo "   A pak spusťte: node scripts/hash-password.js $ADMIN_PASS"
        exit 1
    fi
    
    # Kontrola zda existují node_modules
    if [ ! -d "node_modules" ]; then
        echo "📦 Instaluji závislosti..."
        npm install --silent
    fi
    
    # Generování hashe
    HASH=$(node scripts/hash-password.js "$ADMIN_PASS" 2>/dev/null | grep '^\$2b\$10\$' || echo "")
    
    if [ -z "$HASH" ]; then
        echo "❌ Chyba při generování hashe!"
        echo "   Spusťte manuálně: node scripts/hash-password.js VaseHeslo"
        exit 1
    fi
    
    # Aktualizace .env s hashem
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^ADMIN_PASSWORD_HASH=.*|ADMIN_PASSWORD_HASH=$HASH|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|^ADMIN_PASSWORD_HASH=.*|ADMIN_PASSWORD_HASH=$HASH|" "$ENV_FILE"
    fi
    
    echo "✅ Admin heslo nastaveno!"
fi

echo ""
echo "✨ Konfigurace dokončena!"
echo ""
echo "📋 Přehled nastavení:"
echo "   Port: 3000"
echo "   MailTrap: live.smtp.mailtrap.io:587"
echo "   Email (rezervace): rezervace@pricna.cz"
echo "   Email (formuláře): info@pricna.cz"
echo "   Email (notifikace): j.stachovsky@gmail.com"
echo "   Admin username: admin"
echo ""
echo "🚀 Další kroky:"
echo "   1. Zkontrolujte .env soubor: nano .env"
echo "   2. Spusťte server: npm run dev"
echo "   3. Test API: curl http://localhost:3000/api/health"
echo ""
