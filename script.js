const SIZE = 1080;
const GREEN = "#0B6839";
const GREEN_DARK = "#084d2a";
const YELLOW = "#FEE101";
const CREAM = "#FFFBE8";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const LIVE_URL = "https://atishyy27.github.io/hhgoa-frame-generator/";

const state = {
  mode: "pfp",
  singlePhoto: null,
  singlePhotoProcessed: null,
  multiPhotos: [],
  passId: null,
};

const tabs = document.querySelectorAll(".tab");
const fields = document.querySelectorAll(".field");
const dropzoneSingle = document.getElementById("dropzone-single");
const dropzoneMulti = document.getElementById("dropzone-multi");
const thumbSingle = document.getElementById("thumb-single");
const thumbsMulti = document.getElementById("thumbs-multi");
const photoSingleInput = document.getElementById("photo-single");
const photoMultiInput = document.getElementById("photo-multi");
const bgRemoveRow = document.getElementById("bg-remove-row");
const bgRemoveCheckbox = document.getElementById("bg-remove");
const nameInput = document.getElementById("builder-name");
const stackInput = document.getElementById("builder-stack");
const titleInput = document.getElementById("builder-title");
const rerollBtn = document.getElementById("reroll-title");
const vibesInput = document.getElementById("builder-vibes");
const quoteInput = document.getElementById("builder-quote");
const xInput = document.getElementById("builder-x");
const githubInput = document.getElementById("builder-github");
const selfieBtn = document.getElementById("selfie-btn");
const cameraModal = document.getElementById("camera-modal");
const cameraVideo = document.getElementById("camera-video");
const cameraCaptureBtn = document.getElementById("camera-capture");
const cameraCancelBtn = document.getElementById("camera-cancel");
const audioToggle = document.getElementById("audio-toggle");
const audioIcon = document.getElementById("audio-icon");
const beachAudio = document.getElementById("beach-audio");
const generateBtn = document.getElementById("generate");
const downloadBtn = document.getElementById("download-btn");
const shareBtn = document.getElementById("share-btn");
const hint = document.getElementById("hint");
const shareNote = document.getElementById("share-note");
const canvasFlash = document.getElementById("canvas-flash");
const cursorGlow = document.getElementById("cursor-glow");
const toastStack = document.getElementById("toast-stack");
const confettiCanvas = document.getElementById("confetti-canvas");
const confettiCtx = confettiCanvas.getContext("2d");

let lastBlob = null;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- cursor glow ---------- */

if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
  window.addEventListener("mousemove", e => {
    cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    cursorGlow.classList.add("active");
  });
  window.addEventListener("mouseleave", () => cursorGlow.classList.remove("active"));
}

/* ---------- toast notifications ---------- */

function showToast(message, type = "info", duration = 3200) {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  toastStack.appendChild(el);
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), reduceMotion ? 0 : 260);
  }, duration);
}

/* ---------- confetti ---------- */

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfetti);
resizeConfetti();

const CONFETTI_COLORS = [YELLOW, "#F9DC01", GREEN, CREAM, "#FFFFFF"];
let confettiParticles = [];
let confettiRAF = null;

function burstConfetti() {
  const originX = confettiCanvas.width / 2;
  const originY = confettiCanvas.height * 0.35;
  for (let i = 0; i < 90; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 7;
    confettiParticles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 5 + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      life: 0,
      maxLife: 60 + Math.random() * 30,
    });
  }
  if (!confettiRAF) confettiRAF = requestAnimationFrame(tickConfetti);
}

function tickConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles = confettiParticles.filter(p => p.life < p.maxLife);
  confettiParticles.forEach(p => {
    p.vy += 0.18;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.spin;
    p.life++;
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    confettiCtx.save();
    confettiCtx.globalAlpha = alpha;
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rotation);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    confettiCtx.restore();
  });
  confettiRAF = confettiParticles.length > 0 ? requestAnimationFrame(tickConfetti) : null;
}

/* ---------- tabs / field visibility ---------- */

