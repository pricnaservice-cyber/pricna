# 🛠️ Automatizační Skripty

Kolekce skriptů pro rychlou konfiguraci a správu projektu.

## 📋 Dostupné skripty

### 1. `quick-setup.sh` - Kompletní setup projektu

**Co dělá:**
- ✅ Kontrola Node.js a npm
- ✅ Instalace závislostí (`npm install`)
- ✅ Vytvoření databázové složky
- ✅ Vytvoření a konfigurace `.env` souboru
- ✅ Generování admin hesla

**Použití:**
```bash
cd api
chmod +x quick-setup.sh
./quick-setup.sh
```

**Kdy použít:**
- První setup projektu
- Po sklonování z Gitu
- Při vytváření nového prostředí

---

### 2. `setup-env.sh` - Vytvoření/aktualizace .env

**Co dělá:**
- ✅ Vytvoří nový `.env` soubor s produkční konfigurací
- ✅ Zálohuje existující `.env` (pokud existuje)
- ✅ Automaticky vygeneruje admin heslo hash
- ✅ Nastaví všechny email adresy
- ✅ Nastaví MailTrap credentials

**Použití:**
```bash
cd api
chmod +x setup-env.sh
./setup-env.sh
```

**Konfiguruje:**
- Port: 3000
- MailTrap: live.smtp.mailtrap.io:587
- Email (rezervace): rezervace@pricna.cz
- Email (formuláře): info@pricna.cz
- Email (notifikace): j.stachovsky@gmail.com
- Admin username: admin
- JWT Secret

---

### 3. `update-email-config.sh` - Aktualizace emailů

**Co dělá:**
- ✅ Aktualizuje emailové adresy v `.env`
- ✅ Vytvoří zálohu před změnou

**Použití:**
```bash
cd api
chmod +x update-email-config.sh
./update-email-config.sh
```

**Aktualizuje:**
- `EMAIL_RESERVATIONS=rezervace@pricna.cz`
- `EMAIL_INFO=info@pricna.cz`
- `EMAIL_OWNER=j.stachovsky@gmail.com`

---

### 4. `update-mailtrap.sh` - Aktualizace MailTrap

**Co dělá:**
- ✅ Aktualizuje MailTrap credentials v `.env`
- ✅ Nastaví produkční SMTP server
- ✅ Vytvoří zálohu před změnou

**Použití:**
```bash
cd api
chmod +x update-mailtrap.sh
./update-mailtrap.sh
```

**Nastavuje:**
- Host: live.smtp.mailtrap.io
- Port: 587
- User: api
- Pass: 5dce093e9b7f5a24a77fd170fa520c41

---

### 5. `change-admin-password.sh` - Změna admin hesla

**Co dělá:**
- ✅ Interaktivně požádá o nové heslo
- ✅ Vygeneruje bcrypt hash
- ✅ Aktualizuje `.env` soubor
- ✅ Vytvoří zálohu před změnou

**Použití:**
```bash
cd api
chmod +x change-admin-password.sh
./change-admin-password.sh
```

**Příklad:**
```
🔐 Změna admin hesla
=====================

📝 Zadejte nové admin heslo:
[zadáte heslo]

🔐 Generuji hash hesla...
📦 Záloha vytvořena: .env.backup.20250125_120000
✅ Admin heslo bylo změněno!

🔄 Restartujte server pro aplikování změn
```

---

## 🎯 Rychlé příkazy

### První setup (nový projekt)
```bash
cd api
./quick-setup.sh
npm run dev
```

### Změna emailových adres
```bash
cd api
./update-email-config.sh
pm2 restart pricna-api
```

### Změna MailTrap credentials
```bash
cd api
./update-mailtrap.sh
pm2 restart pricna-api
```

### Změna admin hesla
```bash
cd api
./change-admin-password.sh
pm2 restart pricna-api
```

### Přegenerování .env (s novými hodnotami)
```bash
cd api
./setup-env.sh
pm2 restart pricna-api
```

---

## 🔧 Vlastní úpravy

### Změna emailových adres

Editujte `update-email-config.sh`:

```bash
sed -i '' 's|^EMAIL_RESERVATIONS=.*|EMAIL_RESERVATIONS=nove@pricna.cz|' "$ENV_FILE"
```

### Změna MailTrap credentials

Editujte `update-mailtrap.sh`:

```bash
MAILTRAP_HOST="sandbox.smtp.mailtrap.io"  # Změňte na sandbox pro testing
MAILTRAP_PORT="2525"
MAILTRAP_USER="vase_username"
MAILTRAP_PASS="vase_password"
```

### Přidání nových proměnných

Editujte `setup-env.sh` a přidejte do EOF bloku:

```bash
cat > "$ENV_FILE" << 'EOF'
...
# Nová proměnná
NEW_VARIABLE=hodnota
EOF
```

---

## 📦 Zálohy

Všechny skripty automaticky vytváří zálohy `.env` souboru:

**Formát:** `.env.backup.YYYYMMDD_HHMMSS`

**Příklad:** `.env.backup.20250125_143022`

**Obnovení ze zálohy:**
```bash
cp .env.backup.20250125_143022 .env
```

**Vyčištění starých záloh:**
```bash
# Smazat zálohy starší než 7 dní
find . -name ".env.backup.*" -mtime +7 -delete
```

---

## 🐛 Troubleshooting

### "Permission denied" při spuštění

**Problém:** Skript nemá práva ke spuštění

**Řešení:**
```bash
chmod +x *.sh
```

### "node: command not found"

**Problém:** Node.js není nainstalovaný

**Řešení:**
```bash
# macOS
brew install node

# Ubuntu/Debian
sudo apt install nodejs npm
```

### "npm install fails"

**Problém:** Chyba při instalaci závislostí

**Řešení:**
```bash
# Vyčistit cache
npm cache clean --force

# Smazat node_modules a znovu nainstalovat
rm -rf node_modules package-lock.json
npm install
```

### Skript nefunguje na Linux/macOS

**Problém:** Rozdíly v sed syntaxi

**Řešení:**
Skripty automaticky detekují OS:
- macOS: `sed -i ''`
- Linux: `sed -i`

Pokud problém přetrvává, editujte manuálně.

---

## 💡 Tipy

### Spuštění všech scriptů najednou

```bash
cd api
./quick-setup.sh && \
./update-mailtrap.sh && \
./update-email-config.sh
```

### Automatizace v CI/CD

```yaml
# GitHub Actions příklad
- name: Setup environment
  run: |
    cd api
    ./setup-env.sh
    npm run dev &
```

### Vytvoření aliasů

Do `~/.zshrc` nebo `~/.bashrc`:

```bash
alias pricna-setup='cd ~/path/to/Web/api && ./quick-setup.sh'
alias pricna-email='cd ~/path/to/Web/api && ./update-email-config.sh'
alias pricna-pass='cd ~/path/to/Web/api && ./change-admin-password.sh'
```

---

© 2025 Příčná Offices s.r.o.
