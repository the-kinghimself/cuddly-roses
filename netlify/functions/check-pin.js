// Netlify Function: verifies the PIN server-side.
// Set env var LOCK_PIN in Netlify → Site configuration → Environment variables.
// The actual PIN never ships to the browser.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ ok: false }) };

  try {
    const { pin } = JSON.parse(event.body || '{}');
    const correctPin = process.env.LOCK_PIN;
    if (!correctPin) return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: 'not configured' }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: typeof pin === 'string' && pin === correctPin }) };
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok: false }) };
  }
};