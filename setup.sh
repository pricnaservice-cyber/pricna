#!/bin/bash
# Wrapper skript pro quick-setup.sh
# Spusťte z hlavní složky Web/: ./setup.sh

set -e

echo "🚀 Příčná Offices - Kompletní Setup"
echo "===================================="
echo ""

# Kontrola zda existuje api složka
if [ ! -d "api" ]; then
    echo "❌ Složka 'api' nenalezena!"
    echo "   Ujistěte se, že jste v hlavní složce projektu Web/"
    exit 1
fi

echo "📁 Přecházím do složky api/..."
cd api

# Kontrola zda existuje setup skript
if [ ! -f "quick-setup.sh" ]; then
    echo "❌ Soubor quick-setup.sh nenalezen!"
    exit 1
fi

echo "🔧 Spouštím setup..."
echo ""

# Spuštění setup skriptu
./quick-setup.sh

echo ""
echo "✨ Setup dokončen!"
echo ""
echo "🚀 Spusťte API server:"
echo "   cd api"
echo "   npm run dev"
echo ""
