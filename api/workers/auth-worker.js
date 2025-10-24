/**
 * Autentizace pro Cloudflare Workers
 * Používá Web Crypto API místo bcrypt
 */

import { jsonResponse, errorResponse } from './cors.js';

// Web Crypto API hash funkce (nahrazuje bcrypt)
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

// JWT signing (Web Crypto API)
async function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const encoder = new TextEncoder();
  const headerBase64 = btoa(JSON.stringify(header));
  const payloadBase64 = btoa(JSON.stringify(payload));
  const data = `${headerBase64}.${payloadBase64}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${data}.${signatureBase64}`;
}

export async function handleAuth(request) {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { username, password } = await request.json();
    const env = request.env;

    // Ověření credentials
    if (username !== env.ADMIN_USERNAME) {
      return errorResponse('Invalid credentials', 401);
    }

    // Pro Cloudflare používáme jednodušší hash
    // V production byste měli použít složitější metodu
    const salt = 'pricna-salt-2025'; // V produkci použijte náhodný salt z env
    const isValid = await verifyPassword(password, env.ADMIN_PASSWORD_HASH, salt);

    if (!isValid) {
      return errorResponse('Invalid credentials', 401);
    }

    // Vytvoření JWT
    const payload = {
      username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hodin
    };

    const token = await signJWT(payload, env.JWT_SECRET);

    return jsonResponse({
      success: true,
      token,
      user: { username }
    });

  } catch (error) {
    return errorResponse('Login failed: ' + error.message, 500);
  }
}

// Middleware pro ověření JWT
export async function verifyJWT(token, secret) {
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
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(data)
    );
    
    if (!isValid) return null;
    
    const payload = JSON.parse(atob(payloadBase64));
    
    // Kontrola expirace
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}
