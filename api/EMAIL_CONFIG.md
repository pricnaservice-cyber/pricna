# 📧 Email Configuration - Příčná Offices

Kompletní přehled email nastavení a pravidel pro odesílání emailů.

## 📬 Emailové adresy

### rezervace@pricna.cz
**Účel:** Rezervační systém (sdílené kanceláře)

**Používá se pro:**
- ✅ Odesílání potvrzení rezervace klientům
- ✅ Příjem notifikací o nových rezervacích

**Notifikace o nové rezervaci přijde na:**
- `rezervace@pricna.cz`
- `j.stachovsky@gmail.com` (majitel)

### info@pricna.cz
**Účel:** Ostatní formuláře (kontakt, byty, kanceláře)

**Používá se pro:**
- ✅ Odesílání potvrzení z kontaktního formuláře
- ✅ Odesílání potvrzení z poptávek bytů
- ✅ Odesílání potvrzení z poptávek kanceláří
- ✅ Příjem notifikací o vyplněných formulářích

**Notifikace o vyplněném formuláři přijde na:**
- `info@pricna.cz`
- `j.stachovsky@gmail.com` (majitel)

### j.stachovsky@gmail.com
**Účel:** Majitel - dostane všechny notifikace

**Typy notifikací:**
- ✅ Všechny nové rezervace
- ✅ Všechny vyplněné formuláře (kontakt, byty, kanceláře)

## 📨 Email Flow

### 1. Rezervační systém (sdilene-kancelare.html)

**Když klient vytvoří rezervaci:**

```
┌─────────────────────────────────────────┐
│ Klient vyplní rezervační formulář       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ API vytvoří rezervaci v databázi        │
└─────────────────┬───────────────────────┘
                  │
                  ├──► Email #1: Potvrzení pro klienta
                  │    FROM: rezervace@pricna.cz
                  │    TO: email klienta
                  │    SUBJECT: "Potvrzení rezervace - Sdílené kanceláře"
                  │
                  └──► Email #2: Notifikace
                       FROM: rezervace@pricna.cz
                       TO: rezervace@pricna.cz, j.stachovsky@gmail.com
                       SUBJECT: "🔔 Nová rezervace #123 - datum"
```

### 2. Kontaktní formulář (kontakt.html)

**Když klient odešle kontaktní formulář:**

```
┌─────────────────────────────────────────┐
│ Klient vyplní kontaktní formulář        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ API uloží poptávku do databáze          │
└─────────────────┬───────────────────────┘
                  │
                  ├──► Email #1: Potvrzení pro klienta
                  │    FROM: info@pricna.cz
                  │    TO: email klienta
                  │    SUBJECT: "Děkujeme za Váš zájem"
                  │
                  └──► Email #2: Notifikace
                       FROM: info@pricna.cz
                       TO: info@pricna.cz, j.stachovsky@gmail.com
                       SUBJECT: "Kontaktní formulář - Jméno klienta"
```

### 3. Poptávka bytu (byty.html - modal)

**Když klient odešle poptávku na byt:**

```
┌─────────────────────────────────────────┐
│ Klient vyplní formulář u konkrétního    │
│ bytu (např. "Byt 1+kk")                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ API uloží poptávku do databáze          │
└─────────────────┬───────────────────────┘
                  │
                  ├──► Email #1: Potvrzení pro klienta
                  │    FROM: info@pricna.cz
                  │    TO: email klienta
                  │    SUBJECT: "Děkujeme za Váš zájem"
                  │
                  └──► Email #2: Notifikace
                       FROM: info@pricna.cz
                       TO: info@pricna.cz, j.stachovsky@gmail.com
                       SUBJECT: "Poptávka - Byt - Jméno klienta"
```

### 4. Poptávka kanceláře (kancelare.html - modal)

**Když klient odešle poptávku na kancelář:**

```
┌─────────────────────────────────────────┐
│ Klient vyplní formulář u konkrétní      │
│ kanceláře (např. "Kancelář 15m²")       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ API uloží poptávku do databáze          │
└─────────────────┬───────────────────────┘
                  │
                  ├──► Email #1: Potvrzení pro klienta
                  │    FROM: info@pricna.cz
                  │    TO: email klienta
                  │    SUBJECT: "Děkujeme za Váš zájem"
                  │
                  └──► Email #2: Notifikace
                       FROM: info@pricna.cz
                       TO: info@pricna.cz, j.stachovsky@gmail.com
                       SUBJECT: "Poptávka - Kancelář - Jméno klienta"
```