function setFieldVisibility(mode) {
  fields.forEach(f => {
    const applies = f.dataset.for.split(",").includes(mode);
    if (applies) {
      f.hidden = false;
      requestAnimationFrame(() => f.classList.remove("fade-out"));
    } else if (!f.hidden) {
      f.classList.add("fade-out");
      setTimeout(() => { if (f.classList.contains("fade-out")) f.hidden = true; }, reduceMotion ? 0 : 220);
    }
  });
}

function updateBgRemoveVisibility() {
  bgRemoveRow.hidden = !(state.singlePhoto && (state.mode === "pfp" || state.mode === "id"));
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    state.mode = tab.dataset.mode;
    setFieldVisibility(state.mode);
    refreshForModeChange();
  });
});

function placeholderHintText(mode) {
  return mode === "team"
    ? "showing a placeholder — upload 2-4 team photos to personalize"
    : "showing a placeholder — upload your photo to personalize";
}

function refreshForModeChange() {
  downloadBtn.disabled = true;
  shareBtn.disabled = true;
  shareNote.hidden = true;
  updateBgRemoveVisibility();

  const hasContent = state.mode === "team" ? state.multiPhotos.length >= 2 : !!state.singlePhoto;
  if (hasContent) {
    runGenerate({ auto: true });
  } else {
    drawForMode(null);
    canvas.classList.remove("ready");
    hint.hidden = false;
    hint.textContent = placeholderHintText(state.mode);
  }
}

/* ---------- image loading ---------- */

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function wireDropzone(dropzoneEl, inputEl, onFiles) {
  dropzoneEl.addEventListener("click", () => inputEl.click());
  dropzoneEl.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputEl.click(); }
  });
  ["dragover", "dragenter"].forEach(evt => dropzoneEl.addEventListener(evt, e => {
    e.preventDefault();
    dropzoneEl.classList.add("drag-over");
  }));
  ["dragleave", "dragend"].forEach(evt => dropzoneEl.addEventListener(evt, () => {
    dropzoneEl.classList.remove("drag-over");
  }));
  dropzoneEl.addEventListener("drop", e => {
    e.preventDefault();
    dropzoneEl.classList.remove("drag-over");
    const files = Array.from(e.dataTransfer ? e.dataTransfer.files : []).filter(f => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  });
  inputEl.addEventListener("change", () => {
    const files = Array.from(inputEl.files || []);
    if (files.length) onFiles(files);
  });
}

wireDropzone(dropzoneSingle, photoSingleInput, async files => {
  let img;
  try {
    img = await loadImageFile(files[0]);
  } catch {
    showToast("Couldn't read that image — try a different file.", "error");
    return;
  }
  state.singlePhoto = img;
  state.singlePhotoProcessed = null;
  state.passId = null;
  bgRemoveCheckbox.checked = false;
  thumbSingle.src = img.src;
  thumbSingle.hidden = false;
  const idle = dropzoneSingle.querySelector(".dropzone-idle");
  if (idle) idle.style.display = "none";
  updateBgRemoveVisibility();
  runGenerate({ auto: true });
});

wireDropzone(dropzoneMulti, photoMultiInput, async files => {
  if (files.length > 4) showToast("Only using the first 4 photos.", "info");
  const picked = files.slice(0, 4);
  let imgs;
  try {
    imgs = await Promise.all(picked.map(loadImageFile));
  } catch {
    showToast("Couldn't read one of those images — try different files.", "error");
    return;
  }
  state.multiPhotos = imgs;
  thumbsMulti.innerHTML = "";
  imgs.forEach(img => {
    const el = document.createElement("img");
    el.src = img.src;
    el.alt = "";
    thumbsMulti.appendChild(el);
  });
  thumbsMulti.hidden = false;
  const idle = dropzoneMulti.querySelector(".dropzone-idle");
  if (idle) idle.style.display = "none";
  runGenerate({ auto: true });
});

/* ---------- selfie capture ---------- */

let cameraStream = null;
let cameraReadyTimeout = null;

