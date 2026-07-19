#!/usr/bin/env node
/**
 * Vygeneruje PBKDF2 hash admin hesla pro ADMIN_PASSWORD_HASH.
 * Použití: node hash-password.mjs VaseSilneHeslo
 */
import { webcrypto as crypto } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Použití: node hash-password.mjs VaseSilneHeslo');
  process.exit(1);
}

const ITERATIONS = 100000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const toHex = bytes => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

const keyMaterial = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
);
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
  keyMaterial,
  256
);

console.log(`pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(new Uint8Array(bits))}`);
