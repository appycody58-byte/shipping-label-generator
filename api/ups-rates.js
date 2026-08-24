// POST /api/ups-rates
// Body: { from, to, parcel }

import { getUpsToken, upsHeaders } from './ups-token.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { from = {}, to = {}, parcel = {} } = body;

    const account = process.env.UPS_ACCOUNT_NUMBER || '';
    const { token, base } = await getUpsToken();

    const weightOz = Number(parcel.weight) || 16;
    const weightLbs = Math.max(0.1, weightOz / 16);

    const rateRequest = {
      RateRequest: {
        Request: {
          TransactionReference: { CustomerContext: 'GlobalExpress' }
        },
        Shipment: {
          Shipper: {
            Name: from.name || 'Shipper',
            ShipperNumber: account || undefined,
            Address: {
              AddressLine: [from.street || from.street1 || ''],
              City: from.city,
              StateProvinceCode: from.state,
              PostalCode: from.zip,
              CountryCode: (from.country || 'US').slice(0, 2).toUpperCase()
            }
          },
          ShipTo: {
            Name: to.name || 'Recipient',
            Address: {
              AddressLine: [to.street || to.street1 || ''],
              City: to.city,
              StateProvinceCode: to.state,
              PostalCode: to.zip,
              CountryCode: (to.country || 'US').slice(0, 2).toUpperCase()
            }
          },
          ShipFrom: {
            Name: from.name || 'Shipper',
            Address: {
              AddressLine: [from.street || from.street1 || ''],
              City: from.city,
              StateProvinceCode: from.state,
              PostalCode: from.zip,
              CountryCode: (from.country || 'US').slice(0, 2).toUpperCase()
            }
          },
          Package: {
            PackagingType: { Code: '02', Description: 'Package' },
            Dimensions: {
              UnitOfMeasurement: { Code: 'IN' },
              Length: String(parcel.length || 10),
              Width: String(parcel.width || 8),
              Height: String(parcel.height || 4)
            },
            PackageWeight: {
              UnitOfMeasurement: { Code: 'LBS' },
              Weight: weightLbs.toFixed(1)
            }
          }
        }
      }
    };

    // Shop = all available services
    const url = `${base}/api/rating/v2409/Shop`;
    const r = await fetch(url, {
      method: 'POST',
      headers: upsHeaders(token),
      body: JSON.stringify(rateRequest)
    });

    const data = await r.json();
    if (!r.ok) {
      const msg =
        data?.response?.errors?.[0]?.message ||
        data?.RateResponse?.Response?.Error?.Description ||
        'UPS rating failed';
      return res.status(r.status).json({ error: msg, details: data });
    }

    let rated =
      data?.RateResponse?.RatedShipment ||
      data?.RateResponse?.RatedShipment ||
      [];
    if (!Array.isArray(rated)) rated = rated ? [rated] : [];

    const rates = rated.map((s, i) => {
      const service = s.Service || {};
      const total =
        s.TotalCharges?.MonetaryValue ||
        s.NegotiatedRateCharges?.TotalCharge?.MonetaryValue ||
        s.TransportationCharges?.MonetaryValue ||
        '0';
      const currency =
        s.TotalCharges?.CurrencyCode ||
        s.TransportationCharges?.CurrencyCode ||
        'USD';
      const code = service.Code || String(i);
      return {
        id: `ups_${code}`,
        carrier: 'UPS',
        service: service.Description || serviceCodeName(code),
        service_code: code,
        rate: total,
        currency,
        delivery_days: s.GuaranteedDelivery?.BusinessDaysInTransit
          ? Number(s.GuaranteedDelivery.BusinessDaysInTransit)
          : null,
        source: 'UPS'
      };
    }).sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

    return res.status(200).json({
      rates,
      source: 'UPS',
      account_linked: Boolean(account)
    });
  } catch (e) {
    if (e.code === 'NO_CREDENTIALS') {
      return res.status(503).json({
        error: 'UPS credentials not configured',
        hint: 'Set UPS_CLIENT_ID, UPS_CLIENT_SECRET, and UPS_ACCOUNT_NUMBER in Vercel env'
      });
    }
    console.error('ups-rates', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}

function serviceCodeName(code) {
  const map = {
    '01': 'UPS Next Day Air',
    '02': 'UPS 2nd Day Air',
    '03': 'UPS Ground',
    '12': 'UPS 3 Day Select',
    '13': 'UPS Next Day Air Saver',
    '14': 'UPS Next Day Air Early',
    '59': 'UPS 2nd Day Air A.M.',
    '07': 'UPS Worldwide Express',
    '08': 'UPS Worldwide Expedited',
    '11': 'UPS Standard',
    '54': 'UPS Worldwide Express Plus',
    '65': 'UPS Saver'
  };
  return map[code] || `UPS Service ${code}`;
}
