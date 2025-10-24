# 📧 MailTrap Produkční Konfigurace

## ✅ Produkční Credentials

Vaše MailTrap produkční nastavení:

```env
MAILTRAP_HOST=live.smtp.mailtrap.io
MAILTRAP_PORT=587
MAILTRAP_USER=api
MAILTRAP_PASS=5dce093e9b7f5a24a77fd170fa520c41
```

## ⚠️ DŮLEŽITÉ

**Toto jsou PRODUKČNÍ credentials!**
- Emaily se budou skutečně odesílat na reálné adresy
- Nikdy necommitujte tyto hodnoty do Git
- Používejte pouze v `.env` souboru (který je v .gitignore)

## 🚀 Nastavení

### 1. Lokální Development

```bash
cd api
cp .env.example .env
```

Otevřete `.env` a zkontrolujte, že jsou správně nastaveny:

```env
MAILTRAP_HOST=live.smtp.mailtrap.io
MAILTRAP_PORT=587
MAILTRAP_USER=api
MAILTRAP_PASS=5dce093e9b7f5a24a77fd170fa520c41
```

### 2. Produkční Server

Při deployu na server nastavte environment variables bezpečně:

```bash
# Příklad pro PM2
pm2 start server.js --name pricna-api \
  --env MAILTRAP_HOST=live.smtp.mailtrap.io \
  --env MAILTRAP_PORT=587 \
  --env MAILTRAP_USER=api \
  --env MAILTRAP_PASS=5dce093e9b7f5a24a77fd170fa520c41
```

Nebo je nastavte v `.env` souboru na serveru:

```bash
# Na serveru
nano /var/www/pricna-api/.env
# Vložte produkční hodnoty
```

### 3. Cloudflare Workers

```bash
wrangler secret put MAILTRAP_HOST
# Zadejte: live.smtp.mailtrap.io

wrangler secret put MAILTRAP_PORT
# Zadejte: 587

wrangler secret put MAILTRAP_USER
# Zadejte: api

wrangler secret put MAILTRAP_PASS
# Zadejte: 5dce093e9b7f5a24a77fd170fa520c41
```

## 🧪 Test Odesílání

Po nastavení otestujte:

```bash
# Spusťte server
npm run dev

# V novém terminálu
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "inquiry-confirmation"}'
```

**Email se odešle na skutečnou adresu!** Zkontrolujte doručenou poštu.

## 📋 Emailové adresy

Ujistěte se, že máte v `.env` správné emailové adresy:

```env
EMAIL_FROM=noreply@pricna.cz
EMAIL_RECEPTION_PRICNA=recepce.pricna@pricna.cz
EMAIL_RECEPTION_DELNICKA=recepce.delnicka@pricna.cz
EMAIL_OWNER=j.stachovsky@gmail.com
```

## 🔐 Bezpečnost

- ✅ `.env` je v `.gitignore` - credentials nebudou v Git
- ✅ Používejte silné heslo pro admin panel
- ✅ Na produkci použijte HTTPS (port 587 podporuje STARTTLS)
- ✅ Pravidelně rotujte API klíče

## 📊 MailTrap Dashboard

Přihlaste se na https://mailtrap.io a:
- Sledujte odesílané emaily
- Kontrolujte delivery rate
- Nastavte Domain Authentication pro lepší deliverability
- Přidejte SPF/DKIM záznamy do DNS

## 🆘 Troubleshooting

### Emaily se neodesílají

1. Zkontrolujte credentials v `.env`
2. Zkontrolujte MailTrap dashboard - máte dostatečný limit?
3. Zkontrolujte logy API: `pm2 logs pricna-api`

### "Authentication failed"

- Zkontrolujte, že používáte správný API key
- MailTrap někdy vyžaduje IP whitelisting

### Emaily končí ve spamu

1. V MailTrap dashboard nastavte Domain Authentication
2. Přidejte SPF záznam do DNS:
   ```
   v=spf1 include:_spf.mailtrap.live ~all
   ```
3. Přidejte DKIM záznam (poskytne MailTrap)

---

© 2025 Příčná Offices s.r.o.
