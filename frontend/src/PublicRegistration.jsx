import { useEffect, useRef, useState } from "react";
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
  FileCheck2,
} from "lucide-react";
import "./PublicRegistration.css";

const API_BASE_URL = "";

function AssetPhotoCapture({ index, photo, onPhotoChange }) {
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

      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.error("Video play error:", e);
          }
        }
      }, 50);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera permission denied or camera not available.");
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
      setCameraError("Please select an image file (JPEG or PNG).");
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
            ref={videoRef}
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
                <CheckCircle2 size={14} /> Photo attached
              </span>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                Ready for gate physical verification
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
              <h4>Asset photograph</h4>
              <p>Snap or upload a photo of the item for security verification</p>
            </div>
          </div>
          <div className="public-asset-btn-group">
            <button
              type="button"
              className="public-btn-secondary"
              style={{ padding: "8px 14px", fontSize: "12.5px" }}
              onClick={startCamera}
            >
              <Camera size={14} /> Open camera
            </button>
            <button
              type="button"
              className="public-btn-secondary"
              style={{ padding: "8px 14px", fontSize: "12.5px" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Take photo / Choose file
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

export default function PublicRegistration() {
  useEffect(() => {
    const prevTheme = document.documentElement.getAttribute("data-theme");
    const hadDarkClass = document.documentElement.classList.contains("dark");
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
    return () => {
      if (prevTheme) document.documentElement.setAttribute("data-theme", prevTheme);
      if (hadDarkClass) document.documentElement.classList.add("dark");
    };
  }, []);

  const [hosts, setHosts] = useState([]);
  const [loadingHosts, setLoadingHosts] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const photoFileInputRef = useRef(null);

  const initialFormState = {
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    company_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    host_employee_id: "",
    purpose: "",
    expected_out_time: "",
    assets: [],
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    let cancelled = false;

    async function loadHosts() {
      try {
        const response = await fetch(`${API_BASE_URL}/public-registration/hosts`);
        if (!response.ok) {
          throw new Error("Unable to load hosts.");
        }
        const data = await response.json();
        if (!cancelled) {
          setHosts(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setError("We could not load the host list. Please try again shortly.");
        }
      } finally {
        if (!cancelled) setLoadingHosts(false);
      }
    }

    loadHosts();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handlePhotoFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Please select a valid image file (JPEG or PNG).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCameraError("Image size must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setCameraError("");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    };
    reader.onerror = () => {
      setCameraError("Failed to read image file. Please try another.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError("Camera access was denied or the camera is unavailable.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCameraError("Please wait until the camera preview is ready.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    setPhoto(canvas.toDataURL("image/jpeg", 0.85));

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function stopSelfCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function addAsset() {
    setForm((previous) => ({
      ...previous,
      assets: [
        ...previous.assets,
        { asset_type: "Laptop", brand_model: "", serial_number: "", photo: "" },
      ],
    }));
  }

  function updateAsset(index, field, value) {
    setForm((previous) => ({
      ...previous,
      assets: previous.assets.map((asset, i) =>
        i === index ? { ...asset, [field]: value } : asset
      ),
    }));
  }

  function removeAsset(index) {
    setForm((previous) => ({
      ...previous,
      assets: previous.assets.filter((_, i) => i !== index),
    }));
  }

  function handleClearForm() {
    if (window.confirm("Are you sure you want to clear this registration form?")) {
      setForm(initialFormState);
      setPhoto("");
      setConfirmed(false);
      setError("");
      setCameraError("");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.host_employee_id) {
      setError("Please select the host employee you are visiting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!confirmed) {
      setError("Please confirm the information provided is correct before submitting.");
      return;
    }

    setSubmitting(true);

    try {
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
        purpose: form.purpose.trim(),
        expected_out_time: form.expected_out_time || null,
        assets: form.assets
          .filter(
            (asset) =>
              asset.asset_type.trim() ||
              asset.brand_model.trim() ||
              asset.serial_number.trim() ||
              asset.photo
          )
          .map((asset) => ({
            asset_type: asset.asset_type.trim() || "Item",
            brand_model: asset.brand_model.trim() || null,
            serial_number: asset.serial_number.trim() || null,
            photo_data: asset.photo || null,
          })),
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
        const message =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
            ? detail.map((item) => item.msg).join(", ")
            : "Registration failed. Please check your details and try again.";
        throw new Error(message);
      }

      if (!result.qr_token) {
        throw new Error("Registration response did not include a visitor pass token.");
      }

      sessionStorage.setItem("vms_auto_download_pass", "true");
      window.location.assign(
        `/visitor-pass/${encodeURIComponent(result.qr_token)}?autodownload=1`
      );
    } catch (err) {
      setError(err.message || "Unable to submit your registration. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
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
              <p>Visitor Registration Portal</p>
            </div>
          </div>

          <span className="public-secure-label">
            <ShieldCheck size={15} /> Secure Portal
          </span>
        </div>
      </header>

      <div className="public-container">
        {/* Intro Banner */}
        <section className="public-intro-banner">
          <div className="public-intro-content">
            <h2>Register your visit</h2>
            <p>
              Enter your details, select your host, and register any assets you are
              bringing onto the premises.
            </p>
          </div>

          {/* Decorative graphic card */}
          <div className="public-hero-graphic-card">
            <div className="public-hero-graphic-icon">
              <FileCheck2 size={44} strokeWidth={1.6} />
            </div>
            <div className="public-hero-badge-pill">
              <CheckCircle2 size={13} strokeWidth={2.5} />
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
                <div className="public-card-badge">
                  <UserRound size={20} />
                </div>
                <div className="public-card-title">
                  <h3>Personal information</h3>
                  <p>Enter your identification and contact details.</p>
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
                    placeholder="Enter first name"
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
                    placeholder="Enter last name"
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
                    placeholder="Enter phone number"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <div className="public-field">
                <label className="public-label">Email address</label>
                <div className="public-input-wrap">
                  <Mail size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="Enter email address"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="public-field public-grid-full">
                <label className="public-label">Company or organisation</label>
                <div className="public-input-wrap">
                  <Building2 size={16} className="public-input-icon" />
                  <input
                    className="public-input"
                    name="company_name"
                    value={form.company_name}
                    onChange={updateField}
                    placeholder="Enter company or organisation"
                    autoComplete="organization"
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
                    placeholder="Enter city"
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
                    placeholder="Enter state"
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
                    placeholder="Enter postal code"
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

          {/* CARD 2: Visitor Photograph */}
          <section className="public-card">
            <div className="public-card-header">
              <div className="public-card-header-left">
                <div className="public-card-badge">
                  <Camera size={20} />
                </div>
                <div className="public-card-title">
                  <h3>Visitor photograph</h3>
                  <p>Capture a current photo for identification.</p>
                </div>
              </div>
            </div>

            <div className="public-photo-row">
              <div className="public-photo-preview-box">
                {photo ? (
                  <img src={photo} alt="Visitor portrait" />
                ) : (
                  <>
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
                    <span className="public-photo-placeholder-text">
                      Your photo preview will appear here
                    </span>
                  </>
                )}
              </div>

              <div className="public-photo-controls">
                <button
                  type="button"
                  className="public-btn-secondary"
                  onClick={startCamera}
                >
                  <Camera size={16} />
                  {photo ? "Retake with camera" : "Open camera"}
                </button>

                <button
                  type="button"
                  className="public-btn-secondary"
                  onClick={() => photoFileInputRef.current?.click()}
                >
                  <Upload size={16} /> Upload photo file
                </button>

                {photo && (
                  <button
                    type="button"
                    className="public-btn-danger-outline"
                    onClick={() => setPhoto("")}
                  >
                    <X size={14} /> Remove photo
                  </button>
                )}
              </div>
            </div>

            <input
              type="file"
              ref={photoFileInputRef}
              accept="image/png, image/jpeg, image/jpg"
              style={{ display: "none" }}
              onChange={handlePhotoFileChange}
            />

            {cameraActive && (
              <div className="public-live-camera-view">
                <video
                  ref={videoRef}
                  className="public-live-video"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="public-live-controls">
                  <button
                    type="button"
                    className="public-submit-btn"
                    style={{ width: "auto", padding: "10px 20px" }}
                    onClick={capturePhoto}
                  >
                    <Camera size={16} /> Snap Photo
                  </button>
                  <button
                    type="button"
                    className="public-clear-btn"
                    style={{ width: "auto", padding: "10px 16px", margin: 0 }}
                    onClick={stopSelfCamera}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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
                <div className="public-card-badge">
                  <Building2 size={20} />
                </div>
                <div className="public-card-title">
                  <h3>Visit information</h3>
                  <p>Tell us who you are visiting and why.</p>
                </div>
              </div>
              <ChevronUp size={18} className="public-card-toggle-icon" />
            </div>

            <div className="public-grid">
              <div className="public-field public-grid-full">
                <label className="public-label">
                  Host employee <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <User size={16} className="public-input-icon" />
                  <select
                    className="public-select"
                    name="host_employee_id"
                    value={form.host_employee_id}
                    onChange={updateField}
                    required
                    disabled={loadingHosts}
                  >
                    <option value="">
                      {loadingHosts ? "Loading available hosts..." : "Select your host"}
                    </option>
                    {hosts.map((host) => (
                      <option key={host.employee_id} value={host.employee_id}>
                        {host.name} {host.department ? ` — ${host.department}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="public-field public-grid-full">
                <label className="public-label">
                  Purpose of visit <span className="public-required">*</span>
                </label>
                <div className="public-input-wrap">
                  <FileText
                    size={16}
                    className="public-input-icon textarea-icon"
                  />
                  <textarea
                    className="public-textarea"
                    name="purpose"
                    value={form.purpose}
                    onChange={updateField}
                    rows={3}
                    required
                    placeholder="e.g. Business meeting, interview, delivery"
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
                <div className="public-card-badge">
                  <Laptop size={20} />
                </div>
                <div className="public-card-title">
                  <h3>Assets you are carrying</h3>
                  <p>Register laptops, equipment, or other items.</p>
                </div>
              </div>
              <ChevronUp size={18} className="public-card-toggle-icon" />
            </div>

            {form.assets.map((asset, index) => (
              <div className="public-asset-card" key={index}>
                <div className="public-asset-header">
                  <span className="public-asset-header-title">
                    <Tag size={15} color="#2563eb" /> Asset {index + 1}
                  </span>
                  <button
                    type="button"
                    className="public-btn-danger-outline"
                    onClick={() => removeAsset(index)}
                  >
                    <X size={13} /> Remove asset
                  </button>
                </div>

                <div className="public-grid">
                  <div className="public-field">
                    <label className="public-label">Asset type</label>
                    <div className="public-input-wrap">
                      <Laptop size={16} className="public-input-icon" />
                      <input
                        className="public-input"
                        value={asset.asset_type}
                        onChange={(e) =>
                          updateAsset(index, "asset_type", e.target.value)
                        }
                        placeholder="Laptop, Tool, Device..."
                      />
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
                          updateAsset(index, "brand_model", e.target.value)
                        }
                        placeholder="Brand and model"
                      />
                    </div>
                  </div>

                  <div className="public-field public-grid-full">
                    <label className="public-label">Serial number</label>
                    <div className="public-input-wrap">
                      <Hash size={16} className="public-input-icon" />
                      <input
                        className="public-input"
                        value={asset.serial_number}
                        onChange={(e) =>
                          updateAsset(index, "serial_number", e.target.value)
                        }
                        placeholder="Device serial number"
                      />
                    </div>
                  </div>
                </div>

                <AssetPhotoCapture
                  index={index}
                  photo={asset.photo}
                  onPhotoChange={(newPhoto) => updateAsset(index, "photo", newPhoto)}
                />
              </div>
            ))}

            <button
              type="button"
              className="public-btn-add-asset"
              onClick={addAsset}
            >
              <Plus size={16} /> + Add an asset
            </button>
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
            disabled={submitting}
          >
            <Send size={16} />
            {submitting ? "Submitting registration..." : "Submit visitor registration"}
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
              Your information and photograph are intended for visit management and security
              verification. Do not submit sensitive personal information.
            </span>
          </div>
        </form>

        {/* Footer */}
        <footer className="public-portal-footer">
          <ShieldCheck size={14} />
          <span>Visitor registration · Internal security verification</span>
        </footer>
      </div>
    </main>
  );
}
