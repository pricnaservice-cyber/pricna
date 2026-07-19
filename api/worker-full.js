/**
 * Příčná Offices API - Cloudflare Worker
 * Kompletní implementace bez externích závislostí.
 *
 * Bindings (wrangler.toml):
 *   DB     - D1 databáze (rezervace, poptávky, nemovitosti)
 *   IMAGES - R2 bucket pro fotky nemovitostí
 *
 * Secrets (wrangler secret put / .dev.vars):
 *   JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD_HASH, MAILTRAP_PASS
 */

// === CORS ===

const ALLOWED_ORIGINS = [
  'https://pricna.cz',
  'https://www.pricna.cz',
  'https://rezervace.pricna.cz',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
];

function corsFor(request) {
  const origin = request.headers.get('Origin');
  const allowed = origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.pages.dev'))
    ? origin
    : 'https://pricna.cz';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Name',
    'Vary': 'Origin',
  };
}

// === HELPERS ===

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(value, maxLen) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

// === AUTH HELPERS ===

function b64urlEncode(bytes) {
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlDecode(text) {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2Hex(password, saltBytes, iterations) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations },
    keyMaterial,
    256
  );
  return toHex(new Uint8Array(bits));
}

/**
 * Podporované formáty hashe hesla:
 *  - "pbkdf2$<iterace>$<salt hex>$<hash hex>"  (doporučené, vygenerujte přes hash-password.mjs)
 *  - starší SHA-256(password + 'pricna-salt-2025') hex  (zpětná kompatibilita)
 */
async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (storedHash.startsWith('pbkdf2$')) {
    const [, iterStr, saltHex, hashHex] = storedHash.split('$');
    const iterations = parseInt(iterStr, 10);
    if (!iterations || !saltHex || !hashHex) return false;
    const computed = await pbkdf2Hex(password, fromHex(saltHex), iterations);
    return timingSafeEqualHex(computed, hashHex);
  }
  // legacy formát
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(password + 'pricna-salt-2025'));
  return timingSafeEqualHex(toHex(new Uint8Array(digest)), storedHash);
}

async function hmacKey(secret, usages) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usages
  );
}

async function signJWT(payload, secret) {
  const encoder = new TextEncoder();
  const headerB64 = b64urlEncode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payloadB64 = b64urlEncode(encoder.encode(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;
  const key = await hmacKey(secret, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return `${data}.${b64urlEncode(new Uint8Array(signature))}`;
}

async function verifyJWT(token, secret) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const header = JSON.parse(new TextDecoder().decode(b64urlDecode(headerB64)));
    if (header.alg !== 'HS256') return null;

    const encoder = new TextEncoder();
    const key = await hmacKey(secret, ['verify']);
    const isValid = await crypto.subtle.verify(
      'HMAC', key, b64urlDecode(signatureB64), encoder.encode(`${headerB64}.${payloadB64}`)
    );
    if (!isValid) return null;

    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return verifyJWT(authHeader.substring(7), env.JWT_SECRET);
}

// === RATE LIMITING (login) ===

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

async function isLoginBlocked(env, ip) {
  const since = Date.now() - LOGIN_WINDOW_MS;
  const { results } = await env.DB.prepare(
    'SELECT COUNT(*) AS cnt FROM login_attempts WHERE ip = ? AND ts > ?'
  ).bind(ip, since).all();
  return (results[0]?.cnt || 0) >= LOGIN_MAX_ATTEMPTS;
}

async function recordLoginFailure(env, ip) {
  await env.DB.prepare('INSERT INTO login_attempts (ip, ts) VALUES (?, ?)').bind(ip, Date.now()).run();
  // úklid starých záznamů
  await env.DB.prepare('DELETE FROM login_attempts WHERE ts < ?').bind(Date.now() - LOGIN_WINDOW_MS).run();
}

async function clearLoginFailures(env, ip) {
  await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
}

// === REZERVACE - validace ===

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];
const PRICE_PER_HOUR = 99;
const PRICE_FULL_DAY = 399;
const FULL_DAY_THRESHOLD = 4;

function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function isCzechHoliday(dateStr) {
  const year = parseInt(dateStr.slice(0, 4), 10);
  const fixed = [
    `${year}-01-01`, `${year}-05-01`, `${year}-05-08`, `${year}-07-05`,
    `${year}-07-06`, `${year}-09-28`, `${year}-10-28`, `${year}-11-17`,
    `${year}-12-24`, `${year}-12-25`, `${year}-12-26`,
  ];
  if (fixed.includes(dateStr)) return true;
  const easter = calculateEaster(year);
  const goodFriday = new Date(easter); goodFriday.setUTCDate(easter.getUTCDate() - 2);
  const easterMonday = new Date(easter); easterMonday.setUTCDate(easter.getUTCDate() + 1);
  return dateStr === goodFriday.toISOString().slice(0, 10)
    || dateStr === easterMonday.toISOString().slice(0, 10);
}

function computePrice(hours) {
  return hours >= FULL_DAY_THRESHOLD ? PRICE_FULL_DAY : hours * PRICE_PER_HOUR;
}

/** Vrátí { error } nebo { date, timeSlots, price }. */
function validateReservationInput(data) {
  const date = typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : null;
  if (!date) return { error: 'Neplatné datum' };

  const todayStr = new Date().toISOString().slice(0, 10);
  if (date < todayStr) return { error: 'Datum je v minulosti' };

  const dayOfWeek = new Date(date + 'T12:00:00Z').getUTCDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return { error: 'O víkendech je zavřeno' };
  if (isCzechHoliday(date)) return { error: 'Ve svátek je zavřeno' };

  const rawSlots = Array.isArray(data.timeSlots) ? data.timeSlots : [data.timeSlots];
  const timeSlots = [...new Set(rawSlots)].filter(s => TIME_SLOTS.includes(s))
    .sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));
  if (timeSlots.length === 0 || timeSlots.length !== rawSlots.length) {
    return { error: 'Neplatné časové sloty' };
  }

  return { date, timeSlots, price: computePrice(timeSlots.length) };
}

