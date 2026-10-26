import { useState, useRef, useEffect } from "react";
import {
  UserRound,
  Building2,
  Camera,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
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

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access requires a supported browser and HTTPS.");
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
    <div className="public-asset-photo-box">
      <span className="public-asset-photo-label">Asset Photograph (Optional)</span>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {cameraActive && (
        <div className="public-asset-camera-view">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="public-asset-video"
          />
          <div className="public-asset-cam-controls">
            <button
              type="button"
              className="public-submit"
              style={{ width: "auto", padding: "10px 18px", fontSize: "13px" }}
              onClick={capturePhoto}
            >
              <Camera size={16} /> Snap Photo
            </button>
            <button
              type="button"
              className="public-secondary-button"
              style={{ padding: "10px 16px", fontSize: "13px" }}
              onClick={stopCamera}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!cameraActive && photo && (
        <div className="public-asset-captured-row">
          <div className="public-asset-thumb-container">
            <img
              src={photo}
              alt={`Asset ${index + 1}`}
              className="public-asset-thumbnail"
            />
            <span className="public-asset-photo-badge">
              <CheckCircle2 size={13} /> Photo captured
            </span>
          </div>
          <div className="public-asset-btn-group">
            <button
              type="button"
              className="public-secondary-button"
              style={{ padding: "8px 12px", fontSize: "12px" }}
              onClick={startCamera}
            >
              <RefreshCw size={13} /> Retake
            </button>
            <button
              type="button"
              className="public-secondary-button"
              style={{ padding: "8px 12px", fontSize: "12px" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} /> Upload Image
            </button>
            <button
              type="button"
              className="public-remove-button"
              style={{ margin: 0, padding: "8px 12px", fontSize: "12px" }}
              onClick={() => onPhotoChange("")}
            >
              <X size={13} /> Remove
            </button>
          </div>
        </div>
      )}

      {!cameraActive && !photo && (
        <div className="public-asset-empty-state">
          <div className="public-asset-empty-text">
            <Camera size={20} className="public-asset-empty-icon" />
            <div>
              <p className="public-asset-empty-heading">No photograph attached</p>
              <p className="public-asset-empty-sub">Snap or upload a photo of the item for gate clearance</p>
            </div>
          </div>
          <div className="public-asset-btn-group">
            <button
              type="button"
              className="public-secondary-button"
              style={{ padding: "8px 14px", fontSize: "13px", fontWeight: "600" }}
              onClick={startCamera}
            >
              <Camera size={14} /> Camera
            </button>
            <button
              type="button"
              className="public-secondary-button"
              style={{ padding: "8px 14px", fontSize: "13px", fontWeight: "600" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Upload
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <p className="public-inline-error" style={{ marginTop: "8px" }}>
          {cameraError}
        </p>
      )}
    </div>
  );
}

const IT_SERVICE_CATEGORIES = [
  "Server Room & Data Center Maintenance",
  "Network Infrastructure & Cabling Work",
  "Hardware Diagnostics, Replacement & Repair",
  "IT Asset Delivery / Handover / Offboarding",
  "Software, Cloud & ERP Onsite Implementation",
  "Telecom, Leased Line & Fiber Cable Work",
  "Cybersecurity Audit & Compliance Inspection",
  "General IT Technical Support / Maintenance",
];

const IT_FACILITY_AREAS = [
  "Server Room / Primary Data Center",
  "Network Rack / MDF / IDF Closets",
  "IT Staging Lab & Workshop",
  "Floor Workstations / User Desks",
  "Telecom & UPS Infrastructure Room",
  "Entire Facility / Multi-Zone Access",
];

export default function ITVisitForm({ hosts = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [hasEquipment, setHasEquipment] = useState(true);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const photoInputRef = useRef(null);

  const [form, setForm] = useState({
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
    service_category: IT_SERVICE_CATEGORIES[0],
    ticket_number: "",
    facility_area: IT_FACILITY_AREAS[0],
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
  });

  // Highlight IT Department hosts
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

  async function startSelfCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access requires a supported browser and a secure connection.");
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
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
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
          asset_type: "",
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.host_employee_id) {
      setError("Please select the IT Host employee.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);

    try {
      const formattedPurpose = [
        `[IT_VISIT] ${form.service_category}`,
        `Area: ${form.facility_area}`,
        form.ticket_number ? `Ticket: ${form.ticket_number.trim()}` : null,
        form.technician_id ? `ID: ${form.technician_id.trim()}` : null,
        form.scope_of_work ? `- ${form.scope_of_work.trim()}` : null,
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
            brand_model: form.service_category.slice(0, 100),
            serial_number: form.ticket_number
              ? form.ticket_number.trim()
              : "IT-SERVICE-PASS",
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
        country: form.country.trim(),
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

      window.location.assign(`/visitor-pass/${encodeURIComponent(result.qr_token)}`);
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
      <header className="public-header">
        <div className="public-brand">
          <span className="public-brand-icon">
            <ShieldCheck size={26} />
          </span>

          <div>
            <h1>Visitor Management</h1>
            <p>IT Visitor Registration Portal</p>
          </div>
        </div>

        <span className="public-secure-label">
          <ShieldCheck size={16} /> IT Visitor Portal
        </span>
      </header>

      <section className="public-intro">
        <p className="public-eyebrow">IT DEPARTMENT</p>
        <h2>Register your IT visit</h2>
        <p>
          Please enter your details, select your IT host, and register any
          hardware or diagnostic tools you are bringing onto the premises.
        </p>
      </section>

      {error && (
        <div className="public-message" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form className="public-form" onSubmit={handleSubmit}>
        {/* CARD 1: Personal Information */}
        <section className="public-card">
          <div className="public-section-heading">
            <UserRound size={21} />
            <div>
              <h3>Personal information</h3>
              <p>Enter your identification, company, and contact details.</p>
            </div>
          </div>

          <div className="public-grid">
            <label>
              First name *
              <input
                name="first_name"
                value={form.first_name}
                onChange={updateField}
                required
                placeholder="First name"
              />
            </label>

            <label>
              Last name *
              <input
                name="last_name"
                value={form.last_name}
                onChange={updateField}
                required
                placeholder="Last name"
              />
            </label>

            <label>
              Phone number *
              <input
                name="phone_number"
                type="tel"
                value={form.phone_number}
                onChange={updateField}
                required
                placeholder="+91 98765 43210"
              />
            </label>

            <label>
              Corporate email address *
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                required
                placeholder="technician@company.com"
              />
            </label>

            <label className="public-full-width">
              Company or organisation *
              <input
                name="company_name"
                value={form.company_name}
                onChange={updateField}
                required
                placeholder="e.g. Dell Technologies, Cisco, HP Enterprise, Airtel"
              />
            </label>

            <label className="public-full-width">
              Contractor badge or technician ID
              <input
                name="technician_id"
                value={form.technician_id}
                onChange={updateField}
                placeholder="e.g. TECH-9021 or CISCO-04"
              />
            </label>

            <label className="public-full-width">
              Address line 1 *
              <input
                name="address_line1"
                value={form.address_line1}
                onChange={updateField}
                required
                placeholder="House number, street, or building"
              />
            </label>

            <label className="public-full-width">
              Address line 2
              <input
                name="address_line2"
                value={form.address_line2}
                onChange={updateField}
                placeholder="Apartment, area, or locality"
              />
            </label>

            <label>
              City *
              <input
                name="city"
                value={form.city}
                onChange={updateField}
                required
                placeholder="City"
              />
            </label>

            <label>
              State *
              <input
                name="state"
                value={form.state}
                onChange={updateField}
                required
                placeholder="State"
              />
            </label>

            <label>
              Postal code *
              <input
                name="postal_code"
                value={form.postal_code}
                onChange={updateField}
                required
                placeholder="Postal code"
              />
            </label>

            <label>
              Country *
              <input
                name="country"
                value={form.country}
                onChange={updateField}
                required
                placeholder="Country"
              />
            </label>
          </div>
        </section>

        {/* CARD 2: Photograph */}
        <section className="public-card">
          <div className="public-section-heading">
            <Camera size={21} />
            <div>
              <h3>Technician photograph</h3>
              <p>Capture a frontal photo for identification and access pass.</p>
            </div>
          </div>

          <div className="public-camera">
            {photo ? (
              <img
                className="public-photo-preview"
                src={photo}
                alt="Captured technician"
              />
            ) : (
              <div className="public-camera-placeholder">
                <Camera size={34} />
                <span>Your photo preview will appear here</span>
              </div>
            )}

            <video
              ref={videoRef}
              className="public-video"
              hidden={!cameraActive}
              playsInline
              muted
            />
          </div>

          <div className="public-actions">
            <button type="button" onClick={startSelfCamera}>
              <Camera size={17} /> {photo ? "Retake photo" : "Open camera"}
            </button>

            {cameraActive && (
              <button type="button" onClick={captureSelfPhoto}>
                Capture photo
              </button>
            )}

            <button type="button" onClick={() => photoInputRef.current?.click()}>
              <Upload size={17} /> Upload image
            </button>
          </div>

          <input
            type="file"
            ref={photoInputRef}
            accept="image/*"
            capture="user"
            style={{ display: "none" }}
            onChange={handlePhotoUpload}
          />

          {cameraError && <p className="public-inline-error">{cameraError}</p>}
        </section>

        {/* CARD 3: Visit Information */}
        <section className="public-card">
          <div className="public-section-heading">
            <Building2 size={21} />
            <div>
              <h3>Visit information</h3>
              <p>Tell us who you are visiting and your technical scope.</p>
            </div>
          </div>

          <div className="public-grid">
            <label className="public-full-width">
              IT Host employee *
              <select
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
            </label>

            <label className="public-full-width">
              Service category / Nature of visit *
              <select
                name="service_category"
                value={form.service_category}
                onChange={updateField}
                required
              >
                {IT_SERVICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Ticket or Work order number
              <input
                name="ticket_number"
                value={form.ticket_number}
                onChange={updateField}
                placeholder="e.g. CR-10492 or INC-8821"
              />
            </label>

            <label>
              Target facility area *
              <select
                name="facility_area"
                value={form.facility_area}
                onChange={updateField}
                required
              >
                {IT_FACILITY_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            <label className="public-full-width">
              Detailed purpose of visit *
              <textarea
                name="scope_of_work"
                value={form.scope_of_work}
                onChange={updateField}
                rows={3}
                required
                placeholder="e.g. Switch firmware update, cable diagnostics, server replacement..."
              />
            </label>

            <label className="public-full-width">
              Expected departure *
              <input
                type="datetime-local"
                name="expected_out_time"
                value={form.expected_out_time}
                onChange={updateField}
                required
              />
            </label>
          </div>
        </section>

        {/* CARD 4: Assets you are carrying */}
        <section className="public-card">
          <div className="public-section-heading">
            <ShieldCheck size={21} />
            <div>
              <h3>Assets you are carrying</h3>
              <p>Register laptops, diagnostic equipment, or other items.</p>
            </div>
          </div>

          <div style={{ marginBottom: "16px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600", color: "#1d2b43" }}>
              <input
                type="radio"
                name="eq_toggle"
                checked={hasEquipment}
                onChange={() => setHasEquipment(true)}
              />
              Carrying hardware or tools onto premises
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600", color: "#1d2b43" }}>
              <input
                type="radio"
                name="eq_toggle"
                checked={!hasEquipment}
                onChange={() => setHasEquipment(false)}
              />
              No hardware carried (Service / Inspection only)
            </label>
          </div>

          {hasEquipment &&
            form.assets.map((asset, index) => (
              <div className="public-asset" key={index}>
                <div className="public-grid">
                  <label>
                    Asset type *
                    <input
                      value={asset.asset_type}
                      onChange={(e) =>
                        updateEquipmentItem(index, "asset_type", e.target.value)
                      }
                      placeholder="Laptop, Network Switch, Toolkit..."
                      required
                    />
                  </label>

                  <label>
                    Brand / model
                    <input
                      value={asset.brand_model}
                      onChange={(e) =>
                        updateEquipmentItem(index, "brand_model", e.target.value)
                      }
                      placeholder="Brand and model"
                    />
                  </label>

                  <label>
                    Serial number *
                    <input
                      value={asset.serial_number}
                      onChange={(e) =>
                        updateEquipmentItem(index, "serial_number", e.target.value)
                      }
                      placeholder="Device serial number"
                      required
                    />
                  </label>

                  <label>
                    Custody intent
                    <select
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
                  </label>
                </div>

                <ITAssetPhotoCapture
                  index={index}
                  photo={asset.photo}
                  onPhotoChange={(newPhoto) =>
                    updateEquipmentItem(index, "photo", newPhoto)
                  }
                />

                {form.assets.length > 1 && (
                  <button
                    type="button"
                    className="public-remove-button"
                    onClick={() => removeEquipmentItem(index)}
                  >
                    Remove asset
                  </button>
                )}
              </div>
            ))}

          {hasEquipment && (
            <button
              type="button"
              className="public-secondary-button"
              onClick={addEquipmentItem}
            >
              + Add an asset
            </button>
          )}

          {!hasEquipment && (
            <p className="public-hint" style={{ margin: 0 }}>
              No external hardware declared. A digital IT Service Authorization pass will be issued.
            </p>
          )}
        </section>

        <p className="public-privacy-note">
          Your information, photograph, and registered equipment are intended for IT security verification and gate exit clearance.
        </p>

        <button className="public-submit" type="submit" disabled={loading}>
          {loading ? "Submitting registration..." : "Review and submit registration"}
        </button>
      </form>

      <footer className="public-footer">
        <ShieldCheck size={16} />
        IT Department visitor registration · Internal security verification
      </footer>
    </main>
  );
}
