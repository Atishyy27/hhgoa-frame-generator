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

## Stack

**React + Vite**, source in `react/`. The live site is the built output of that project, deployed to the `gh-pages` branch — `main` holds the source for both this project and the earlier plain HTML/CSS/JS version (`index.html`/`style.css`/`script.js` at the repo root), kept as history rather than deleted.

The original build was intentionally plain HTML/CSS/JS — no build step, fastest possible path to a working deploy under a same-day deadline. That reasoning held up: nothing about the task needed a framework, and the vanilla version shipped every feature below just fine. It moved to React because more capable UI (postcard chrome, live countdown, multi-share, more Builder ID fields) kept stacking on top of it and framework tooling handles that better long-term — not because the vanilla version was broken. One genuine win from the move: React's conditional rendering means a hidden element is simply absent from the DOM, so the `[hidden]`-vs-`display` CSS specificity bug that had to be fixed in the vanilla build (element.hidden silently doing nothing on 4 components) can't happen here at all — it's structurally not possible.

Canvas drawing (`react/src/lib/draw.js`) stays plain imperative functions called via a ref, not JSX — that's the correct way to mix Canvas with React rather than fighting it.

Colors and fonts (`#0B6839`, `#FEE101`, `#FFFBE8`, Imbue + Victor Mono) are pulled directly from HH Goa's own site CSS, not guessed.

## Running locally

```
cd react
npm install
npm run dev
```

## Commit history

The commit history on `main` is the real build log, bugs and fixes included, not a single squashed dump — worth a look if you want to see the actual process rather than just the result.