async function findConflictingSlots(env, date, timeSlots) {
  const { results } = await env.DB.prepare(
    "SELECT time FROM reservations WHERE date = ? AND status != 'cancelled'"
  ).bind(date).all();
  const booked = new Set();
  results.forEach(r => r.time.split(', ').forEach(t => booked.add(t)));
  return timeSlots.filter(t => booked.has(t));
}

// === EMAIL SERVICE ===

async function sendEmail(env, to, subject, html, from) {
  if (!env.MAILTRAP_PASS) {
    console.log('MAILTRAP_PASS není nastaven - email se neodesílá (dev režim)');
    return false;
  }
  const response = await fetch('https://send.api.mailtrap.io/api/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MAILTRAP_PASS}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { email: from, name: 'Příčná Offices' },
      to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
      subject,
      html,
    }),
  });
  return response.ok;
}

function emailShell(headerGradient, headerTitle, bodyHtml, footerText) {
  return `
    <!DOCTYPE html>
    <html lang="cs">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <tr><td style="background: ${headerGradient}; padding: 40px 30px; text-align: center;">
              <img src="https://pricna.cz/images/pricna_logo_final.png" alt="Příčná Offices" style="max-width: 200px; height: auto; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">${headerTitle}</h1>
            </td></tr>
            <tr><td style="padding: 40px 30px;">${bodyHtml}</td></tr>
            <tr><td style="background-color: #7a848d; padding: 30px; text-align: center;">
              <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px; font-weight: 500;">${footerText}</p>
              <p style="color: #f0f0f0; font-size: 14px; margin: 0;"><strong>Tým Příčná Offices</strong></p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

async function sendReservationEmails(reservation, env) {
  const name = escapeHtml(reservation.name);
  const date = escapeHtml(reservation.date);
  const time = escapeHtml(reservation.time);
  const durationText = `${reservation.duration} ${reservation.duration === 1 ? 'hodina' : reservation.duration < 5 ? 'hodiny' : 'hodin'}`;

  const confirmationBody = `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Dobrý den <strong style="color: #eabb11;">${name}</strong>,</p>
    <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Děkujeme za Vaši rezervaci sdílené kanceláře. Těšíme se na Vaši návštěvu!</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9e7; border-left: 4px solid #eabb11; border-radius: 8px; margin: 0 0 25px;">
      <tr><td style="padding: 25px;">
        <h2 style="color: #333; font-size: 20px; margin: 0 0 20px; font-weight: 600;">📅 Detaily rezervace</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Datum:</strong> ${date}</p>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Čas:</strong> ${time}</p>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Délka:</strong> ${durationText}</p>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Cena:</strong> <span style="color: #eabb11; font-size: 18px; font-weight: 600;">${reservation.totalPrice} Kč</span></p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4f8; border-left: 4px solid #7a848d; border-radius: 8px; margin: 0 0 25px;">
      <tr><td style="padding: 20px;">
        <h3 style="color: #333; font-size: 18px; margin: 0 0 12px; font-weight: 600;">💰 Platba a klíče</h3>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">Platbu a vyzvednutí klíčů od kanceláře prosím proveďte na recepci na adrese <strong style="color: #7a848d;">Příčná 1, 736 01 Havířov - Město</strong>.</p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8e6; border-left: 4px solid #eabb11; border-radius: 8px; margin: 0 0 30px;">
      <tr><td style="padding: 20px;">
        <h3 style="color: #333; font-size: 18px; margin: 0 0 12px; font-weight: 600;">ℹ️ Změna nebo zrušení</h3>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">Pro změnu nebo zrušení rezervace nás prosím kontaktujte telefonicky na čísle <strong style="color: #eabb11;">+420 608 429 100</strong>.</p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #f0f0f0; padding-top: 25px; margin-top: 25px;">
      <tr><td>
        <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 5px 0;"><strong style="color: #7a848d;">📍 Adresa recepce:</strong> Příčná 1, 736 01 Havířov - Město</p>
        <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 5px 0;"><strong style="color: #7a848d;">📞 Telefon:</strong> +420 608 429 100</p>
        <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 5px 0;"><strong style="color: #7a848d;">🕐 Otevírací doba:</strong> Po-Pá: 7:00 - 19:00</p>
      </td></tr>
    </table>
  `;

  await sendEmail(
    env, reservation.email, 'Potvrzení rezervace - Sdílená kancelář Příčná',
    emailShell('linear-gradient(135deg, #eabb11 0%, #d4a00f 100%)', '✅ Potvrzení rezervace', confirmationBody, 'Těšíme se na Vaši návštěvu!'),
    'noreply@pricna.cz'
  );

  const notificationHtml = `
    <h2>🔔 Nová rezervace #${reservation.id}</h2>
    <p><strong>Jméno:</strong> ${name}</p>
    <p><strong>Email:</strong> ${escapeHtml(reservation.email)}</p>
    <p><strong>Telefon:</strong> ${escapeHtml(reservation.phone || 'N/A')}</p>
    <p><strong>Datum:</strong> ${date}</p>
    <p><strong>Čas:</strong> ${time}</p>
    <p><strong>Cena:</strong> ${reservation.totalPrice} Kč</p>
  `;
  await sendEmail(env, ['j.stachovsky@gmail.com', 'pricna.apartments@gmail.com'], `Nová rezervace #${reservation.id}`, notificationHtml, 'noreply@pricna.cz');
}