## ⚙️ Implementace v kódu

### Environment Variables (.env)

```env
# Rezervační systém
EMAIL_RESERVATIONS=rezervace@pricna.cz

# Ostatní formuláře
EMAIL_INFO=info@pricna.cz

# Majitel (dostane všechny notifikace)
EMAIL_OWNER=j.stachovsky@gmail.com
```

### Email Service (emailService.js)

**Potvrzení rezervace:**
```javascript
from: "Příčná Offices - Rezervace" <rezervace@pricna.cz>
to: klient@example.com
```

**Notifikace o rezervaci:**
```javascript
from: "Příčná Offices - Rezervační systém" <rezervace@pricna.cz>
to: rezervace@pricna.cz, j.stachovsky@gmail.com
```

**Potvrzení poptávky:**
```javascript
from: "Příčná Offices & Apartments" <info@pricna.cz>
to: klient@example.com
```

**Notifikace o poptávce:**
```javascript
from: "Příčná Offices - Formuláře" <info@pricna.cz>
to: info@pricna.cz, j.stachovsky@gmail.com
```

## 🔧 Konfigurace MailTrap

### 1. Přidání odesílacích domén

V MailTrap dashboard → Sending Domains:

1. Přidejte doménu `pricna.cz`
2. Ověřte doménu pomocí DNS záznamů
3. Nastavte SPF a DKIM záznamy

### 2. DNS záznamy (v Cloudflare)

**SPF (pro oba emaily):**
```
Type: TXT
Name: pricna.cz
Content: v=spf1 include:_spf.mailtrap.live ~all
```

**DKIM (poskytne MailTrap):**
```
Type: TXT
Name: mailtrap._domainkey
Content: [hodnota z MailTrap]
```

**DMARC (volitelné, doporučeno):**
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=none; rua=mailto:j.stachovsky@gmail.com
```

### 3. Vytvoření email účtů

MailTrap podporuje více "From" adres z jedné domény:
- `rezervace@pricna.cz` ✅
- `info@pricna.cz` ✅

Obě budou fungovat se stejnými SMTP credentials.

## 📊 Monitoring

### MailTrap Dashboard

Sledujte:
- ✅ Počet odeslaných emailů
- ✅ Delivery rate
- ✅ Bounce rate
- ✅ Spam complaints

### API Logs

```bash
# Sledování logů
pm2 logs pricna-api

# Co hledat:
✓ SMTP server je připraven k odesílání emailů
✓ Potvrzení rezervace odesláno: [messageId]
✓ Notifikace o rezervaci odeslána: [messageId]
✓ Potvrzení poptávky odesláno: [messageId]
✓ Notifikace o poptávce odeslána: [messageId]
```

## 🧪 Testování

### Test rezervačního emailu

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-25",
    "timeSlots": ["09:00", "10:00"],
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+420123456789",
    "totalPrice": 198
  }'
```

**Očekávané emaily:**
1. `test@example.com` - potvrzení (FROM: rezervace@pricna.cz)
2. `rezervace@pricna.cz` - notifikace
3. `j.stachovsky@gmail.com` - notifikace

### Test poptávkového emailu

```bash
curl -X POST http://localhost:3000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "contact",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+420123456789",
    "message": "Mám zájem o informace"
  }'
```

**Očekávané emaily:**
1. `test@example.com` - potvrzení (FROM: info@pricna.cz)
2. `info@pricna.cz` - notifikace
3. `j.stachovsky@gmail.com` - notifikace

## 📋 Checklist před spuštěním do produkce

- [ ] Doména `pricna.cz` ověřena v MailTrap
- [ ] SPF záznam přidán do DNS
- [ ] DKIM záznamy přidány do DNS
- [ ] Email `rezervace@pricna.cz` existuje/je nastavený
- [ ] Email `info@pricna.cz` existuje/je nastavený
- [ ] Email `j.stachovsky@gmail.com` je dostupný
- [ ] Environment variables správně nastaveny v `.env`
- [ ] Testovací emaily úspěšně doručeny
- [ ] Emaily nekončí ve spamu
- [ ] Všechny HTML šablony zobrazují správné kontaktní údaje

---

© 2025 Příčná Offices s.r.o.
