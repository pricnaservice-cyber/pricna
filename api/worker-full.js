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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5f8d;">✅ Potvrzení rezervace</h2>
      <p>Dobrý den <strong>${reservation.name}</strong>,</p>
      <p>Děkujeme za Vaši rezervaci sdílené kanceláře.</p>
      
      <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0;">📅 Detaily rezervace</h3>
        <p><strong>Datum:</strong> ${reservation.date}</p>
        <p><strong>Čas:</strong> ${reservation.time}</p>
        <p><strong>Délka:</strong> ${reservation.duration} ${reservation.duration === 1 ? 'hodina' : 'hodiny'}</p>
        <p><strong>Cena:</strong> ${reservation.totalPrice} Kč</p>
      </div>
      
      <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
        <h4 style="margin-top: 0;">ℹ️ Změna nebo zrušení rezervace</h4>
        <p style="margin: 0;">Pro změnu nebo zrušení rezervace nás prosím kontaktujte telefonicky na čísle <strong>+420 608 429 100</strong>.</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p><strong>📍 Adresa:</strong> Příčná 1, 736 01 Havířov - Město</p>
        <p><strong>📞 Telefon:</strong> +420 608 429 100</p>
        <p><strong>🕐 Otevírací doba:</strong> Po-Pá: 7:00 - 19:00</p>
      </div>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Těšíme se na Vaši návštěvu!<br>
        <strong>Tým Příčná Offices</strong>
      </p>
    </div>
  `;
  
  await sendEmail(env, reservation.email, 'Potvrzení rezervace - Příčná Offices', confirmationHtml, env.EMAIL_RESERVATIONS);
  
  const notificationHtml = `
    <h2>🔔 Nová rezervace #${reservation.id}</h2>
    <p><strong>Jméno:</strong> ${reservation.name}</p>
    <p><strong>Email:</strong> ${reservation.email}</p>
    <p><strong>Telefon:</strong> ${reservation.phone || 'N/A'}</p>
    <p><strong>Datum:</strong> ${reservation.date}</p>
    <p><strong>Čas:</strong> ${reservation.time}</p>
    <p><strong>Cena:</strong> ${reservation.totalPrice} Kč</p>
  `;
  
  await sendEmail(env, [env.EMAIL_RESERVATIONS, env.EMAIL_OWNER], `Nová rezervace #${reservation.id}`, notificationHtml, env.EMAIL_RESERVATIONS);
}

async function sendCancellationEmail(reservation, env) {
  const cancellationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545;">❌ Zrušení rezervace</h2>
      <p>Dobrý den <strong>${reservation.name}</strong>,</p>
      <p>Vaše rezervace sdílené kanceláře byla zrušena.</p>
      
      <div style="background: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc3545;">
        <h3 style="margin-top: 0;">📅 Zrušená rezervace</h3>
        <p><strong>Datum:</strong> ${reservation.date}</p>
        <p><strong>Čas:</strong> ${reservation.time}</p>
        <p><strong>Cena:</strong> ${reservation.totalPrice} Kč</p>
      </div>
      
      <p>Pokud jste tuto rezervaci nezrušili Vy, nebo máte dotazy, kontaktujte nás prosím na:</p>
      <p><strong>📞 Telefon:</strong> +420 608 429 100</p>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Budeme se těšit na Vaši další návštěvu!<br>
        <strong>Tým Příčná Offices</strong>
      </p>
    </div>
  `;
  
  await sendEmail(env, reservation.email, 'Zrušení rezervace - Příčná Offices', cancellationHtml, env.EMAIL_RESERVATIONS);
}

async function sendInquiryEmails(inquiry, env) {
  const confirmationHtml = `
    <h2>✉️ Děkujeme za Váš zájem</h2>
    <p>Dobrý den <strong>${inquiry.name}</strong>,</p>
    <p>Děkujeme za Vaši zprávu. Brzy se Vám ozveme.</p>
    <p><strong>📞 Telefon:</strong> +420 608 429 100</p>
  `;
  
  await sendEmail(env, inquiry.email, 'Děkujeme za Váš zájem - Příčná Offices', confirmationHtml, env.EMAIL_INFO);
  
  const typeLabels = { 'contact': 'Kontaktní formulář', 'apartment': 'Poptávka - Byt', 'office': 'Poptávka - Kancelář' };
  const notificationHtml = `
    <h2>${typeLabels[inquiry.type]}</h2>
    <p><strong>Jméno:</strong> ${inquiry.name}</p>
    <p><strong>Email:</strong> ${inquiry.email}</p>
    <p><strong>Telefon:</strong> ${inquiry.phone || 'N/A'}</p>
    <p><strong>Zpráva:</strong> ${inquiry.message || 'N/A'}</p>
  `;
  
  await sendEmail(env, [env.EMAIL_INFO, env.EMAIL_OWNER], `${typeLabels[inquiry.type]} - ${inquiry.name}`, notificationHtml, env.EMAIL_INFO);
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
