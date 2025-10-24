#!/bin/bash
# Wrapper skript pro change-admin-password.sh
# Spusťte z hlavní složky Web/: ./change-password.sh

set -e

echo "🔐 Změna admin hesla"
echo "====================="
echo ""

if [ ! -d "api" ]; then
    echo "❌ Složka 'api' nenalezena!"
    exit 1
fi

cd api
./change-admin-password.sh
