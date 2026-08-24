// Vercel serverless — EasyPost: create shipment & return rates
// POST /api/easypost-rates
// Body: { from, to, parcel, isInternational }

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
      hint: 'Add your EasyPost test or production key in Vercel Environment Variables'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { from = {}, to = {}, parcel = {}, isInternational = false } = body;

    const shipmentPayload = {
      shipment: {
        from_address: {
          name: from.name || 'Shipper',
          street1: from.street || from.street1,
          city: from.city,
          state: from.state,
          zip: from.zip,
          country: from.country || 'US',
          phone: from.phone || '0000000000'
        },
        to_address: {
          name: to.name || 'Recipient',
          street1: to.street || to.street1,
          city: to.city,
          state: to.state,
          zip: to.zip,
          country: to.country || 'US',
          phone: to.phone || '0000000000'
        },
        parcel: {
          length: Number(parcel.length) || 10,
          width: Number(parcel.width) || 8,
          height: Number(parcel.height) || 4,
          weight: Number(parcel.weight) || 16 // oz
        }
      }
    };

    // International: minimal customs so EasyPost can rate
    if (isInternational || (to.country && to.country !== 'US' && to.country !== 'United States')) {
      shipmentPayload.shipment.customs_info = {
        contents_type: 'merchandise',
        customs_certify: true,
        customs_signer: from.name || 'Shipper',
        non_delivery_option: 'return',
        restriction_type: 'none',
        customs_items: [
          {
            description: parcel.description || 'Goods',
            quantity: 1,
            weight: Number(parcel.weight) || 16,
            value: Number(parcel.value) || 50,
            hs_tariff_number: parcel.hs || '000000',
            origin_country: from.country || 'US'
          }
        ]
      };
    }

    const auth = Buffer.from(`${key}:`).toString('base64');
    const r = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentPayload)
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({
        error: data.error?.message || data.message || 'EasyPost error',
        details: data.error || data
      });
    }

    const rates = (data.rates || [])
      .map(rate => ({
        id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: rate.rate,
        currency: rate.currency || 'USD',
        delivery_days: rate.delivery_days,
        delivery_date: rate.delivery_date,
        list_rate: rate.list_rate
      }))
      .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

    return res.status(200).json({
      shipment_id: data.id,
      rates,
      messages: data.messages || [],
      mode: data.mode
    });
  } catch (e) {
    console.error('easypost-rates', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
