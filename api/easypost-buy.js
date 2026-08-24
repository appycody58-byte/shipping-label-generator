// Vercel serverless — EasyPost: buy shipment (purchase postage + label)
// POST /api/easypost-buy
// Body: { shipment_id, rate_id }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const key = process.env.EASYPOST_API_KEY;
  if (!key) {
    return res.status(503).json({
      error: 'EASYPOST_API_KEY not configured',
      hint: 'Add EasyPost key in Vercel Environment Variables'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { shipment_id, rate_id } = body;

    if (!shipment_id || !rate_id) {
      return res.status(400).json({ error: 'shipment_id and rate_id required' });
    }

    const auth = Buffer.from(`${key}:`).toString('base64');
    const r = await fetch(`https://api.easypost.com/v2/shipments/${shipment_id}/buy`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rate: { id: rate_id }
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({
        error: data.error?.message || data.message || 'Buy failed',
        details: data.error || data
      });
    }

    const label = data.postage_label || {};
    return res.status(200).json({
      shipment_id: data.id,
      tracking_code: data.tracking_code,
      status: data.status,
      carrier: data.selected_rate?.carrier,
      service: data.selected_rate?.service,
      rate: data.selected_rate?.rate,
      currency: data.selected_rate?.currency || 'USD',
      label_url: label.label_url || label.label_pdf_url || null,
      label_pdf_url: label.label_pdf_url || null,
      label_zpl_url: label.label_zpl_url || null,
      tracker_id: data.tracker?.id || null,
      mode: data.mode
    });
  } catch (e) {
    console.error('easypost-buy', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
