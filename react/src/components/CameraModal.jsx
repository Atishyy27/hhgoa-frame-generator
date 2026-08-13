import { useEffect, useRef, useState } from "react";

export default function CameraModal({ open, onCapture, onClose, showToast }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timeoutRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setReady(false);

    async function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast("Camera isn't available on this browser — upload a photo instead.", "error");
        onClose();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        showToast("Couldn't access the camera — check permissions.", "error");
        onClose();
        return;
      }

      timeoutRef.current = setTimeout(() => {
        setReady(current => {
          if (!current) {
            showToast("Camera feed isn't coming through — this device's camera may not be working. Upload a photo instead.", "error", 5000);
          }
          return current;
        });
      }, 4000);
    }

    start();

    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  function handleLoadedMetadata() {
    clearTimeout(timeoutRef.current);
    setReady(true);
  }

  function handleCapture() {
    const video = videoRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      showToast("Camera not ready yet — try again.", "error");
      return;
    }
    const shot = document.createElement("canvas");
    shot.width = w;
    shot.height = h;
    const sctx = shot.getContext("2d");
    // Mirror the capture to match what the user saw in the (CSS-mirrored) preview.
    sctx.translate(w, 0);
    sctx.scale(-1, 1);
    sctx.drawImage(video, 0, 0, w, h);
    onCapture(shot);
  }

  return (
    <div className="camera-modal">
      <video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={handleLoadedMetadata} />
      <div className="camera-actions">
        <button type="button" className="primary-btn" onClick={handleCapture} disabled={!ready}>
          {ready ? "Capture" : "Starting…"}
        </button>
        <button type="button" className="link-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
