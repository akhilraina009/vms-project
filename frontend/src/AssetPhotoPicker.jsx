import { useState, useRef, useEffect } from "react";
import { Camera, Upload, RefreshCw, X } from "lucide-react";

const PHOTO_BASE_URL = "http://127.0.0.1:8000";

function defaultResolvePhotoUrl(url) {
  if (!url) return null;
  const clean = String(url).trim().replace(/\\/g, "/");
  if (
    clean.startsWith("data:") ||
    clean.startsWith("blob:") ||
    clean.startsWith("http://") ||
    clean.startsWith("https://")
  ) {
    return clean;
  }
  if (clean.includes("/uploads/")) {
    const uploadIndex = clean.indexOf("/uploads/");
    return clean.slice(uploadIndex);
  }
  if (clean.startsWith("uploads/")) {
    return `/${clean}`;
  }
  return `${PHOTO_BASE_URL}${clean.startsWith("/") ? "" : "/"}${clean}`;
}

export default function AssetPhotoPicker({
  photoData,
  photoUrl,
  onPhotoChange,
  label = "Hardware Photo (Physical Asset Inspection)",
  resolveFn = defaultResolvePhotoUrl,
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera requires a modern browser and secure context (HTTPS/localhost).");
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);

      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.error("Video play error:", e);
          }
        }
      }, 60);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera permission was denied or camera is in use.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCameraError("Please wait until camera stream is ready.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onPhotoChange(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Please choose a valid image file (JPEG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        onPhotoChange(dataUrl);
        stopCamera();
      };
      img.src = loadEvt.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const currentDisplayPhoto = photoData || (photoUrl ? resolveFn(photoUrl) : "");

  return (
    <div style={{ marginTop: "12px", padding: "12px", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.3px", display: "flex", alignItems: "center", gap: "5px" }}>
          <Camera size={13} color="#2563eb" /> {label}
        </span>
        {currentDisplayPhoto && (
          <span style={{ fontSize: "10.5px", color: "#166534", background: "#f0fdf4", padding: "2px 7px", borderRadius: "4px", fontWeight: 600, border: "1px solid #bbf7d0" }}>
            ✓ Photo Attached
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {cameraActive && (
        <div style={{ background: "#000000", borderRadius: "8px", overflow: "hidden", marginBottom: "10px", position: "relative" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", maxHeight: "240px", objectFit: "cover", display: "block" }}
          />
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", padding: "10px", background: "rgba(0,0,0,0.75)" }}>
            <button
              type="button"
              onClick={capturePhoto}
              style={{ padding: "8px 18px", background: "#16a34a", color: "white", border: "none", borderRadius: "6px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Camera size={14} /> Snap Photo
            </button>
            <button
              type="button"
              onClick={stopCamera}
              style={{ padding: "8px 14px", background: "#475569", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!cameraActive && currentDisplayPhoto && (
        <div className="app-photo-preview-card" style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", padding: "10px", borderRadius: "8px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1", flexShrink: 0, position: "relative" }}>
            <img
              src={currentDisplayPhoto}
              alt="Hardware asset"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={startCamera}
              style={{ padding: "6px 12px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <RefreshCw size={12} /> Retake with Camera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: "6px 12px", background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <Upload size={12} /> Upload Different File
            </button>
            <button
              type="button"
              onClick={() => onPhotoChange("")}
              style={{ padding: "6px 10px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      )}

      {!cameraActive && !currentDisplayPhoto && (
        <div className="app-photo-picker-box" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", padding: "10px 14px", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <Camera size={19} />
            </div>
            <div>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>Asset Photo (Camera or Upload)</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Capture a snapshot of the item or choose an image file for gate clearance</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={startCamera}
              style={{ padding: "7px 14px", background: "#0284c7", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Camera size={13} /> Camera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: "7px 14px", background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Upload size={13} /> Upload File
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <div style={{ marginTop: "6px", fontSize: "11px", color: "#b91c1c", fontWeight: 500 }}>
          ⚠️ {cameraError}
        </div>
      )}
    </div>
  );
}
