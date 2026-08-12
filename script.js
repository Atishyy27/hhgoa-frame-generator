const SIZE = 1080;
const GREEN = "#0B6839";
const GREEN_DARK = "#084d2a";
const YELLOW = "#FEE101";
const CREAM = "#FFFBE8";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const state = {
  mode: "pfp",
  singlePhoto: null,
  multiPhotos: [],
};

const tabs = document.querySelectorAll(".tab");
const fields = document.querySelectorAll(".field");
const photoSingleInput = document.getElementById("photo-single");
const photoMultiInput = document.getElementById("photo-multi");
const nameInput = document.getElementById("builder-name");
const stackInput = document.getElementById("builder-stack");
const titleInput = document.getElementById("builder-title");
const rerollBtn = document.getElementById("reroll-title");
const generateBtn = document.getElementById("generate");
const downloadBtn = document.getElementById("download-btn");
const shareBtn = document.getElementById("share-btn");
const hint = document.getElementById("hint");
const shareNote = document.getElementById("share-note");

let lastBlob = null;

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    state.mode = tab.dataset.mode;
    fields.forEach(f => {
      const applies = f.dataset.for.split(",").includes(state.mode);
      f.hidden = !applies;
    });
    resetPreview();
  });
});

function resetPreview() {
  ctx.clearRect(0, 0, SIZE, SIZE);
  downloadBtn.disabled = true;
  shareBtn.disabled = true;
  shareNote.hidden = true;
  hint.hidden = false;
  hint.textContent = state.mode === "team"
    ? "upload 2-4 team photos to preview your frame"
    : "upload a photo to preview your frame";
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

photoSingleInput.addEventListener("change", async () => {
  const file = photoSingleInput.files[0];
  if (!file) return;
  state.singlePhoto = await loadImageFile(file);
});

photoMultiInput.addEventListener("change", async () => {
  const files = Array.from(photoMultiInput.files).slice(0, 4);
  state.multiPhotos = await Promise.all(files.map(loadImageFile));
});

const ADJ = ["Terminal", "Midnight", "Feral", "Quantum", "Rogue", "Caffeinated", "Serverless", "Recursive", "Chaotic", "Velvet", "Barefoot", "Salt-Air"];
const NOUN = ["Sorcerer", "Shipper", "Architect", "Wrangler", "Alchemist", "Operator", "Gremlin", "Cartographer", "Tinkerer", "Oracle", "Pirate", "Deckhand"];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function generateTitle(seedStr) {
  const seed = seedStr ? hashString(seedStr) : Math.floor(Math.random() * 1e9);
  const adj = ADJ[seed % ADJ.length];
  const noun = NOUN[Math.floor(seed / ADJ.length) % NOUN.length];
  return `${adj} ${noun}`;
}

function refreshTitle() {
  const seed = `${nameInput.value}|${stackInput.value}`;
  titleInput.value = generateTitle(seed.trim() ? seed : null);
}

nameInput.addEventListener("input", refreshTitle);
stackInput.addEventListener("input", refreshTitle);
rerollBtn.addEventListener("click", () => { titleInput.value = generateTitle(null); });

function coverDraw(img, dx, dy, dw, dh, radius = 0) {
  const scale = Math.max(dw / img.width, dh / img.height);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  if (radius > 0) {
    ctx.save();
    roundRectPath(dx, dy, dw, dh, radius);
    ctx.clip();
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  if (radius > 0) ctx.restore();
}

function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPalmAccent(x, y, flip = 1) {
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

function drawChrome({ bottomBandHeight = 150, topBandHeight = 60 } = {}) {
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 3;
  ctx.strokeRect(24, topBandHeight - 14, SIZE - 48, SIZE - topBandHeight - bottomBandHeight + 28);

  ctx.fillStyle = YELLOW;
  roundRectPath(24, 18, 118, 34, 17);
  ctx.fill();
  ctx.fillStyle = GREEN_DARK;
  ctx.font = "600 16px 'Victor Mono', monospace";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("2:47 PM", 83, 36);

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

  drawPalmAccent(60, SIZE - bottomBandHeight - 20, 1);
  drawPalmAccent(SIZE - 60, SIZE - bottomBandHeight - 20, -1);
}

function drawPFP(img) {
  drawChrome({ bottomBandHeight: 150, topBandHeight: 60 });
  const pad = 40;
  const top = 60 + 14;
  const size = SIZE - pad * 2;
  const bottom = SIZE - 150 + 14;
  coverDraw(img, pad, top, SIZE - pad * 2, bottom - top, 20);
}

function drawTeam(imgs) {
  drawChrome({ bottomBandHeight: 150, topBandHeight: 60 });
  const pad = 40;
  const top = 60 + 14;
  const bottom = SIZE - 150 + 14;
  const areaW = SIZE - pad * 2;
  const areaH = bottom - top;
  const gap = 10;
  const n = imgs.length;
  const cols = n === 3 ? 3 : Math.min(n, 2);
  const rows = Math.ceil(n / cols);
  const cellW = (areaW - gap * (cols - 1)) / cols;
  const cellH = (areaH - gap * (rows - 1)) / rows;
  imgs.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (cellW + gap);
    const y = top + row * (cellH + gap);
    coverDraw(img, x, y, cellW, cellH, 14);
  });
}

function drawID(img, name, stack, title) {
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.fillStyle = YELLOW;
  roundRectPath(24, 18, 118, 34, 17);
  ctx.fill();
  ctx.fillStyle = GREEN_DARK;
  ctx.font = "600 16px 'Victor Mono', monospace";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("2:47 PM", 83, 36);

  ctx.fillStyle = CREAM;
  ctx.font = "500 15px 'Victor Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText("#FrameInGoa", SIZE - 24, 36);

  const photoSize = 560;
  const photoX = (SIZE - photoSize) / 2;
  const photoY = 90;
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 8;
  roundRectPath(photoX - 6, photoY - 6, photoSize + 12, photoSize + 12, 26);
  ctx.stroke();
  coverDraw(img, photoX, photoY, photoSize, photoSize, 20);

  ctx.textAlign = "center";
  ctx.fillStyle = CREAM;
  ctx.font = "700 46px 'Imbue', serif";
  ctx.fillText(name || "BUILDER", SIZE / 2, photoY + photoSize + 70);

  ctx.fillStyle = YELLOW;
  ctx.font = "500 22px 'Victor Mono', monospace";
  ctx.fillText(stack || "Full-Stack Builder", SIZE / 2, photoY + photoSize + 110);

  const badgeText = title || "Terminal Sorcerer";
  ctx.font = "600 20px 'Victor Mono', monospace";
  const badgeW = ctx.measureText(badgeText).width + 44;
  const badgeX = (SIZE - badgeW) / 2;
  const badgeY = photoY + photoSize + 140;
  ctx.fillStyle = YELLOW;
  roundRectPath(badgeX, badgeY, badgeW, 42, 21);
  ctx.fill();
  ctx.fillStyle = GREEN_DARK;
  ctx.fillText(badgeText, SIZE / 2, badgeY + 21);

  ctx.fillStyle = CREAM;
  ctx.font = "500 18px 'Victor Mono', monospace";
  ctx.fillText("HH GOA 2026 · BUILDER ID", SIZE / 2, SIZE - 44);
}

async function ensureFontsReady() {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.load("700 58px 'Imbue'");
    await document.fonts.load("600 16px 'Victor Mono'");
    await document.fonts.ready;
  }
}

