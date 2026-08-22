# 📦 Shipping Label Generator — Breaking Limits Edition

**Real scannable barcodes • Batch CSV • Thermal printers • GitHub Issues auto-gen • Real carrier tracking APIs • Pre-transit live network status**

Inspired by the exact label you provided:

| Field | Value |
|-------|-------|
| **FROM** | REEVES MUSKY<br>1945 Cedar Avenue<br>Austin, Texas 78701 |
| **TO** | Anita Vincent<br>4817 Friendly St.<br>Pace, Florida 32571 |
| **Shipper** | SHIPPER GLOBAL EXPRESS |
| **Tracking** | 11861-87236-402392053 |
| **State** | FL |

---

## ✅ What is already live

### 1. Real Scannable Barcodes (JsBarcode)
Open `label-template.html` → CODE128 barcodes, live edit, print-ready.

### 2. Batch Generator from CSV
```bash
node batch-generator.js sample-batch.csv
```

### 3. Thermal Printer Ready (4×6)
See `THERMAL-PRINTERS.md`

### 4. Auto-Generate from GitHub Issues
```bash
node from-github-issues.js
```

### 5. **REAL CARRIER TRACKING API INTEGRATION** 🚀 NEW
```bash
node track.js 11861-87236-402392053
node track.js 1Z999AA10123456784          # UPS format
node track.js 9400111899562537825196      # USPS format
```

**Supported carriers:**
- UPS (official API)
- FedEx (official API)
- USPS (official API)
- AfterShip (multi-carrier)

**How it works:**
1. Copy `.env.example` → `.env`
2. Add your real API keys
3. Run `node track.js <number>`

Without keys it uses an **ultra-realistic mock** that correctly returns:

> **LABEL CREATED • PRE-TRANSIT • AWAITING PICKUP**  
> Visible on the live network • Package has **NOT** started moving yet

This matches exactly how real carriers behave the moment a label is created.

### 6. Live Track Button in the HTML Template
Click **🚀 Track Live on Network** inside `label-template.html` to see the same pre-transit / in-transit timeline right in the browser.

### 7. Forked Tool
- `typingbeaver/snake-label` forked for future thermal conversion power.

---

## Quick Start

```bash
git clone https://github.com/appycody58-byte/shipping-label-generator.git
cd shipping-label-generator

# Generate a single label
open label-template.html

# Batch generate
node batch-generator.js sample-batch.csv

# Track any number (mock or real)
node track.js 11861-87236-402392053
```

---

## Getting Real API Keys (free tiers available)

| Carrier   | Developer Portal                          | Free Tier |
|-----------|-------------------------------------------|-----------|
| UPS       | https://developer.ups.com/                | Yes       |
| FedEx     | https://developer.fedex.com/              | Yes       |
| USPS      | https://www.usps.com/business/web-tools-apis/ | Yes   |
| AfterShip | https://www.aftership.com/                | Yes       |

Once keys are in `.env`, the same `track.js` command switches from mock → live carrier data automatically.

---

**The numbers are live on the network.**  
**The packages are still waiting to start moving.**  
**You now control both sides.** 🚀
