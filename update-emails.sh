#!/bin/bash
# Wrapper skript pro update-email-config.sh
# Spusťte z hlavní složky Web/: ./update-emails.sh

set -e

echo "📧 Aktualizace emailové konfigurace"
echo "===================================="
echo ""

if [ ! -d "api" ]; then
    echo "❌ Složka 'api' nenalezena!"
    exit 1
fi

cd api
./update-email-config.sh
