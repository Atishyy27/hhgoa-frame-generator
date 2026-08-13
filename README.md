# HH Goa 2026 — Frame / Builder ID Generator

Built for **Hacker House Goa 2026, Task #1**. Upload a photo, get a branded HH Goa 2026 graphic in three formats, download it, share it to X with `#FrameInGoa`.

**Live: https://atishyy27.github.io/hhgoa-frame-generator/**

## What it does

- **PFP Frame** — one photo, wrapped in an on-brand overlay
- **Builder ID** — photo + name + stack + auto-generated "builder class," plus optional quote, socials, a real functional QR code linking back to the tool, a passport-stamp motif, and a circular seal
- **Team Frame** — 2-4 teammates combined into one shared frame
- Optional client-side background removal (Google MediaPipe Selfie Segmenter, runs entirely in-browser)
- Optional in-browser selfie capture as an alternative to file upload
- Optional ambient beach-wave audio (CC0-licensed)
- Everything reactive — the canvas redraws live as you type or upload, no manual "generate" required to preview

## Stack: plain HTML/CSS/JS, on purpose

No React, no build step, no bundler. That's a deliberate call, not an oversight:

- **Speed to ship** — static files deploy to GitHub Pages directly; no build pipeline to configure or debug
- **Zero dependencies to break** — the only external code is the (verified, pinned-version) MediaPipe segmentation model and a small QR-generation library, both loaded lazily and only when actually used
- **The task doesn't need a framework** — it's a canvas-manipulation tool with a handful of toggled UI states, not an app with routing or complex shared state

Colors and fonts (`#0B6839`, `#FEE101`, `#FFFBE8`, Imbue + Victor Mono) are pulled directly from HH Goa's own site CSS, not guessed.

## Running locally

No build step — just open `index.html` in a browser, or serve the folder with any static server:

```
npx serve .
```

## Commit history

The commit history on `main` is the real build log, bugs and fixes included, not a single squashed dump — worth a look if you want to see the actual process rather than just the result.
