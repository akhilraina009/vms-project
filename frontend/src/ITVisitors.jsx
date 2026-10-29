import { useCallback, useEffect, useState, useRef } from "react";
import "./ITVisit.css";
import {
  Users,
  Laptop,
  ArrowRight,
  ArrowRightCircle,
  Columns,
  Scan,
  Smartphone,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ArrowLeft,
  X,
  Eye,
  Building2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Server,
  QrCode,
  Tag,
  AlertTriangle,
  HardDrive,
  Briefcase,
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter,
  LogOut,
  Camera,
  UserCheck,
  Printer,
  Check,
  CheckCheck,
  Plus,
  Trash2,
  Edit3,
  Package,
  Upload,
} from "lucide-react";
import QRCode from "qrcode";

const API_BASE_URL = "";
const PHOTO_BASE_URL = "";

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("vms_token") || localStorage.getItem("guard_token") || "";
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, {
    ...options,
    headers,
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function resolvePhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  if (
    photoUrl.startsWith("http://") ||
    photoUrl.startsWith("https://") ||
    photoUrl.startsWith("data:")
  ) {
    return photoUrl;
  }
  return `${PHOTO_BASE_URL}${photoUrl}`;
}

function AssetPhotoPicker({ photoData, photoUrl, onPhotoChange, label = "Hardware Photo (Physical Asset Inspection)" }) {
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

  const currentDisplayPhoto = photoData || (photoUrl ? resolvePhotoUrl(photoUrl) : "");

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
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", padding: "10px 14px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
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

function getInitials(name) {
  if (!name) return "IT";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Clean purpose string by removing technical tags for display
function getCleanPurpose(purpose) {
  if (!purpose) return "IT Technical Maintenance & Support";
  return (
    purpose
      .replace(/\[IT_VISIT\]\s*/gi, "")
      .replace(/\|\s*Area:[^|]+/gi, "")
      .replace(/\|\s*Ticket:[^|]+/gi, "")
      .replace(/\|\s*ID:[^|]+/gi, "")
      .trim() || "IT Technical Maintenance"
  );
}

function getAreaBadge(purpose) {
  if (!purpose) return null;
  const match = purpose.match(/Area:\s*([^|]+)/i);
  return match ? match[1].trim() : null;
}

function getTicketBadge(purpose) {
  if (!purpose) return null;
  const match = purpose.match(/Ticket:\s*([^|]+)/i);
  return match ? match[1].trim() : null;
}


function categorizeAsset(asset) {
  const text = `${asset?.asset_type || ""} ${asset?.brand_model || ""}`.toLowerCase();
  if (
    text.includes("laptop") ||
    text.includes("notebook") ||
    text.includes("macbook") ||
    text.includes("thinkpad") ||
    text.includes("computer") ||
    text.includes("pc")
  ) {
    return "Laptop";
  }
  if (
    text.includes("mobile") ||
    text.includes("phone") ||
    text.includes("iphone") ||
    text.includes("android") ||
    text.includes("tablet") ||
    text.includes("ipad") ||
    text.includes("smartphone")
  ) {
    return "Mobile";
  }
  return "Others";
}

function getFormattedVisitId(visit, visitorId) {
  if (visit?.pass_number) return visit.pass_number;
  const vid = String(visit?.visit_id || visitorId || "001");
  if (vid.startsWith("V-")) return vid;
  const clean = vid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const dateStr = visit?.check_in_time
    ? new Date(visit.check_in_time).toISOString().slice(0, 10).replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `V-${dateStr}-${clean.slice(-3) || "001"}`;
}

function Laptop3DIcon() {
  return (
    <svg width="68" height="56" viewBox="0 0 68 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="34" cy="48" rx="28" ry="6" fill="#bfdbfe" fillOpacity="0.45" />
      <path d="M12 36L22 10C22.5 8.5 24 7.5 25.5 7.5H48.5C50 7.5 51.5 8.5 52 10L60 36H12Z" fill="#3b82f6" />
      <path d="M14 34L23 12C23.3 11 24.2 10 25.5 10H47C48.2 10 49.2 11 49.5 12L56 34H14Z" fill="#1e40af" />
      <rect x="25" y="14" width="20" height="15" rx="2" fill="#60a5fa" fillOpacity="0.8" />
      <path d="M28 18H40M28 22H36" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 38C6 36.5 7.2 35.5 8.7 35.5H59.3C60.8 35.5 62 36.5 62 38L64 43C64 44.5 62.8 45.5 61.3 45.5H6.7C5.2 45.5 4 44.5 4 43L6 38Z" fill="#93c5fd" />
      <path d="M8 38H60L58 42H10L8 38Z" fill="#dbeafe" />
      <rect x="29" y="39" width="10" height="2" rx="1" fill="#60a5fa" />
    </svg>
  );
}

function PackageCheck3DIcon() {
  return (
    <svg width="68" height="56" viewBox="0 0 68 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="48" rx="26" ry="6" fill="#bbf7d0" fillOpacity="0.5" />
      <path d="M12 24L32 12L52 24L32 36L12 24Z" fill="#4ade80" />
      <path d="M12 24L32 36V48L12 36V24Z" fill="#22c55e" />
      <path d="M52 24L32 36V48L52 36V24Z" fill="#16a34a" />
      <path d="M32 12L24 8L16 16L24 20L32 12Z" fill="#86efac" />
      <path d="M32 12L40 8L48 16L40 20L32 12Z" fill="#86efac" />
      <circle cx="46" cy="40" r="11" fill="#15803d" stroke="#ffffff" strokeWidth="2.5" />
      <path d="M42 40L45 43L50 37" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssetFallbackIcon({ category }) {
  if (category === "Laptop") {
    return (
      <svg width="26" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="2" fill="#eff6ff" />
        <path d="M2 18h20v2H2z" fill="#93c5fd" />
      </svg>
    );
  }
  if (category === "Mobile") {
    return (
      <svg width="22" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="3" fill="#f0fdf4" />
        <circle cx="12" cy="18" r="1" fill="#16a34a" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" fill="#fffbeb" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

export default function ITVisitors({ onBack, onNotification, onOpenScanner }) {
  const [visitors, setVisitors] = useState([]);
  const [summary, setSummary] = useState({
    total_it_visitors: 0,
    currently_inside: 0,
    total_assets: 0,
    total_companies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'inside' | 'corporate' | 'assets'
  const [selectedCompany, setSelectedCompany] = useState("");

  // Detailed Modal State
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [dossierViewMode, setDossierViewMode] = useState("checkin"); // 'checkin' | 'checkout' | 'dual' | 'overview'
  const [dossierData, setDossierData] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [directCheckoutLoading, setDirectCheckoutLoading] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [isAddingAsset, setIsAddingAsset] = useState(null); // null | "checkin" | "checkout"
  const [newAssetForm, setNewAssetForm] = useState({
    asset_type: "Laptop",
    brand_model: "",
    serial_number: "",
    photo_data: "",
    disposition: "CARRIED_OUT",
    retention_note: "",
  });
  const [assetOpLoading, setAssetOpLoading] = useState(false);

  // Portal QR Modal
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [portalQrData, setPortalQrData] = useState("");

  const fetchTechnicianDossier = async (visitorId) => {
    const vId = visitorId || selectedVisitor?.visitor_id;
    if (!vId) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/visitors/${vId}`);
      if (res.ok) {
        const fullDetails = await res.json();
        setDossierData(fullDetails);
        setSelectedVisitor((prev) => (prev ? { ...prev, ...fullDetails } : prev));
      }
    } catch (e) {
      console.warn("Could not fetch detailed dossier:", e);
    }
  };

  const openTechnicianDossier = async (item, initialMode = "overview") => {
    setSelectedVisitor(item);
    setDossierViewMode(initialMode);
    setDossierData(null);
    setDossierLoading(true);
    try {
      await fetchTechnicianDossier(item.visitor_id);
    } finally {
      setDossierLoading(false);
    }
  };

  // Asset Management Handlers (After Check-in, Before Checkout)
  const handleUpdateAssetDisposition = async (assetId, disposition, retentionNote = "") => {
    try {
      setAssetOpLoading(true);
      const res = await apiFetch(`${API_BASE_URL}/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disposition,
          retention_note: retentionNote || (disposition === "RETAINED_ON_PREMISES" ? "Installed in facility / kept in use" : ""),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update asset disposition");
      }
      const updated = await res.json();
      if (selectedVisitor?.visitor_id) {
        fetchTechnicianDossier(selectedVisitor.visitor_id);
      }
      await fetchData();
    } catch (err) {
      console.error("Asset disposition error:", err);
      alert(err.message || "Failed to update asset disposition.");
    } finally {
      setAssetOpLoading(false);
    }
  };

  const handleCreateNewAsset = async (visitId) => {
    if (!visitId) return;
    if (!newAssetForm.asset_type.trim()) {
      alert("Please enter or select an asset type.");
      return;
    }
    try {
      setAssetOpLoading(true);
      const isCleared = newAssetForm.disposition === "CARRIED_OUT" || newAssetForm.disposition === "RETAINED_ON_PREMISES";
      const res = await apiFetch(`${API_BASE_URL}/assets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visit_id: visitId,
          asset_type: newAssetForm.asset_type.trim(),
          brand_model: newAssetForm.brand_model.trim() || null,
          serial_number: newAssetForm.serial_number.trim() || null,
          photo_data: newAssetForm.photo_data || null,
          is_cleared_for_exit: isCleared,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to register new asset");
      }
      const created = await res.json();
      if (newAssetForm.disposition === "RETAINED_ON_PREMISES") {
        await apiFetch(`${API_BASE_URL}/assets/${created.asset_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            disposition: "RETAINED_ON_PREMISES",
            retention_note: newAssetForm.retention_note.trim() || "Installed in facility / kept in use",
          }),
        });
      }
      setIsAddingAsset(false);
      setNewAssetForm({
        asset_type: "Laptop",
        brand_model: "",
        serial_number: "",
        photo_data: "",
        disposition: "CARRIED_OUT",
        retention_note: "",
      });
      if (selectedVisitor?.visitor_id) {
        fetchTechnicianDossier(selectedVisitor.visitor_id);
      }
      await fetchData();
    } catch (err) {
      console.error("Create asset error:", err);
      alert(err.message || "Failed to add asset.");
    } finally {
      setAssetOpLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId, assetName) => {
    if (!window.confirm(`Are you sure you want to remove "${assetName || "this asset"}" from the visit registry?`)) return;
    try {
      setAssetOpLoading(true);
      const res = await apiFetch(`${API_BASE_URL}/assets/${assetId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete asset");
      }
      if (selectedVisitor?.visitor_id) {
        fetchTechnicianDossier(selectedVisitor.visitor_id);
      }
      await fetchData();
    } catch (err) {
      console.error("Delete asset error:", err);
      alert(err.message || "Failed to delete asset.");
    } finally {
      setAssetOpLoading(false);
    }
  };

  const handleSaveAssetEdit = async (assetId) => {
    if (!editingAsset) return;
    try {
      setAssetOpLoading(true);
      const res = await apiFetch(`${API_BASE_URL}/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_type: editingAsset.asset_type,
          brand_model: editingAsset.brand_model,
          serial_number: editingAsset.serial_number,
          photo_data: editingAsset.photo_data || null,
          disposition: editingAsset.disposition,
          retention_note: editingAsset.retention_note,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update asset");
      }
      setEditingAsset(null);
      if (selectedVisitor?.visitor_id) {
        fetchTechnicianDossier(selectedVisitor.visitor_id);
      }
      await fetchData();
    } catch (err) {
      console.error("Save asset edit error:", err);
      alert(err.message || "Failed to save asset changes.");
    } finally {
      setAssetOpLoading(false);
    }
  };

  const handleDirectCheckout = async (visitId, visitorName, forceClear = false) => {
    if (!visitId) {
      alert(`${visitorName || "This IT technician"} does not have an active onsite visit (already checked out).`);
      return;
    }
    const confirmed = window.confirm(
      forceClear
        ? `Confirm exit clearance of all declared hardware & equipment and check out ${visitorName || "this IT technician"} now?`
        : `Check out ${visitorName || "this IT technician"} from campus now?`
    );
    if (!confirmed) return;

    try {
      setDirectCheckoutLoading(String(visitId));
      const url = forceClear
        ? `${API_BASE_URL}/visits/checkout/${visitId}?clear_assets=true`
        : `${API_BASE_URL}/visits/checkout/${visitId}`;
      const res = await apiFetch(url, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.status === "ASSETS_PENDING_CLEARANCE") {
        if (data.status === "ASSETS_PENDING_CLEARANCE") {
          const autoClear = window.confirm(
            `Notice: ${visitorName || "This IT technician"} has declared diagnostic or hardware assets requiring exit clearance.\n\n` +
            `Do you want to verify and clear all declared hardware assets to complete checkout immediately?`
          );
          if (autoClear) {
            return handleDirectCheckout(visitId, visitorName, true);
          }
          return;
        }
        throw new Error(data.message || data.detail || `Checkout failed (${res.status})`);
      }

      alert(`IT Technician ${visitorName || ""} has been checked out successfully. Campus departure recorded.`);
      await fetchData();
      if (selectedVisitor) {
        setSelectedVisitor((prev) => prev ? {
          ...prev,
          is_inside: false,
          active_visit: null,
          latest_visit: { ...(prev.latest_visit || {}), status: "CHECKED_OUT" },
        } : null);
        if (dossierData) {
          setDossierData((prev) => prev ? {
            ...prev,
            active_visit: null,
            visitor: { ...prev.visitor, is_inside: false },
          } : null);
        }
      }
    } catch (err) {
      console.error("IT Checkout error:", err);
      alert(err.message || "Unable to check out technician.");
    } finally {
      setDirectCheckoutLoading("");
    }
  };

  const handleDirectCheckIn = async (visitId, visitorName) => {
    if (!visitId) {
      alert("No pending IT visit found to check in.");
      return;
    }
    const confirmed = window.confirm(
      `Authorize campus gate admission and check in IT Technician ${visitorName || "this technician"} now?`
    );
    if (!confirmed) return;

    try {
      setDirectCheckoutLoading(String(visitId));
      const res = await apiFetch(`${API_BASE_URL}/visits/${visitId}/check-in`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.detail || `Check-in failed (${res.status})`);
      }
      alert(`IT Technician ${visitorName || ""} has been checked in successfully.`);
      await fetchData();
      if (selectedVisitor) {
        setSelectedVisitor((prev) => prev ? {
          ...prev,
          is_inside: true,
          active_visit: { ...(prev.pending_visit || prev.latest_visit || {}), status: "ACTIVE" },
        } : null);
        if (dossierData) {
          setDossierData((prev) => prev ? {
            ...prev,
            active_visit: { ...(prev.visitor?.latest_visit || {}), status: "ACTIVE" },
            visitor: { ...prev.visitor, is_inside: true },
          } : null);
        }
      }
    } catch (err) {
      console.error("IT Check-in error:", err);
      alert(err.message || "Unable to check in technician.");
    } finally {
      setDirectCheckoutLoading("");
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    const targetVid = selectedVisitor?.visitor_id || dossierData?.visitor?.visitor_id;
    if (!file || !targetVid) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setPhotoUploading(true);
        const res = await apiFetch(`${API_BASE_URL}/visitors/${targetVid}/photo`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo_data: reader.result }),
        });
        if (!res.ok) throw new Error("Failed to update photograph.");
        const json = await res.json();
        setSelectedVisitor((prev) => prev ? ({ ...prev, photo_url: json.photo_url }) : null);
        setDossierData((prev) => prev ? ({ ...prev, visitor: { ...prev.visitor, photo_url: json.photo_url } }) : null);
        await fetchData();
      } catch (err) {
        alert(err.message || "Photo update failed.");
      } finally {
        setPhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetch(`${API_BASE_URL}/visitors/it`);
      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      if (!response.ok) {
        throw new Error(`Failed to load IT visitors directory (${response.status})`);
      }
      const data = await response.json();
      const rawVisitors = Array.isArray(data.visitors) ? data.visitors : [];
      // Strictly show only visitors who filled up the IT Visit form ([IT_VISIT])
      const itOnlyVisitors = rawVisitors.filter((v) => {
        const latestPurpose = String(v.latest_visit?.purpose || "");
        const anyItPurpose = (v.visits || []).some((vt) => String(vt.purpose || "").includes("[IT_VISIT]"));
        return latestPurpose.includes("[IT_VISIT]") || anyItPurpose;
      });
      setVisitors(itOnlyVisitors);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("IT Visitors fetch error:", err);
      setError(err.message || "Unable to load IT visitors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate QR for IT Visit Registration Portal
  const handleOpenPortalQR = async () => {
    const portalUrl = `${window.location.origin}/it-visit`;
    try {
      const qr = await QRCode.toDataURL(portalUrl, {
        width: 320,
        margin: 4,
        errorCorrectionLevel: "M",
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
      setPortalQrData(qr);
    } catch (e) {
      console.error(e);
    }
    setShowPortalModal(true);
  };

  // Distinct company list for filtering
  const distinctCompanies = Array.from(
    new Set(
      visitors
        .map((v) => v.company_name?.trim())
        .filter((c) => c && c.toLowerCase() !== "n/a" && c.toLowerCase() !== "none")
    )
  ).sort();

  // Filtered Visitors
  const filteredVisitors = visitors.filter((item) => {
    // Status / Mode filter
    if (filterMode === "inside" && !item.is_inside) return false;
    if (filterMode === "corporate" && (!item.company_name || item.company_name.toLowerCase() === "n/a")) return false;
    if (filterMode === "assets" && (item.total_assets || 0) === 0) return false;

    // Company dropdown filter
    if (selectedCompany && item.company_name?.trim() !== selectedCompany) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${item.first_name || ""} ${item.last_name || ""}`.toLowerCase();
      const comp = String(item.company_name || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const phone = String(item.phone_number || "").toLowerCase();
      const purpose = String(item.latest_visit?.purpose || "").toLowerCase();
      const city = String(item.city || "").toLowerCase();

      return (
        fullName.includes(q) ||
        comp.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        purpose.includes(q) ||
        city.includes(q)
      );
    }

    return true;
  });

  return (
    <div className="it-visitors-container">
      <div className={`it-visitors-main-content ${selectedVisitor ? "no-print" : ""}`}>
      {/* Header */}
      <div className="it-management-header">
        <div className="it-header-title-box">
          <div className="it-header-badge-row">
            <span className="it-division-pill">IT Department Division</span>
            <span className="it-telemetry-pill">
              <span className="status-dot"></span>
              Technical Personnel Directory
            </span>
          </div>
          <h2 className="it-page-title">IT Visitors &amp; Technical Contractors</h2>
          <p className="it-page-desc">
            Dedicated registry of IT technical personnel, field service engineers, hardware contractors, and datacenter technicians
          </p>
        </div>

        <div className="it-header-controls">
          <button
            type="button"
            className="it-qr-portal-btn"
            onClick={handleOpenPortalQR}
            title="Show IT Visit Registration Portal QR Code and Link"
          >
            <QrCode size={15} />
            <span>IT Visit Portal QR</span>
          </button>

          <button
            type="button"
            className="it-refresh-btn"
            onClick={fetchData}
            disabled={loading}
            title="Refresh IT visitors directory"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
          </button>

          {onBack && (
            <button type="button" className="it-qr-portal-btn" onClick={onBack}>
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Counter Bar */}
      <section className="stats-grid">
        <div
          className={`stat-card clickable ${filterMode === "all" && !selectedCompany ? "active-filter filter-blue" : ""}`}
          onClick={() => {
            setFilterMode("all");
            setSelectedCompany("");
          }}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon blue">
            <Users size={18} />
          </div>
          <div className="stat-content">
            <span>Total IT Visitors</span>
            <strong>{summary.total_it_visitors}</strong>
            <span className="stat-interactive-hint">
              {filterMode === "all" && !selectedCompany ? "● Active View" : "View all records"}
            </span>
          </div>
          <ChevronRight size={15} className={`stat-arrow ${filterMode === "all" ? "arrow-active" : ""}`} />
        </div>

        <div
          className={`stat-card clickable ${filterMode === "inside" ? "active-filter filter-green" : ""}`}
          onClick={() => {
            setFilterMode(filterMode === "inside" ? "all" : "inside");
            setSelectedCompany("");
          }}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon green">
            <Server size={18} />
          </div>
          <div className="stat-content">
            <span>Currently Inside (Onsite)</span>
            <strong style={{ color: "#059669" }}>{summary.currently_inside}</strong>
            <span className="stat-interactive-hint">
              {filterMode === "inside" ? "● Active View" : "Technicians on premises"}
            </span>
          </div>
          <ChevronRight size={15} className={`stat-arrow ${filterMode === "inside" ? "arrow-active" : ""}`} />
        </div>

        <div
          className={`stat-card clickable ${filterMode === "corporate" ? "active-filter filter-purple" : ""}`}
          onClick={() => {
            setFilterMode(filterMode === "corporate" ? "all" : "corporate");
          }}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon purple">
            <Building2 size={18} />
          </div>
          <div className="stat-content">
            <span>Service &amp; Hardware Partners</span>
            <strong>{summary.total_companies}</strong>
            <span className="stat-interactive-hint">
              {filterMode === "corporate" ? "● Active View" : "Affiliated vendor firms"}
            </span>
          </div>
          <ChevronRight size={15} className={`stat-arrow ${filterMode === "corporate" ? "arrow-active" : ""}`} />
        </div>

        <div
          className={`stat-card clickable ${filterMode === "assets" ? "active-filter filter-amber" : ""}`}
          onClick={() => {
            setFilterMode(filterMode === "assets" ? "all" : "assets");
            setSelectedCompany("");
          }}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon amber">
            <Laptop size={18} />
          </div>
          <div className="stat-content">
            <span>Declared Hardware Assets</span>
            <strong>{summary.total_assets}</strong>
            <span className="stat-interactive-hint">
              {filterMode === "assets" ? "● Active View" : "Items in custody / cleared"}
            </span>
          </div>
          <ChevronRight size={15} className={`stat-arrow ${filterMode === "assets" ? "arrow-active" : ""}`} />
        </div>
      </section>

      {/* Main Table Card */}
      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <h2>IT Visitors Directory</h2>
            <p>
              {loading
                ? "Loading IT visitor directory..."
                : `${filteredVisitors.length} of ${summary.total_it_visitors} technical visitor${
                    summary.total_it_visitors === 1 ? "" : "s"
                  } displayed`}
            </p>
          </div>
          <div className="visitor-toolbar-actions">
            <div className="search-field">
              <Search size={14} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search IT visitors by name, vendor, email, purpose..."
              />
              {searchQuery && (
                <button
                  type="button"
                  style={{ background: "transparent", border: 0, cursor: "pointer", color: "#94a3b8" }}
                  onClick={() => setSearchQuery("")}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              className="it-refresh-btn"
              onClick={fetchData}
              disabled={loading}
              title="Refresh IT visitors"
              type="button"
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="it-filter-pills-row">
          <button
            type="button"
            className={`it-filter-pill ${filterMode === "all" && !selectedCompany ? "active" : ""}`}
            onClick={() => {
              setFilterMode("all");
              setSelectedCompany("");
            }}
          >
            All IT Visitors ({summary.total_it_visitors})
          </button>
          <button
            type="button"
            className={`it-filter-pill ${filterMode === "inside" ? "active" : ""}`}
            onClick={() => {
              setFilterMode("inside");
              setSelectedCompany("");
            }}
          >
            <span className="live-dot"></span>
            Currently Inside ({summary.currently_inside})
          </button>
          <button
            type="button"
            className={`it-filter-pill ${filterMode === "corporate" ? "active" : ""}`}
            onClick={() => setFilterMode("corporate")}
          >
            Corporate &amp; Partners
          </button>
          <button
            type="button"
            className={`it-filter-pill ${filterMode === "assets" ? "active" : ""}`}
            onClick={() => {
              setFilterMode("assets");
              setSelectedCompany("");
            }}
          >
            With Declared Assets
          </button>

          {distinctCompanies.length > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Vendor / Company:</span>
              <select
                className="it-company-select"
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  if (e.target.value) setFilterMode("all");
                }}
              >
                <option value="">All Companies ({distinctCompanies.length})</option>
                {distinctCompanies.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(filterMode !== "all" || searchQuery || selectedCompany) && (
            <button
              type="button"
              className="it-filter-pill-reset"
              onClick={() => {
                setFilterMode("all");
                setSelectedCompany("");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {error && (
          <div className="error-banner" style={{ margin: "14px 20px" }}>
            <AlertTriangle size={16} />
            <div>
              <strong>Failed to load IT visitors</strong>
              <div style={{ fontSize: "12px", marginTop: "2px" }}>{error}</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <RefreshCw size={22} className="spin" />
            <span style={{ marginTop: "8px", color: "#64748b" }}>Loading IT technical personnel records...</span>
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div className="empty-state" style={{ flexDirection: "column", minHeight: "220px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eff6ff",
                color: "#2563eb",
              }}
            >
              <Users size={24} />
            </div>
            <strong style={{ color: "#344054", fontSize: "14px", marginTop: "8px" }}>
              No IT visitors found matching your criteria
            </strong>
            <span style={{ color: "#98a2b3", fontSize: "12px", marginBottom: "12px" }}>
              Try clearing search terms or selecting a different status filter.
            </span>
            <button
              type="button"
              className="it-log-recovery-primary-btn"
              onClick={() => {
                setFilterMode("all");
                setSelectedCompany("");
                setSearchQuery("");
              }}
            >
              <RefreshCw size={13} />
              <span>Show All IT Visitors</span>
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="visitors-table" style={{ width: "100%", minWidth: "1080px", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ minWidth: "220px" }}>Technician / IT Visitor</th>
                  <th style={{ minWidth: "120px" }}>Status</th>
                  <th style={{ minWidth: "170px" }}>Organization / Vendor</th>
                  <th style={{ minWidth: "220px" }}>Latest IT Scope / Mission</th>
                  <th style={{ minWidth: "150px" }}>Host IT Engineer</th>
                  <th style={{ minWidth: "140px" }}>Hardware Assets</th>
                  <th style={{ minWidth: "160px" }}>Contact &amp; Location</th>
                  <th style={{ minWidth: "110px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((item) => {
                  const fullName = `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Unknown Technician";
                  const resolvedPhoto = resolvePhotoUrl(item.photo_url);
                  const isInside = Boolean(item.is_inside || item.active_visit);
                  const activeVisitId = item.active_visit?.visit_id || (isInside && item.latest_visit?.visit_id);
                  const pendingVisitId = item.pending_visit?.visit_id || (!isInside && ["PENDING", "APPROVED"].includes(item.latest_visit?.status) ? item.latest_visit?.visit_id : null);
                  const latestVisit = item.active_visit || item.latest_visit;
                  const cleanPurpose = getCleanPurpose(latestVisit?.purpose);
                  const areaBadge = getAreaBadge(latestVisit?.purpose);
                  const ticketBadge = getTicketBadge(latestVisit?.purpose);
                  const totalAssets = item.total_assets || (latestVisit?.assets?.length || 0);

                  return (
                    <tr
                      key={item.visitor_id}
                      className={`row-visitor-clickable ${isInside ? "row-visitor-inside" : ""}`}
                      onClick={() => openTechnicianDossier(item, "overview")}
                    >
                      {/* Visitor Name & Avatar */}
                      <td>
                        <div className="visitor-cell">
                          <div
                            className="visitor-avatar"
                            style={{
                              width: "42px",
                              height: "42px",
                              minWidth: "42px",
                              cursor: resolvedPhoto ? "pointer" : "default",
                            }}
                            onClick={(e) => {
                              if (resolvedPhoto) {
                                e.stopPropagation();
                                setLightboxImage(resolvedPhoto);
                              }
                            }}
                            title={resolvedPhoto ? "Click to view photo" : ""}
                          >
                            {resolvedPhoto ? (
                              <img
                                src={resolvedPhoto}
                                alt={fullName}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : null}
                            <span className="avatar-initials">{getInitials(fullName)}</span>
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <strong style={{ color: "#0f172a", fontSize: "13.5px" }}>{fullName}</strong>
                              <span className="visitor-id-badge" style={{ fontSize: "10.5px" }}>
                                #{item.visitor_id}
                              </span>
                            </div>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              {item.phone_number || item.email || "Registered IT Personnel"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {isInside ? (
                          <span
                            className="status-pill active live-onsite-pill"
                            title="Technician is currently inside on premises"
                          >
                            <span className="status-dot"></span>
                            Inside (Onsite)
                          </span>
                        ) : (
                          <span className="status-pill checked" title="Visit concluded or checked out">
                            Checked Out
                          </span>
                        )}
                      </td>

                      {/* Organization / Vendor */}
                      <td>
                        <div className="it-company-tag">
                          <Building2 size={12} />
                          <span>{item.company_name || "Independent"}</span>
                        </div>
                      </td>

                      {/* Latest IT Mission */}
                      <td>
                        <div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#1e293b",
                              fontWeight: 500,
                              lineHeight: 1.3,
                              marginBottom: "3px",
                            }}
                          >
                            {cleanPurpose}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {areaBadge && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  background: "#f1f5f9",
                                  color: "#475569",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                {areaBadge}
                              </span>
                            )}
                            {ticketBadge && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  background: "#eff6ff",
                                  color: "#2563eb",
                                  border: "1px solid #bfdbfe",
                                }}
                              >
                                Tkt: {ticketBadge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Host IT Engineer */}
                      <td>
                        <div style={{ fontSize: "12px", color: "#334155", fontWeight: 550 }}>
                          {latestVisit?.host_employee
                            ? `${latestVisit.host_employee.first_name || ""} ${
                                latestVisit.host_employee.last_name || ""
                              }`.trim()
                            : "IT Department"}
                        </div>
                        <span
                          style={{
                            fontSize: "10.5px",
                            color: "#0369a1",
                            background: "#f0f9ff",
                            padding: "1px 5px",
                            borderRadius: "4px",
                            border: "1px solid #bae6fd",
                            display: "inline-block",
                            marginTop: "2px",
                          }}
                        >
                          IT Division
                        </span>
                      </td>

                      {/* Hardware Assets */}
                      <td>
                        {totalAssets > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#047857",
                                background: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                                borderRadius: "6px",
                                padding: "2px 7px",
                              }}
                            >
                              <Laptop size={12} />
                              {totalAssets} Hardware Asset{totalAssets > 1 ? "s" : ""}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>None declared</span>
                        )}
                      </td>

                      {/* Contact & Location */}
                      <td>
                        <div style={{ fontSize: "11.5px", color: "#475569" }}>
                          {[item.city, item.state].filter(Boolean).join(", ") || item.country || "—"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          {item.email || item.phone_number || "—"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn-table-action btn-table-view"
                            onClick={() => openTechnicianDossier(item)}
                            title="View complete IT technician dossier, hardware assets, and mission history"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                          {isInside && (
                            <button
                              type="button"
                              className="btn-table-action btn-table-checkout"
                              disabled={directCheckoutLoading === String(activeVisitId)}
                              onClick={() => openTechnicianDossier(item, "checkout")}
                              title="Check out IT technician from campus"
                            >
                              <LogOut size={13} />
                              <span>{directCheckoutLoading === String(activeVisitId) ? "Checking Out..." : "Check Out"}</span>
                            </button>
                          )}
                          {!isInside && pendingVisitId && (
                            <button
                              type="button"
                              className="btn-table-action"
                              style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0", fontWeight: 700 }}
                              disabled={directCheckoutLoading === String(pendingVisitId)}
                              onClick={() => handleDirectCheckIn(pendingVisitId, fullName)}
                              title="Authorize campus admission and check in technician"
                            >
                              <UserCheck size={13} />
                              <span>{directCheckoutLoading === String(pendingVisitId) ? "Checking In..." : "Check In"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Security note */}
      <div
        className="visitor-security-note"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginTop: "14px",
          color: "#98a2b3",
          fontSize: "12px",
        }}
      >
        <ShieldCheck size={14} color="#12b76a" />
        IT Visitor identity and hardware custody records are audited under Enterprise Security Policy.
      </div>
      </div>

      {/* Detailed IT Visitor Dossier Modal */}
      {selectedVisitor && (() => {
        const vProfile = dossierData?.visitor || selectedVisitor;
        const fullName = `${vProfile.first_name || ""} ${vProfile.last_name || ""}`.trim() || "Unknown Technician";
        const resolvedPhoto = resolvePhotoUrl(vProfile.photo_url);
        const activeVisit = dossierData?.active_visit || (selectedVisitor.latest_visit?.status === "ACTIVE" ? selectedVisitor.latest_visit : null);
        const pendingVisit = selectedVisitor.pending_visit || (!activeVisit && ["PENDING", "APPROVED"].includes(selectedVisitor.latest_visit?.status) ? selectedVisitor.latest_visit : null);
        const isInside = Boolean(activeVisit && activeVisit.status === "ACTIVE");
        const activeVisitId = activeVisit?.visit_id;
        const pendingVisitId = pendingVisit?.visit_id;
        const targetVisit = activeVisit || selectedVisitor.latest_visit;
        const declaredAssets = dossierData?.declared_assets || targetVisit?.assets || [];
        const allVisits = dossierData?.visits || selectedVisitor.visits || (targetVisit ? [targetVisit] : []);
        const areaBadge = getAreaBadge(targetVisit?.purpose);
        const ticketBadge = getTicketBadge(targetVisit?.purpose);
        const cleanPurpose = getCleanPurpose(targetVisit?.purpose);
        const formattedVisitId = getFormattedVisitId(targetVisit, vProfile.visitor_id);

        const laptopAssets = declaredAssets.filter((a) => categorizeAsset(a) === "Laptop");
        const mobileAssets = declaredAssets.filter((a) => categorizeAsset(a) === "Mobile");
        const otherAssets = declaredAssets.filter((a) => categorizeAsset(a) === "Others");
        const laptopCount = laptopAssets.length;
        const mobileCount = mobileAssets.length;
        const otherCount = otherAssets.length;

        const retainedAssets = declaredAssets.filter((a) => (a.cleared_by && a.cleared_by.includes("RETAINED")) || a.disposition === "RETAINED_ON_PREMISES");
        const returningAssets = declaredAssets.filter((a) => !((a.cleared_by && a.cleared_by.includes("RETAINED")) || a.disposition === "RETAINED_ON_PREMISES"));
        const returningCount = returningAssets.length;
        const retainedCount = retainedAssets.length;

        // Unified Add Asset Form with Camera Snap & File Upload
        const renderAddAssetForm = (mode = "checkin") => {
          const isCheckoutMode = mode === "checkout";
          const themeColor = isCheckoutMode ? "#16a34a" : "#2563eb";
          const bgBox = isCheckoutMode ? "#f0fdf4" : "#eff6ff";
          const borderBox = isCheckoutMode ? "#bbf7d0" : "#bfdbfe";

          return (
            <div className="it-asset-add-box" style={{ margin: "6px 0 12px", padding: "14px", background: bgBox, border: `1px solid ${borderBox}`, borderRadius: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ fontSize: "12.5px", color: isCheckoutMode ? "#14532d" : "#1e40af", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Plus size={14} color={themeColor} /> {isCheckoutMode ? "Register & Clear Hardware at Check-Out" : "Register Hardware Item at Entry"}
                </strong>
                <button
                  type="button"
                  onClick={() => setIsAddingAsset(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "2px" }}
                  title="Close form"
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Asset Category *</label>
                  <select
                    value={newAssetForm.asset_type}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, asset_type: e.target.value })}
                    style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                  >
                    <option value="Laptop">Laptop / Computer</option>
                    <option value="Mobile">Mobile Phone / Tablet</option>
                    <option value="Diagnostic Toolkit">Diagnostic Toolkit / Fluke</option>
                    <option value="Server Blade">Server Blade / Module</option>
                    <option value="Network Switch">Network Switch / Router</option>
                    <option value="Hardware Device">Other Hardware Device</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Brand &amp; Model *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dell Latitude 5420, iPhone 14"
                    value={newAssetForm.brand_model}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, brand_model: e.target.value })}
                    style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Serial Number / Asset Tag *</label>
                <input
                  type="text"
                  placeholder="e.g. SN: DELL-5420-001"
                  value={newAssetForm.serial_number}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, serial_number: e.target.value })}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                />
              </div>

              {/* Asset Photo with Camera Snap and File Upload */}
              <AssetPhotoPicker
                photoData={newAssetForm.photo_data}
                photoUrl={newAssetForm.photo_url}
                onPhotoChange={(dataUrl) => setNewAssetForm((prev) => ({ ...prev, photo_data: dataUrl }))}
                label="Hardware Asset Photograph (Camera / File Upload)"
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddingAsset(null)}
                  style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={assetOpLoading}
                  onClick={() => handleCreateNewAsset(targetVisit?.visit_id, isCheckoutMode)}
                  style={{
                    padding: "6px 16px",
                    fontSize: "12px",
                    borderRadius: "6px",
                    border: "none",
                    background: themeColor,
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: `0 2px 8px ${isCheckoutMode ? "rgba(22, 163, 74, 0.35)" : "rgba(37, 99, 235, 0.35)"}`
                  }}
                >
                  {assetOpLoading ? "Saving..." : isCheckoutMode ? "Add & Clear Asset" : "Add Hardware Item"}
                </button>
              </div>
            </div>
          );
        };

        // Render Check-In Card
        const renderCheckInCard = () => (
          <div className="it-asset-tracker-card checkin">
            {/* Header */}
            <div className="it-asset-tracker-header checkin">
              <div className="it-asset-header-left">
                <div className="it-asset-header-icon-box checkin">
                  <ArrowRightCircle size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 className="it-asset-header-title">Check-In</h3>
                  <p className="it-asset-header-subtitle">Register visitor assets at entry</p>
                </div>
              </div>
              <button
                type="button"
                className="it-asset-close-btn"
                onClick={() => setSelectedVisitor(null)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contractor Summary Bar */}
            <div className="it-asset-contractor-bar">
              <div className="it-asset-contractor-left">
                <div className="it-asset-avatar-circle checkin">
                  {resolvedPhoto ? (
                    <img src={resolvedPhoto} alt={fullName} />
                  ) : (
                    <span>{getInitials(fullName)}</span>
                  )}
                </div>
                <div>
                  <div className="it-asset-contractor-name">{fullName}</div>
                  <div className="it-asset-contractor-company">{vProfile.company_name || "Apex Server Solutions"}</div>
                </div>
              </div>
              <div className="it-asset-contractor-right">
                <div className="it-asset-meta-item">
                  <Calendar size={13} className="it-asset-meta-icon" />
                  <div>
                    <span className="it-asset-meta-label">Visit ID:</span>
                    <span className="it-asset-meta-val">{formattedVisitId}</span>
                  </div>
                </div>
                <div className="it-asset-meta-item">
                  <Clock size={13} className="it-asset-meta-icon" />
                  <span className="it-asset-meta-val">
                    {targetVisit?.check_in_time ? formatDateTime(targetVisit.check_in_time) : "Oct 28, 2026, 6:15 AM"}
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Asset Counter Card */}
            <div className="it-asset-hero-box checkin">
              <div className="it-asset-hero-illustration">
                <Laptop3DIcon />
              </div>
              <div className="it-asset-hero-content">
                <span className="it-asset-hero-label">Total Assets at Check-In</span>
                <div className="it-asset-hero-number checkin">{declaredAssets.length}</div>
                <span className="it-asset-hero-desc">All items will be tracked until checkout</span>
              </div>
            </div>

            {/* Category Breakdown 3-Box */}
            <div className="it-asset-cat-grid">
              <div className="it-asset-cat-pill laptop">
                <div className="it-asset-cat-header">
                  <Laptop size={15} color="#2563eb" />
                  <span>Laptops</span>
                </div>
                <div className="it-asset-cat-count">{laptopCount}</div>
              </div>
              <div className="it-asset-cat-pill mobile">
                <div className="it-asset-cat-header">
                  <Smartphone size={15} color="#16a34a" />
                  <span>Mobiles</span>
                </div>
                <div className="it-asset-cat-count">{mobileCount}</div>
              </div>
              <div className="it-asset-cat-pill other">
                <div className="it-asset-cat-header">
                  <Briefcase size={15} color="#d97706" />
                  <span>Others</span>
                </div>
                <div className="it-asset-cat-count">{otherCount}</div>
              </div>
            </div>

            {/* Assets List Section */}
            <div className="it-asset-list-section">
              <div className="it-asset-list-header">
                <span className="it-asset-list-title">Assets ({declaredAssets.length})</span>
                <button
                  type="button"
                  className="it-asset-btn-add"
                  onClick={() => setIsAddingAsset((prev) => prev === "checkin" ? null : "checkin")}
                >
                  <Plus size={13} />
                  <span>Add Asset</span>
                </button>
              </div>

              {/* Inline Add Asset Box with Camera & File Upload */}
              {isAddingAsset === "checkin" && renderAddAssetForm("checkin")}

              {/* Items List */}
              <div className="it-asset-items-container">
                {declaredAssets.length === 0 ? (
                  <div style={{ padding: "20px 10px", textAlign: "center", color: "#64748b", fontSize: "12.5px" }}>
                    No assets declared yet. Click "+ Add Asset" above to register items.
                  </div>
                ) : (
                  declaredAssets.map((asset) => {
                    const cat = categorizeAsset(asset);
                    return (
                      <div key={asset.asset_id} className="it-asset-item-card">
                        <div className="it-asset-item-left">
                          <div
                            className="it-asset-thumb-box"
                            onClick={() => { if (asset.photo_url) setLightboxImage(resolvePhotoUrl(asset.photo_url)); }}
                            title={asset.photo_url ? "Click to view photo" : ""}
                          >
                            {asset.photo_url ? (
                              <img src={resolvePhotoUrl(asset.photo_url)} alt={asset.brand_model || asset.asset_type} />
                            ) : (
                              <AssetFallbackIcon category={cat} />
                            )}
                          </div>
                          <div className="it-asset-meta">
                            <div className="it-asset-name">{asset.brand_model || asset.asset_type || "Diagnostic Hardware"}</div>
                            <div className="it-asset-sn">SN: {asset.serial_number || "NOT SPECIFIED"}</div>
                          </div>
                        </div>
                        <div className="it-asset-item-right">
                          <span className={`it-asset-tag ${cat.toLowerCase()}`}>{cat}</span>
                          <button
                            type="button"
                            className="it-asset-btn-trash"
                            title="Remove asset"
                            onClick={() => handleDeleteAsset(asset.asset_id, asset.brand_model || asset.asset_type)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="it-asset-card-footer">
              <button
                type="button"
                className="it-asset-btn-cancel"
                onClick={() => setSelectedVisitor(null)}
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className="it-asset-btn-action checkin"
                onClick={() => {
                  if (!isInside && pendingVisitId) {
                    handleDirectCheckIn(pendingVisitId, fullName);
                  } else {
                    setDossierViewMode("checkout");
                  }
                }}
              >
                <span>
                  {!isInside && pendingVisitId
                    ? `Authorize Gate Entry (${declaredAssets.length} Assets)`
                    : isInside
                    ? `Proceed to Check-Out Clearance (${declaredAssets.length} Assets)`
                    : `View Exit Clearance (${declaredAssets.length} Assets)`}
                </span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        );

        // Render Check-Out Card with Add Asset + Scan / Mark All
        const renderCheckOutCard = () => (
          <div className="it-asset-tracker-card checkout">
            {/* Header */}
            <div className="it-asset-tracker-header checkout">
              <div className="it-asset-header-left">
                <div className="it-asset-header-icon-box checkout">
                  <LogOut size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 className="it-asset-header-title">
                    {isInside ? "Check-Out" : "Check-Out Clearance"}
                  </h3>
                  <p className="it-asset-header-subtitle">
                    {isInside ? "Clear visitor assets at exit" : "Campus exit & hardware clearance verified"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="it-asset-close-btn"
                onClick={() => setSelectedVisitor(null)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contractor Summary Bar */}
            <div className="it-asset-contractor-bar">
              <div className="it-asset-contractor-left">
                <div className="it-asset-avatar-circle checkout">
                  {resolvedPhoto ? (
                    <img src={resolvedPhoto} alt={fullName} />
                  ) : (
                    <span>{getInitials(fullName)}</span>
                  )}
                </div>
                <div>
                  <div className="it-asset-contractor-name">{fullName}</div>
                  <div className="it-asset-contractor-company">{vProfile.company_name || "Apex Server Solutions"}</div>
                </div>
              </div>
              <div className="it-asset-contractor-right">
                <div className="it-asset-meta-item">
                  <Calendar size={13} className="it-asset-meta-icon" />
                  <div>
                    <span className="it-asset-meta-label">Visit ID:</span>
                    <span className="it-asset-meta-val">{formattedVisitId}</span>
                  </div>
                </div>
                <div className="it-asset-meta-item">
                  <Clock size={13} className="it-asset-meta-icon" />
                  <span className="it-asset-meta-val">
                    {targetVisit?.check_out_time ? formatDateTime(targetVisit.check_out_time) : formatDateTime(new Date().toISOString())}
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Asset Counter Card */}
            <div className="it-asset-hero-box checkout">
              <div className="it-asset-hero-illustration">
                <PackageCheck3DIcon />
              </div>
              <div className="it-asset-hero-content">
                <span className="it-asset-hero-label">
                  {isInside ? "Assets to Return at Check-Out" : "Assets Cleared at Exit"}
                </span>
                <div className="it-asset-hero-number checkout">{returningCount}</div>
                <span className="it-asset-hero-desc">
                  {isInside
                    ? `${returningCount} Returning with visitor · ${retainedCount} Retained in facility`
                    : targetVisit?.check_out_time
                    ? `Exit clearance: ${returningCount} Returned · ${retainedCount} Retained (${formatDateTime(targetVisit.check_out_time)})`
                    : "Exit clearance completed · Departure recorded"}
                </span>
              </div>
            </div>

            {/* Category Breakdown 3-Box */}
            <div className="it-asset-cat-grid">
              <div className="it-asset-cat-pill laptop">
                <div className="it-asset-cat-header">
                  <Laptop size={15} color="#2563eb" />
                  <span>Laptops</span>
                </div>
                <div className="it-asset-cat-count">{laptopCount}</div>
              </div>
              <div className="it-asset-cat-pill mobile">
                <div className="it-asset-cat-header">
                  <Smartphone size={15} color="#16a34a" />
                  <span>Mobiles</span>
                </div>
                <div className="it-asset-cat-count">{mobileCount}</div>
              </div>
              <div className="it-asset-cat-pill other">
                <div className="it-asset-cat-header">
                  <Briefcase size={15} color="#d97706" />
                  <span>Others</span>
                </div>
                <div className="it-asset-cat-count">{otherCount}</div>
              </div>
            </div>

            {/* Assets List Section */}
            <div className="it-asset-list-section">
              <div className="it-asset-list-header">
                <span className="it-asset-list-title">Assets ({declaredAssets.length})</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {isInside && (
                    <button
                      type="button"
                      className="it-asset-btn-add checkout"
                      onClick={() => setIsAddingAsset((prev) => prev === "checkout" ? null : "checkout")}
                      title="Add new hardware asset directly during checkout exit clearance"
                    >
                      <Plus size={13} />
                      <span>Add Asset</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="it-asset-btn-scan"
                    disabled={!isInside || assetOpLoading}
                    onClick={() => isInside && handleMarkAllAssetsCleared(declaredAssets)}
                    title={isInside ? "Mark all registered assets cleared for exit" : "All assets already cleared at departure"}
                    style={!isInside ? { opacity: 0.8, cursor: "default" } : {}}
                  >
                    <CheckCheck size={13} />
                    <span>{isInside ? "Scan / Mark All" : "All Cleared"}</span>
                  </button>
                  <button
                    type="button"
                    className="it-asset-btn-scan no-print"
                    onClick={() => window.print()}
                    title="Print official hardware exit clearance pass"
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                  >
                    <Printer size={13} />
                    <span>Print Pass</span>
                  </button>
                </div>
              </div>

              {/* Inline Add Asset Box with Camera & File Upload in Checkout */}
              {isAddingAsset === "checkout" && renderAddAssetForm("checkout")}

              {/* Items List */}
              <div className="it-asset-items-container">
                {declaredAssets.length === 0 ? (
                  <div style={{ padding: "20px 10px", textAlign: "center", color: "#64748b", fontSize: "12.5px" }}>
                    No hardware assets requiring exit clearance.
                  </div>
                ) : (
                  declaredAssets.map((asset) => {
                    const cat = categorizeAsset(asset);
                    const isRetained = (asset.cleared_by && asset.cleared_by.includes("RETAINED")) || asset.disposition === "RETAINED_ON_PREMISES";
                    const isCarried = !isRetained;
                    return (
                      <div key={asset.asset_id} className="it-asset-item-card">
                        <div className="it-asset-item-left">
                          <div
                            className="it-asset-thumb-box"
                            onClick={() => { if (asset.photo_url) setLightboxImage(resolvePhotoUrl(asset.photo_url)); }}
                            title={asset.photo_url ? "Click to view photo" : ""}
                          >
                            {asset.photo_url ? (
                              <img src={resolvePhotoUrl(asset.photo_url)} alt={asset.brand_model || asset.asset_type} />
                            ) : (
                              <AssetFallbackIcon category={cat} />
                            )}
                          </div>
                          <div className="it-asset-meta">
                            <div className="it-asset-name">{asset.brand_model || asset.asset_type || "Diagnostic Hardware"}</div>
                            <div className="it-asset-sn">SN: {asset.serial_number || "NOT SPECIFIED"}</div>
                          </div>
                        </div>
                        <div className="it-asset-item-right" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span className={`it-asset-tag ${cat.toLowerCase()}`}>{cat}</span>
                          
                          {/* Segmented Return vs Retained Toggle Options */}
                          <div
                            className="it-asset-toggle-group"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              background: "#f8fafc",
                              padding: "2px",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0"
                            }}
                          >
                            <button
                              type="button"
                              className={`it-asset-btn-toggle return ${isCarried ? "active" : ""}`}
                              disabled={!isInside || assetOpLoading}
                              onClick={() => {
                                if (isInside) {
                                  handleUpdateAssetDisposition(asset.asset_id, "CARRIED_OUT");
                                }
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 9px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: isCarried ? 700 : 500,
                                cursor: isInside ? "pointer" : "default",
                                border: isCarried ? "1.5px solid #16a34a" : "1px solid transparent",
                                background: isCarried ? "#f0fdf4" : "transparent",
                                color: isCarried ? "#15803d" : "#64748b",
                                transition: "all 0.15s ease",
                              }}
                              title={isInside ? "Click to set this item to Return with visitor on exit" : "Item returned with visitor"}
                            >
                              <Check size={12} strokeWidth={isCarried ? 3 : 2} color={isCarried ? "#16a34a" : "#94a3b8"} />
                              <span>Return</span>
                            </button>

                            <button
                              type="button"
                              className={`it-asset-btn-toggle retained ${isRetained ? "active" : ""}`}
                              disabled={!isInside || assetOpLoading}
                              onClick={() => {
                                if (isInside) {
                                  const defaultNote = asset.retention_note || "Installed on premises / kept in datacenter";
                                  const note = prompt("Retain item on premises? Enter note or location (e.g. Datacenter Rack 4):", defaultNote);
                                  if (note !== null) {
                                    handleUpdateAssetDisposition(asset.asset_id, "RETAINED_ON_PREMISES", note);
                                  }
                                }
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 9px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: isRetained ? 700 : 500,
                                cursor: isInside ? "pointer" : "default",
                                border: isRetained ? "1.5px solid #2563eb" : "1px solid transparent",
                                background: isRetained ? "#eff6ff" : "transparent",
                                color: isRetained ? "#1d4ed8" : "#64748b",
                                transition: "all 0.15s ease",
                              }}
                              title={isInside ? "Click to mark this item Retained in facility (does not depart)" : "Item retained in facility"}
                            >
                              <Package size={12} color={isRetained ? "#2563eb" : "#94a3b8"} />
                              <span>Retained</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="it-asset-card-footer">
              <button
                type="button"
                className="it-asset-btn-cancel"
                onClick={() => setDossierViewMode("checkin")}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              {isInside ? (
                <button
                  type="button"
                  className="it-asset-btn-action checkout"
                  disabled={directCheckoutLoading === String(activeVisitId)}
                  onClick={() => handleDirectCheckout(activeVisitId, fullName, true)}
                >
                  <Check size={15} strokeWidth={3} />
                  <span>
                    {directCheckoutLoading === String(activeVisitId)
                      ? "Checking Out..."
                      : returningCount > 0
                      ? `Complete Check-Out (${returningCount} Return${retainedCount > 0 ? ` · ${retainedCount} Retained` : ""})`
                      : `Complete Check-Out (0 Return · ${retainedCount} Retained)`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="it-asset-btn-action checkout completed"
                  disabled={true}
                  style={{
                    background: "#f0fdf4",
                    color: "#166534",
                    border: "1.5px solid #86efac",
                    cursor: "default",
                    opacity: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700
                  }}
                  title="Campus exit and hardware clearance have already been completed."
                >
                  <CheckCheck size={16} color="#16a34a" />
                  <span>Departure Recorded ({returningCount} Returned · {retainedCount} Retained)</span>
                </button>
              )}
            </div>
          </div>
        );

        // Render Full Technician Dossier Modal (Overview)
        const renderOverviewDossier = () => (
          <div className="vms-dossier-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vms-dossier-header" style={{ borderBottom: "1.5px solid #e2e8f0" }}>
              <div className="vms-dossier-header-title">
                <div className="vms-dossier-header-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <Server size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                    IT Department Personnel Dossier &amp; Hardware Clearance
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                    Enterprise IT Infrastructure &amp; Technical Contractor Registry
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {isInside && activeVisitId && (
                  <button
                    type="button"
                    className="btn-dossier-checkout"
                    disabled={directCheckoutLoading === String(activeVisitId)}
                    onClick={() => setDossierViewMode("checkout")}
                    title="Check out IT technician from campus"
                  >
                    <LogOut size={14} />
                    <span>Check Out Technician</span>
                  </button>
                )}
                {!isInside && pendingVisitId && (
                  <button
                    type="button"
                    className="btn-dossier-checkin"
                    disabled={directCheckoutLoading === String(pendingVisitId)}
                    onClick={() => handleDirectCheckIn(pendingVisitId, fullName)}
                    title="Authorize entry and check in technician"
                  >
                    <UserCheck size={14} />
                    <span>Check In Technician</span>
                  </button>
                )}
                <button
                  type="button"
                  className="it-qr-portal-btn no-print"
                  style={{ padding: "7px 14px", fontSize: "12.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => window.print()}
                  title="Print official IT dossier and hardware certificate"
                >
                  <Printer size={14} />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  className="vms-dossier-close-btn no-print"
                  onClick={() => setSelectedVisitor(null)}
                  title="Close dossier"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="vms-dossier-body">
              {/* Profile Card */}
              <div className="vms-dossier-profile-card">
                <div className="vms-dossier-avatar-col">
                  <div
                    className="vms-dossier-avatar-box"
                    style={{ cursor: resolvedPhoto ? "pointer" : "default" }}
                    onClick={() => { if (resolvedPhoto) setLightboxImage(resolvedPhoto); }}
                    title={resolvedPhoto ? "Click to view enlarged photograph" : ""}
                  >
                    {resolvedPhoto ? (
                      <img src={resolvedPhoto} alt={fullName} />
                    ) : (
                      <span className="vms-dossier-avatar-initials">{getInitials(fullName)}</span>
                    )}
                  </div>
                  <label
                    className="vms-dossier-change-photo-btn no-print"
                    title="Upload or change technician photograph"
                    style={{ cursor: "pointer" }}
                  >
                    <Camera size={12} />
                    <span>{photoUploading ? "Uploading..." : "Change Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhotoUpload}
                      disabled={photoUploading}
                    />
                  </label>
                </div>
                <div className="vms-dossier-info-col">
                  <div className="vms-dossier-name-row">
                    <h2 className="vms-dossier-name">{fullName}</h2>
                    <div className="vms-dossier-badges">
                      <span className="visitor-id-badge">#{vProfile.visitor_id}</span>
                      <span className="it-company-tag">
                        <Building2 size={12} />
                        <span>{vProfile.company_name || "Independent Contractor"}</span>
                      </span>
                      {isInside ? (
                        <span className="status-pill active live-onsite-pill">
                          <span className="status-dot"></span>
                          Inside (Active IT Mission)
                        </span>
                      ) : (
                        <span className="status-pill checked">Offsite / Checked Out</span>
                      )}
                    </div>
                  </div>
                  <div className="vms-dossier-grid-details">
                    <div className="vms-dossier-field">
                      <span className="vms-dossier-field-label"><Phone size={12} /> Phone Number</span>
                      <span className="vms-dossier-field-val">{vProfile.phone_number || "—"}</span>
                    </div>
                    <div className="vms-dossier-field">
                      <span className="vms-dossier-field-label"><Mail size={12} /> Email Address</span>
                      <span className="vms-dossier-field-val">{vProfile.email || "—"}</span>
                    </div>
                    <div className="vms-dossier-field">
                      <span className="vms-dossier-field-label"><Building2 size={12} /> Affiliated Organization</span>
                      <span className="vms-dossier-field-val">{vProfile.company_name || "Independent"}</span>
                    </div>
                    <div className="vms-dossier-field">
                      <span className="vms-dossier-field-label"><MapPin size={12} /> Registered Physical Address</span>
                      <span className="vms-dossier-field-val">
                        {[vProfile.address_line1, vProfile.address_line2, vProfile.city, vProfile.state, vProfile.postal_code, vProfile.country].filter(Boolean).join(", ") || "On record"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Visit Banner */}
              {isInside && targetVisit && (
                <div className="vms-active-visit-banner">
                  <div className="vms-active-visit-top">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span className="vms-live-indicator-pill">
                        <span className="vms-pulse-dot"></span>
                        Active IT Mission in Progress
                      </span>
                      <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>
                        Ref: <code>{formattedVisitId}</code>
                      </span>
                    </div>
                    <div className="vms-active-visit-actions">
                      <button
                        type="button"
                        className="vms-btn-checkout-prominent"
                        onClick={() => setDossierViewMode("checkout")}
                        title="Clear declared hardware and check out technician"
                      >
                        <LogOut size={14} />
                        <span>CONFIRM EXIT &amp; AUTHORIZE CHECK-OUT</span>
                      </button>
                      <button
                        type="button"
                        className="vms-btn-it-pass"
                        onClick={() => window.open(`/visitor-pass/${encodeURIComponent(targetVisit.visit_id)}`, "_blank")}
                        title="View digital IT Visitor Pass"
                      >
                        <QrCode size={14} />
                        <span>IT Visitor Pass</span>
                      </button>
                    </div>
                  </div>
                  <div className="vms-active-visit-grid">
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Check-In Time:</span>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>{formatDateTime(targetVisit.check_in_time)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Host IT Engineer:</span>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                        {targetVisit.host_employee ? `${targetVisit.host_employee.first_name} ${targetVisit.host_employee.last_name}` : "IT Department"}
                      </strong>
                    </div>
                    {areaBadge && (
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Designated Area:</span>
                        <strong style={{ fontSize: "13px", color: "#0f172a" }}>{areaBadge}</strong>
                      </div>
                    )}
                    {ticketBadge && (
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Service Ticket:</span>
                        <strong style={{ fontSize: "13px", color: "#2563eb" }}>#{ticketBadge}</strong>
                      </div>
                    )}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Technical Mission &amp; Scope:</span>
                      <div style={{ fontSize: "13px", color: "#0f172a", marginTop: "3px", lineHeight: 1.4 }}>
                        {cleanPurpose}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Completed Visit Departure Audit Banner */}
              {!isInside && targetVisit && (
                <div className="vms-active-visit-banner completed-checkout" style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                  <div className="vms-active-visit-top">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span className="vms-live-indicator-pill" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #86efac" }}>
                        <CheckCircle2 size={13} color="#16a34a" />
                        Visit Completed · Campus Departure Recorded
                      </span>
                      <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>
                        Ref: <code>{formattedVisitId}</code>
                      </span>
                    </div>
                    <div className="vms-active-visit-actions">
                      <button
                        type="button"
                        className="vms-btn-it-pass"
                        onClick={() => window.open(`/visitor-pass/${encodeURIComponent(targetVisit.visit_id)}`, "_blank")}
                        title="View digital IT Visitor Pass"
                      >
                        <QrCode size={14} />
                        <span>IT Visitor Pass</span>
                      </button>
                    </div>
                  </div>
                  <div className="vms-active-visit-grid">
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Check-In Time:</span>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>{formatDateTime(targetVisit.check_in_time)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Check-Out / Departure:</span>
                      <strong style={{ fontSize: "13px", color: "#166534" }}>{formatDateTime(targetVisit.check_out_time) || "Departure Recorded"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Host IT Engineer:</span>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                        {targetVisit.host_employee ? `${targetVisit.host_employee.first_name} ${targetVisit.host_employee.last_name}` : "IT Department"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Exit Hardware Clearance:</span>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                        {declaredAssets.length} Assets Verified &amp; Cleared
                      </strong>
                    </div>
                    {cleanPurpose && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Technical Mission &amp; Scope:</span>
                        <div style={{ fontSize: "13px", color: "#0f172a", marginTop: "3px", lineHeight: 1.4 }}>
                          {cleanPurpose}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hardware Section Embedded in Overview: Side-by-Side Dual View */}
              <div className="vms-dossier-section" style={{ border: "none", padding: 0, background: "transparent" }}>
                <div className="vms-dossier-section-header" style={{ marginBottom: "12px", padding: "0 4px" }}>
                  <div className="vms-dossier-section-title">
                    <Laptop size={16} color="#2563eb" />
                    <span>Registered Hardware &amp; Exit Clearance Tracking</span>
                  </div>
                </div>
                <div className="it-asset-cards-wrapper" style={{ margin: "0 auto", justifyContent: "center" }}>
                  {renderCheckInCard()}
                  {renderCheckOutCard()}
                </div>
              </div>

              {/* Hardware Custody Reconciliation Card */}
              <div className="ch-dossier-section highlight-out" style={{ marginTop: "16px" }}>
                <div className="ch-dossier-section-header">
                  <div className="ch-dossier-section-title-wrap">
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="ch-dossier-section-title">
                        Custody Reconciliation &amp; Chain-of-Custody Balance
                      </h4>
                      <div className="ch-dossier-section-sub">
                        Complete audit verification of hardware brought in vs taken out
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", background: "#f0fdf4", padding: "4px 10px", borderRadius: "6px", border: "1px solid #86efac" }}>
                    ✓ AUDIT VERIFIED: Zero Discrepancy
                  </span>
                </div>

                <div className="ch-recon-box">
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Check-In Inventory</span>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                      {declaredAssets.length} Declared Assets
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#059669", textTransform: "uppercase", fontWeight: 700 }}>Return on Exit</span>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
                      {returningCount} Items Returned
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#1d4ed8", textTransform: "uppercase", fontWeight: 700 }}>Retained in Facility</span>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1d4ed8", marginTop: "2px" }}>
                      {retainedCount} Items Retained / Installed
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>Reconciliation Verdict</span>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#166534", marginTop: "2px" }}>
                      ✓ 100% Balanced &amp; Accounted
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Visit History */}
              {allVisits.length > 0 && (
                <div className="vms-dossier-section no-print">
                  <div className="vms-dossier-section-header">
                    <div className="vms-dossier-section-title">
                      <Clock size={16} color="#0284c7" />
                      <span>Technical Visit History ({allVisits.length} Recorded Visits)</span>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="vms-history-table">
                      <thead>
                        <tr>
                          <th>Date &amp; Check-In</th>
                          <th>Checkout</th>
                          <th>Mission &amp; Service Scope</th>
                          <th>Host IT Engineer</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Pass Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allVisits.map((v, i) => (
                          <tr key={v.visit_id || i}>
                            <td style={{ fontWeight: 600 }}>{formatDateTime(v.check_in_time)}</td>
                            <td>{formatDateTime(v.check_out_time)}</td>
                            <td>{getCleanPurpose(v.purpose)}</td>
                            <td>{v.host_employee ? `${v.host_employee.first_name} ${v.host_employee.last_name}` : "IT Department"}</td>
                            <td>
                              <span className={`status-pill ${v.status === "ACTIVE" ? "active" : "checked"}`} style={{ fontSize: "11px", padding: "1px 7px" }}>
                                {v.status}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => window.open(`/visitor-pass/${encodeURIComponent(v.visit_id)}`, "_blank")}
                                style={{
                                  background: "#f0fdf4",
                                  border: "1px solid #86efac",
                                  color: "#166534",
                                  borderRadius: "6px",
                                  padding: "3px 8px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <QrCode size={11} /> IT Pass
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Official Legal & Security Clearance Signatures in Print */}
              <div
                className="it-cert-signatures-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "18px",
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: "1.5px dashed #cbd5e1",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                    Technician / Carrier Signature
                  </span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                    Host IT Engineer Signature
                  </span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                    Security Gate Clearance Stamp
                  </span>
                </div>
              </div>
            </div>

            <div className="vms-dossier-footer no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #e2e8f0", borderRadius: "0 0 16px 16px" }}>
              <button
                type="button"
                className="it-qr-portal-btn"
                onClick={() => setSelectedVisitor(null)}
              >
                Close Dossier
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="it-qr-portal-btn no-print"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => window.print()}
                >
                  <Printer size={13} />
                  <span>Print Dossier</span>
                </button>
                {isInside && activeVisitId && (
                  <button
                    type="button"
                    className="btn-dossier-checkout"
                    onClick={() => setDossierViewMode("checkout")}
                  >
                    <LogOut size={14} />
                    <span>Check Out &amp; Clear Hardware</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );

        return (
          <div
            className="it-asset-modal-overlay"
            onClick={() => setSelectedVisitor(null)}
            role="dialog"
            aria-modal="true"
          >
            <div className="it-asset-modal-inner" onClick={(e) => e.stopPropagation()}>
              {/* Top View Mode Switcher Pills */}
              <div className="it-asset-view-switcher-bar no-print">
                <button
                  type="button"
                  className={`it-asset-switcher-pill ${dossierViewMode === "checkin" ? "active checkin" : ""}`}
                  onClick={() => setDossierViewMode("checkin")}
                  title="Check-In asset entry registration view"
                >
                  <ArrowRightCircle size={14} />
                  <span>Check-In Assets ({declaredAssets.length})</span>
                </button>
                <button
                  type="button"
                  className={`it-asset-switcher-pill ${dossierViewMode === "checkout" ? "active checkout" : ""}`}
                  onClick={() => setDossierViewMode("checkout")}
                  title="Check-Out asset exit clearance view"
                >
                  <LogOut size={14} />
                  <span>Check-Out Clearance ({declaredAssets.length})</span>
                </button>
                <button
                  type="button"
                  className={`it-asset-switcher-pill ${dossierViewMode === "dual" ? "active dual" : ""}`}
                  onClick={() => setDossierViewMode("dual")}
                  title="View both Check-In and Check-Out cards side-by-side"
                >
                  <Columns size={14} />
                  <span>Side-by-Side Dual View</span>
                </button>
                <button
                  type="button"
                  className={`it-asset-switcher-pill ${dossierViewMode === "overview" ? "active overview" : ""}`}
                  onClick={() => setDossierViewMode("overview")}
                  title="View technician profile details, host contact & visit log history"
                >
                  <ShieldCheck size={14} />
                  <span>Technician Profile &amp; Logs</span>
                </button>
              </div>

              {/* Cards according to active view mode (screen) */}
              <div className={dossierViewMode === "overview" ? "" : "no-print"}>
                {dossierViewMode === "checkin" && (
                  <div className="it-asset-cards-wrapper single">
                    {renderCheckInCard()}
                  </div>
                )}

                {dossierViewMode === "checkout" && (
                  <div className="it-asset-cards-wrapper single">
                    {renderCheckOutCard()}
                  </div>
                )}

                {dossierViewMode === "dual" && (
                  <div className="it-asset-cards-wrapper">
                    {renderCheckInCard()}
                    {renderCheckOutCard()}
                  </div>
                )}

                {dossierViewMode === "overview" && (
                  renderOverviewDossier()
                )}
              </div>

              {/* Print-Only Fallback: When on checkin/checkout/dual tab on screen, always print the full Overview Dossier */}
              {dossierViewMode !== "overview" && (
                <div className="no-screen it-print-dossier-wrapper">
                  {renderOverviewDossier()}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Lightbox for zooming photos */}
      {lightboxImage && (
        <div className="vms-lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div
            className="vms-lightbox-card"
            style={{ maxWidth: "560px", padding: "16px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>High-Resolution Inspection</strong>
              <button
                type="button"
                className="vms-lightbox-close"
                onClick={() => setLightboxImage(null)}
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={lightboxImage}
              alt="Inspection"
              style={{
                width: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            />
          </div>
        </div>
      )}

      {/* IT Visit Portal QR Modal */}
      {showPortalModal && (
        <div className="vms-lightbox-overlay" onClick={() => setShowPortalModal(false)}>
          <div
            className="vms-lightbox-card"
            style={{ maxWidth: "440px", padding: "24px", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <strong style={{ fontSize: "16px", color: "#0f172a" }}>IT Visit Registration Portal</strong>
              <button
                type="button"
                className="vms-lightbox-close"
                onClick={() => setShowPortalModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
              Scan with smartphone camera to launch the self-service IT Visitor Pass &amp; Hardware Declaration form.
            </p>

            {portalQrData && (
              <img
                src={portalQrData}
                alt="IT Visit QR"
                style={{
                  width: "220px",
                  height: "220px",
                  margin: "0 auto 16px",
                  display: "block",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "8px",
                  background: "#ffffff",
                }}
              />
            )}

            <div
              style={{
                background: "#f8fafc",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#1e3a8a",
                wordBreak: "break-all",
                marginBottom: "16px",
              }}
            >
              {`${window.location.origin}/it-visit`}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <a
                href={`${window.location.origin}/it-visit`}
                target="_blank"
                rel="noreferrer"
                className="it-log-recovery-primary-btn"
                style={{ textDecoration: "none" }}
              >
                <ExternalLink size={14} />
                <span>Open Form</span>
              </a>
              <button
                type="button"
                className="it-qr-portal-btn"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/it-visit`);
                  if (onNotification) {
                    onNotification("IT Visit Portal link copied to clipboard!", "success");
                  }
                }}
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
