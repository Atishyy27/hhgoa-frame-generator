// Faithful port of the canvas drawing logic from the vanilla build's script.js.
// Canvas is imperative by nature — this stays plain JS functions taking `ctx`
// as a parameter, called from a useEffect/ref in React rather than turned
// into JSX. That's the standard, correct way to mix Canvas with React.

export const SIZE = 1080;
export const GREEN = "#0B6839";
export const GREEN_DARK = "#084d2a";
export const YELLOW = "#FEE101";
export const CREAM = "#FFFBE8";

export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function coverDraw(ctx, img, dx, dy, dw, dh, radius = 0) {
  const scale = Math.max(dw / img.width, dh / img.height);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  if (radius > 0) {
    ctx.save();
    roundRectPath(ctx, dx, dy, dw, dh, radius);
    ctx.clip();
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  if (radius > 0) ctx.restore();
}

export function drawSilhouette(ctx, x, y, w, h, radius = 0) {
  ctx.save();
  if (radius > 0) { roundRectPath(ctx, x, y, w, h, radius); ctx.clip(); }
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "#0f7a42");
  grad.addColorStop(1, "#0a5730");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const headR = Math.min(w, h) * 0.16;
  ctx.fillStyle = "rgba(255,251,232,0.35)";
  ctx.beginPath();
  ctx.arc(cx, cy - headR * 0.9, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy + headR * 1.7, headR * 1.9, headR * 1.7, 0, Math.PI, 0, true);
  ctx.fill();
  ctx.restore();
}

export function drawPhotoOrPlaceholder(ctx, img, x, y, w, h, radius = 0) {
  if (img) coverDraw(ctx, img, x, y, w, h, radius);
  else drawSilhouette(ctx, x, y, w, h, radius);
}

export function drawPalmAccent(ctx, x, y, flip = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip, 1);
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const angle = (-30 + i * 20) * Math.PI / 180;
    const len = 46 - i * 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(angle) * len * 0.6, Math.sin(angle) * len * 0.6 - 10,
      Math.cos(angle) * len, Math.sin(angle) * len
    );
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStampBox(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,251,232,0.5)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  roundRectPath(ctx, x, y, 120, 56, 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,251,232,0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "600 11px 'Victor Mono', monospace";
  ctx.fillText("GOA · INDIA", x + 60, y + 24);
  ctx.font = "700 14px 'Victor Mono', monospace";
  ctx.fillText("HH 2026", x + 60, y + 43);
  ctx.restore();
}

export function drawCircularSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,251,232,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.stroke();

  const text = "BUILD · SHIP · REPEAT · ";
  ctx.font = "600 10px 'Victor Mono', monospace";
  ctx.fillStyle = "rgba(255,251,232,0.85)";
  const radius = r - 4;
  const anglePerChar = (Math.PI * 2) / text.length;
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.rotate(i * anglePerChar);
    ctx.translate(0, -radius);
    ctx.textAlign = "center";
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();

  ctx.save();
  ctx.font = "18px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🌴", cx, cy);
  ctx.restore();
}

export function drawCornerBrackets(ctx, x, y, w, h, len = 26) {
  ctx.save();
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const corners = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];
  corners.forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + len * dy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + len * dx, cy);
    ctx.stroke();
  });
  ctx.restore();
}

// Wraps left-to-right within maxWidth, returns the y position just after the
// last row so callers can keep stacking content below it regardless of how
// many tags were actually passed.
export function drawTagPills(ctx, tags, centerX, startY, maxWidth) {
  if (!tags.length) return startY;
  ctx.font = "500 15px 'Victor Mono', monospace";
  const paddingX = 14;
  const gap = 8;
  const pillH = 32;
  const rowGap = 10;
  const rows = [];
  let row = [];
  let rowWidth = 0;
  tags.forEach(tag => {
    const w = ctx.measureText(tag).width + paddingX * 2;
    if (rowWidth + w + gap > maxWidth && row.length) {
      rows.push({ items: row, width: rowWidth - gap });
      row = [];
      rowWidth = 0;
    }
    row.push({ text: tag, w });
    rowWidth += w + gap;
  });
  if (row.length) rows.push({ items: row, width: rowWidth - gap });

  let y = startY;
  rows.forEach(r => {
    let x = centerX - r.width / 2;
    r.items.forEach(item => {
      ctx.fillStyle = "rgba(255,251,232,0.12)";
      roundRectPath(ctx, x, y, item.w, pillH, pillH / 2);
      ctx.fill();
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 1.5;
      roundRectPath(ctx, x, y, item.w, pillH, pillH / 2);
      ctx.stroke();
      ctx.fillStyle = CREAM;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.text, x + item.w / 2, y + pillH / 2 + 1);
      ctx.textBaseline = "alphabetic";
      x += item.w + gap;
    });
    y += pillH + rowGap;
  });
  return y;
}

