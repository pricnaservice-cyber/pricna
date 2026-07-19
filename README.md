# Příčná Offices & Apartments – web pricna.cz

Web pro Příčná Offices s.r.o. a Příčná Apartments s.r.o.:
- prezentační web (kanceláře, byty, sdílená kancelář, kontakt)
- rezervační systém sdílené kanceláře s e-mailovými potvrzeními
- admin panel (rezervace.pricna.cz): správa rezervací + **správa nabídek bytů a kanceláří včetně fotek**

## Architektura

```
pricna.cz            → statický web (Cloudflare Pages, tento repozitář)
rezervace.pricna.cz  → admin panel (stejný Pages projekt, routing přes functions/_middleware.js)
API                  → Cloudflare Worker (api/worker-full.js)
                       - D1 databáze "pricna-db" (rezervace, poptávky, nemovitosti)
                       - R2 bucket "pricna-images" (fotky nahrané v adminu)
                       - Mailtrap API (odesílání e-mailů)
```

## Struktura projektu

```
Web/
├── index.html, kancelare.html, byty.html, sdilene-kancelare.html, kontakt.html
├── css/style.css            # styly (včetně vrstvy „Modern refresh 2026“ na konci)
├── js/
│   ├── api.js               # API klient (na localhostu automaticky míří na wrangler dev)
│   ├── script.js            # menu, kontaktní formulář, rezervační kalendář
│   └── properties.js        # dynamické nabídky bytů/kanceláří + modal + poptávky
├── images/                  # statické obrázky (zkomprimované, max 1920 px)
├── admin/                   # admin panel (login, rezervace, správa nemovitostí)
├── functions/_middleware.js # Pages routing pro rezervace.pricna.cz
└── api/
    ├── worker-full.js       # celé API (bez závislostí)
    ├── wrangler.toml        # konfigurace (D1 + R2 binding)
    ├── schema.sql           # schéma databáze
    ├── seed-properties.sql  # jednorázový import původních nabídek
    ├── hash-password.mjs    # generátor hashe admin hesla (PBKDF2)
    └── .dev.vars            # lokální dev secrets (NEcommitovat; login admin/admin123)
```

## Lokální vývoj

```bash
# 1) API (Worker + lokální D1/R2)
cd api
wrangler d1 execute pricna-db --local --file=schema.sql           # poprvé
wrangler d1 execute pricna-db --local --file=seed-properties.sql  # poprvé
wrangler dev --port 8787 --local

# 2) Web (v druhém terminálu, ze složky Web/)
npx http-server . -p 8080 -c-1
```

- Web: http://localhost:8080
- Admin: http://localhost:8080/admin/ (login `admin` / `admin123` z `.dev.vars`)
- Frontend na localhostu automaticky volá API na `http://127.0.0.1:8787`.

## Nasazení do produkce (checklist)

```bash
cd api

# 1) R2 bucket pro fotky (jen poprvé)
wrangler r2 bucket create pricna-images

# 2) Migrace produkční D1 (přidá tabulky properties + login_attempts, data nemaže)
wrangler d1 execute pricna-db --remote --file=schema.sql
wrangler d1 execute pricna-db --remote --file=seed-properties.sql   # jen poprvé

# 3) Secrets – DOPORUČENO ROTOVAT (staré hodnoty byly ve smazaném .env):
node hash-password.mjs NoveSilneHeslo   # výstup vložit níže
wrangler secret put ADMIN_PASSWORD_HASH
wrangler secret put ADMIN_USERNAME
wrangler secret put JWT_SECRET          # náhodný řetězec 32+ znaků
wrangler secret put MAILTRAP_PASS       # nový Mailtrap API token

# 4) Deploy API
wrangler deploy

# 5) Frontend – push do gitu (Cloudflare Pages nasadí automaticky)
```

## API endpointy

Veřejné:
- `GET  /api/health`
- `GET  /api/properties?type=office|apartment` – publikované nabídky
- `GET  /api/reservations/public` – obsazené sloty (bez osobních údajů)
- `POST /api/reservations` – rezervace (server validuje datum, sloty, kolize a **cenu počítá sám**)
- `POST /api/inquiries` – poptávky/kontakt
- `GET  /api/images/:key` – fotky z R2

Chráněné (JWT z `POST /api/auth/login`, rate limit 5 pokusů / 15 min):
- `GET/PUT/DELETE /api/reservations…`, `POST /api/reservations/:id/cancel`
- `GET /api/inquiries`
- `GET/POST/PUT/DELETE /api/admin/properties…`
- `POST /api/admin/images` (upload, max 5 MB, JPEG/PNG/WebP), `DELETE /api/admin/images/:key`

## Bezpečnost (stav po revizi 07/2026)

- JWT (HS256, exp 24 h), hesla PBKDF2-SHA256 (100 000 iterací) se zpětnou kompatibilitou pro starý hash
- Rate limiting přihlášení, CORS omezen na domény pricna.cz + localhost
- Veškerý uživatelský vstup escapován v admin panelu i v e-mailech (XSS)
- Server validuje rezervace: cena, dostupnost slotů, víkendy, státní svátky
- Vstupy limitované na délku, upload jen obrázky do 5 MB

## Barvy a písmo

- Zlatá `#eabb11` (tmavší `#d4a00f`), šedá `#7a848d` (tmavší `#5a646d`)
- Písmo: Inter (Google Fonts)

---
© 2026 Příčná Offices s.r.o.
