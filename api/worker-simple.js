/**
 * Zjednodušený Cloudflare Worker - všechno v jednom souboru
 */

import { Router } from 'itty-router';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const router = Router();

// CORS preflight
router.options('*', () => new Response(null, { headers: corsHeaders }));

// Health check
router.get('/api/health', () => {
  return new Response(JSON.stringify({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: 'cloudflare-workers'
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
});

// 404
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    try {
      request.env = env;
      return router.handle(request);
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};
