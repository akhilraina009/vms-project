import { useState, useRef, useEffect } from "react";
import {
  UserRound,
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  Globe,
  Calendar,
  Camera,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  Send,
  RotateCcw,
  Plus,
  ChevronUp,
  ChevronDown,
  Hash,
  Laptop,
  Tag,
  FileText,
  Code2,
  IdCard,
  Cpu,
} from "lucide-react";
import "./PublicRegistration.css";

const API_BASE_URL = "";

function ITAssetPhotoCapture({ index, photo, onPhotoChange }) {
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

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access requires HTTPS or localhost.");
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.error("Video play error:", e);
        }
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or device unavailable.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCameraError("Please wait until camera preview is ready.");
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
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraError("");
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Please choose a valid image file (JPEG or PNG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
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
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <div className="public-asset-photo-section">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {cameraActive && (
        <div className="public-live-camera-view" style={{ marginBottom: "12px" }}>
          <video
            ref={(el) => {
              videoRef.current = el;
              if (el && streamRef.current && el.srcObject !== streamRef.current) {
                el.srcObject = streamRef.current;
                el.play().catch(() => {});
              }
            }}
            autoPlay
            playsInline
            muted
            className="public-live-video"
          />
          <div className="public-live-controls">
            <button
              type="button"
              className="public-submit-btn"
              style={{ width: "auto", padding: "8px 16px", fontSize: "13px" }}
              onClick={capturePhoto}
            >
              <Camera size={15} /> Snap Photo
            </button>
            <button
              type="button"
              className="public-clear-btn"
              style={{ width: "auto", padding: "8px 14px", fontSize: "13px", margin: 0 }}
              onClick={stopCamera}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!cameraActive && photo && (
        <div className="public-asset-photo-box">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img
              src={photo}
              alt={`Asset ${index + 1}`}
              style={{
                width: "60px",
                height: "60px",
                objectFit: "cover",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            />
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "#059669",
                  fontWeight: 650,
                }}
              >
                <CheckCircle2 size={14} /> Photo captured
              </span>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                Ready for gate clearance
              </p>
            </div>
          </div>
          <div className="public-asset-btn-group">
            <button
              type="button"
              className="public-btn-secondary"
              style={{ padding: "7px 12px", fontSize: "12px" }}
              onClick={startCamera}
            >
              <RefreshCw size={13} /> Retake
            </button>
            <button
              type="button"
              className="public-btn-secondary"
              style={{ padding: "7px 12px", fontSize: "12px" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} /> Upload
            </button>
            <button
              type="button"
              className="public-btn-danger-outline"
              onClick={() => onPhotoChange("")}
            >
              <X size={13} /> Remove
            </button>
          </div>
        </div>
      )}

      {!cameraActive && !photo && (
        <div className="public-asset-photo-box">
          <div className="public-asset-empty-info">
            <div className="public-asset-empty-icon">
              <Camera size={18} />
            </div>
            <div className="public-asset-empty-text">
              <h4>Asset photograph (Optional)</h4>
              <p>Snap or upload a photo of the item for gate clearance</p>
            </div>
          </div>
          <div className="public-asset-btn-group">
            <button
              type="button"
              className="public-btn-secondary"
              style={{ padding: "8px 14px", fontSize: "12.5px" }}
              onClick={startCamera}
            >
              <Camera size={14} /> Camera
            </button>
            <button
              type="button"
              className="public-btn-secondary"
              style={{ padding: "8px 14px", fontSize: "12.5px" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Upload
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <p style={{ color: "#ef4444", fontSize: "12px", margin: "8px 0 0 0" }}>
          {cameraError}
        </p>
      )}
    </div>
  );
}

export default function ITVisitForm({ hosts = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState("user");
  const [hasEquipment, setHasEquipment] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  const initialFormState = {
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    company_name: "",
    technician_id: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    host_employee_id: "",
    scope_of_work: "",
    expected_out_time: "",
    assets: [
      {
        asset_type: "Diagnostic Laptop",
        brand_model: "",
        serial_number: "",
        custody_action: "Will take back upon departure (Returnable)",
        photo: "",
      },
    ],
  };

  const [form, setForm] = useState(initialFormState);

  // Group hosts: IT first
  const itHosts = hosts.filter((h) =>
    (h.department || "").toLowerCase().includes("it") ||
    (h.department || "").toLowerCase().includes("tech") ||
    (h.department || "").toLowerCase().includes("system")
  );
  const otherHosts = hosts.filter(
    (h) => !itHosts.some((it) => it.employee_id === h.employee_id)
  );

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function updateField(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function startSelfCamera(requestedMode) {
    const mode = requestedMode || facingMode;
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access requires HTTPS or localhost.");
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (err) {
          console.warn("Video play warning:", err);
        }
      }
    } catch {
      setCameraError("Camera access was denied or the camera is unavailable.");
      setCameraActive(false);
    }
  }

  async function toggleCameraFacing() {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    await startSelfCamera(nextMode);
  }

  function captureSelfPhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCameraError("Please wait until the camera preview is ready.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    if (facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setPhoto(canvas.toDataURL("image/jpeg", 0.88));
    stopSelfCamera();
  }

  function stopSelfCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Please choose a valid image file (JPEG or PNG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
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
        setPhoto(canvas.toDataURL("image/jpeg", 0.85));
        stopSelfCamera();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function addEquipmentItem() {
    setForm((prev) => ({
      ...prev,
      assets: [
        ...prev.assets,
        {
          asset_type: "Diagnostic Laptop",
          brand_model: "",
          serial_number: "",
          custody_action: "Will take back upon departure (Returnable)",
          photo: "",
        },
      ],
    }));
  }

  function updateEquipmentItem(index, field, value) {
    setForm((prev) => ({
      ...prev,
      assets: prev.assets.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function removeEquipmentItem(index) {
    setForm((prev) => ({
      ...prev,
      assets: prev.assets.filter((_, i) => i !== index),
    }));
  }

  function handleClearForm() {
    if (window.confirm("Are you sure you want to clear this IT registration form?")) {
      setForm(initialFormState);
      setPhoto("");
      setConfirmed(false);
      setError("");
      setCameraError("");
      setHasEquipment(true);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.host_employee_id) {
      setError("Please select the IT Host employee.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!confirmed) {
      setError("Please confirm the information provided is correct before submitting.");
      return;
    }

    setLoading(true);

    try {
      const formattedPurpose = [
        `[IT_VISIT]`,
        form.technician_id ? `ID: ${form.technician_id.trim()}` : null,
        form.scope_of_work ? form.scope_of_work.trim() : "IT Technical Maintenance",
      ]
        .filter(Boolean)
        .join(" | ");

      const sanitizedPurpose = formattedPurpose.slice(0, 495);

      let assetsPayload = [];
      if (hasEquipment && form.assets.length > 0) {
        assetsPayload = form.assets
          .filter((a) => a.asset_type.trim())
          .map((a) => ({
            asset_type: a.asset_type.trim(),
            brand_model: a.brand_model.trim() || null,
            serial_number: a.serial_number.trim() || null,
            photo_data: a.photo || null,
          }));
      }

      if (assetsPayload.length === 0) {
        assetsPayload = [
          {
            asset_type: "IT Access Permit / Badge",
            brand_model: "IT Department Access",
            serial_number: "IT-SERVICE-PASS",
            photo_data: null,
          },
        ];
      }

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_number: form.phone_number.trim(),
        email: form.email.trim(),
        company_name: form.company_name.trim(),
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postal_code: form.postal_code.trim(),
        country: form.country.trim() || "India",
        host_employee_id: Number(form.host_employee_id),
        purpose: sanitizedPurpose,
        expected_out_time: form.expected_out_time || null,
        assets: assetsPayload,
        photo_data: photo || null,
      };

      const response = await fetch(`${API_BASE_URL}/public-registration/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = result.detail;
        const msg =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
            ? detail.map((d) => d.msg).join(", ")
            : "Registration failed. Please check your details and try again.";
        throw new Error(msg);
      }

      if (!result.qr_token) {
        throw new Error("Server response did not include a pass token.");
      }

      sessionStorage.setItem("vms_auto_download_pass", "true");
      window.location.assign(
        `/visitor-pass/${encodeURIComponent(result.qr_token)}?autodownload=1`
      );
    } catch (err) {
      console.error("IT Registration error:", err);
      setError(err.message || "Unable to submit your registration. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="public-registration">
      {/* Top Header */}
      <header className="public-header">
        <div className="public-header-inner">
          <div className="public-brand">
            <div className="public-brand-icon">
              <img src="/vms-logo.png" alt="VMS Logo" />
            </div>
            <div className="public-brand-text">
              <h1>Visitor Management</h1>
              <p>IT Visitor Registration Portal</p>
            </div>
          </div>

          <span className="public-secure-label">
            <ShieldCheck size={15} /> IT Visitor Portal
          </span>
        </div>
      </header>

      <div className="public-container">
        {/* Intro Banner */}
        <section className="public-intro-banner">
          <div className="public-intro-content">
            <h2>Register your IT visit</h2>
            <p>
              Please enter your details, select your IT host, and register any hardware
              or diagnostic tools you are bringing onto the premises.
            </p>
          </div>

          {/* Decorative graphic card with code laptop & purple badge */}
          <div className="public-hero-graphic-card it-theme">
            <div className="public-hero-graphic-icon">
              <Code2 size={44} strokeWidth={1.6} />
            </div>
            <div className="public-hero-badge-pill">
              <Cpu size={13} strokeWidth={2.5} />
            </div>
          </div>
        </section>

        {/* Stepper Progress Bar */}
        <div className="public-stepper">
          <div
            className={`public-step-item ${activeStep >= 1 ? "active" : ""}`}
            onClick={() => setActiveStep(1)}
          >
            <div className="public-step-circle">1</div>
            <span className="public-step-label">Personal details</span>
          </div>

          <div
            className={`public-step-item ${activeStep >= 2 ? "active" : ""}`}
            onClick={() => setActiveStep(2)}
          >
            <div className="public-step-circle">2</div>
            <span className="public-step-label">Visit information</span>
          </div>

          <div
            className={`public-step-item ${activeStep >= 3 ? "active" : ""}`}
            onClick={() => setActiveStep(3)}
          >
            <div className="public-step-circle">3</div>
            <span className="public-step-label">Assets & submit</span>
          </div>
        </div>

        {error && (
          <div className="public-alert-box" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* CARD 1: Personal Information */}
          <section className="public-card" id="step-personal">
            <div className="public-card-header">
              <div className="public-card-header-left">
                <div className="public-card-badge it-badge">
                  <UserRound size={20} />
                </div>
                <div className="public-card-title">
                  <h3>Personal information</h3>
                  <p>Enter your identification, company, and contact details.</p>
                </div>
              </div>
              <ChevronUp size={18} className="public-card-toggle-icon" />
            </div>

            <div className="public-grid">
              <div className="public-field">
                <label className="public-label">
                  First name <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <User size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="first_name"
                    value={form.first_name}
                    onChange={updateField}
                    placeholder="First name"
                    autoComplete="given-name"
                    required
                  />
                </div>
              </div>

              <div className="public-field">
                <label className="public-label">
                  Last name <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <User size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="last_name"
                    value={form.last_name}
                    onChange={updateField}
                    placeholder="Last name"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              <div className="public-field">
                <label className="public-label">
                  Phone number <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <Phone size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="phone_number"
                    type="tel"
                    value={form.phone_number}
                    onChange={updateField}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <div className="public-field">
                <label className="public-label">
                  Corporate email address <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <Mail size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="technician@company.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="public-field public-grid-full">
                <label className="public-label">
                  Company or organisation <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <Building2 size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="company_name"
                    value={form.company_name}
                    onChange={updateField}
                    placeholder="e.g. Dell Technologies, Cisco, HP Enterprise"
                    autoComplete="organization"
                    required
                  />
                </div>
              </div>

              <div className="public-field public-grid-full">
                <label className="public-label">
                  Contractor badge or technician ID
                </label>
                <div className="public-input-wrap">
                  <IdCard size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="technician_id"
                    value={form.technician_id}
                    onChange={updateField}
                    placeholder="e.g. TECH-9021 or CISCO-04"
                  />
                </div>
              </div>

              <div className="public-field public-grid-full">
                <label className="public-label">
                  Address line 1 <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <MapPin size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="address_line1"
                    value={form.address_line1}
                    onChange={updateField}
                    placeholder="House number, street, or building"
                    autoComplete="address-line1"
                    required
                  />
                </div>
              </div>

              <div className="public-field public-grid-full">
                <label className="public-label">Address line 2</label>
                <div className="public-input-wrap">
                  <MapPin size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="address_line2"
                    value={form.address_line2}
                    onChange={updateField}
                    placeholder="Apartment, area, or locality"
                    autoComplete="address-line2"
                  />
                </div>
              </div>

              <div className="public-field">
                <label className="public-label">
                  City <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <Building2 size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="city"
                    value={form.city}
                    onChange={updateField}
                    placeholder="City"
                    autoComplete="address-level2"
                    required
                  />
                </div>
              </div>

              <div className="public-field">
                <label className="public-label">
                  State <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <MapPin size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="state"
                    value={form.state}
                    onChange={updateField}
                    placeholder="State"
                    autoComplete="address-level1"
                    required
                  />
                </div>
              </div>

              <div className="public-field">
                <label className="public-label">
                  Postal code <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <Hash size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="postal_code"
                    value={form.postal_code}
                    onChange={updateField}
                    placeholder="Postal code"
                    autoComplete="postal-code"
                    required
                  />
                </div>
              </div>

              <div className="public-field">
                <label className="public-label">
                  Country <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <Globe size={16} className="public-input-icon" />
                  <select
                    className="public-select"
                    name="country"
                    value={form.country}
                    onChange={updateField}
                    required
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Germany">Germany</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* CARD 2: Technician Photograph */}
          <section className="public-card">
            <div className="public-card-header">
              <div className="public-card-header-left">
                <div className="public-card-badge it-badge">
                  <Camera size={20} />
                </div>
                <div className="public-card-title">
                  <h3>Technician photograph</h3>
                  <p>Capture a frontal photo for identification and access pass.</p>
                </div>
              </div>
            </div>

            {cameraActive ? (
              <div className="public-live-camera-viewfinder-card">
                <div className="public-camera-topbar">
                  <div className="public-camera-status-pill">
                    <span className="public-camera-pulse-dot" />
                    <span>Live Camera Active</span>
                  </div>
                  <button
                    type="button"
                    className="public-camera-flip-btn"
                    onClick={toggleCameraFacing}
                    title="Switch camera"
                  >
                    <RefreshCw size={13} /> Switch Camera
                  </button>
                </div>

                <div className="public-camera-screen-wrap">
                  <video
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && streamRef.current && el.srcObject !== streamRef.current) {
                        el.srcObject = streamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    className={`public-live-video ${facingMode === "user" ? "mirrored" : ""}`}
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="public-camera-reticle">
                    <div className="public-camera-corner top-left" />
                    <div className="public-camera-corner top-right" />
                    <div className="public-camera-corner bottom-left" />
                    <div className="public-camera-corner bottom-right" />
                    <div className="public-camera-face-guide">
                      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2">
                        <circle cx="12" cy="10" r="5" />
                        <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
                      </svg>
                      <span className="public-camera-hint">Align face inside frame</span>
                    </div>
                  </div>
                </div>

                <div className="public-camera-action-bar">
                  <button
                    type="button"
                    className="public-camera-snap-btn"
                    onClick={captureSelfPhoto}
                  >
                    <Camera size={18} /> Snap Photo
                  </button>
                  <button
                    type="button"
                    className="public-camera-cancel-btn"
                    onClick={stopSelfCamera}
                  >
                    <X size={16} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="public-photo-row">
                <div className={`public-photo-preview-box ${photo ? "has-photo" : ""}`}>
                  {photo ? (
                    <div className="public-photo-thumbnail-container">
                      <img src={photo} alt="Technician portrait" />
                      <span className="public-photo-badge-attached">
                        <CheckCircle2 size={12} /> Photo Attached
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="public-photo-avatar-placeholder">
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <span className="public-photo-placeholder-text">
                        Your photo preview will appear here
                      </span>
                    </>
                  )}
                </div>

                <div className="public-photo-controls">
                  <button
                    type="button"
                    className="public-btn-primary-camera"
                    onClick={() => startSelfCamera("user")}
                  >
                    <Camera size={16} />
                    {photo ? "Retake Photo" : "Open Camera"}
                  </button>

                  <button
                    type="button"
                    className="public-btn-secondary"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Upload size={16} /> Upload Image
                  </button>

                  {photo && (
                    <button
                      type="button"
                      className="public-btn-danger-outline"
                      onClick={() => setPhoto("")}
                    >
                      <X size={14} /> Remove Photo
                    </button>
                  )}
                </div>
              </div>
            )}

            <input
              type="file"
              ref={photoInputRef}
              accept="image/*"
              capture="user"
              style={{ display: "none" }}
              onChange={handlePhotoUpload}
            />

            {cameraError && (
              <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "10px" }}>
                {cameraError}
              </p>
            )}
          </section>

          {/* CARD 3: Visit Information */}
          <section className="public-card" id="step-visit">
            <div className="public-card-header">
              <div className="public-card-header-left">
                <div className="public-card-badge green-badge">
                  <Building2 size={20} />
                </div>
                <div className="public-card-title">
                  <h3>Visit information</h3>
                  <p>Tell us who you are visiting and your technical scope.</p>
                </div>
              </div>
              <ChevronUp size={18} className="public-card-toggle-icon" />
            </div>

            <div className="public-grid">
              <div className="public-field public-grid-full">
                <label className="public-label">
                  IT Host employee <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <User size={16} className="public-input-icon" />
                  <select
                    className="public-select"
                    name="host_employee_id"
                    value={form.host_employee_id}
                    onChange={updateField}
                    required
                  >
                    <option value="">Select your IT host</option>
                    {itHosts.length > 0 && (
                      <optgroup label="IT Department Personnel (Recommended)">
                        {itHosts.map((h) => (
                          <option key={h.employee_id} value={h.employee_id}>
                            ★ {h.name} — {h.department || "IT Department"}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {otherHosts.length > 0 && (
                      <optgroup label="Other Hosts">
                        {otherHosts.map((h) => (
                          <option key={h.employee_id} value={h.employee_id}>
                            {h.name} {h.department ? `(${h.department})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              <div className="public-field public-grid-full">
                <label className="public-label">
                  Detailed purpose of visit <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <FileText
                    size={16}
                    className="public-input-icon textarea-icon"
                  />
                  <textarea
                    className="public-textarea"
                    name="scope_of_work"
                    value={form.scope_of_work}
                    onChange={updateField}
                    rows={3}
                    required
                    placeholder="Switch firmware update, cable diagnostics, server replacement..."
                  />
                </div>
              </div>

              <div className="public-field public-grid-full">
                <label className="public-label">
                  Expected departure <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <Calendar size={16} className="public-input-icon" />
                  <input
                    type="datetime-local"
                    className="public-input"
                    name="expected_out_time"
                    value={form.expected_out_time}
                    onChange={updateField}
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          {/* CARD 4: Assets you are carrying */}
          <section className="public-card" id="step-assets">
            <div className="public-card-header">
              <div className="public-card-header-left">
                <div className="public-card-badge it-badge">
                  <Cpu size={20} />
                </div>
                <div className="public-card-title">
                  <h3>Assets you are carrying</h3>
                  <p>Register laptops, diagnostic equipment, or other items.</p>
                </div>
              </div>
              <ChevronUp size={18} className="public-card-toggle-icon" />
            </div>

            {/* Radio Selection Toggle */}
            <div className="public-segmented-toggle">
              <label className="public-radio-label">
                <input
                  type="radio"
                  name="hardware_mode"
                  checked={hasEquipment}
                  onChange={() => setHasEquipment(true)}
                />
                <span>Carrying hardware or tools onto premises</span>
              </label>
              <label className="public-radio-label">
                <input
                  type="radio"
                  name="hardware_mode"
                  checked={!hasEquipment}
                  onChange={() => setHasEquipment(false)}
                />
                <span>No hardware carried (Service / Inspection only)</span>
              </label>
            </div>

            {hasEquipment && (
              <>
                {form.assets.map((asset, index) => (
                  <div className="public-asset-card" key={index}>
                    <div className="public-asset-header">
                      <span className="public-asset-header-title">
                        <Tag size={15} color="#7c3aed" /> Asset {index + 1}
                      </span>
                      {form.assets.length > 1 && (
                        <button
                          type="button"
                          className="public-btn-danger-outline"
                          onClick={() => removeEquipmentItem(index)}
                        >
                          <X size={13} /> Remove asset
                        </button>
                      )}
                    </div>

                    <div className="public-grid">
                      <div className="public-field">
                        <label className="public-label">
                          Asset type <span className="public-required">*</span>
                        </label>
                        <div className="public-input-wrap">
                          <Laptop size={16} className="public-input-icon" />
                          <select
                            className="public-select"
                            value={asset.asset_type}
                            onChange={(e) =>
                              updateEquipmentItem(index, "asset_type", e.target.value)
                            }
                            required
                          >
                            <option value="Diagnostic Laptop">Diagnostic Laptop</option>
                            <option value="Network Switch / Router">Network Switch / Router</option>
                            <option value="Toolkit / Hand Tools">Toolkit / Hand Tools</option>
                            <option value="Cable Tester / Fluke">Cable Tester / Fluke</option>
                            <option value="Server / Storage Unit">Server / Storage Unit</option>
                            <option value="Fiber Splicing Machine">Fiber Splicing Machine</option>
                            <option value="Other IT Equipment">Other IT Equipment</option>
                          </select>
                        </div>
                      </div>

                      <div className="public-field">
                        <label className="public-label">Brand / model</label>
                        <div className="public-input-wrap">
                          <Tag size={16} className="public-input-icon" />
                          <input
                            className="public-input"
                            value={asset.brand_model}
                            onChange={(e) =>
                              updateEquipmentItem(index, "brand_model", e.target.value)
                            }
                            placeholder="Brand and model"
                          />
                        </div>
                      </div>

                      <div className="public-field">
                        <label className="public-label">
                          Serial number <span className="public-required">*</span>
                        </label>
                        <div className="public-input-wrap">
                          <Hash size={16} className="public-input-icon" />
                          <input
                            className="public-input"
                            value={asset.serial_number}
                            onChange={(e) =>
                              updateEquipmentItem(index, "serial_number", e.target.value)
                            }
                            placeholder="Device serial number"
                            required
                          />
                        </div>
                      </div>

                      <div className="public-field">
                        <label className="public-label">Custody intent</label>
                        <div className="public-input-wrap">
                          <select
                            className="public-select no-icon"
                            value={asset.custody_action}
                            onChange={(e) =>
                              updateEquipmentItem(index, "custody_action", e.target.value)
                            }
                          >
                            <option value="Will take back upon departure (Returnable)">
                              Will take back upon departure
                            </option>
                            <option value="Permanent delivery / Handing over to IT">
                              Handing over to IT Department
                            </option>
                            <option value="Temporary staging / Remaining on premises">
                              Temporary staging on premises
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <ITAssetPhotoCapture
                      index={index}
                      photo={asset.photo}
                      onPhotoChange={(newPhoto) =>
                        updateEquipmentItem(index, "photo", newPhoto)
                      }
                    />
                  </div>
                ))}

                <button
                  type="button"
                  className="public-btn-add-asset"
                  onClick={addEquipmentItem}
                >
                  <Plus size={16} /> + Add an asset
                </button>
              </>
            )}

            {!hasEquipment && (
              <p
                style={{
                  margin: 0,
                  fontSize: "12.5px",
                  color: "#64748b",
                  background: "#f1f5f9",
                  padding: "12px 14px",
                  borderRadius: "10px",
                }}
              >
                No external hardware declared. Pass serves as contractor personnel
                clearance.
              </p>
            )}
          </section>

          {/* Confirmation Checkbox */}
          <label className="public-confirm-row">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              required
            />
            <span className="public-confirm-text">
              I confirm the information provided is correct.
            </span>
          </label>

          {/* Submit and Clear Buttons */}
          <button
            type="submit"
            className="public-submit-btn"
            disabled={loading}
          >
            <Send size={16} />
            {loading ? "Submitting registration..." : "Review and submit registration"}
          </button>

          <button
            type="button"
            className="public-clear-btn"
            onClick={handleClearForm}
          >
            <RotateCcw size={15} /> Clear form
          </button>

          {/* Privacy Note */}
          <div className="public-security-notice">
            <ShieldCheck size={18} />
            <span>
              Your information, photograph, and registered equipment are intended for IT
              security verification and gate exit clearance.
            </span>
          </div>
        </form>

        {/* Footer */}
        <footer className="public-portal-footer">
          <ShieldCheck size={14} />
          <span>
            IT Department visitor registration · Internal security verification
          </span>
        </footer>
      </div>
    </main>
  );
}
