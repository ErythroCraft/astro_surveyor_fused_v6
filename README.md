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
````

How to Use (Quick)

1.  Load ≥2 frames (drag & drop).
1.1 (Recommended) click Pick reference star and click a bright, unsaturated star on the canvas.
2. Enter Reference star magnitude (catalog mag) and set aperture radii if needed.
3. Press Run.

Make sure you setup the correct date format in your pictures. That means, calculating has got an timestamp and use the creation date of your pictures to calculate the posion.

Inspect tracks:

    Select a row in the track table, or choose it in Found objects

Review the WISEA-style output

Use filters:

    Filter by model (H/r/Δ/phase)
    AU anchor filter (m600 + target AU)


Formulas (Summary)
Solar irradiance (inverse square)

    I(1 AU) = 1360.8 W/m²
    I(r) = I(1 AU) / r²
    I(600 AU) ≈ 0.00378 W/m²

AU anchor (from 600 AU baseline)

    I(AU) = I(600)·(600/AU)²
    Δm = -2.5·log10(I(AU)/I(600)) = -5·log10(600/AU)
    m_exp(AU) = m600 + Δm

Aperture photometry

    NetFlux = Sum(aperture) - Median(background)·N_aperturePixels
    Instrumental magnitude
    m_inst = -2.5·log10(NetFlux / exposureSeconds)

Zero point calibration

    ZP = m_ref - m_inst(ref)
    m_true = m_inst + ZP

Reflected-object magnitude model (minimal)

    m = H + 5·log10(r·Δ) + P(α)
    P(α)=β·α (optional linear phase)

Limitations / Notes

This is a minimal photometry/tracking tool.
- No PSF fitting, no advanced deblending (close sources may merge into one blob).
- No RA/Dec output until WCS is implemented.

- RGB → spectral classification is heuristic (not calibrated filter photometry).
- Roadmap (Ideas)

- WCS calibration (pixel → RA/Dec)
- MPC / JPL ephemerides comparison

- Better photometry (PSF fit, deblend)

- Track linking improvements (Kalman filter / Hungarian matching)

- Object type classifier (planet / asteroid / star) with confidence scoring
