// Netlify Function: validates the special occasion PIN.
// Only the PIN is treated as secret here.

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
    const correctPin = process.env.SPECIAL_PIN;

    if (!correctPin) return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: 'not configured' }) };
    if (typeof pin !== 'string' || pin !== correctPin) return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false }) };

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok: false }) };
  }
};
