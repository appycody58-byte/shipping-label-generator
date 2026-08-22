// Shipping Label Generator - Breaking Limits Edition
// Usage: node generate-label.js

const fs = require('fs');

const sample = {
  from: {
    name: "REEVES MUSKY",
    street: "1945 Cedar Avenue",
    city: "Austin, Texas 78701"
  },
  to: {
    name: "Anita Vincent",
    street: "4817 Friendly St.",
    city: "Pace, Florida 32571"
  },
  shipper: "SHIPPER GLOBAL EXPRESS",
  tracking: "11861-87236-402392053",
  state: "FL"
};

function generateHTML(data) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Shipping Label - ${data.tracking}</title>
  <style>
    body { font-family: Arial; margin: 20px; }
    .label { width: 400px; border: 2px solid #000; padding: 10px; }
    .from, .to { margin-bottom: 15px; }
    .state { font-size: 48px; font-weight: bold; border: 2px solid #000; display: inline-block; padding: 5px 15px; }
    .barcode { font-family: monospace; font-size: 24px; letter-spacing: 3px; }
  </style>
</head>
<body>
  <div class="label">
    <div class="from"><strong>FROM:</strong><br>${data.from.name}<br>${data.from.street}<br>${data.from.city}</div>
    <div><strong>SHIPPER:</strong> ${data.shipper}</div>
    <hr>
    <div class="to"><strong>TO:</strong><br>${data.to.name}<br>${data.to.street}<br>${data.to.city}</div>
    <div class="state">${data.state}</div>
    <div class="barcode">*${data.tracking}*</div>
    <div>${data.tracking}</div>
  </div>
</body>
</html>`;
}

const html = generateHTML(sample);
fs.writeFileSync('generated-label.html', html);
console.log('\n✅ Label generated: generated-label.html');
console.log('Open it in browser or print it!');
console.log('\nTracking:', sample.tracking);
console.log('From:', sample.from.name, '->', sample.to.name);
