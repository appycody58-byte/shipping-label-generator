// Shared UPS OAuth client-credentials token
// Used by ups-rates.js and ups-ship.js

export async function getUpsToken() {
  const id = process.env.UPS_CLIENT_ID;
  const secret = process.env.UPS_CLIENT_SECRET;
  if (!id || !secret) {
    const err = new Error('UPS_CLIENT_ID and UPS_CLIENT_SECRET required');
    err.code = 'NO_CREDENTIALS';
    throw err;
  }

  const base =
    process.env.UPS_ENV === 'production'
      ? 'https://onlinetools.ups.com'
      : 'https://wwwcie.ups.com';

  const res = await fetch(`${base}/security/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    const err = new Error(data.response?.errors?.[0]?.message || data.error || 'UPS OAuth failed');
    err.details = data;
    throw err;
  }

  return { token: data.access_token, base };
}

export function upsHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    transId: `ge-${Date.now()}`,
    transactionSrc: 'global-express'
  };
}