async function openCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast("Camera isn't available on this browser — upload a photo instead.", "error");
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
  } catch {
    showToast("Couldn't access the camera — check permissions.", "error");
    return;
  }
  cameraVideo.srcObject = cameraStream;
  cameraModal.hidden = false;
  cameraCaptureBtn.disabled = true;
  cameraCaptureBtn.textContent = "Starting…";

  clearTimeout(cameraReadyTimeout);
  cameraReadyTimeout = setTimeout(() => {
    if (cameraCaptureBtn.disabled) {
      showToast("Camera feed isn't coming through — this laptop's camera may not be working. Upload a photo instead.", "error", 5000);
    }
  }, 4000);

  cameraVideo.onloadedmetadata = () => {
    clearTimeout(cameraReadyTimeout);
    cameraCaptureBtn.disabled = false;
    cameraCaptureBtn.textContent = "Capture";
  };
}

function closeCamera() {
  clearTimeout(cameraReadyTimeout);
  cameraVideo.onloadedmetadata = null;
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  cameraModal.hidden = true;
  cameraCaptureBtn.disabled = false;
  cameraCaptureBtn.textContent = "Capture";
}

selfieBtn.addEventListener("click", openCamera);
cameraCancelBtn.addEventListener("click", closeCamera);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !cameraModal.hidden) closeCamera();
});

cameraCaptureBtn.addEventListener("click", () => {
  const w = cameraVideo.videoWidth;
  const h = cameraVideo.videoHeight;
  if (!w || !h) { showToast("Camera not ready yet — try again.", "error"); return; }
  const shot = document.createElement("canvas");
  shot.width = w;
  shot.height = h;
  const sctx = shot.getContext("2d");
  // Mirror the capture to match what the user saw in the (CSS-mirrored) preview.
  sctx.translate(w, 0);
  sctx.scale(-1, 1);
  sctx.drawImage(cameraVideo, 0, 0, w, h);
  closeCamera();

  state.singlePhoto = shot;
  state.singlePhotoProcessed = null;
  state.passId = null;
  bgRemoveCheckbox.checked = false;
  thumbSingle.src = shot.toDataURL("image/png");
  thumbSingle.hidden = false;
  const idle = dropzoneSingle.querySelector(".dropzone-idle");
  if (idle) idle.style.display = "none";
  updateBgRemoveVisibility();
  runGenerate({ auto: true });
});

/* ---------- ambient beach audio (CC0, archive.org) ---------- */

audioToggle.addEventListener("click", async () => {
  if (beachAudio.paused) {
    try {
      await beachAudio.play();
      audioIcon.textContent = "🔊";
      audioToggle.setAttribute("aria-pressed", "true");
    } catch {
      showToast("Couldn't start audio — try again.", "error");
    }
  } else {
    beachAudio.pause();
    audioIcon.textContent = "🔇";
    audioToggle.setAttribute("aria-pressed", "false");
  }
});

/* ---------- background remover (optional, MediaPipe selfie segmenter) ---------- */

