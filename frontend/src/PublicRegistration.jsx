
import { useEffect, useRef, useState } from "react";
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
      <span className="public-asset-photo-label">Asset Photograph</span>

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
              <RefreshCw size={13} /> Retake with Camera
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
            <Camera size={22} className="public-asset-empty-icon" />
            <div>
              <p className="public-asset-empty-heading">No photograph attached</p>
              <p className="public-asset-empty-sub">Snap or upload a photo of the item for security verification</p>
            </div>
          </div>
          <div className="public-asset-btn-group">
            <button
              type="button"
              className="public-secondary-button"
              style={{ padding: "9px 14px", fontSize: "13px", fontWeight: "650" }}
              onClick={startCamera}
            >
              <Camera size={15} /> Open Camera
            </button>
            <button
              type="button"
              className="public-secondary-button"
              style={{ padding: "9px 14px", fontSize: "13px", fontWeight: "650" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} /> Take Photo / Choose File
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


export default function PublicRegistration() {
  const [hosts, setHosts] = useState([]);
  const [loadingHosts, setLoadingHosts] = useState(true);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const photoFileInputRef = useRef(null);

  function handlePhotoFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Please select a valid image file (JPEG or PNG).");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setCameraError("Image size must be smaller than 3 MB.");
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

  const [form, setForm] = useState({
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
    country: "",
    host_employee_id: "",
    purpose: "",
    expected_out_time: "",
    assets: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadHosts() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/public-registration/hosts`
        );

        if (!response.ok) {
          throw new Error("Unable to load hosts.");
        }

        const data = await response.json();

        if (!cancelled) {
          setHosts(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setError(
            "We could not load the host list. Please try again shortly."
          );
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

  async function startCamera() {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access requires a supported browser and a secure connection."
      );
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
      setCameraError(
        "Camera access was denied or the camera is unavailable. Check browser permissions."
      );
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

  function addAsset() {
    setForm((previous) => ({
      ...previous,
      assets: [
        ...previous.assets,
        { asset_type: "", brand_model: "", serial_number: "", photo: "" },
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.host_employee_id) {
      setError("Please select the employee you want to meet.");
      return;
    }

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_number: form.phone_number.trim(),
        email: form.email.trim(),
        company_name: form.company_name.trim(),

        // Visitor address
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postal_code: form.postal_code.trim(),
        country: form.country.trim(),

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

      const response = await fetch(
        `${API_BASE_URL}/public-registration/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

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
        throw new Error(
          "Registration response did not include a visitor pass token."
        );
      }

      window.location.assign(
        `/visitor-pass/${encodeURIComponent(result.qr_token)}`
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to submit your registration. Please try again."
      );
    }
  }

  return (
    <main className="public-registration">
      <header className="public-header">
        <div className="public-brand">
          <span className="public-brand-icon">
            <img src="/vms-logo.png" alt="VMS Logo" />
          </span>

          <div>
            <h1>Visitor Management</h1>
            <p>Visitor Registration Portal</p>
          </div>
        </div>

        <span className="public-secure-label">
          <ShieldCheck size={16} /> Visitor Portal
        </span>
      </header>

      <section className="public-intro">
        <p className="public-eyebrow">WELCOME</p>
        <h2>Register your visit</h2>
        <p>
          Please enter your details, select your host, and register any
          assets you are bringing onto the premises.
        </p>
      </section>

      {error && (
        <div className="public-message" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form className="public-form" onSubmit={handleSubmit}>
        <section className="public-card">
          <div className="public-section-heading">
            <UserRound size={21} />
            <div>
              <h3>Personal information</h3>
              <p>Enter your identification and contact details.</p>
            </div>
          </div>

          <div className="public-grid">
            <label>
              First name *
              <input
                name="first_name"
                value={form.first_name}
                onChange={updateField}
                autoComplete="given-name"
                required
              />
            </label>

            <label>
              Last name *
              <input
                name="last_name"
                value={form.last_name}
                onChange={updateField}
                autoComplete="family-name"
                required
              />
            </label>

            <label>
              Phone number *
              <input
                name="phone_number"
                type="tel"
                value={form.phone_number}
                onChange={updateField}
                autoComplete="tel"
                required
              />
            </label>

            <label>
              Email address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                autoComplete="email"
              />
            </label>

            <label className="public-full-width">
              Company or organisation
              <input
                name="company_name"
                value={form.company_name}
                onChange={updateField}
                autoComplete="organization"
              />
            </label>

            <label className="public-full-width">
              Address line 1 *
              <input
                name="address_line1"
                value={form.address_line1}
                onChange={updateField}
                autoComplete="address-line1"
                placeholder="House number, street, or building"
                required
              />
            </label>

            <label className="public-full-width">
              Address line 2
              <input
                name="address_line2"
                value={form.address_line2}
                onChange={updateField}
                autoComplete="address-line2"
                placeholder="Apartment, area, or locality"
              />
            </label>

            <label>
              City *
              <input
                name="city"
                value={form.city}
                onChange={updateField}
                autoComplete="address-level2"
                required
              />
            </label>

            <label>
              State *
              <input
                name="state"
                value={form.state}
                onChange={updateField}
                autoComplete="address-level1"
                required
              />
            </label>

            <label>
              Postal code *
              <input
                name="postal_code"
                value={form.postal_code}
                onChange={updateField}
                autoComplete="postal-code"
                required
              />
            </label>

            <label>
              Country *
              <input
                name="country"
                value={form.country}
                onChange={updateField}
                autoComplete="country-name"
                required
              />
            </label>
          </div>
        </section>

        <section className="public-card">
          <div className="public-section-heading">
            <Camera size={21} />
            <div>
              <h3>Visitor photograph</h3>
              <p>Capture a current photo for identification.</p>
            </div>
          </div>

          <div className="public-camera">
            {photo ? (
              <img
                className="public-photo-preview"
                src={photo}
                alt="Captured visitor"
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

          <input
            type="file"
            ref={photoFileInputRef}
            accept="image/png, image/jpeg, image/jpg"
            style={{ display: "none" }}
            onChange={handlePhotoFileChange}
          />

          <div className="public-actions">
            <button type="button" onClick={startCamera}>
              <Camera size={17} /> {photo ? "Retake with camera" : "Open camera"}
            </button>

            {cameraActive && (
              <button type="button" onClick={capturePhoto}>
                Capture photo
              </button>
            )}

            <button type="button" onClick={() => photoFileInputRef.current?.click()}>
              <Upload size={17} /> Upload photo file
            </button>

            {photo && (
              <button
                type="button"
                className="public-remove-button"
                style={{ margin: 0 }}
                onClick={() => setPhoto("")}
              >
                <X size={15} /> Remove photo
              </button>
            )}
          </div>

          {cameraError && (
            <p className="public-inline-error">{cameraError}</p>
          )}
        </section>

        <section className="public-card">
          <div className="public-section-heading">
            <Building2 size={21} />
            <div>
              <h3>Visit information</h3>
              <p>Tell us who you are visiting and why.</p>
            </div>
          </div>

          <div className="public-grid">
            <label className="public-full-width">
              Host employee *
              <select
                name="host_employee_id"
                value={form.host_employee_id}
                onChange={updateField}
                required
                disabled={loadingHosts}
              >
                <option value="">
                  {loadingHosts ? "Loading hosts..." : "Select your host"}
                </option>

                {hosts.map((host) => (
                  <option
                    key={host.employee_id}
                    value={host.employee_id}
                  >
                    {host.name}
                    {host.department ? ` — ${host.department}` : ""}
                  </option>
                ))}
              </select>

              {!loadingHosts && hosts.length === 0 && (
                <span className="public-hint">
                  No active hosts are currently available.
                </span>
              )}
            </label>

            <label className="public-full-width">
              Purpose of visit *
              <textarea
                name="purpose"
                value={form.purpose}
                onChange={updateField}
                rows={3}
                required
                placeholder="e.g. Business meeting, interview, delivery"
              />
            </label>

            <label className="public-full-width">
              Expected departure
              <input
                type="datetime-local"
                name="expected_out_time"
                value={form.expected_out_time}
                onChange={updateField}
              />
            </label>
          </div>
        </section>

        <section className="public-card">
          <div className="public-section-heading">
            <ShieldCheck size={21} />
            <div>
              <h3>Assets you are carrying</h3>
              <p>Register laptops, equipment, or other items.</p>
            </div>
          </div>

          {form.assets.map((asset, index) => (
            <div className="public-asset" key={index}>
              <div className="public-grid">
                <label>
                  Asset type
                  <input
                    value={asset.asset_type}
                    onChange={(event) =>
                      updateAsset(index, "asset_type", event.target.value)
                    }
                    placeholder="Laptop"
                  />
                </label>

                <label>
                  Brand / model
                  <input
                    value={asset.brand_model}
                    onChange={(event) =>
                      updateAsset(index, "brand_model", event.target.value)
                    }
                    placeholder="Brand and model"
                  />
                </label>

                <label className="public-full-width">
                  Serial number
                  <input
                    value={asset.serial_number}
                    onChange={(event) =>
                      updateAsset(index, "serial_number", event.target.value)
                    }
                    placeholder="Device serial number"
                  />
                </label>
              </div>

              <AssetPhotoCapture
                index={index}
                photo={asset.photo}
                onPhotoChange={(newPhoto) => updateAsset(index, "photo", newPhoto)}
              />

              <button
                type="button"
                className="public-remove-button"
                onClick={() => removeAsset(index)}
              >
                Remove asset
              </button>
            </div>
          ))}

          <button
            type="button"
            className="public-secondary-button"
            onClick={addAsset}
          >
            + Add an asset
          </button>
        </section>

        <p className="public-privacy-note">
          Your information and photograph are intended for visit management
          and security verification. Do not submit sensitive personal
          information that is not requested.
        </p>

        <button className="public-submit" type="submit">
          Review registration
        </button>
      </form>

      <footer className="public-footer">
        <ShieldCheck size={16} />
        Visitor registration · Internal security verification
      </footer>
    </main>
  );
}
