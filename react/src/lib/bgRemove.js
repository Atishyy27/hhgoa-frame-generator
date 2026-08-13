// Client-side background removal via Google's MediaPipe Selfie Segmenter.
// Ported as-is from the vanilla build. That version went through two real
// iterations: a first attempt routed the category mask through WebGL +
// DrawingUtils.drawCategoryMask() and, in real-browser testing, wiped the
// *entire* photo instead of just the background — a blank mask from a
// WebGL-context mismatch that static review never caught. This version uses
// categoryMask.getAsUint8Array() instead (one byte per pixel = class index,
// per MediaPipe's own docs) — no WebGL context to get wrong. Keeping that
// fixed approach here rather than re-deriving it.

const MEDIAPIPE_VERSION = "0.10.14";
const VISION_BUNDLE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/vision_bundle.mjs`;
const VISION_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const SELFIE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

let segmenterPromise = null;

function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, ImageSegmenter } = await import(/* @vite-ignore */ VISION_BUNDLE_URL);
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

export async function removeBackground(img) {
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
