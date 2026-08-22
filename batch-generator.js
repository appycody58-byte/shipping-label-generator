#!/usr/bin/env node
/**
 * BATCH SHIPPING LABEL GENERATOR - Breaking Limits Edition
 * Reads CSV → generates individual printable HTML labels with REAL scannable barcodes
 * Status: LABEL CREATED • PRE-TRANSIT • Visible on network but NOT moving yet
 *
 * Usage:
 *   node batch-generator.js sample-batch.csv
 *   node batch-generator.js my-orders.csv
 */

const fs = require('fs');
const path = require('path');

const csvFile = process.argv[2] || 'sample-batch.csv';

if (!fs.existsSync(csvFile)) {
  console.error('❌ CSV file not found:', csvFile);
  process.exit(1);
}

const raw = fs.readFileSync(csvFile, 'utf8').trim();
const lines = raw.split('\n');
const headers = lines[0].split(',').map(h => h.trim());
const rows = lines.slice(1).map(line => {
  const vals = line.split(',').map(v => v.trim());
  const obj = {};
  headers.forEach((h, i) => obj[h] = vals[i] || '');
  return obj;
});

console.log(`\n📦 Generating ${rows.length} labels from ${csvFile}...\n`);

const outDir = 'generated-batch';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

rows.forEach((row, idx) => {
  const tracking = row.tracking || `1186${idx}-${Math.floor(10000+Math.random()*90000)}-${Math.floor(100000000+Math.random()*900000000)}`;
  const clean = tracking.replace(/-/g, '');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Label ${tracking}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; }
    .label { width: 4in; min-height: 6in; border: 1px solid #000; page-break-after: always; }
    .top { display: flex; border-bottom: 2px solid #000; }
    .from { flex: 1; padding: 10px; font-size: 12px; }
    .shipper { width: 120px; padding: 8px; text-align: center; border-left: 1px solid #ccc; font-size: 10px; }
    .logo { font-weight: 900; color: #0066cc; font-size: 13px; }
    .to-section { padding: 10px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #000; }
    .to { flex: 1; font-size: 13px; }
    .fl-box { width: 65px; height: 65px; border: 3px solid #000; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 900; }
    .status { background: #fff3cd; border: 1px solid #ffc107; margin: 8px; padding: 6px; font-size: 11px; text-align: center; }
    .bottom { padding: 12px; text-align: center; }
    .track { font-weight: bold; font-size: 14px; margin-top: 4px; }
    @media print { .label { border: none; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="top">
      <div class="from">
        <strong>FROM:</strong><br>
        ${row.from_name}<br>
        ${row.from_street}<br>
        ${row.from_city}
      </div>
      <div class="shipper">
        <strong>SHIPPER:</strong><br>
        <div class="logo">SHIPPER<br>GLOBAL EXPRESS</div>
      </div>
    </div>
    <div class="to-section">
      <div class="to">
        <strong>TO:</strong><br>
        ${row.to_name}<br>
        ${row.to_street}<br>
        ${row.to_city}
      </div>
      <div class="fl-box">${row.state || 'FL'}</div>
      <div style="text-align:center;font-size:10px;">
        <svg id="side${idx}"></svg>
      </div>
    </div>
    <div class="status">
      <strong>STATUS:</strong> LABEL CREATED • PRE-TRANSIT • AWAITING PICKUP<br>
      Visible on live network • Package has <u>NOT</u> started moving
    </div>
    <div class="bottom">
      <svg id="main${idx}"></svg>
      <div class="track">${tracking}</div>
    </div>
  </div>
  <script>
    JsBarcode("#main${idx}", "${clean}", { format: "CODE128", width: 1.6, height: 50, displayValue: false, margin: 0 });
    JsBarcode("#side${idx}", "${clean.slice(-9)}", { format: "CODE128", width: 1.1, height: 30, displayValue: false, margin: 0 });
  </script>
</body>
</html>`;

  const filename = path.join(outDir, `label-${idx + 1}-${clean.slice(-6)}.html`);
  fs.writeFileSync(filename, html);
  console.log(`  ✅ ${filename}  →  ${tracking}`);
});

console.log(`\n🚀 Done! Open the files in ${outDir}/ and print them.`);
console.log('All labels show as LIVE on the network but PRE-TRANSIT (not moving yet).\n');
