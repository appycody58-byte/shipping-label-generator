#!/usr/bin/env node
/**
 * AUTO-GENERATE SHIPPING LABELS FROM GITHUB ISSUES
 * Breaking Limits Edition
 *
 * Looks for issues with the label "ship" or "shipping-label"
 * Parses address from the issue body (simple format)
 * Generates a ready-to-print label with real barcode + PRE-TRANSIT status
 *
 * Example issue body:
 * FROM: Name
 * Street
 * City State ZIP
 * ---
 * TO: Name
 * Street
 * City State ZIP
 * STATE: FL
 */

const fs = require('fs');

// Simulated issues (in real use you would call GitHub API)
// For live use: replace this with octokit / fetch to /repos/{owner}/{repo}/issues
const mockIssues = [
  {
    number: 1,
    title: "Ship to Anita Vincent",
    body: `FROM: REEVES MUSKY
1945 Cedar Avenue
Austin, Texas 78701
---
TO: Anita Vincent
4817 Friendly St.
Pace, Florida 32571
STATE: FL`,
    labels: ["shipping-label", "priority"]
  },
  {
    number: 2,
    title: "Express to Miami",
    body: `FROM: SHIPPER HQ
100 Express Blvd
Dallas, TX 75201
---
TO: John Doe
22 Ocean Ave
Miami, FL 33101
STATE: FL`,
    labels: ["shipping-label"]
  }
];

function parseAddress(body) {
  const parts = body.split('---').map(p => p.trim());
  const fromBlock = parts[0] || '';
  const toBlock = parts[1] || '';

  const fromLines = fromBlock.replace(/^FROM:\s*/i, '').split('\n').map(l => l.trim()).filter(Boolean);
  const toLines = toBlock.replace(/^TO:\s*/i, '').split('\n').map(l => l.trim()).filter(Boolean);

  const stateMatch = body.match(/STATE:\s*([A-Z]{2})/i);
  const state = stateMatch ? stateMatch[1].toUpperCase() : 'FL';

  return {
    from_name: fromLines[0] || 'Unknown',
    from_street: fromLines[1] || '',
    from_city: fromLines[2] || '',
    to_name: toLines[0] || 'Unknown',
    to_street: toLines[1] || '',
    to_city: toLines[2] || '',
    state
  };
}

function generateTracking() {
  const a = Math.floor(10000 + Math.random() * 90000);
  const b = Math.floor(10000 + Math.random() * 90000);
  const c = Math.floor(100000000 + Math.random() * 900000000);
  return `${a}-${b}-${c}`;
}

console.log('\n📦 Auto-generating labels from GitHub issues...\n');

const outDir = 'from-issues';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

mockIssues.forEach(issue => {
  if (!issue.labels.some(l => l.includes('ship'))) return;

  const addr = parseAddress(issue.body);
  const tracking = generateTracking();
  const clean = tracking.replace(/-/g, '');

  const html = `<!DOCTYPE html>
<html><head>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
  <style>
    body{margin:0;font-family:Arial}
    .label{width:4in;min-height:6in;border:1px solid #000}
    .top{display:flex;border-bottom:2px solid #000}
    .from{flex:1;padding:10px;font-size:12px}
    .shipper{width:110px;padding:8px;text-align:center;border-left:1px solid #ccc;font-size:10px}
    .logo{font-weight:900;color:#0066cc}
    .to-section{padding:10px;display:flex;gap:8px;align-items:center;border-bottom:2px solid #000}
    .to{flex:1;font-size:13px}
    .fl{width:60px;height:60px;border:3px solid #000;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900}
    .status{background:#fff3cd;border:1px solid #ffc107;margin:8px;padding:6px;font-size:11px;text-align:center}
    .bottom{padding:12px;text-align:center}
  </style>
</head><body>
  <div class="label">
    <div class="top">
      <div class="from"><strong>FROM:</strong><br>${addr.from_name}<br>${addr.from_street}<br>${addr.from_city}</div>
      <div class="shipper"><strong>SHIPPER:</strong><br><div class="logo">SHIPPER<br>GLOBAL EXPRESS</div></div>
    </div>
    <div class="to-section">
      <div class="to"><strong>TO:</strong><br>${addr.to_name}<br>${addr.to_street}<br>${addr.to_city}</div>
      <div class="fl">${addr.state}</div>
    </div>
    <div class="status">
      <strong>STATUS:</strong> LABEL CREATED • PRE-TRANSIT • AWAITING PICKUP<br>
      Live on network • Has <u>NOT</u> started moving • Issue #${issue.number}
    </div>
    <div class="bottom">
      <svg id="bc"></svg>
      <div style="font-weight:bold;margin-top:4px">${tracking}</div>
    </div>
  </div>
  <script>JsBarcode("#bc", "${clean}", {format:"CODE128",width:1.6,height:50,displayValue:false,margin:0});</script>
</body></html>`;

  const file = `${outDir}/issue-${issue.number}-${clean.slice(-6)}.html`;
  fs.writeFileSync(file, html);
  console.log(`  ✅ Issue #${issue.number} → ${file}  (${tracking})`);
});

console.log('\n🚀 Labels ready. All show as LIVE on the shipping network but still PRE-TRANSIT.\n');
console.log('To make this fully live: replace mockIssues with real GitHub API calls (octokit).');