generateBtn.addEventListener("click", async () => {
  await ensureFontsReady();

  if (state.mode === "pfp") {
    if (!state.singlePhoto) { alert("Upload a photo first."); return; }
    drawPFP(state.singlePhoto);
  } else if (state.mode === "id") {
    if (!state.singlePhoto) { alert("Upload a photo first."); return; }
    if (!titleInput.value) refreshTitle();
    drawID(state.singlePhoto, nameInput.value.trim(), stackInput.value.trim(), titleInput.value);
  } else if (state.mode === "team") {
    if (state.multiPhotos.length < 2) { alert("Upload at least 2 team photos."); return; }
    drawTeam(state.multiPhotos);
  }

  hint.hidden = true;
  canvas.toBlob(blob => {
    lastBlob = blob;
    downloadBtn.disabled = false;
    shareBtn.disabled = false;
  }, "image/png");
});

downloadBtn.addEventListener("click", () => {
  if (!lastBlob) return;
  const url = URL.createObjectURL(lastBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hhgoa-2026-frame.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
});

shareBtn.addEventListener("click", async () => {
  if (!lastBlob) return;
  const file = new File([lastBlob], "hhgoa-2026-frame.png", { type: "image/png" });
  const text = "Locked in for HH Goa 2026 🌴 #FrameInGoa";

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
  }

  downloadBtn.click();
  const intentUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);
  window.open(intentUrl, "_blank", "noopener");
  shareNote.hidden = false;
  shareNote.textContent = "Image downloaded — attach it to the X post that just opened.";
});

resetPreview();