async function sendCancellationEmail(reservation, env) {
  const body = `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Dobrý den <strong style="color: #7a848d;">${escapeHtml(reservation.name)}</strong>,</p>
    <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Vaše rezervace sdílené kanceláře byla zrušena.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffe6e6; border-left: 4px solid #dc3545; border-radius: 8px; margin: 0 0 30px;">
      <tr><td style="padding: 25px;">
        <h2 style="color: #333; font-size: 20px; margin: 0 0 20px; font-weight: 600;">📅 Zrušená rezervace</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Datum:</strong> ${escapeHtml(reservation.date)}</p>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Čas:</strong> ${escapeHtml(reservation.time)}</p>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Cena:</strong> ${reservation.totalPrice} Kč</p>
      </td></tr>
    </table>
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px;">Pokud jste tuto rezervaci nezrušili Vy, nebo máte dotazy, kontaktujte nás prosím na:</p>
    <p style="color: #333; font-size: 16px; margin: 0;"><strong style="color: #eabb11;">📞 +420 608 429 100</strong></p>
  `;
  await sendEmail(
    env, reservation.email, 'Zrušení rezervace - Sdílená kancelář Příčná',
    emailShell('linear-gradient(135deg, #dc3545 0%, #c82333 100%)', '❌ Zrušení rezervace', body, 'Budeme se těšit na Vaši další návštěvu!'),
    'noreply@pricna.cz'
  );
}

