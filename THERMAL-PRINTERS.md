# Thermal Printer Support 🖨

This project is built for **real thermal label printers** (4×6 inch standard).

## Supported / Tested Concepts
- Brother QL series (QL-500, QL-700, QL-800, QL-820NWB)
- Zebra ZD series / GK420
- Dymo LabelWriter (with 4x6 stock)
- Any printer that accepts 4" × 6" thermal labels

## How to Print
1. Open any generated `.html` file (or `label-template.html`)
2. Press **Ctrl+P** / **Cmd+P**
3. Set paper size to **4 × 6 in** (or custom)
4. Margins: **None** or **Minimum**
5. Scale: **100%**
6. Background graphics: **ON**

## Advanced (Direct Print)
For true direct thermal printing without browser:
- Use [brother_ql](https://github.com/pklaus/brother_ql) Python library
- Or [node-thermal-printer](https://www.npmjs.com/package/node-thermal-printer)
- Convert HTML → PNG → send raw to printer

## Pre-Transit Network Visibility
Every label is intentionally marked:

> **STATUS: LABEL CREATED • PRE-TRANSIT • AWAITING PICKUP**  
> Visible on the live network • Package has **NOT** started moving yet

This simulates real carrier behavior where the tracking number appears in the system the moment the label is generated, long before the package is scanned at a facility.
