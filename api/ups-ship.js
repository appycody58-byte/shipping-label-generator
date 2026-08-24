// POST /api/ups-ship
// Body: { from, to, parcel, service_code }

import { getUpsToken, upsHeaders } from './ups-token.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { from = {}, to = {}, parcel = {}, service_code = '03' } = body;

    const account = process.env.UPS_ACCOUNT_NUMBER;
    if (!account) {
      return res.status(400).json({
        error: 'UPS_ACCOUNT_NUMBER required to purchase labels',
        hint: 'Add your UPS shipper account number in environment variables'
      });
    }

    const { token, base } = await getUpsToken();
    const weightOz = Number(parcel.weight) || 16;
    const weightLbs = Math.max(0.1, weightOz / 16);

    const shipRequest = {
      ShipmentRequest: {
        Request: {
          SubVersion: '1801',
          RequestOption: 'nonvalidate',
          TransactionReference: { CustomerContext: 'GlobalExpress' }
        },
        Shipment: {
          Description: 'Package',
          Shipper: {
            Name: from.name || 'Shipper',
            AttentionName: from.name || 'Shipper',
            ShipperNumber: account,
            Phone: { Number: (from.phone || '0000000000').replace(/\D/g, '').slice(0, 15) },
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
            AttentionName: to.name || 'Recipient',
            Phone: { Number: (to.phone || '0000000000').replace(/\D/g, '').slice(0, 15) },
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
            AttentionName: from.name || 'Shipper',
            Phone: { Number: (from.phone || '0000000000').replace(/\D/g, '').slice(0, 15) },
            Address: {
              AddressLine: [from.street || from.street1 || ''],
              City: from.city,
              StateProvinceCode: from.state,
              PostalCode: from.zip,
              CountryCode: (from.country || 'US').slice(0, 2).toUpperCase()
            }
          },
          PaymentInformation: {
            ShipmentCharge: {
              Type: '01',
              BillShipper: { AccountNumber: account }
            }
          },
          Service: {
            Code: String(service_code),
            Description: 'UPS'
          },
          Package: {
            Description: 'Package',
            Packaging: { Code: '02', Description: 'Package' },
            Dimensions: {
              UnitOfMeasurement: { Code: 'IN', Description: 'Inches' },
              Length: String(parcel.length || 10),
              Width: String(parcel.width || 8),
              Height: String(parcel.height || 4)
            },
            PackageWeight: {
              UnitOfMeasurement: { Code: 'LBS', Description: 'Pounds' },
              Weight: weightLbs.toFixed(1)
            }
          }
        },
        LabelSpecification: {
          LabelImageFormat: { Code: 'GIF', Description: 'GIF' },
          HTTPUserAgent: 'Mozilla/5.0'
        }
      }
    };

    const url = `${base}/api/shipments/v2409/ship`;
    const r = await fetch(url, {
      method: 'POST',
      headers: upsHeaders(token),
      body: JSON.stringify(shipRequest)
    });

    const data = await r.json();
    if (!r.ok) {
      const msg =
        data?.response?.errors?.[0]?.message ||
        data?.ShipmentResponse?.Response?.Error?.Description ||
        'UPS ship failed';
      return res.status(r.status).json({ error: msg, details: data });
    }

    const results = data?.ShipmentResponse?.ShipmentResults || {};
    const pkgResults = results.PackageResults;
    const pkg = Array.isArray(pkgResults) ? pkgResults[0] : pkgResults;
    const tracking =
      pkg?.TrackingNumber ||
      results.ShipmentIdentificationNumber ||
      null;
    const graphic = pkg?.ShippingLabel?.GraphicImage || null;
    const charges =
      results.ShipmentCharges?.TotalCharges?.MonetaryValue ||
      results.ShipmentCharges?.TransportationCharges?.MonetaryValue ||
      null;
    const currency =
      results.ShipmentCharges?.TotalCharges?.CurrencyCode || 'USD';

    return res.status(200).json({
      tracking_code: tracking,
      carrier: 'UPS',
      service_code,
      rate: charges,
      currency,
      // UPS returns base64 GIF — data URL for browser display/print
      label_gif_base64: graphic,
      label_data_url: graphic ? `data:image/gif;base64,${graphic}` : null,
      shipment_id: results.ShipmentIdentificationNumber || null,
      source: 'UPS',
      mode: process.env.UPS_ENV === 'production' ? 'production' : 'cie'
    });
  } catch (e) {
    if (e.code === 'NO_CREDENTIALS') {
      return res.status(503).json({
        error: 'UPS credentials not configured',
        hint: 'Set UPS_CLIENT_ID, UPS_CLIENT_SECRET, UPS_ACCOUNT_NUMBER'
      });
    }
    console.error('ups-ship', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