// Skips silently if the qrcode-generator script failed to load — a nice-to-have
// flourish is never worth breaking the card render over.
export function drawQR(ctx, text, x, y, size) {
  if (typeof window === "undefined" || typeof window.qrcode !== "function") return;
  try {
    const qr = window.qrcode(0, "L");
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const cell = size / count;
    ctx.fillStyle = CREAM;
    ctx.fillRect(x - 6, y - 6, size + 12, size + 12);
    ctx.fillStyle = GREEN_DARK;
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(x + c * cell, y + r * cell, Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
  } catch (err) {
    console.warn("QR generation failed:", err);
  }
}

export function drawChrome(ctx, { bottomBandHeight = 150, topBandHeight = 60 } = {}) {
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 3;
  ctx.strokeRect(24, topBandHeight - 14, SIZE - 48, SIZE - topBandHeight - bottomBandHeight + 28);

  ctx.fillStyle = YELLOW;
  roundRectPath(ctx, 24, 18, 118, 34, 17);
  ctx.fill();
  ctx.fillStyle = GREEN_DARK;
  ctx.font = "600 16px 'Victor Mono', monospace";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("2:47 PM", 83, 36);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = CREAM;
  ctx.font = "500 15px 'Victor Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText("#FrameInGoa", SIZE - 24, 36);

  ctx.textAlign = "center";
  ctx.fillStyle = YELLOW;
  ctx.font = "700 58px 'Imbue', serif";
  ctx.fillText("HH GOA 2026", SIZE / 2, SIZE - bottomBandHeight / 2 - 14);

  ctx.fillStyle = CREAM;
  ctx.font = "500 20px 'Victor Mono', monospace";
  ctx.fillText("BUILDER RESIDENCY · GOA, INDIA", SIZE / 2, SIZE - bottomBandHeight / 2 + 34);

  drawPalmAccent(ctx, 60, SIZE - bottomBandHeight - 20, 1);
  drawPalmAccent(ctx, SIZE - 60, SIZE - bottomBandHeight - 20, -1);
}

export function drawPFP(ctx, img) {
  drawChrome(ctx, { bottomBandHeight: 150, topBandHeight: 60 });
  const pad = 40;
  const top = 60 + 14;
  const bottom = SIZE - 150 + 14;
  drawPhotoOrPlaceholder(ctx, img, pad, top, SIZE - pad * 2, bottom - top, 20);
}

export function drawTeam(ctx, imgs) {
  drawChrome(ctx, { bottomBandHeight: 150, topBandHeight: 60 });
  const pad = 40;
  const top = 60 + 14;
  const bottom = SIZE - 150 + 14;
  const areaW = SIZE - pad * 2;
  const areaH = bottom - top;
  const gap = 10;
  const list = imgs.length ? imgs : [null, null];
  const n = list.length;
  const cols = n === 3 ? 3 : Math.min(n, 2);
  const rows = Math.ceil(n / cols);
  const cellW = (areaW - gap * (cols - 1)) / cols;
  const cellH = (areaH - gap * (rows - 1)) / rows;
  list.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (cellW + gap);
    const y = top + row * (cellH + gap);
    drawPhotoOrPlaceholder(ctx, img, x, y, cellW, cellH, 14);
  });
}

const LIVE_URL = "https://atishyy27.github.io/hhgoa-frame-generator/";

