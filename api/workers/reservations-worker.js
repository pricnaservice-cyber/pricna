/**
 * Reservations handler pro Cloudflare Workers
 * Používá D1 databázi
 */

import { jsonResponse, errorResponse } from './cors.js';
import { verifyJWT } from './auth-worker.js';
import { sendReservationEmails } from './email-worker.js';

// Pomocná funkce pro ověření autentizace
async function requireAuth(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, request.env.JWT_SECRET);
  return payload;
}

export async function handleReservations(request) {
  const env = request.env;
  const db = env.DB;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const reservationId = pathParts[pathParts.length - 1];

  // GET /api/reservations - Seznam rezervací (vyžaduje auth)
  if (request.method === 'GET' && !reservationId.match(/^\d+$/)) {
    const user = await requireAuth(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    try {
      const { results } = await db.prepare(
        'SELECT * FROM reservations ORDER BY date DESC, time DESC LIMIT 100'
      ).all();

      return jsonResponse(results);
    } catch (error) {
      return errorResponse('Database error: ' + error.message, 500);
    }
  }

  // GET /api/reservations/:id - Detail rezervace (vyžaduje auth)
  if (request.method === 'GET' && reservationId.match(/^\d+$/)) {
    const user = await requireAuth(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    try {
      const { results } = await db.prepare(
        'SELECT * FROM reservations WHERE id = ?'
      ).bind(reservationId).all();

      if (results.length === 0) {
        return errorResponse('Reservation not found', 404);
      }

      return jsonResponse(results[0]);
    } catch (error) {
      return errorResponse('Database error: ' + error.message, 500);
    }
  }

  // POST /api/reservations - Vytvoření nové rezervace
  if (request.method === 'POST') {
    try {
      const data = await request.json();
      
      // Validace
      if (!data.date || !data.timeSlots || !data.name || !data.email) {
        return errorResponse('Missing required fields', 400);
      }

      // Spojení time slots
      const timeSlots = Array.isArray(data.timeSlots) ? data.timeSlots : [data.timeSlots];
      const time = timeSlots.join(', ');
      const duration = timeSlots.length;

      // Vložení do databáze
      const result = await db.prepare(`
        INSERT INTO reservations (date, time, duration, name, email, phone, company, message, totalPrice, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).bind(
        data.date,
        time,
        duration,
        data.name,
        data.email,
        data.phone || null,
        data.company || null,
        data.message || null,
        data.totalPrice || 0
      ).run();

      const reservationId = result.meta.last_row_id;

      // Načtení vytvořené rezervace
      const { results } = await db.prepare(
        'SELECT * FROM reservations WHERE id = ?'
      ).bind(reservationId).all();

      const reservation = results[0];

      // Odeslání emailů (async, nečekáme na dokončení)
      try {
        await sendReservationEmails(reservation, env);
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Pokračujeme i když email selže
      }

      return jsonResponse({
        success: true,
        reservation
      }, 201);

    } catch (error) {
      return errorResponse('Failed to create reservation: ' + error.message, 500);
    }
  }

  // PUT /api/reservations/:id - Aktualizace rezervace (vyžaduje auth)
  if (request.method === 'PUT' && reservationId.match(/^\d+$/)) {
    const user = await requireAuth(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    try {
      const data = await request.json();

      await db.prepare(`
        UPDATE reservations 
        SET status = ?, message = ?
        WHERE id = ?
      `).bind(data.status || 'pending', data.message || null, reservationId).run();

      const { results } = await db.prepare(
        'SELECT * FROM reservations WHERE id = ?'
      ).bind(reservationId).all();

      return jsonResponse({
        success: true,
        reservation: results[0]
      });

    } catch (error) {
      return errorResponse('Failed to update reservation: ' + error.message, 500);
    }
  }

  // DELETE /api/reservations/:id - Smazání rezervace (vyžaduje auth)
  if (request.method === 'DELETE' && reservationId.match(/^\d+$/)) {
    const user = await requireAuth(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    try {
      await db.prepare('DELETE FROM reservations WHERE id = ?').bind(reservationId).run();

      return jsonResponse({
        success: true,
        message: 'Reservation deleted'
      });

    } catch (error) {
      return errorResponse('Failed to delete reservation: ' + error.message, 500);
    }
  }

  return errorResponse('Method not allowed', 405);
}
