/**
 * Inquiries handler pro Cloudflare Workers
 */

import { jsonResponse, errorResponse } from './cors.js';
import { verifyJWT } from './auth-worker.js';
import { sendInquiryEmails } from './email-worker.js';

async function requireAuth(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, request.env.JWT_SECRET);
  return payload;
}

export async function handleInquiries(request) {
  const env = request.env;
  const db = env.DB;

  // GET /api/inquiries - Seznam poptávek (vyžaduje auth)
  if (request.method === 'GET') {
    const user = await requireAuth(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    try {
      const { results } = await db.prepare(
        'SELECT * FROM inquiries ORDER BY createdAt DESC LIMIT 100'
      ).all();

      return jsonResponse(results);
    } catch (error) {
      return errorResponse('Database error: ' + error.message, 500);
    }
  }

  // POST /api/inquiries - Vytvoření nové poptávky
  if (request.method === 'POST') {
    try {
      const data = await request.json();
      
      // Validace
      if (!data.type || !data.name || !data.email) {
        return errorResponse('Missing required fields', 400);
      }

      // Vložení do databáze
      const result = await db.prepare(`
        INSERT INTO inquiries (type, name, email, phone, service, itemName, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.type,
        data.name,
        data.email,
        data.phone || null,
        data.service || null,
        data.itemName || null,
        data.message || null
      ).run();

      const inquiryId = result.meta.last_row_id;

      // Načtení vytvořené poptávky
      const { results } = await db.prepare(
        'SELECT * FROM inquiries WHERE id = ?'
      ).bind(inquiryId).all();

      const inquiry = results[0];

      // Odeslání emailů (async)
      try {
        await sendInquiryEmails(inquiry, env);
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Pokračujeme i když email selže
      }

      return jsonResponse({
        success: true,
        inquiry
      }, 201);

    } catch (error) {
      return errorResponse('Failed to create inquiry: ' + error.message, 500);
    }
  }

  return errorResponse('Method not allowed', 405);
}
