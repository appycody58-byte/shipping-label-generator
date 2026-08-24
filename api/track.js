// Vercel Serverless — Tracking
// Order: EasyPost → AfterShip → UPS → fallback simulator

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const trackingNumber = (req.query.number || req.query.tracking || '').trim();
  if (!trackingNumber) {
    return res.status(400).json({ error: 'Missing tracking number. Use ?number=XXXX' });
  }

  const clean = trackingNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  let result = null;

  // 1. EasyPost Tracker
  if (process.env.EASYPOST_API_KEY) {
    try {
      const auth = Buffer.from(`${process.env.EASYPOST_API_KEY}:`).toString('base64');
      // Create or retrieve tracker
      const createRes = await fetch('https://api.easypost.com/v2/trackers', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tracker: { tracking_code: clean } })
      });
      let tracker = null;
      if (createRes.ok) {
        tracker = await createRes.json();
      } else {
        // May already exist — list by tracking code
        const listRes = await fetch(
          `https://api.easypost.com/v2/trackers?tracking_code=${encodeURIComponent(clean)}`,
          { headers: { Authorization: `Basic ${auth}` } }
        );
        if (listRes.ok) {
          const list = await listRes.json();
          tracker = list.trackers?.[0] || null;
        }
      }

      if (tracker && tracker.tracking_code) {
        const status = tracker.status || tracker.status_detail || 'unknown';
        const isPre = /pre.?transit|unknown|label/i.test(status);
        result = {
          trackingNumber: tracker.tracking_code,
          carrier: tracker.carrier || 'EasyPost',
          status: status.replace(/_/g, ' '),
          statusDescription: tracker.status_detail || status,
          isPreTransit: isPre,
          events: (tracker.tracking_details || []).slice().reverse().map(d => ({
            title: (d.status || d.message || 'Update').replace(/_/g, ' '),
            desc: d.message || '',
            location: [d.tracking_location?.city, d.tracking_location?.state, d.tracking_location?.country]
              .filter(Boolean).join(', '),
            time: d.datetime ? new Date(d.datetime).toLocaleString() : ''
          })),
          source: 'EasyPost Tracker',
          live: true,
          mode: tracker.mode
        };
      }
    } catch (e) {
      console.error('EasyPost track', e.message);
    }
  }

  // 2. AfterShip
  if (!result && process.env.AFTERSHIP_API_KEY) {
    try {
      const r = await fetch(
        `https://api.aftership.com/tracking/2024-10/trackings?tracking_numbers=${clean}`,
        {
          headers: {
            'as-api-key': process.env.AFTERSHIP_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      if (r.ok) {
        const data = await r.json();
        const t = data?.data?.trackings?.[0];
        if (t) {
          result = {
            trackingNumber,
            carrier: t.slug || 'AfterShip',
            status: t.tag || t.subtag || 'In Transit',
            statusDescription: t.subtag_message || t.tag || '',
            isPreTransit: /pending|info.?received|label/i.test(t.tag || ''),
            events: (t.checkpoints || []).map(c => ({
              title: c.tag || c.message,
              desc: c.message || '',
              location: [c.city, c.state, c.country_name].filter(Boolean).join(', '),
              time: c.checkpoint_time ? new Date(c.checkpoint_time).toLocaleString() : ''
            })),
            source: 'AfterShip Live API',
            live: true
          };
        }
      }
    } catch (e) {
      console.error('AfterShip', e.message);
    }
  }

  // 3. UPS
  if (!result && process.env.UPS_CLIENT_ID && process.env.UPS_CLIENT_SECRET) {
    try {
      const tokenRes = await fetch('https://onlinetools.ups.com/security/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(
            `${process.env.UPS_CLIENT_ID}:${process.env.UPS_CLIENT_SECRET}`
          ).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });
      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        const trackRes = await fetch(
          `https://onlinetools.ups.com/api/track/v1/details/${clean}`,
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              transId: Date.now().toString(),
              transactionSrc: 'shipping-label-generator'
            }
          }
        );
        if (trackRes.ok) {
          const data = await trackRes.json();
          const pkg = data?.trackResponse?.shipment?.[0]?.package?.[0];
          const activities = pkg?.activity || [];
          result = {
            trackingNumber,
            carrier: 'UPS',
            status: activities[0]?.status?.description || 'In Transit',
            statusDescription: activities[0]?.status?.description || '',
            isPreTransit: /label|pre.?transit|created/i.test(activities[0]?.status?.description || ''),
            events: activities.map(a => ({
              title: a.status?.description || a.status?.type,
              desc: a.status?.description || '',
              location: [a.location?.address?.city, a.location?.address?.stateProvince]
                .filter(Boolean).join(', '),
              time: a.date && a.time ? `${a.date} ${a.time}` : ''
            })),
            source: 'UPS Official API',
            live: true
          };
        }
      }
    } catch (e) {
      console.error('UPS', e.message);
    }
  }

  // 4. Fallback — start of route (Label Created)
  if (!result) {
    const now = new Date();
    const created = new Date(now - 12 * 60000);
    const fmt = (d) => d.toLocaleString('en-US', {
      month: 'numeric', day: 'numeric', year: '2-digit',
      hour: 'numeric', minute: '2-digit'
    });
    result = {
      trackingNumber,
      carrier: 'Global Express',
      status: 'Label Created',
      statusDescription: 'Pre-Transit · Awaiting carrier pickup',
      isPreTransit: true,
      events: [
        {
          title: 'Label Created',
          desc: 'Houston, TX US',
          location: 'Houston, TX',
          time: fmt(created),
          state: 'current'
        },
        {
          title: 'Shipment Information Received',
          desc: 'Carrier network',
          location: '',
          time: '',
          state: 'done'
        },
        {
          title: 'Awaiting Pickup',
          desc: 'Houston, TX',
          location: 'Houston, TX',
          time: '',
          state: 'pending'
        },
        {
          title: 'In Transit',
          desc: '',
          location: '',
          time: '',
          state: 'pending'
        },
        {
          title: 'Out for Delivery',
          desc: '',
          location: '',
          time: '',
          state: 'pending'
        },
        {
          title: 'Delivered',
          desc: '',
          location: '',
          time: '',
          state: 'pending'
        }
      ],
      source: 'Simulator (add EASYPOST_API_KEY for live tracking)',
      live: false
    };
  }

  return res.status(200).json(result);
}
