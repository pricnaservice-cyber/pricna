#!/bin/bash
# Fix pro instalaci na macOS s Node.js v24
# Spusťte: chmod +x fix-install.sh && ./fix-install.sh

set -e

echo "🔧 Fix instalace pro Node.js v24"
echo "=================================="
echo ""

# Detekce Node verze
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "📌 Detekována Node.js verze: v$(node -v)"

if [ "$NODE_VERSION" -ge "22" ]; then
    echo "⚠️  Node.js v$NODE_VERSION může mít problémy s better-sqlite3"
    echo ""
    echo "💡 Doporučené řešení:"
    echo "   1. Downgrade na Node.js LTS v20.x"
    echo "   2. Nebo použijeme kompatibilní build"
    echo ""
    echo "Pokračovat s instalací? (y/N): "
    read -r RESPONSE
    if [[ ! "$RESPONSE" =~ ^[Yy]$ ]]; then
        echo "Přerušeno."
        exit 0
    fi
fi

echo ""
echo "🔨 Instalace Xcode Command Line Tools (pokud chybí)..."

# Kontrola Xcode tools
if ! xcode-select -p &> /dev/null; then
    echo "❌ Xcode Command Line Tools nejsou nainstalovány!"
    echo "📦 Instaluji..."
    xcode-select --install
    echo ""
    echo "⏸️  Počkejte na dokončení instalace Xcode tools a pak spusťte tento skript znovu."
    exit 0
else
    echo "✅ Xcode Command Line Tools jsou nainstalovány"
fi

echo ""
echo "🧹 Čištění předchozích pokusů..."
rm -rf node_modules package-lock.json

echo ""
echo "📦 Instalace závislostí s --force flagy..."

# Použití legacy-peer-deps pro lepší kompatibilitu
npm install --legacy-peer-deps --build-from-source

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Instalace úspěšná!"
    echo ""
    echo "🚀 Můžete spustit server:"
    echo "   npm run dev"
else
    echo ""
    echo "❌ Instalace selhala!"
    echo ""
    echo "💡 Alternativní řešení:"
    echo ""
    echo "1️⃣  Downgrade Node.js na LTS verzi:"
    echo "    brew install node@20"
    echo "    brew unlink node"
    echo "    brew link node@20"
    echo ""
    echo "2️⃣  Nebo použijte nvm pro správu verzí:"
    echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "    nvm install 20"
    echo "    nvm use 20"
    echo ""
    echo "3️⃣  Zkuste přeinstalovat Xcode Command Line Tools:"
    echo "    sudo rm -rf /Library/Developer/CommandLineTools"
    echo "    xcode-select --install"
    exit 1
fi
