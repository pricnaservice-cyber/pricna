# 🔧 Fix pro instalační problém

## Problém

`better-sqlite3` selhává při kompilaci na Node.js v24.10.0:
```
fatal error: 'climits' file not found
```

## ✅ Řešení

### **Řešení 1: Downgrade Node.js na LTS verzi (DOPORUČENO)**

Node.js v24 je experimentální verze. Doporučujeme použít LTS verzi v20.

#### Pomocí Homebrew:

```bash
# Spusťte automatický skript
cd api
./downgrade-node.sh

# Nebo manuálně:
brew unlink node
brew install node@20
brew link --overwrite node@20
```

#### Pomocí nvm (Node Version Manager):

```bash
# 1. Nainstalujte nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 2. Restartujte terminál a pak:
nvm install 20
nvm use 20
nvm alias default 20

# 3. Ověřte verzi
node -v  # Mělo by být v20.x.x
```

Po downgrade spusťte:
```bash
cd api
./fix-install.sh
```

---

### **Řešení 2: Fix současné instalace**

Pokud nechcete měnit Node.js verzi:

```bash
cd api
./fix-install.sh
```

Tento skript:
- ✅ Zkontroluje Xcode Command Line Tools
- ✅ Vyčistí předchozí pokusy
- ✅ Spustí instalaci s kompatibilními flagy

---

### **Řešení 3: Manuální fix Xcode Tools**

Někdy pomůže přeinstalace Xcode Command Line Tools:

```bash
# 1. Odstraňte staré tools
sudo rm -rf /Library/Developer/CommandLineTools

# 2. Nainstalujte znovu
xcode-select --install

# 3. Po dokončení instalace:
cd api
npm install
```

---

## 🚀 Po úspěšné instalaci

```bash
cd api

# Vytvořte .env
./setup-env.sh

# Spusťte server
npm run dev
```

Server poběží na `http://localhost:3000`

---

## 💡 Rychlé příkazy

```bash
# Z hlavní složky Web/
cd api

# Řešení 1: Downgrade Node.js
./downgrade-node.sh

# Řešení 2: Fix instalace
./fix-install.sh

# Po úspěchu
./setup-env.sh
npm run dev
```

---

## 🆘 Stále nefunguje?

### Kontrola Xcode Tools:
```bash
xcode-select -p
# Mělo by vypsat: /Library/Developer/CommandLineTools
```

### Kontrola Node.js verze:
```bash
node -v
# Doporučeno: v20.x.x (LTS)
# Problematické: v24.x.x
```

### Kompletní reset:
```bash
cd api

# Smazat všechno
rm -rf node_modules package-lock.json

# Downgrade Node.js
brew unlink node
brew install node@20
brew link --overwrite node@20

# Ověřit
node -v  # mělo by být v20.x.x

# Instalovat znovu
npm install
```

---

## 📚 Odkazy

- [Node.js LTS verze](https://nodejs.org/)
- [nvm dokumentace](https://github.com/nvm-sh/nvm)
- [better-sqlite3 issues](https://github.com/WiseLibs/better-sqlite3/issues)

---

© 2025 Příčná Offices s.r.o.