export function drawID(ctx, img, data) {
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.fillStyle = YELLOW;
  roundRectPath(ctx, 24, 18, 118, 34, 17);
  ctx.fill();
  ctx.fillStyle = GREEN_DARK;
  ctx.font = "600 16px 'Victor Mono', monospace";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("2:47 PM", 83, 36);
  ctx.textBaseline = "alphabetic";

  drawStampBox(ctx, 24, 62);

  ctx.fillStyle = CREAM;
  ctx.font = "500 15px 'Victor Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText("#FrameInGoa", SIZE - 24, 36);

  drawCircularSeal(ctx, SIZE - 88, 128, 52);

  const photoSize = 440;
  const photoX = (SIZE - photoSize) / 2;
  const photoY = 200;
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 8;
  roundRectPath(ctx, photoX - 6, photoY - 6, photoSize + 12, photoSize + 12, 26);
  ctx.stroke();
  drawPhotoOrPlaceholder(ctx, img, photoX, photoY, photoSize, photoSize, 20);
  drawCornerBrackets(ctx, photoX - 6, photoY - 6, photoSize + 12, photoSize + 12);

  let y = photoY + photoSize + 60;

  ctx.textAlign = "center";
  ctx.fillStyle = CREAM;
  ctx.font = "700 44px 'Imbue', serif";
  ctx.fillText(data.name || "BUILDER", SIZE / 2, y);
  y += 40;

  ctx.fillStyle = YELLOW;
  ctx.font = "500 20px 'Victor Mono', monospace";
  ctx.fillText(data.stack || "Full-Stack Builder", SIZE / 2, y);
  y += 34;

  if (data.quote) {
    ctx.fillStyle = CREAM;
    ctx.globalAlpha = 0.85;
    ctx.font = "italic 400 16px 'Victor Mono', monospace";
    ctx.fillText(`"${data.quote}"`, SIZE / 2, y);
    ctx.globalAlpha = 1;
    y += 34;
  }

  const vibeTags = (data.vibes || "").split(",").map(s => s.trim()).filter(Boolean);
  if (vibeTags.length) {
    y += 6;
    y = drawTagPills(ctx, vibeTags, SIZE / 2, y, SIZE - 160);
    y += 6;
  }

  const badgeText = data.title || "Terminal Sorcerer";
  ctx.font = "600 20px 'Victor Mono', monospace";
  const badgeW = ctx.measureText(badgeText).width + 44;
  ctx.fillStyle = YELLOW;
  roundRectPath(ctx, (SIZE - badgeW) / 2, y, badgeW, 42, 21);
  ctx.fill();
  ctx.fillStyle = GREEN_DARK;
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, SIZE / 2, y + 22);
  ctx.textBaseline = "alphabetic";
  y += 62;

  if (data.xHandle || data.githubHandle) {
    const parts = [];
    if (data.xHandle) parts.push(`𝕏 ${data.xHandle.replace(/^@/, "")}`);
    if (data.githubHandle) parts.push(`⌥ ${data.githubHandle}`);
    ctx.fillStyle = CREAM;
    ctx.font = "500 15px 'Victor Mono', monospace";
    ctx.fillText(parts.join("    "), SIZE / 2, y);
    y += 30;
  }

  const passId = data.passId || "HHGOA-2026-00000";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,251,232,0.7)";
  ctx.font = "500 14px 'Victor Mono', monospace";
  ctx.fillText(passId, 32, SIZE - 38);

  drawQR(ctx, LIVE_URL, SIZE - 32 - 84, SIZE - 44 - 84, 84);

  ctx.textAlign = "center";
  ctx.fillStyle = CREAM;
  ctx.font = "500 16px 'Victor Mono', monospace";
  ctx.fillText("HH GOA 2026 · BUILDER ID · GOA, INDIA", SIZE / 2, SIZE - 16);
}

export function drawForMode(ctx, mode, { singlePhoto, multiPhotos, idData }) {
  if (mode === "pfp") {
    drawPFP(ctx, singlePhoto);
  } else if (mode === "id") {
    drawID(ctx, singlePhoto, idData);
  } else {
    drawTeam(ctx, multiPhotos);
  }
}

export async function ensureFontsReady() {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.load("700 58px 'Imbue'");
    await document.fonts.load("600 16px 'Victor Mono'");
    await document.fonts.ready;
  }
}

const ADJ = ["Terminal", "Midnight", "Feral", "Quantum", "Rogue", "Caffeinated", "Serverless", "Recursive", "Chaotic", "Velvet", "Barefoot", "Salt-Air"];
const NOUN = ["Sorcerer", "Shipper", "Architect", "Wrangler", "Alchemist", "Operator", "Gremlin", "Cartographer", "Tinkerer", "Oracle", "Pirate", "Deckhand"];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function generateTitle(seedStr) {
  const seed = seedStr ? hashString(seedStr) : Math.floor(Math.random() * 1e9);
  const adj = ADJ[seed % ADJ.length];
  const noun = NOUN[Math.floor(seed / ADJ.length) % NOUN.length];
  return `${adj} ${noun}`;
}

export function generatePassId() {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `HHGOA-2026-${n}`;
}
