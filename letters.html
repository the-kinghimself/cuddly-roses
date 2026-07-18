exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let pin;
  try {
    ({ pin } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'bad request' }) };
  }

  const correctPin = process.env.LOCK_PIN;

  if (!correctPin) {
    // Misconfiguration on the Netlify side — fail closed, not open.
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'server not configured' }) };
  }

  const match = typeof pin === 'string' && pin === correctPin;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: match })
  };
};
