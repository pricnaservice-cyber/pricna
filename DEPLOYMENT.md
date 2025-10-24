# 🚀 Deployment Guide - Příčná Offices

Kompletní návod pro nasazení webu a API na Cloudflare.

## 📋 Prerekvizity

- [x] Cloudflare účet
- [x] Doména pricna.cz připojená k Cloudflare
- [x] Node.js a npm nainstalováno
- [x] Wrangler CLI (`npm install -g wrangler`)
- [x] MailTrap účet

## 🌐 Architektura

```
pricna.cz              → Hlavní web (Cloudflare Pages)
rezervace.pricna.cz    → Admin panel (Cloudflare Pages)
api.pricna.cz          → Backend API (Cloudflare Workers nebo VPS)
```

## 📦 Část 1: Backend API

### Možnost A: Cloudflare Workers (doporučeno pro jednoduchost)

**Poznámka:** Cloudflare Workers má omezení pro Node.js balíčky. Pro plnou funkcionalitu doporučujeme VPS.

1. **Přihlášení do Wrangler:**
```bash
cd api
wrangler login
```

2. **Konfigurace environment variables:**
```bash
wrangler secret put MAILTRAP_HOST
wrangler secret put MAILTRAP_USER
wrangler secret put MAILTRAP_PASS
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASSWORD_HASH
# ... další secrets
```

3. **Deploy:**
```bash
wrangler publish
```

### Možnost B: VPS/Cloud Server (doporučeno pro produkci)

#### 1. Nastavení serveru (Ubuntu 22.04)

```bash
# Aktualizace systému
sudo apt update && sudo apt upgrade -y

# Instalace Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Instalace PM2 pro běh v pozadí
sudo npm install -g pm2

# Vytvoření aplikačního adresáře
sudo mkdir -p /var/www/pricna-api
sudo chown -R $USER:$USER /var/www/pricna-api
```

#### 2. Upload kódu

```bash
# Na lokálním počítači
cd api
# Vytvořte tar.gz
tar -czf pricna-api.tar.gz .

# Upload na server (nahraďte user@server)
scp pricna-api.tar.gz user@server:/var/www/pricna-api/

# Na serveru
cd /var/www/pricna-api
tar -xzf pricna-api.tar.gz
rm pricna-api.tar.gz
```

#### 3. Konfigurace .env

```bash
cd /var/www/pricna-api
cp .env.example .env
nano .env
```

Vyplňte všechny hodnoty v `.env`:

```env
PORT=3000
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_username
MAILTRAP_PASS=your_password
EMAIL_FROM=noreply@pricna.cz
EMAIL_RECEPTION_PRICNA=recepce.pricna@pricna.cz
EMAIL_RECEPTION_DELNICKA=recepce.delnicka@pricna.cz
EMAIL_OWNER=j.stachovsky@gmail.com
JWT_SECRET=vygenerujte-silny-nahodny-retezec-aspon-32-znaku
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$...
DATABASE_PATH=./database/pricna.db
NODE_ENV=production
FRONTEND_URL=https://pricna.cz
ADMIN_URL=https://rezervace.pricna.cz
```

#### 4. Instalace závislostí a spuštění

```bash
npm install --production
npm run hash-password VaseSilneHeslo  # Zkopírujte hash do .env

# Spuštění s PM2
pm2 start server.js --name pricna-api
pm2 save
pm2 startup  # Spustí automaticky po restartu serveru
```

#### 5. Nginx reverse proxy

```bash
sudo apt install -y nginx

# Vytvoření konfigurace
sudo nano /etc/nginx/sites-available/pricna-api
```

Obsah:

```nginx
server {
    listen 80;
    server_name api.pricna.cz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Aktivace konfigurace
sudo ln -s /etc/nginx/sites-available/pricna-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. SSL certifikát (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.pricna.cz
```

## 🌍 Část 2: Frontend (Cloudflare Pages)

### 1. Příprava projektu

```bash
# V hlavním adresáři projektu
# Ujistěte se, že máte tyto soubory:
# - index.html, byty.html, kancelare.html, kontakt.html, sdilene-kancelare.html
# - css/, js/, images/, admin/
# - _redirects
```

### 2. Aktualizace API URL

V `js/api.js` změňte:

```javascript
const API_CONFIG = {
    baseURL: 'https://api.pricna.cz/api',  // Nebo URL vašeho API
    timeout: 10000
};
```

V `admin/js/admin.js` změňte:

