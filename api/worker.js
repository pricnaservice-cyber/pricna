/**
 * Cloudflare Worker pro Příčná Offices API
 * Používá D1 databázi místo SQLite
 */

import { Router } from 'itty-router';
import { handleReservations } from './workers/reservations-worker.js';
import { handleInquiries } from './workers/inquiries-worker.js';
import { handleAuth } from './workers/auth-worker.js';
import { corsHeaders, handleCORS } from './workers/cors.js';

const router = Router();

// CORS preflight
router.options('*', handleCORS);

// Health check
router.get('/api/health', () => {
  return new Response(JSON.stringify({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: 'cloudflare-workers'
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
});

// Auth endpoints
router.post('/api/auth/login', handleAuth);

// Reservations endpoints
router.get('/api/reservations', handleReservations);
router.post('/api/reservations', handleReservations);
router.get('/api/reservations/:id', handleReservations);
router.put('/api/reservations/:id', handleReservations);
router.delete('/api/reservations/:id', handleReservations);

// Inquiries endpoints
router.get('/api/inquiries', handleInquiries);
router.post('/api/inquiries', handleInquiries);

// 404
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    try {
      // Přidání env do requestu pro přístup k D1 a secrets
      request.env = env;
      return router.handle(request);
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
