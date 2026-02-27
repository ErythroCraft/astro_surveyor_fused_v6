# Astro Surveyor (Fused v6) — Multi-frame Photometry + AU Models + WISEA-style Inspector

Astro Surveyor is a **browser-only** (no backend) web app for analyzing multiple astronomy images (“frames”) to detect bright sources, track their motion across frames, and compute **photometry-based magnitudes** using a reference star.  
It also includes a minimal **AU irradiance anchor**, a reflected-object **magnitude model**, a **color/spectral heuristic**, and a **WISEA-style** object-inspector output.

This repository contains:
- `index.html` — the main application
- `tutorial.html` — a complete step-by-step tutorial with formulas and definitions
- `styles.css`, `app.js`, `tutorial.js`

---

## Features

### Core workflow
- ✅ Load **2+ images** (drag & drop or file picker)
- ✅ Sort frames by time (JPEG EXIF `DateTimeOriginal` if present, else file modified time)
- ✅ Coarse **frame alignment** (global drift compensation via shift search)
- ✅ **Blob detection** (threshold + connected components)
- ✅ **Multi-frame tracking** (nearest-neighbor linking into tracks)
- ✅ Track overlay visualization (colored paths on canvas)

### Photometry (optional but recommended)
- ✅ Click-to-pick **reference star**
- ✅ Aperture photometry with background annulus
- ✅ Per-frame **Zero Point (ZP)** calibration
- ✅ Track mean magnitude + optional color correction

### Physics layers
- ✅ Solar irradiance at distance: `I(r)=I(1AU)/r²` with **I(1AU)=1360.8 W/m²**
- ✅ 600 AU baseline anchor: **I(600 AU)=0.00378 W/m²**
- ✅ AU anchor expected magnitude:
  - `I(AU) = I(600)·(600/AU)²`
  - `Δm = -5·log10(600/AU)`
  - `m_exp(AU)=m600+Δm`
- ✅ Reflected-object magnitude model:
  - `m = H + 5·log10(r·Δ) + P(α)`
  - linear phase option: `P(α)=β·α`
- ✅ Filters based on model/anchor tolerances

### WISEA-style Inspector
- ✅ Dropdown list of detected objects (tracks)
- ✅ “WISEA-like” structured record: motion, photometry, model deltas, settings snapshot
- ✅ Copy-to-clipboard

> Note: True WISEA naming `WISEA Jhhmmss.ss±ddmmss.s` requires WCS (pixel→RA/Dec). This app outputs a local, pixel-based designation (e.g. `WISEA PX512_384`) until WCS is added.

---

## Demo / Run Locally

### Option A: Open directly (quick)
Just open `index.html` in a modern browser (Chrome/Edge/Firefox).

### Option B: Local web server (recommended)
Some browsers restrict file access; a small local server is safer.

**Python**
```bash
python -m http.server 8080
