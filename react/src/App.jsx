import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Dropzone from "./components/Dropzone";
import CameraModal from "./components/CameraModal";
import { useToasts } from "./hooks/useToasts";
import { useConfetti } from "./hooks/useConfetti";
import { useCountdown } from "./hooks/useCountdown";
import { loadImageFile } from "./lib/loadImage";
import { removeBackground } from "./lib/bgRemove";
import {
  SIZE, drawForMode, ensureFontsReady, generateTitle, generatePassId,
} from "./lib/draw";

const LIVE_URL = "https://atishyy27.github.io/hhgoa-frame-generator/";
const SHARE_CAPTION = "Locked in for HH Goa 2026 🌴 #FrameInGoa";

export default function App() {
  const canvasRef = useRef(null);
  const confettiCanvasRef = useRef(null);
  const flashRef = useRef(null);
  const audioRef = useRef(null);
  const lastBlobRef = useRef(null);
  const cursorGlowRef = useRef(null);
  const reduceMotion = useRef(window.matchMedia("(prefers-reduced-motion: reduce)").matches).current;

  const [mode, setMode] = useState("pfp");
  const [singlePhoto, setSinglePhoto] = useState(null);
  const [singlePhotoProcessed, setSinglePhotoProcessed] = useState(null);
  const [multiPhotos, setMultiPhotos] = useState([]);
  const [thumbSingleSrc, setThumbSingleSrc] = useState(null);
  const [thumbsMultiSrc, setThumbsMultiSrc] = useState([]);
  const [passId, setPassId] = useState(null);
  const [bgRemoveChecked, setBgRemoveChecked] = useState(false);
  const [bgRemoving, setBgRemoving] = useState(false);

  const [name, setName] = useState("");
  const [stack, setStack] = useState("");
  const [title, setTitle] = useState("");
  const [vibes, setVibes] = useState("");
  const [quote, setQuote] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [githubHandle, setGithubHandle] = useState("");

  const [cameraOpen, setCameraOpen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [rerollSpin, setRerollSpin] = useState(false);

  const { toasts, showToast } = useToasts();
  const burstConfetti = useConfetti(confettiCanvasRef, reduceMotion);
  const countdownText = useCountdown();

  const celebrateRef = useRef(false);

  /* cursor glow */
  useEffect(() => {
    if (reduceMotion || !window.matchMedia("(hover: hover)").matches) return;
    const el = cursorGlowRef.current;
    const onMove = e => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      el.classList.add("active");
    };
    const onLeave = () => el.classList.remove("active");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [reduceMotion]);

  /* deterministic title from name+stack — reroll overrides until next keystroke */
  useEffect(() => {
    const seed = `${name}|${stack}`;
    setTitle(generateTitle(seed.trim() ? seed : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, stack]);

  /* assign a pass id the first time a photo exists in id-eligible state */
  useEffect(() => {
    if (mode === "id" && singlePhoto && !passId) setPassId(generatePassId());
  }, [mode, singlePhoto, passId]);

  const idData = useMemo(() => ({
    name: name.trim(),
    stack: stack.trim(),
    title,
    quote: quote.trim(),
    vibes: vibes.trim(),
    xHandle: xHandle.trim(),
    githubHandle: githubHandle.trim(),
    passId,
  }), [name, stack, title, quote, vibes, xHandle, githubHandle, passId]);

  const activePhoto = bgRemoveChecked && singlePhotoProcessed ? singlePhotoProcessed : singlePhoto;
  const hasContent = mode === "team" ? multiPhotos.length >= 2 : !!singlePhoto;

  /* the reactive redraw — debounced so typing doesn't hammer the canvas */
  useEffect(() => {
    const timer = setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      await ensureFontsReady();
      const ctx = canvas.getContext("2d");

      if (!hasContent) {
        drawForMode(ctx, mode, { singlePhoto: null, multiPhotos: [], idData });
        setReady(false);
        lastBlobRef.current = null;
        return;
      }

      drawForMode(ctx, mode, { singlePhoto: activePhoto, multiPhotos, idData });
      setReady(true);
      if (flashRef.current) {
        flashRef.current.classList.remove("play");
        void flashRef.current.offsetWidth;
        flashRef.current.classList.add("play");
      }
      canvas.toBlob(blob => {
        lastBlobRef.current = blob;
        if (celebrateRef.current) {
          celebrateRef.current = false;
          burstConfetti();
          showToast("Frame ready — download or share it 🎉", "success");
        }
      }, "image/png");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activePhoto, multiPhotos, idData, hasContent]);

  function handleGenerateClick() {
    if (!hasContent) {
      showToast(mode === "team" ? "Upload at least 2 team photos." : "Upload a photo first.", "error");
      return;
    }
    celebrateRef.current = true;
    // force an immediate redraw + celebration even if nothing else changed
    const canvas = canvasRef.current;
    ensureFontsReady().then(() => {
      const ctx = canvas.getContext("2d");
      drawForMode(ctx, mode, { singlePhoto: activePhoto, multiPhotos, idData });
      flashRef.current.classList.remove("play");
      void flashRef.current.offsetWidth;
      flashRef.current.classList.add("play");
      canvas.toBlob(blob => {
        lastBlobRef.current = blob;
        burstConfetti();
        showToast("Frame ready — download or share it 🎉", "success");
        celebrateRef.current = false;
      }, "image/png");
    });
  }

  async function handleSingleFiles(files) {
    let img;
    try {
      img = await loadImageFile(files[0]);
    } catch {
      showToast("Couldn't read that image — try a different file.", "error");
      return;
    }
    setSinglePhoto(img);
    setSinglePhotoProcessed(null);
    setPassId(null);
    setBgRemoveChecked(false);
    setThumbSingleSrc(img.src);
  }

  async function handleMultiFiles(files) {
    if (files.length > 4) showToast("Only using the first 4 photos.", "info");
    const picked = files.slice(0, 4);
    let imgs;
    try {
      imgs = await Promise.all(picked.map(loadImageFile));
    } catch {
      showToast("Couldn't read one of those images — try different files.", "error");
      return;
    }
    setMultiPhotos(imgs);
    setThumbsMultiSrc(imgs.map(img => img.src));
  }

  function handleCameraCapture(shot) {
    setCameraOpen(false);
    setSinglePhoto(shot);
    setSinglePhotoProcessed(null);
    setPassId(null);
    setBgRemoveChecked(false);
    setThumbSingleSrc(shot.toDataURL("image/png"));
  }

  async function toggleBgRemove() {
    const next = !bgRemoveChecked;
    setBgRemoveChecked(next);
    if (!next || !singlePhoto) return;
    if (singlePhotoProcessed) return;
    showToast("Removing background…", "info", 4000);
    setBgRemoving(true);
    try {
      const result = await removeBackground(singlePhoto);
      setSinglePhotoProcessed(result);
      showToast("Background removed.", "success");
    } catch (err) {
      console.warn("bg removal unavailable:", err);
      setBgRemoveChecked(false);
      showToast("Background removal isn't available here — using the original photo.", "error");
    } finally {
      setBgRemoving(false);
    }
  }

  function handleReroll() {
    setTitle(generateTitle(null));
    setRerollSpin(false);
    requestAnimationFrame(() => setRerollSpin(true));
  }

  function handleDownload() {
    if (!lastBlobRef.current) return;
    const url = URL.createObjectURL(lastBlobRef.current);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hhgoa-2026-frame.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function handleShareX() {
    if (!lastBlobRef.current) return;
    const file = new File([lastBlobRef.current], "hhgoa-2026-frame.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: SHARE_CAPTION });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    handleDownload();
    window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(SHARE_CAPTION), "_blank", "noopener");
    showToast("Image downloaded — attach it to the X post that just opened.", "info", 4500);
  }

  function handleShareWhatsapp() {
    if (!lastBlobRef.current) return;
    handleDownload();
    const text = `${SHARE_CAPTION}\n${LIVE_URL}`;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
    showToast("Image downloaded — attach it in the WhatsApp chat that just opened.", "info", 4500);
  }

  function handleShareLinkedin() {
    if (!lastBlobRef.current) return;
    handleDownload();
    window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(LIVE_URL), "_blank", "noopener");
    showToast("Image downloaded — LinkedIn doesn't accept a pre-filled caption, paste it and attach the image yourself.", "info", 5500);
  }

  async function handleShareCopy() {
    const text = `${SHARE_CAPTION}\n${LIVE_URL}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Caption copied — paste it into Instagram (or anywhere) and attach the downloaded image.", "success", 4500);
    } catch {
      showToast("Couldn't copy automatically — caption: " + text, "info", 6000);
    }
  }

  function toggleAudio() {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().then(() => setAudioPlaying(true)).catch(() => showToast("Couldn't start audio — try again.", "error"));
    } else {
      audio.pause();
      setAudioPlaying(false);
    }
  }

  const hint = hasContent
    ? null
    : (mode === "team"
      ? "showing a placeholder — upload 2-4 team photos to personalize"
      : "showing a placeholder — upload your photo to personalize");

  return (
    <>
      <div className="cursor-glow" ref={cursorGlowRef} />
      <canvas className="confetti-canvas" ref={confettiCanvasRef} />
      <div className="toast-stack" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}${t.leaving ? " leaving" : ""}`}>{t.message}</div>
        ))}
      </div>

      <button
        type="button"
        className="audio-toggle"
        title="Toggle ambient beach audio"
        aria-pressed={audioPlaying}
        onClick={toggleAudio}
      >
        <span>{audioPlaying ? "🔊" : "🔇"}</span>
      </button>
      <audio ref={audioRef} loop preload="none"
        src="https://archive.org/download/naturesounds-soundtheraphy/Birds%20With%20Ocean%20Waves%20on%20the%20Beach.mp3" />

      <div className="marquee">
        <div className="marquee-track">
          <span>BUILD. SHIP. REPEAT. &nbsp;·&nbsp; #FrameInGoa &nbsp;·&nbsp; HH GOA 2026 &nbsp;·&nbsp; LESS NOISE, MORE SIGNAL &nbsp;·&nbsp; </span>
          <span>BUILD. SHIP. REPEAT. &nbsp;·&nbsp; #FrameInGoa &nbsp;·&nbsp; HH GOA 2026 &nbsp;·&nbsp; LESS NOISE, MORE SIGNAL &nbsp;·&nbsp; </span>
        </div>
      </div>

      <div className="postcard-frame">
        <div className="pf-stamp">
          <span>GOA · INDIA</span>
          <span className="pf-stamp-year">HH 2026</span>
        </div>
        <div className="pf-mail" aria-hidden="true">✉️</div>

        <header className="site-header reveal" style={{ "--delay": 0 }}>
          <span className="brand-mark">2:47</span>
          <h1>HH GOA <span className="year">2026</span> — Frame Generator</h1>
          <p className="tagline">upload. frame. ship it with #FrameInGoa.</p>
        </header>

        <div className="countdown reveal" style={{ "--delay": 1 }}>
          <span className="countdown-label">✈ GOA ARRIVAL · 28 OCT 2026</span>
          <span className="countdown-value">{countdownText}</span>
        </div>

        <main>
          <div className="tabs reveal" style={{ "--delay": 2 }} role="tablist">
            {["pfp", "id", "team"].map(m => (
              <button
                key={m}
                className={`tab${mode === m ? " active" : ""}`}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
              >
                {m === "pfp" ? "PFP Frame" : m === "id" ? "Builder ID" : "Team Frame"}
              </button>
            ))}
          </div>

          <section className="panel reveal" style={{ "--delay": 3 }}>
            <div className="controls">
              {(mode === "pfp" || mode === "id") && (
                <Dropzone
                  label="Photo"
                  hint="drop a photo or tap to upload"
                  onFiles={handleSingleFiles}
                  thumbs={thumbSingleSrc ? <img className="dropzone-thumb" src={thumbSingleSrc} alt="" /> : null}
                  extra={
                    <>
                      <div className="secondary-row">
                        <button type="button" className="link-btn" onClick={() => setCameraOpen(true)}>
                          📷 or take a selfie
                        </button>
                      </div>
                      {singlePhoto && (
                        <label className="checkbox-row">
                          <input type="checkbox" checked={bgRemoveChecked} onChange={toggleBgRemove} disabled={bgRemoving} />
                          <span>Remove background <em>(beta, ~2-5s)</em></span>
                        </label>
                      )}
                    </>
                  }
                />
              )}

              {mode === "team" && (
                <Dropzone
                  label="Team photos (2–4)"
                  hint="drop 2-4 photos or tap to upload"
                  multiple
                  onFiles={handleMultiFiles}
                  thumbs={thumbsMultiSrc.length ? (
                    <div className="dropzone-thumbs">
                      {thumbsMultiSrc.map((src, i) => <img key={i} src={src} alt="" />)}
                    </div>
                  ) : null}
                />
              )}

              {mode === "id" && (
                <>
                  <div className="field">
                    <label>Name</label>
                    <input type="text" value={name} maxLength={24} placeholder="Your name" onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Stack / Role</label>
                    <input type="text" value={stack} maxLength={28} placeholder="e.g. Full-stack, Solidity, Design" onChange={e => setStack(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Builder class</label>
                    <div className="title-row">
                      <input type="text" value={title} readOnly placeholder="auto-generated" />
                      <button type="button" className={rerollSpin ? "spinning" : ""} title="Reroll builder class" onClick={handleReroll}>⟳</button>
                    </div>
                  </div>
                  <div className="field">
                    <label>Vibes <em>(optional, comma-separated)</em></label>
                    <input type="text" value={vibes} maxLength={60} placeholder="e.g. Music, Photography, Surfing" onChange={e => setVibes(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Quote / tagline <em>(optional)</em></label>
                    <input type="text" value={quote} maxLength={60} placeholder="e.g. Build with purpose. Ship with courage." onChange={e => setQuote(e.target.value)} />
                  </div>
                  <div className="field field-split">
                    <div>
                      <label>X handle <em>(optional)</em></label>
                      <input type="text" value={xHandle} maxLength={20} placeholder="@yourhandle" onChange={e => setXHandle(e.target.value)} />
                    </div>
                    <div>
                      <label>GitHub <em>(optional)</em></label>
                      <input type="text" value={githubHandle} maxLength={24} placeholder="username" onChange={e => setGithubHandle(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              <button type="button" className="primary-btn" onClick={handleGenerateClick}>Generate</button>
            </div>

            <div className="preview">
              <div className="canvas-wrap">
                <canvas ref={canvasRef} id="canvas" width={SIZE} height={SIZE} className={ready ? "ready" : ""} />
                <div className="canvas-flash" ref={flashRef} />
              </div>
              {hint && <p className="hint">{hint}</p>}
              <div className="actions">
                <button type="button" disabled={!ready} onClick={handleDownload}>Download PNG</button>
                <button type="button" disabled={!ready} onClick={handleShareX}>Share to X</button>
              </div>
              <div className="share-more">
                <button type="button" className="share-chip" disabled={!ready} onClick={handleShareWhatsapp}>WhatsApp</button>
                <button type="button" className="share-chip" disabled={!ready} onClick={handleShareLinkedin}>LinkedIn</button>
                <button type="button" className="share-chip" disabled={!ready} onClick={handleShareCopy}>Copy caption</button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <div className="marquee marquee-reverse">
        <div className="marquee-track marquee-track-reverse">
          <span>#FrameInGoa &nbsp;·&nbsp; 247 BUILDERS &nbsp;·&nbsp; GOA, INDIA &nbsp;·&nbsp; 28-31 OCT 2026 &nbsp;·&nbsp; </span>
          <span>#FrameInGoa &nbsp;·&nbsp; 247 BUILDERS &nbsp;·&nbsp; GOA, INDIA &nbsp;·&nbsp; 28-31 OCT 2026 &nbsp;·&nbsp; </span>
        </div>
      </div>

      <footer className="site-footer">
        <p>fan-built for HH Goa 2026 Task #1 · not an official HH Goa / 247pm Studio product</p>
      </footer>

      <CameraModal
        open={cameraOpen}
        onCapture={handleCameraCapture}
        onClose={() => setCameraOpen(false)}
        showToast={showToast}
      />
    </>
  );
}
