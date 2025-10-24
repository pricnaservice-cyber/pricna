# ⚡ Quick Start Guide

Rychlý návod pro lokální spuštění projektu (5 minut).

## Krok 1: Nastavení MailTrap

1. Jděte na https://mailtrap.io a zaregistrujte se (zdarma)
2. Vytvořte nový Inbox
3. Zkopírujte SMTP credentials (najdete v Integrations → Show Credentials)

## Krok 2: Backend API

```bash
# Otevřete terminál a přejděte do API složky
cd "Příčná/Web/api"

# Instalace závislostí (první spuštění)
npm install

# Vytvoření .env souboru
cp .env.example .env
```

**Upravte .env soubor:**

Otevřete `api/.env` v textovém editoru a vyplňte:

```env
PORT=3000

# Z MailTrap zkopírujte:
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=xxxxxxxxxxxxx    # Vaše MailTrap username
MAILTRAP_PASS=xxxxxxxxxxxxx    # Vaše MailTrap password

# Emailové adresy (zatím můžete nechat, nebo změnit)
EMAIL_FROM=noreply@pricna.cz
EMAIL_RECEPTION_PRICNA=recepce.pricna@pricna.cz
EMAIL_RECEPTION_DELNICKA=recepce.delnicka@pricna.cz
EMAIL_OWNER=j.stachovsky@gmail.com

# JWT Secret - vygenerujte náhodný řetězec (min 32 znaků)
JWT_SECRET=moje-tajne-heslo-pro-jwt-autentizaci-min-32-znaku

ADMIN_USERNAME=admin

# Nechte zatím prázdné, vyplníme v dalším kroku
ADMIN_PASSWORD_HASH=

DATABASE_PATH=./database/pricna.db
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
ADMIN_URL=http://localhost:8080
```

**Vygenerujte admin heslo:**

```bash
# V terminálu (stále ve složce api/)
node scripts/hash-password.js admin123

# Zkopírujte vygenerovaný hash (začíná $2b$10$...)
# Vložte ho do .env jako ADMIN_PASSWORD_HASH
```

**Spusťte server:**

```bash
npm run dev
```

Měli byste vidět:

```
🚀 API Server běží na portu 3000
   Environment: development

📍 Endpoints:
   Health check: http://localhost:3000/api/health
   ...

📧 Testování SMTP připojení...
✓ SMTP server je připraven k odesílání emailů

✨ Server je připraven
```

✅ API běží! Nechte tento terminál otevřený.

## Krok 3: Frontend

**Otevřete NOVÝ terminál** a přejděte do hlavní složky Web:

```bash
cd "Příčná/Web"

# Spusťte lokální web server (zvolte jeden z těchto):

# Možnost 1: Python (pokud máte nainstalovaný)
python3 -m http.server 8080

# Možnost 2: Node.js
npx http-server -p 8080

# Možnost 3: PHP (pokud máte nainstalovaný)
php -S localhost:8080
```

✅ Web běží na http://localhost:8080

## Krok 4: Testování

### Test Webu

1. Otevřete http://localhost:8080
2. Měli byste vidět hlavní stránku Příčná Offices

### Test Kontaktního Formuláře

1. Jděte na http://localhost:8080/kontakt.html
2. Vyplňte formulář
3. Klikněte "Odeslat zprávu"
4. Měli byste vidět potvrzení
5. **Zkontrolujte MailTrap inbox** - měly by tam být 2 emaily:
   - Potvrzení pro klienta
   - Notifikace pro recepci

### Test Rezervačního Systému

1. Jděte na http://localhost:8080/sdilene-kancelare.html
2. Vyberte datum v kalendáři (ne víkend nebo minulost)
3. Vyberte časové sloty
4. Klikněte "Pokračovat k rezervaci"
5. Vyplňte formulář
6. Klikněte "Potvrdit rezervaci"
7. **Zkontrolujte MailTrap inbox** - měly by tam být další 2 emaily

### Test Admin Panelu

1. Otevřete http://localhost:8080/admin/
2. Přihlaste se:
   - Username: `admin`
   - Password: `admin123` (nebo co jste použili)
3. Měli byste vidět dashboard s rezervací, kterou jste právě vytvořili
4. Zkuste vytvořit novou rezervaci přímo z admin panelu

## 🎉 Hotovo!

Pokud vše funguje, máte funkční:
- ✅ Backend API
- ✅ Frontend web
- ✅ Kontaktní formuláře s emaily
- ✅ Rezervační systém
- ✅ Admin panel

## 🔍 Řešení Problémů

### API nespustí

**Chyba: "Cannot find module"**
```bash
cd api
npm install
```

**Chyba: "SMTP connection failed"**
- Zkontrolujte MailTrap credentials v `.env`
- Ujistěte se, že jste správně zkopírovali username a password

### Frontend nefunguje

**"API is not defined" error**
- Ujistěte se, že `<script src="js/api.js"></script>` je PŘED ostatními scripty v HTML

**Formuláře neodesílají**
- Zkontrolujte, že API běží na http://localhost:3000
- Otevřete browser console (F12) a zkontrolujte chyby

### Admin panel - nelze přihlásit

**"Neplatné přihlašovací údaje"**
- Zkontrolujte, že `ADMIN_PASSWORD_HASH` v `.env` je správně nastavený
- Zkuste znovu vygenerovat hash:
  ```bash
  cd api
  node scripts/hash-password.js VaseNoveHeslo
  # Zkopírujte hash do .env a restartujte server
  ```

## 📚 Další Kroky

- Přečtěte si [README.md](README.md) pro kompletní dokumentaci
- Přečtěte si [DEPLOYMENT.md](DEPLOYMENT.md) pro nasazení do produkce
- Upravte design a obsah podle vašich potřeb
- Přidejte vlastní obrázky do složky `images/`

## 💡 Tipy

1. **MailTrap Inbox:** Nechte si otevřený https://mailtrap.io/inboxes - všechny emaily uvidíte tam
2. **API Logy:** Sledujte terminál s API - vidíte tam všechny požadavky a případné chyby
3. **Browser Console:** Otevřete F12 → Console pro případné JavaScript chyby
4. **Database:** SQLite databáze se vytvoří automaticky v `api/database/pricna.db`

---

**Potřebujete pomoc?** Zkontrolujte README.md nebo kontaktujte vývojáře.
