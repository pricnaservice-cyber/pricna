#!/bin/bash
# Fix Xcode Command Line Tools pro macOS 15 (Sequoia)
# Spusťte: chmod +x fix-xcode.sh && ./fix-xcode.sh

set -e

echo "🔧 Fix Xcode Command Line Tools"
echo "================================="
echo ""

# Detekce macOS verze
MACOS_VERSION=$(sw_vers -productVersion | cut -d'.' -f1)
echo "📌 macOS verze: $(sw_vers -productVersion)"
echo ""

if [ "$MACOS_VERSION" -ge "15" ]; then
    echo "⚠️  Detekován macOS 15 (Sequoia)"
    echo "   Známý problém s C++ headers v Xcode tools"
    echo ""
fi

echo "🗑️  Odstraňuji staré Xcode Command Line Tools..."
sudo rm -rf /Library/Developer/CommandLineTools

echo ""
echo "📥 Instaluji nové Xcode Command Line Tools..."
echo ""
echo "   ⚠️  DŮLEŽITÉ:"
echo "   1. Otevře se instalační okno"
echo "   2. Klikněte na 'Install'"
echo "   3. Počkejte na dokončení instalace (5-10 minut)"
echo "   4. Po dokončení spusťte znovu tento skript"
echo ""
echo "Spustit instalaci? (y/N): "
read -r RESPONSE

if [[ "$RESPONSE" =~ ^[Yy]$ ]]; then
    xcode-select --install
    
    echo ""
    echo "⏸️  Čekání na dokončení instalace..."
    echo ""
    echo "Po dokončení spusťte:"
    echo "   ./fix-xcode.sh    # Pro ověření"
    echo "   ./fix-install.sh  # Pro instalaci závislostí"
else
    echo "Přerušeno."
    exit 0
fi
