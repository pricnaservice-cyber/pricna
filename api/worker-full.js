/**
 * Příčná Offices API - Cloudflare Worker
 * Kompletní implementace bez externích závislostí
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// === HELPER FUNCTIONS ===

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// === AUTH HELPERS ===

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hashedPassword, salt) {
  const hash = await hashPassword(password, salt);
  return hash === hashedPassword;
}

async function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encoder = new TextEncoder();
  const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadBase64 = btoa(JSON.stringify(payload)).replace(/=/g, '');
  const data = `${headerBase64}.${payloadBase64}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
  return `${data}.${signatureBase64}`;
}

async function verifyJWT(token, secret) {
  try {
    const [headerBase64, payloadBase64, signatureBase64] = token.split('.');
    const data = `${headerBase64}.${payloadBase64}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
    
    if (!isValid) return null;
    
    const payload = JSON.parse(atob(payloadBase64));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch {
    return null;
  }
}

async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return await verifyJWT(token, env.JWT_SECRET);
}

// === EMAIL SERVICE ===

async function sendEmail(env, to, subject, html, from) {
  const apiUrl = 'https://send.api.mailtrap.io/api/send';
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MAILTRAP_PASS}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: { email: from, name: 'Příčná Offices' },
      to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
      subject,
      html
    })
  });

  return response.ok;
}

async function sendReservationEmails(reservation, env) {
  const confirmationHtml = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Email Container -->
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <!-- Header with Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #eabb11 0%, #d4a00f 100%); padding: 40px 30px; text-align: center;">
                  <img src="https://pricna.cz/images/pricna_logo_final.png" alt="Příčná Offices" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">✅ Potvrzení rezervace</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Dobrý den <strong style="color: #eabb11;">${reservation.name}</strong>,
                  </p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                    Děkujeme za Vaši rezervaci sdílené kanceláře. Těšíme se na Vaši návštěvu!
                  </p>
                  
                  <!-- Reservation Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9e7; border-left: 4px solid #eabb11; border-radius: 8px; margin: 0 0 25px;">
                    <tr>
                      <td style="padding: 25px;">
                        <h2 style="color: #333; font-size: 20px; margin: 0 0 20px; font-weight: 600;">📅 Detaily rezervace</h2>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;">
                          <strong style="color: #333;">Datum:</strong> ${reservation.date}
                        </p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;">
                          <strong style="color: #333;">Čas:</strong> ${reservation.time}
                        </p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;">
                          <strong style="color: #333;">Délka:</strong> ${reservation.duration} ${reservation.duration === 1 ? 'hodina' : reservation.duration < 5 ? 'hodiny' : 'hodin'}
                        </p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;">
                          <strong style="color: #333;">Cena:</strong> <span style="color: #eabb11; font-size: 18px; font-weight: 600;">${reservation.totalPrice} Kč</span>
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Payment Info Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4f8; border-left: 4px solid #7a848d; border-radius: 8px; margin: 0 0 25px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #333; font-size: 18px; margin: 0 0 12px; font-weight: 600;">💰 Platba a klíče</h3>
                        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                          Platbu a vyzvednutí klíčů od kanceláře prosím proveďte na recepci na adrese <strong style="color: #7a848d;">Příčná 1, 736 01 Havířov - Město</strong>.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Cancellation Info Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8e6; border-left: 4px solid #eabb11; border-radius: 8px; margin: 0 0 30px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #333; font-size: 18px; margin: 0 0 12px; font-weight: 600;">ℹ️ Změna nebo zrušení</h3>
                        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                          Pro změnu nebo zrušení rezervace nás prosím kontaktujte telefonicky na čísle <strong style="color: #eabb11;">+420 608 429 100</strong>.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Contact Information -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #f0f0f0; padding-top: 25px; margin-top: 25px;">
                    <tr>
                      <td>
                        <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 5px 0;">
                          <strong style="color: #7a848d;">📍 Adresa recepce:</strong> Příčná 1, 736 01 Havířov - Město
                        </p>
                        <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 5px 0;">
                          <strong style="color: #7a848d;">📞 Telefon:</strong> +420 608 429 100
                        </p>
                        <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 5px 0;">
                          <strong style="color: #7a848d;">🕐 Otevírací doba:</strong> Po-Pá: 7:00 - 19:00
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #7a848d; padding: 30px; text-align: center;">
                  <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px; font-weight: 500;">
                    Těšíme se na Vaši návštěvu!
                  </p>
                  <p style="color: #f0f0f0; font-size: 14px; margin: 0;">
                    <strong>Tým Příčná Offices</strong>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  await sendEmail(env, reservation.email, 'Potvrzení rezervace - Sdílená kancelář Příčná', confirmationHtml, 'noreply@pricna.cz');
  
  const notificationHtml = `
    <h2>🔔 Nová rezervace #${reservation.id}</h2>
    <p><strong>Jméno:</strong> ${reservation.name}</p>
    <p><strong>Email:</strong> ${reservation.email}</p>
    <p><strong>Telefon:</strong> ${reservation.phone || 'N/A'}</p>
    <p><strong>Datum:</strong> ${reservation.date}</p>
    <p><strong>Čas:</strong> ${reservation.time}</p>
    <p><strong>Cena:</strong> ${reservation.totalPrice} Kč</p>
  `;
  
  await sendEmail(env, ['j.stachovsky@gmail.com', 'pricna.apartments@gmail.com'], `Nová rezervace #${reservation.id}`, notificationHtml, 'noreply@pricna.cz');
}

async function sendCancellationEmail(reservation, env) {
  const cancellationHtml = `
    <!DOCTYPE html>
    <html lang="cs">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <tr><td style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 30px; text-align: center;">
                  <img src="https://pricna.cz/images/pricna_logo_final.png" alt="Příčná Offices" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">❌ Zrušení rezervace</h1>
                </td></tr>
              <tr><td style="padding: 40px 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Dobrý den <strong style="color: #7a848d;">${reservation.name}</strong>,</p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Vaše rezervace sdílené kanceláře byla zrušena.</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffe6e6; border-left: 4px solid #dc3545; border-radius: 8px; margin: 0 0 30px;">
                    <tr><td style="padding: 25px;">
                        <h2 style="color: #333; font-size: 20px; margin: 0 0 20px; font-weight: 600;">📅 Zrušená rezervace</h2>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Datum:</strong> ${reservation.date}</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Čas:</strong> ${reservation.time}</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Cena:</strong> ${reservation.totalPrice} Kč</p>
                      </td></tr>
                  </table>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px;">Pokud jste tuto rezervaci nezrušili Vy, nebo máte dotazy, kontaktujte nás prosím na:</p>
                  <p style="color: #333; font-size: 16px; margin: 0;"><strong style="color: #eabb11;">📞 +420 608 429 100</strong></p>
                </td></tr>
              <tr><td style="background-color: #7a848d; padding: 30px; text-align: center;">
                  <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px; font-weight: 500;">Budeme se těšit na Vaši další návštěvu!</p>
                  <p style="color: #f0f0f0; font-size: 14px; margin: 0;"><strong>Tým Příčná Offices</strong></p>
                </td></tr>
            </table>
          </td></tr>
      </table>
    </body>
    </html>
  `;
  
  await sendEmail(env, reservation.email, 'Zrušení rezervace - Sdílená kancelář Příčná', cancellationHtml, 'noreply@pricna.cz');
}

async function sendInquiryEmails(inquiry, env) {
  const typeLabels = { 'contact': 'Kontaktní formulář', 'apartment': 'Poptávka - Byt', 'office': 'Poptávka - Kancelář' };
  
  const confirmationHtml = `
    <!DOCTYPE html>
    <html lang="cs">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <tr><td style="background: linear-gradient(135deg, #eabb11 0%, #d4a00f 100%); padding: 40px 30px; text-align: center;">
                  <img src="https://pricna.cz/images/pricna_logo_final.png" alt="Příčná Offices" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">✉️ Děkujeme za Váš zájem</h1>
                </td></tr>
              <tr><td style="padding: 40px 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Dobrý den <strong style="color: #eabb11;">${inquiry.name}</strong>,</p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Děkujeme za Vaši zprávu. Brzy se Vám ozveme a rádi zodpovíme všechny Vaše dotazy.</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9e7; border-left: 4px solid #eabb11; border-radius: 8px; margin: 0 0 30px;">
                    <tr><td style="padding: 25px;">
                        <h2 style="color: #333; font-size: 20px; margin: 0 0 20px; font-weight: 600;">📞 Kontakt</h2>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Telefon:</strong> <span style="color: #eabb11; font-weight: 600;">+420 608 429 100</span></p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Email:</strong> info@pricna.cz</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Adresa:</strong> Příčná 1, 736 01 Havířov - Město</p>
                      </td></tr>
                  </table>
                </td></tr>
              <tr><td style="background-color: #7a848d; padding: 30px; text-align: center;">
                  <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px; font-weight: 500;">Těšíme se na setkání s Vámi!</p>
                  <p style="color: #f0f0f0; font-size: 14px; margin: 0;"><strong>Tým Příčná Offices & Apartments</strong></p>
                </td></tr>
            </table>
          </td></tr>
      </table>
    </body>
    </html>
  `;
  
  await sendEmail(env, inquiry.email, `Děkujeme za Váš zájem - Příčná Offices`, confirmationHtml, 'noreply@pricna.cz');
  
  const notificationHtml = `
    <!DOCTYPE html>
    <html lang="cs">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <tr><td style="background: linear-gradient(135deg, #7a848d 0%, #5a646d 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🔔 ${typeLabels[inquiry.type]}</h1>
                </td></tr>
              <tr><td style="padding: 40px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9e7; border-left: 4px solid #eabb11; border-radius: 8px;">
                    <tr><td style="padding: 25px;">
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Jméno:</strong> ${inquiry.name}</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Email:</strong> ${inquiry.email}</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Telefon:</strong> ${inquiry.phone || 'N/A'}</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 15px 0 8px;"><strong style="color: #333;">Zpráva:</strong></p>
                        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0; padding: 15px; background-color: #ffffff; border-radius: 6px;">${inquiry.message || 'N/A'}</p>
                      </td></tr>
                  </table>
                </td></tr>
            </table>
          </td></tr>
      </table>
    </body>
    </html>
  `;
  
  await sendEmail(env, 'j.stachovsky@gmail.com', `${typeLabels[inquiry.type]} - ${inquiry.name}`, notificationHtml, 'noreply@pricna.cz');
}

// === MAIN WORKER ===

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Health check
      if (path === '/api/health' && method === 'GET') {
        return jsonResponse({
          status: 'OK',
          timestamp: new Date().toISOString(),
          environment: 'cloudflare-workers'
        });
      }
      
      // === AUTH ===
      if (path === '/api/auth/login' && method === 'POST') {
        const { username, password } = await request.json();
        
        if (username !== env.ADMIN_USERNAME) {
          return errorResponse('Invalid credentials', 401);
        }
        
        const salt = 'pricna-salt-2025';
        const isValid = await verifyPassword(password, env.ADMIN_PASSWORD_HASH, salt);
        
        if (!isValid) {
          return errorResponse('Invalid credentials', 401);
        }
        
        const payload = {
          username,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        };
        
        const token = await signJWT(payload, env.JWT_SECRET);
        return jsonResponse({ success: true, token, user: { username } });
      }
      
      // === RESERVATIONS ===
      // Public endpoint for frontend calendar (no auth required)
      if (path === '/api/reservations/public' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT id, date, time, duration, status FROM reservations WHERE status != ? ORDER BY date ASC').bind('cancelled').all();
        return jsonResponse(results);
      }
      
      // Admin endpoint (auth required)
      if (path === '/api/reservations' && method === 'GET') {
        const user = await requireAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        
        const { results } = await env.DB.prepare('SELECT * FROM reservations ORDER BY date DESC, time DESC LIMIT 100').all();
        return jsonResponse(results);
      }
      
      if (path === '/api/reservations' && method === 'POST') {
        const data = await request.json();
        
        if (!data.date || !data.timeSlots || !data.name || !data.email) {
          return errorResponse('Missing required fields', 400);
        }
        
        const timeSlots = Array.isArray(data.timeSlots) ? data.timeSlots : [data.timeSlots];
        const time = timeSlots.join(', ');
        const duration = timeSlots.length;
        
        const result = await env.DB.prepare(`
          INSERT INTO reservations (date, time, duration, name, email, phone, company, message, totalPrice, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(
          data.date, time, duration, data.name, data.email,
          data.phone || null, data.company || null, data.message || null, data.totalPrice || 0
        ).run();
        
        const reservationId = result.meta.last_row_id;
        const { results } = await env.DB.prepare('SELECT * FROM reservations WHERE id = ?').bind(reservationId).all();
        const reservation = results[0];
        
        ctx.waitUntil(sendReservationEmails(reservation, env));
        
        return jsonResponse({ success: true, reservation }, 201);
      }
      
      if (path.match(/^\/api\/reservations\/\d+$/) && method === 'PUT') {
        const user = await requireAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        
        const id = path.split('/').pop();
        const data = await request.json();
        
        await env.DB.prepare('UPDATE reservations SET status = ?, message = ? WHERE id = ?')
          .bind(data.status || 'pending', data.message || null, id).run();
        
        const { results } = await env.DB.prepare('SELECT * FROM reservations WHERE id = ?').bind(id).all();
        return jsonResponse({ success: true, reservation: results[0] });
      }
      
      if (path.match(/^\/api\/reservations\/\d+\/cancel$/) && method === 'POST') {
        const user = await requireAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        
        const id = path.split('/')[3];
        
        // Get reservation details before cancelling
        const { results } = await env.DB.prepare('SELECT * FROM reservations WHERE id = ?').bind(id).all();
        const reservation = results[0];
        
        if (!reservation) {
          return errorResponse('Reservation not found', 404);
        }
        
        // Update status to cancelled
        await env.DB.prepare('UPDATE reservations SET status = ? WHERE id = ?')
          .bind('cancelled', id).run();
        
        // Send cancellation email
        ctx.waitUntil(sendCancellationEmail(reservation, env));
        
        return jsonResponse({ success: true, message: 'Reservation cancelled' });
      }
      
      if (path.match(/^\/api\/reservations\/\d+$/) && method === 'DELETE') {
        const user = await requireAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        
        const id = path.split('/').pop();
        await env.DB.prepare('DELETE FROM reservations WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'Reservation deleted' });
      }
      
      // === INQUIRIES ===
      if (path === '/api/inquiries' && method === 'GET') {
        const user = await requireAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        
        const { results } = await env.DB.prepare('SELECT * FROM inquiries ORDER BY createdAt DESC LIMIT 100').all();
        return jsonResponse(results);
      }
      
      if (path === '/api/inquiries' && method === 'POST') {
        const data = await request.json();
        
        if (!data.type || !data.name || !data.email) {
          return errorResponse('Missing required fields', 400);
        }
        
        const result = await env.DB.prepare(`
          INSERT INTO inquiries (type, name, email, phone, service, itemName, message)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.type, data.name, data.email, data.phone || null,
          data.service || null, data.itemName || null, data.message || null
        ).run();
        
        const inquiryId = result.meta.last_row_id;
        const { results } = await env.DB.prepare('SELECT * FROM inquiries WHERE id = ?').bind(inquiryId).all();
        const inquiry = results[0];
        
        ctx.waitUntil(sendInquiryEmails(inquiry, env));
        
        return jsonResponse({ success: true, inquiry }, 201);
      }
      
      // 404
      return errorResponse('Not Found', 404);
      
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({
        error: 'Internal Server Error',
        message: error.message
      }, 500);
    }
  }
};
