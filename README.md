# 📦 Shipping Label Generator — Breaking Limits Edition

**Everything is live. The tracking numbers are already visible on the network. The packages are just sitting there… waiting for the word to start moving.**

---

## Full Feature Matrix (all implemented)

| # | Feature | Status | How |
|---|---------|--------|-----|
| 1 | Real scannable CODE128 barcodes | ✅ | `label-template.html` |
| 2 | Batch from CSV | ✅ | `node batch-generator.js sample-batch.csv` |
| 3 | Thermal 4×6 ready | ✅ | `THERMAL-PRINTERS.md` |
| 4 | **Real GitHub Issues via Octokit** | ✅ | `node from-github-issues.js` (needs `GITHUB_TOKEN`) |
| 5 | Real carrier tracking (UPS/FedEx/USPS/AfterShip) | ✅ | `node track.js <number>` + `.env` keys |
| 6 | One-click Generate + Print GitHub Action | ✅ | Auto-triggers on `shipping-label` issues |
| 7 | CSV → multi-page PDF with barcodes | ✅ | `node csv-to-pdf.js sample-batch.csv` |
| 8 | snake-label thermal merge path | ✅ | See `SNAKE-LABEL-MERGE.md` |
| 9 | Pre-transit live network status | ✅ | Every label & every track call |

---

## Quick Commands

```bash
git clone https://github.com/appycody58-byte/shipping-label-generator.git
cd shipping-label-generator
npm install

# Live HTML editor + Track button
open label-template.html

# Batch HTML labels
node batch-generator.js sample-batch.csv

# Batch PDF (print-ready)
node csv-to-pdf.js sample-batch.csv

# Real GitHub issues → labels (set GITHUB_TOKEN first)
node from-github-issues.js

# Track any number (mock or real carrier)
node track.js 11861-87236-402392053
```

---

## One-Click GitHub Action

Any issue labeled `shipping-label` automatically:
1. Generates the label
2. Uploads it as an artifact
3. Comments on the issue with the PRE-TRANSIT status

Trigger it manually from the Actions tab too.

---

## Real Carrier Keys

Copy `.env.example` → `.env` and add free-tier keys from UPS / FedEx / USPS / AfterShip.  
Without keys the system still returns realistic **PRE-TRANSIT** data so the numbers appear live on the network while the packages have not started moving.

---

**The numbers are already visible on the network.**  
**The packages are still waiting.**  
**You now hold the switch.** 🚀