```javascript
const API_URL = 'https://api.pricna.cz/api';
```

### 3. Deploy na Cloudflare Pages

**Pomocí Git (doporučeno):**

1. Vytvořte Git repozitář:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Pushněte na GitHub/GitLab

3. V Cloudflare Dashboard:
   - Pages → Create a project
   - Connect to Git
   - Vyberte repozitář
   - Build settings:
     - Framework: None
     - Build command: (prázdné)
     - Build output directory: /
   - Deploy

**Pomocí Wrangler:**

```bash
# V hlavním adresáři projektu
wrangler pages publish . --project-name=pricna
```

### 4. Konfigurace Custom Domains

V Cloudflare Pages dashboard:

1. **Hlavní doména:**
   - Custom domains → Add domain
   - Přidejte: `pricna.cz` a `www.pricna.cz`

2. **Admin subdoména:**
   - Custom domains → Add domain
   - Přidejte: `rezervace.pricna.cz`

### 5. Konfigurace DNS v Cloudflare

Ujistěte se, že máte tyto DNS záznamy:

```
Type    Name          Target
CNAME   pricna.cz     your-project.pages.dev
CNAME   www           your-project.pages.dev
CNAME   rezervace     your-project.pages.dev
A       api           IP_vaseho_serveru  (pokud používáte VPS)
```

## 🔧 Část 3: Konfigurace MailTrap

### Pro Development (Sandbox):

1. Přihlaste se na [mailtrap.io](https://mailtrap.io)
2. Vytvořte nový inbox
3. Zkopírujte SMTP credentials do `.env`

### Pro Production:

MailTrap má také produkční službu pro odesílání skutečných emailů:

1. Mailtrap → Sending Domains
2. Přidejte doménu `pricna.cz`
3. Ověřte doménu (přidejte DNS záznamy)
4. Získejte produkční SMTP credentials
5. Aktualizujte `.env` na serveru

**Alternativa:** Použijte jiný email service (SendGrid, AWS SES, Mailgun)

## ✅ Část 4: Testování

### 1. Test API

```bash
# Health check
curl https://api.pricna.cz/api/health

# Test přihlášení
curl -X POST https://api.pricna.cz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"vase-heslo"}'
```

### 2. Test Webu

1. Otevřete `https://pricna.cz`
2. Zkuste odeslat kontaktní formulář
3. Zkuste vytvořit rezervaci na `https://pricna.cz/sdilene-kancelare.html`
4. Zkuste poptávku na byt/kancelář

### 3. Test Admin Panelu

1. Otevřete `https://rezervace.pricna.cz`
2. Přihlaste se
3. Zkontrolujte, zda vidíte rezervace
4. Zkuste vytvořit novou rezervaci

### 4. Test Emailů

Zkontrolujte MailTrap inbox, zda přicházejí emaily:
- Potvrzení pro klienta
- Notifikace pro recepci

## 🔒 Bezpečnost

### 1. Firewall (pokud VPS)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Pravidelné aktualizace

```bash
# Nastavte automatické bezpečnostní aktualizace
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 3. Monitoring

```bash
# PM2 monitoring
pm2 monit

# Logy
pm2 logs pricna-api

# Status
pm2 status
```

### 4. Zálohy databáze

```bash
# Vytvořte cronjob pro denní zálohy
crontab -e
```

Přidejte:
```
0 2 * * * cp /var/www/pricna-api/database/pricna.db /var/www/backups/pricna-$(date +\%Y\%m\%d).db
```

## 📊 Monitoring & Analytics

### Cloudflare Analytics
- Automatic pro Pages a Workers
- Dashboard → Analytics

### Google Analytics (volitelné)
Přidejte do všech HTML souborů před `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🆘 Troubleshooting

### API nefunguje
```bash
# Zkontrolujte status
pm2 status

# Zkontrolujte logy
pm2 logs pricna-api --lines 100

# Restartujte API
pm2 restart pricna-api
```

### Emaily se neodesílají
- Zkontrolujte MailTrap credentials v `.env`
- Zkontrolujte logy API
- Testujte SMTP připojení

### CORS errors
- Zkontrolujte `FRONTEND_URL` a `ADMIN_URL` v `.env`
- Ujistěte se, že API běží na správné doméně

## 📞 Kontakt pro podporu

Pro technické problémy kontaktujte vývojáře nebo administrátora serveru.

---

© 2025 Příčná Offices s.r.o.