const MEDIAPIPE_VERSION = "0.10.14";
const VISION_BUNDLE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/vision_bundle.mjs`;
const VISION_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const SELFIE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

let segmenterPromise = null;

function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, ImageSegmenter } = await import(VISION_BUNDLE_URL);
      const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);
      return ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: SELFIE_MODEL_URL },
        runningMode: "IMAGE",
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      });
    })();
  }
  return segmenterPromise;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("segmentation timed out")), ms)),
  ]);
}

// CPU-array approach on purpose: categoryMask.getAsUint8Array() gives one byte
// per pixel = the predicted class index (0 background, 1 person) directly, per
// MediaPipe's own MPMask docs. A first version of this routed through a WebGL
// canvas + DrawingUtils.drawCategoryMask() instead, and in real-browser testing
// it wiped the *entire* photo, not just the background — almost certainly a
// blank mask from a WebGL-context mismatch that static review couldn't catch.
// This version has no WebGL context to get wrong.
async function removeBackground(img) {
  const segmenter = await withTimeout(getSegmenter(), 8000);
  const result = segmenter.segment(img);
  const mask = result && result.categoryMask;
  if (!mask) throw new Error("no category mask returned");

  const maskW = mask.width;
  const maskH = mask.height;
  const maskData = mask.getAsUint8Array();
  mask.close();

  const maskImgData = new ImageData(maskW, maskH);
  let hasOpaquePixel = false;
  for (let i = 0; i < maskW * maskH; i++) {
    const isPerson = maskData[i] === 1;
    if (isPerson) hasOpaquePixel = true;
    const o = i * 4;
    maskImgData.data[o] = 255;
    maskImgData.data[o + 1] = 255;
    maskImgData.data[o + 2] = 255;
    maskImgData.data[o + 3] = isPerson ? 255 : 0;
  }
  if (!hasOpaquePixel) throw new Error("segmentation mask came back empty — refusing to wipe the photo");

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = maskW;
  maskCanvas.height = maskH;
  maskCanvas.getContext("2d").putImageData(maskImgData, 0, 0);

  const out = document.createElement("canvas");
  out.width = img.naturalWidth || img.width;
  out.height = img.naturalHeight || img.height;
  const octx = out.getContext("2d");
  octx.drawImage(img, 0, 0, out.width, out.height);
  octx.globalCompositeOperation = "destination-in";
  octx.drawImage(maskCanvas, 0, 0, out.width, out.height);
  octx.globalCompositeOperation = "source-over";
  return out;
}

async function triggerBgRemoval() {
  if (!state.singlePhoto) return;
  if (state.singlePhotoProcessed) { runGenerate({ auto: true }); return; }
  dropzoneSingle.classList.add("drag-over");
  showToast("Removing background…", "info", 4000);
  try {
    state.singlePhotoProcessed = await removeBackground(state.singlePhoto);
    showToast("Background removed.", "success");
  } catch (err) {
    console.warn("bg removal unavailable:", err);
    bgRemoveCheckbox.checked = false;
    showToast("Background removal isn't available here — using the original photo.", "error");
  } finally {
    dropzoneSingle.classList.remove("drag-over");
    runGenerate({ auto: true });
  }
}

bgRemoveCheckbox.addEventListener("change", () => {
  if (bgRemoveCheckbox.checked) {
    triggerBgRemoval();
  } else {
    runGenerate({ auto: true });
  }
});

function pickSinglePhoto() {
  if (bgRemoveCheckbox.checked && state.singlePhotoProcessed) return state.singlePhotoProcessed;
  return state.singlePhoto;
}

/* ---------- builder title generator ---------- */

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

function debounce(fn, wait) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

const debouncedIdRegenerate = debounce(() => {
  if (state.mode === "id" && state.singlePhoto) runGenerate({ auto: true });
}, 350);

nameInput.addEventListener("input", () => { refreshTitle(); debouncedIdRegenerate(); });
stackInput.addEventListener("input", () => { refreshTitle(); debouncedIdRegenerate(); });
[vibesInput, quoteInput, xInput, githubInput].forEach(el => {
  el.addEventListener("input", debouncedIdRegenerate);
});
rerollBtn.addEventListener("click", () => {
  titleInput.value = generateTitle(null);
  rerollBtn.classList.remove("spinning");
  void rerollBtn.offsetWidth;
  rerollBtn.classList.add("spinning");
  if (state.mode === "id" && state.singlePhoto) runGenerate({ auto: true });
});

function generatePassId() {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `HHGOA-2026-${n}`;
}

/* ---------- canvas drawing ---------- */

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

function drawSilhouette(x, y, w, h, radius = 0) {
  ctx.save();
  if (radius > 0) { roundRectPath(x, y, w, h, radius); ctx.clip(); }
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

function drawPhotoOrPlaceholder(img, x, y, w, h, radius = 0) {
  if (img) coverDraw(img, x, y, w, h, radius);
  else drawSilhouette(x, y, w, h, radius);
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

function drawStampBox(x, y) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,251,232,0.5)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  roundRectPath(x, y, 120, 56, 6);
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

function drawCircularSeal(cx, cy, r) {
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

function drawCornerBrackets(x, y, w, h, len = 26) {
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

// Draws left-to-right, wrapping to new rows within maxWidth; returns the y
// position just after the last row so callers can keep stacking content
// below it — avoids fixed-offset collisions when some tags are empty.
function drawTagPills(tags, centerX, startY, maxWidth) {
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
      roundRectPath(x, y, item.w, pillH, pillH / 2);
      ctx.fill();
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 1.5;
      roundRectPath(x, y, item.w, pillH, pillH / 2);
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

// Skips silently if the qrcode-generator CDN script failed to load — a QR
// code is a nice-to-have flourish, never something worth breaking the card over.
function drawQR(text, x, y, size) {
  if (typeof qrcode !== "function") return;
  try {
    const qr = qrcode(0, "L");
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
  const bottom = SIZE - 150 + 14;
  drawPhotoOrPlaceholder(img, pad, top, SIZE - pad * 2, bottom - top, 20);
}

function drawTeam(imgs) {
  drawChrome({ bottomBandHeight: 150, topBandHeight: 60 });
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
    drawPhotoOrPlaceholder(img, x, y, cellW, cellH, 14);
  });
}

function drawID(img, data) {
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
  ctx.textBaseline = "alphabetic";

  drawStampBox(24, 62);

  ctx.fillStyle = CREAM;
  ctx.font = "500 15px 'Victor Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText("#FrameInGoa", SIZE - 24, 36);

  drawCircularSeal(SIZE - 88, 128, 52);

  const photoSize = 440;
  const photoX = (SIZE - photoSize) / 2;
  const photoY = 200;
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 8;
  roundRectPath(photoX - 6, photoY - 6, photoSize + 12, photoSize + 12, 26);
  ctx.stroke();
  drawPhotoOrPlaceholder(img, photoX, photoY, photoSize, photoSize, 20);
  drawCornerBrackets(photoX - 6, photoY - 6, photoSize + 12, photoSize + 12);

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
    y = drawTagPills(vibeTags, SIZE / 2, y, SIZE - 160);
    y += 6;
  }

  const badgeText = data.title || "Terminal Sorcerer";
  ctx.font = "600 20px 'Victor Mono', monospace";
  const badgeW = ctx.measureText(badgeText).width + 44;
  ctx.fillStyle = YELLOW;
  roundRectPath((SIZE - badgeW) / 2, y, badgeW, 42, 21);
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

  drawQR(LIVE_URL, SIZE - 32 - 84, SIZE - 44 - 84, 84);

  ctx.textAlign = "center";
  ctx.fillStyle = CREAM;
  ctx.font = "500 16px 'Victor Mono', monospace";
  ctx.fillText("HH GOA 2026 · BUILDER ID · GOA, INDIA", SIZE / 2, SIZE - 16);
}

function drawForMode(_unusedTrigger) {
  if (state.mode === "pfp") {
    drawPFP(pickSinglePhoto());
  } else if (state.mode === "id") {
    if (!titleInput.value) refreshTitle();
    if (!state.passId) state.passId = generatePassId();
    drawID(pickSinglePhoto(), {
      name: nameInput.value.trim(),
      stack: stackInput.value.trim(),
      title: titleInput.value,
      quote: quoteInput.value.trim(),
      vibes: vibesInput.value.trim(),
      xHandle: xInput.value.trim(),
      githubHandle: githubInput.value.trim(),
      passId: state.passId,
    });
  } else {
    drawTeam(state.multiPhotos);
  }
}

async function ensureFontsReady() {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.load("700 58px 'Imbue'");
    await document.fonts.load("600 16px 'Victor Mono'");
    await document.fonts.ready;
  }
}

/* ---------- generate ---------- */

async function runGenerate({ auto = false, celebrate = false } = {}) {
  await ensureFontsReady();

  if (state.mode === "pfp" || state.mode === "id") {
    if (!state.singlePhoto) {
      if (!auto) showToast("Upload a photo first.", "error");
      return false;
    }
  } else if (state.mode === "team") {
    if (state.multiPhotos.length < 2) {
      if (!auto) showToast("Upload at least 2 team photos.", "error");
      return false;
    }
  }

  drawForMode();

  hint.hidden = true;
  canvas.classList.add("ready");
  canvasFlash.classList.remove("play");
  void canvasFlash.offsetWidth;
  canvasFlash.classList.add("play");

  canvas.toBlob(blob => {
    lastBlob = blob;
    downloadBtn.disabled = false;
    shareBtn.disabled = false;
  }, "image/png");

  if (celebrate) {
    if (!reduceMotion) burstConfetti();
    showToast("Frame ready — download or share it 🎉", "success");
  }
  return true;
}

generateBtn.addEventListener("click", () => runGenerate({ auto: false, celebrate: true }));

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
  showToast("Image downloaded — attach it to the X post that just opened.", "info", 4500);
});

refreshForModeChange();
