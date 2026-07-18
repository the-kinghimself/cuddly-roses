// Netlify Function: checks the special occasion PIN and returns the letter content.
//
// Set these in Netlify → Site configuration → Environment variables:
//   SPECIAL_PIN           = any 4-digit code you choose (change whenever you want)
//   SPECIAL_LETTER_TITLE  = e.g. "happy birthday, mon cœur 🎂"
//   SPECIAL_LETTER        = your full message (use \n for new lines)

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
    const title      = process.env.SPECIAL_LETTER_TITLE || 'a letter for you 💌';
    const message    = process.env.SPECIAL_LETTER        || '';

    if (!correctPin) return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: 'not configured' }) };
    if (typeof pin !== 'string' || pin !== correctPin) return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false }) };

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, title, message }) };
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok: false }) };
  }
};
