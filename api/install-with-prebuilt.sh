#!/bin/bash
# Instalace s prebuilt binárkami (bez kompilace)
# Řešení pro problémy s node-gyp na macOS 15
# Spusťte: chmod +x install-with-prebuilt.sh && ./install-with-prebuilt.sh

set -e

echo "📦 Instalace s prebuilt binárkami"
echo "==================================="
echo ""

echo "🧹 Čištění..."
rm -rf node_modules package-lock.json

echo ""
echo "📥 Stahování závislostí..."
echo ""

# Pokus 1: Instalace s ignorováním scripts (přeskočí kompilaci)
echo "Pokus 1: Instalace s --ignore-scripts..."
npm install --ignore-scripts --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Základní instalace úspěšná!"
    echo ""
    echo "🔨 Pokus o postinstalaci balíčků..."
    
    # Pokus nainstalovat prebuilt binárky
    npm rebuild bcrypt --update-binary 2>/dev/null || echo "⚠️  bcrypt rebuild selhal (není kritické)"
    npm rebuild better-sqlite3 --update-binary 2>/dev/null || echo "⚠️  better-sqlite3 rebuild selhal (není kritické)"
    
    echo ""
    echo "✅ Instalace dokončena!"
    echo ""
    echo "🧪 Test závislostí..."
    
    # Test zda funguje bcrypt
    node -e "try { require('bcrypt'); console.log('✅ bcrypt OK'); } catch(e) { console.log('❌ bcrypt FAILED'); }" || true
    
    # Test zda funguje better-sqlite3
    node -e "try { require('better-sqlite3'); console.log('✅ better-sqlite3 OK'); } catch(e) { console.log('❌ better-sqlite3 FAILED'); }" || true
    
    echo ""
    echo "📝 Pokud některý balíček selhal, použijeme fallback řešení"
    echo ""
    echo "🚀 Můžete zkusit spustit server:"
    echo "   npm run dev"
else
    echo ""
    echo "❌ Instalace selhala!"
    exit 1
fi