async function sendInquiryEmails(inquiry, env) {
  const typeLabels = { contact: 'Kontaktní formulář', apartment: 'Poptávka - Byt', office: 'Poptávka - Kancelář' };
  const typeLabel = typeLabels[inquiry.type] || 'Poptávka';

  const confirmationBody = `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Dobrý den <strong style="color: #eabb11;">${escapeHtml(inquiry.name)}</strong>,</p>
    <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Děkujeme za Vaši zprávu. Brzy se Vám ozveme a rádi zodpovíme všechny Vaše dotazy.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9e7; border-left: 4px solid #eabb11; border-radius: 8px; margin: 0 0 30px;">
      <tr><td style="padding: 25px;">
        <h2 style="color: #333; font-size: 20px; margin: 0 0 20px; font-weight: 600;">📞 Kontakt</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Telefon:</strong> <span style="color: #eabb11; font-weight: 600;">+420 608 429 100</span></p>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Email:</strong> info@pricna.cz</p>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Adresa:</strong> Příčná 1, 736 01 Havířov - Město</p>
      </td></tr>
    </table>
  `;
  await sendEmail(
    env, inquiry.email, 'Děkujeme za Váš zájem - Příčná Offices',
    emailShell('linear-gradient(135deg, #eabb11 0%, #d4a00f 100%)', '✉️ Děkujeme za Váš zájem', confirmationBody, 'Těšíme se na setkání s Vámi!'),
    'noreply@pricna.cz'
  );

  const notificationBody = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9e7; border-left: 4px solid #eabb11; border-radius: 8px;">
      <tr><td style="padding: 25px;">
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Jméno:</strong> ${escapeHtml(inquiry.name)}</p>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Email:</strong> ${escapeHtml(inquiry.email)}</p>
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Telefon:</strong> ${escapeHtml(inquiry.phone || 'N/A')}</p>
        ${inquiry.itemName ? `<p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Nabídka:</strong> ${escapeHtml(inquiry.itemName)}</p>` : ''}
        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 15px 0 8px;"><strong style="color: #333;">Zpráva:</strong></p>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0; padding: 15px; background-color: #ffffff; border-radius: 6px;">${escapeHtml(inquiry.message || 'N/A')}</p>
      </td></tr>
    </table>
  `;
  await sendEmail(
    env, 'j.stachovsky@gmail.com', `${typeLabel} - ${inquiry.name}`,
    emailShell('linear-gradient(135deg, #7a848d 0%, #5a646d 100%)', `🔔 ${escapeHtml(typeLabel)}`, notificationBody, 'Příčná Offices & Apartments'),
    'noreply@pricna.cz'
  );
}

// === PROPERTIES (nemovitosti) ===

function parseStringArray(value, maxItems, maxLen) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => typeof item === 'string' && item.trim())
    .slice(0, maxItems)
    .map(item => item.trim().slice(0, maxLen));
}

/** Validace vstupu pro create/update nemovitosti. Vrátí { error } nebo { values }. */
function validatePropertyInput(data) {
  const type = data.type === 'apartment' || data.type === 'office' ? data.type : null;
  if (!type) return { error: 'Neplatný typ nemovitosti' };

  const title = str(data.title, 120);
  if (!title) return { error: 'Název je povinný' };

  const values = {
    type,
    title,
    building: str(data.building, 120),
    location: str(data.location, 200),
    size: str(data.size, 60),
    capacity: str(data.capacity, 120),
    price: str(data.price, 60),
    utilities: str(data.utilities, 60),
    deposit: str(data.deposit, 60),
    vatNote: str(data.vatNote, 300),
    description: str(data.description, 4000),
    features: JSON.stringify(parseStringArray(data.features, 30, 200)),
    images: JSON.stringify(parseStringArray(data.images, 20, 500)),
    available: str(data.available, 60),
    published: data.published ? 1 : 0,
    sortOrder: Number.isFinite(Number(data.sortOrder)) ? Math.trunc(Number(data.sortOrder)) : 0,
  };
  return { values };
}

function propertyFromRow(row) {
  return {
    ...row,
    features: safeJsonArray(row.features),
    images: safeJsonArray(row.images),
    published: !!row.published,
  };
}

function safeJsonArray(text) {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// === MAIN WORKER ===

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const cors = corsFor(request);
    const json = (data, status = 200) => new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
    const error = (message, status = 400) => json({ success: false, error: message }, status);

    if (method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    try {
      // Health check
      if (path === '/api/health' && method === 'GET') {
        return json({ status: 'OK', timestamp: new Date().toISOString(), environment: 'cloudflare-workers' });
      }

      // === AUTH ===
      if (path === '/api/auth/login' && method === 'POST') {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (await isLoginBlocked(env, ip)) {
          return error('Příliš mnoho pokusů o přihlášení. Zkuste to za 15 minut.', 429);
        }

        const { username, password } = await request.json();
        if (typeof username !== 'string' || typeof password !== 'string'
          || username !== env.ADMIN_USERNAME
          || !(await verifyPassword(password, env.ADMIN_PASSWORD_HASH))) {
          await recordLoginFailure(env, ip);
          return error('Invalid credentials', 401);
        }

        await clearLoginFailures(env, ip);
        const now = Math.floor(Date.now() / 1000);
        const token = await signJWT({ username, iat: now, exp: now + 24 * 60 * 60 }, env.JWT_SECRET);
        return json({ success: true, token, user: { username } });
      }

      // === RESERVATIONS ===
      // Veřejný endpoint pro kalendář (bez osobních údajů)
      if (path === '/api/reservations/public' && method === 'GET') {
        const { results } = await env.DB.prepare(
          "SELECT id, date, time, duration, status FROM reservations WHERE status != 'cancelled' ORDER BY date ASC"
        ).all();
        return json(results);
      }

      if (path === '/api/reservations' && method === 'GET') {
        if (!(await requireAuth(request, env))) return error('Unauthorized', 401);
        const { results } = await env.DB.prepare(
          'SELECT * FROM reservations ORDER BY date DESC, time DESC LIMIT 200'
        ).all();
        return json(results);
      }

      if (path === '/api/reservations' && method === 'POST') {
        const data = await request.json();

        const name = str(data.name, 120);
        const email = str(data.email, 200);
        if (!name || !email || !EMAIL_RE.test(email)) {
          return error('Vyplňte prosím jméno a platný e-mail');
        }

        const validated = validateReservationInput(data);
        if (validated.error) return error(validated.error);

        // kontrola kolizí na serveru
        const conflicts = await findConflictingSlots(env, validated.date, validated.timeSlots);
        if (conflicts.length > 0) {
          return error('Některé časové sloty již nejsou k dispozici', 409);
        }

        const time = validated.timeSlots.join(', ');
        const result = await env.DB.prepare(`
          INSERT INTO reservations (date, time, duration, name, email, phone, company, message, totalPrice, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(
          validated.date, time, validated.timeSlots.length, name, email,
          str(data.phone, 40), str(data.company, 200), str(data.message, 2000),
          validated.price
        ).run();

        const { results } = await env.DB.prepare('SELECT * FROM reservations WHERE id = ?')
          .bind(result.meta.last_row_id).all();
        const reservation = results[0];

        ctx.waitUntil(sendReservationEmails(reservation, env));
        return json({ success: true, reservation }, 201);
      }

      if (path.match(/^\/api\/reservations\/\d+$/) && method === 'PUT') {
        if (!(await requireAuth(request, env))) return error('Unauthorized', 401);
        const id = path.split('/').pop();
        const data = await request.json();
        const status = ['pending', 'confirmed', 'cancelled'].includes(data.status) ? data.status : 'pending';

        await env.DB.prepare('UPDATE reservations SET status = ?, message = ? WHERE id = ?')
          .bind(status, str(data.message, 2000), id).run();
        const { results } = await env.DB.prepare('SELECT * FROM reservations WHERE id = ?').bind(id).all();
        return json({ success: true, reservation: results[0] });
      }

      if (path.match(/^\/api\/reservations\/\d+\/cancel$/) && method === 'POST') {
        if (!(await requireAuth(request, env))) return error('Unauthorized', 401);
        const id = path.split('/')[3];

        const { results } = await env.DB.prepare('SELECT * FROM reservations WHERE id = ?').bind(id).all();
        const reservation = results[0];
        if (!reservation) return error('Reservation not found', 404);

        await env.DB.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").bind(id).run();
        ctx.waitUntil(sendCancellationEmail(reservation, env));
        return json({ success: true, message: 'Reservation cancelled' });
      }

      if (path.match(/^\/api\/reservations\/\d+$/) && method === 'DELETE') {
        if (!(await requireAuth(request, env))) return error('Unauthorized', 401);
        await env.DB.prepare('DELETE FROM reservations WHERE id = ?').bind(path.split('/').pop()).run();
        return json({ success: true, message: 'Reservation deleted' });
      }

      // === INQUIRIES ===
      if (path === '/api/inquiries' && method === 'GET') {
        if (!(await requireAuth(request, env))) return error('Unauthorized', 401);
        const { results } = await env.DB.prepare('SELECT * FROM inquiries ORDER BY createdAt DESC LIMIT 200').all();
        return json(results);
      }

      if (path === '/api/inquiries' && method === 'POST') {
        const data = await request.json();

        const type = ['contact', 'apartment', 'office'].includes(data.type) ? data.type : null;
        const name = str(data.name, 120);
        const email = str(data.email, 200);
        if (!type || !name || !email || !EMAIL_RE.test(email)) {
          return error('Vyplňte prosím všechna povinná pole');
        }

        const result = await env.DB.prepare(`
          INSERT INTO inquiries (type, name, email, phone, service, itemName, message)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          type, name, email, str(data.phone, 40),
          str(data.service, 200), str(data.itemName, 200), str(data.message, 2000)
        ).run();

        const { results } = await env.DB.prepare('SELECT * FROM inquiries WHERE id = ?')
          .bind(result.meta.last_row_id).all();
        ctx.waitUntil(sendInquiryEmails(results[0], env));
        return json({ success: true, inquiry: results[0] }, 201);
      }

      // === PROPERTIES - veřejné ===
      if (path === '/api/properties' && method === 'GET') {
        const type = url.searchParams.get('type');
        let query = 'SELECT * FROM properties WHERE published = 1';
        const binds = [];
        if (type === 'apartment' || type === 'office') {
          query += ' AND type = ?';
          binds.push(type);
        }
        query += ' ORDER BY sortOrder ASC, id ASC';
        const { results } = await env.DB.prepare(query).bind(...binds).all();
        return json({ success: true, properties: results.map(propertyFromRow) });
      }

      // === PROPERTIES - admin ===
      if (path === '/api/admin/properties' && method === 'GET') {
        if (!(await requireAuth(request, env))) return error('Unauthorized', 401);
        const { results } = await env.DB.prepare(
          'SELECT * FROM properties ORDER BY type ASC, sortOrder ASC, id ASC'
        ).all();
        return json({ success: true, properties: results.map(propertyFromRow) });
      }

      if (path === '/api/admin/properties' && method === 'POST') {
        if (!(await requireAuth(request, env))) return error('Unauthorized', 401);
        const { error: validationError, values } = validatePropertyInput(await request.json());
        if (validationError) return error(validationError);

        const result = await env.DB.prepare(`
          INSERT INTO properties (type, title, building, location, size, capacity, price, utilities, deposit, vatNote, description, features, images, available, published, sortOrder)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          values.type, values.title, values.building, values.location, values.size,
          values.capacity, values.price, values.utilities, values.deposit, values.vatNote,
          values.description, values.features, values.images, values.available,
          values.published, values.sortOrder
        ).run();

        const { results } = await env.DB.prepare('SELECT * FROM properties WHERE id = ?')
          .bind(result.meta.last_row_id).all();
        return json({ success: true, property: propertyFromRow(results[0]) }, 201);
      }

      if (path.match(/^\/api\/admin\/properties\/\d+$/) && method === 'PUT') {
        if (!(await requireAuth(request, env))) return error('Unauthorized', 401);
        const id = path.split('/').pop();

        const { results: existing } = await env.DB.prepare('SELECT id FROM properties WHERE id = ?').bind(id).all();
        if (!existing[0]) return error('Nemovitost nenalezena', 404);

        const { error: validationError, values } = validatePropertyInput(await request.json());
        if (validationError) return error(validationError);

        await env.DB.prepare(`
          UPDATE properties SET
            type = ?, title = ?, building = ?, location = ?, size = ?, capacity = ?,
            price = ?, utilities = ?, deposit = ?, vatNote = ?, description = ?,
            features = ?, images = ?, available = ?, published = ?, sortOrder = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          values.type, values.title, values.building, values.location, values.size,
          values.capacity, values.price, values.utilities, values.deposit, values.vatNote,
          values.description, values.features, values.images, values.available,
          values.published, values.sortOrder, id
        ).run();

        const { results } = await env.DB.prepare('SELECT * FROM properties WHERE id = ?').bind(id).all();
        return json({ success: true, property: propertyFromRow(results[0]) });
      }

      if (path.match(/^\/api\/admin\/properties\/\d+$/) && method === 'DELETE') {
        if (!(await requireAuth(request, env))) return error('Unauthorized', 401);
        const id = path.split('/').pop();

        const { results } = await env.DB.prepare('SELECT images FROM properties WHERE id = ?').bind(id).all();
        if (!results[0]) return error('Nemovitost nenalezena', 404);

        // smazat i nahrané fotky z R2 (statické fotky webu se nemažou)
        if (env.IMAGES) {
          const keys = safeJsonArray(results[0].images)
            .filter(img => img.startsWith('/api/images/'))
            .map(img => img.replace('/api/images/', ''));
          ctx.waitUntil(Promise.all(keys.map(key => env.IMAGES.delete(key).catch(() => {}))));
        }

        await env.DB.prepare('DELETE FROM properties WHERE id = ?').bind(id).run();
        return json({ success: true, message: 'Nemovitost smazána' });
      }

      // === OBRÁZKY (R2) ===
      if (path === '/api/admin/images' && method === 'POST') {
        if (!(await requireAuth(request, env))) return error('Unauthorized', 401);
        if (!env.IMAGES) return error('R2 bucket není nakonfigurován', 500);

        const contentType = request.headers.get('Content-Type') || '';
        const allowedTypes = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
        const ext = allowedTypes[contentType.split(';')[0].trim()];
        if (!ext) return error('Nepodporovaný formát obrázku (povolené: JPEG, PNG, WebP)');

        const body = await request.arrayBuffer();
        if (body.byteLength === 0) return error('Prázdný soubor');
        if (body.byteLength > 5 * 1024 * 1024) return error('Obrázek je příliš velký (max 5 MB)');

        const key = `prop_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
        await env.IMAGES.put(key, body, { httpMetadata: { contentType } });
        return json({ success: true, path: `/api/images/${key}` }, 201);
      }

      if (path.match(/^\/api\/admin\/images\/[\w.-]+$/) && method === 'DELETE') {
        if (!(await requireAuth(request, env))) return error('Unauthorized', 401);
        if (!env.IMAGES) return error('R2 bucket není nakonfigurován', 500);
        await env.IMAGES.delete(path.split('/').pop());
        return json({ success: true });
      }

      if (path.match(/^\/api\/images\/[\w.-]+$/) && method === 'GET') {
        if (!env.IMAGES) return error('R2 bucket není nakonfigurován', 500);
        const object = await env.IMAGES.get(path.split('/').pop());
        if (!object) return error('Obrázek nenalezen', 404);
        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            ...cors,
          },
        });
      }

      return error('Not Found', 404);
    } catch (err) {
      console.error('Worker error:', err);
      return json({ success: false, error: 'Internal Server Error' }, 500);
    }
  },
};
