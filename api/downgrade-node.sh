#!/bin/bash
# Pomoc s downgrade Node.js na LTS verzi
# Spusťte: chmod +x downgrade-node.sh && ./downgrade-node.sh

set -e

echo "📦 Node.js Downgrade Helper"
echo "============================"
echo ""

echo "Aktuální Node.js verze: $(node -v)"
echo "Aktuální npm verze: $(npm -v)"
echo ""

echo "🎯 Doporučená verze: Node.js v20 (LTS)"
echo ""

echo "Máte nainstalovaný Homebrew? (y/N): "
read -r HAS_BREW

if [[ "$HAS_BREW" =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 Instalace Node.js v20 přes Homebrew..."
    echo ""
    
    # Unlink current node
    brew unlink node 2>/dev/null || true
    
    # Install node@20
    if ! brew list node@20 &> /dev/null; then
        echo "📥 Stahuji Node.js v20..."
        brew install node@20
    fi
    
    # Link node@20
    echo "🔗 Propojuji Node.js v20..."
    brew link --overwrite node@20
    
    echo ""
    echo "✅ Node.js v20 nainstalován!"
    echo ""
    echo "📋 Nová verze:"
    echo "   Node.js: $(node -v)"
    echo "   npm: $(npm -v)"
    echo ""
    echo "🚀 Nyní můžete spustit:"
    echo "   cd api"
    echo "   ./fix-install.sh"
    
else
    echo ""
    echo "💡 Instalace přes nvm (Node Version Manager):"
    echo ""
    echo "1️⃣  Nainstalujte nvm:"
    echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo ""
    echo "2️⃣  Restartujte terminál a pak:"
    echo "    nvm install 20"
    echo "    nvm use 20"
    echo "    nvm alias default 20"
    echo ""
    echo "3️⃣  Potom spusťte:"
    echo "    cd api"
    echo "    ./fix-install.sh"
fi
