import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  QrCode,
  RefreshCw,
  UserPlus,
  XCircle,
  Download,
  Printer,
  Check,
  Clipboard,
} from "lucide-react";

import "./CreateVisit.css";

const API_BASE_URL = "http://127.0.0.1:8000";
const QR_BACKEND_URL = "http://192.168.20.182:8000";

// Read the latest token for every request so this component uses the same
// login session as App.jsx, including after login/logout without remounting.
const authenticatedFetch = (url, options = {}) => {
  const token = localStorage.getItem("vms_token");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
};

function CreateVisit({ onBack, onCreated, onNotification }) {
  const [visitors, setVisitors] = useState([]);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createdVisit, setCreatedVisit] = useState(null);
  const [assetSaveWarning, setAssetSaveWarning] = useState("");
  const [savedAssets, setSavedAssets] = useState([]);
  const [loadingSavedAssets, setLoadingSavedAssets] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrImageSrc, setQrImageSrc] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const [form, setForm] = useState({
    visitor_id: "",
    host_employee_id: "1",
    purpose: "",
    expected_out_time: "",
  });

  const [assets, setAssets] = useState([]);
  const [assetForm, setAssetForm] = useState({
    asset_type: "Laptop",
    brand_model: "",
    serial_number: "",
  });

  /* =========================================================
      LOAD VISITORS
  ========================================================= */

  const fetchVisitors = async () => {
    try {
      setLoadingVisitors(true);
      setError("");

      const response = await authenticatedFetch(`${API_BASE_URL}/visitors/`);

      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Your login session is invalid or expired. Please log out and sign in again."
            : `Unable to load registered visitors (HTTP ${response.status}).`
        );
      }

      const data = await response.json();

      setVisitors(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.visitors)
            ? data.visitors
            : []
      );
    } catch (err) {
      console.error("Visitor loading error:", err);

      setError(
        err.message ||
          "Unable to load registered visitors. Make sure the backend is running."
      );
    } finally {
      setLoadingVisitors(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  /* =========================================================
      FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleAssetChange = (event) => {
    const { name, value } = event.target;

    setAssetForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddAsset = () => {
    if (!assetForm.asset_type.trim()) {
      setError("Please select an asset type.");
      return;
    }

    setAssets((previous) => [
      ...previous,
      {
        ...assetForm,
        asset_type: assetForm.asset_type.trim(),
        brand_model: assetForm.brand_model.trim(),
        serial_number: assetForm.serial_number.trim(),
        localId: `${Date.now()}-${previous.length}`,
      },
    ]);

    setAssetForm({
      asset_type: "Laptop",
      brand_model: "",
      serial_number: "",
    });

    setError("");
    setSuccess("");
  };

  const handleRemoveAsset = (localId) => {
    setAssets((previous) =>
      previous.filter((asset) => asset.localId !== localId)
    );
  };

  /* =========================================================
      CREATE VISIT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setCreatedVisit(null);
    setAssetSaveWarning("");
    setQrVisible(false);

    if (!form.visitor_id) {
      setError("Please select a visitor.");
      return;
    }

    if (!form.host_employee_id) {
      setError("Please enter the host employee ID.");
      return;
    }

    if (!form.purpose.trim()) {
      setError("Please enter the purpose of visit.");
      return;
    }

    const selectedVisitor = visitors.find(
      (visitor) =>
        String(visitor.visitor_id) === String(form.visitor_id)
    );

    try {
      setSubmitting(true);

      let expectedOutTime = null;

      if (form.expected_out_time) {
        const selectedDate = new Date(form.expected_out_time);

        if (Number.isNaN(selectedDate.getTime())) {
          setError("Please select a valid expected checkout date and time.");
          setSubmitting(false);
          return;
        }

        expectedOutTime = selectedDate.toISOString();
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/visits/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitor_id: Number(form.visitor_id),
          host_employee_id: Number(form.host_employee_id),
          purpose: form.purpose.trim(),
          expected_out_time: expectedOutTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to create visit."
        );
      }

      const assetFailures = [];

      for (const asset of assets) {
        try {
          const assetResponse = await authenticatedFetch(`${API_BASE_URL}/assets/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              visit_id: data.visit_id,
              asset_type: asset.asset_type,
              brand_model: asset.brand_model || null,
              serial_number: asset.serial_number || null,
            }),
          });

          if (!assetResponse.ok) {
            const assetError = await assetResponse.json().catch(() => ({}));

            assetFailures.push(
              `${asset.asset_type}: ${
                assetError.detail || `HTTP ${assetResponse.status}`
              }`
            );
          }
        } catch {
          assetFailures.push(`${asset.asset_type}: network error`);
        }
      }

      if (assetFailures.length > 0) {
        setAssetSaveWarning(
          `The visit was created, but ${assetFailures.length} asset(s) could not be saved: ${assetFailures.join("; ")}`
        );
      } else {
        setAssetSaveWarning("");
      }

      setCreatedVisit(data);

      loadingSavedAssets && setLoadingSavedAssets(false);
      setLoadingSavedAssets(true);
      setSavedAssets([]);

      try {
        const assetResponse = await authenticatedFetch(
          `${API_BASE_URL}/assets/?visit_id=${encodeURIComponent(data.visit_id)}`
        );

        if (!assetResponse.ok) {
          throw new Error("Unable to load registered assets.");
        }

        const assetData = await assetResponse.json();
        setSavedAssets(Array.isArray(assetData) ? assetData : []);
      } catch (assetFetchError) {
        console.error("Load assets error:", assetFetchError);
        setAssetSaveWarning((previous) =>
          previous
            ? `${previous}. Registered assets could not be loaded.`
            : "Visit created, but registered assets could not be loaded."
        );
      } finally {
        setLoadingSavedAssets(false);
      }

      if (data?.status === "ACTIVE" && onNotification) {
        const visitorName = selectedVisitor
          ? `${selectedVisitor.first_name} ${selectedVisitor.last_name}`
          : "A visitor";

        onNotification({
          title: "New Visitor Checked In",
          message: `${visitorName} has checked in successfully and is currently inside.`,
          type: "visitor",
          time: "Just now",
        });
      }

      const successfulAssetsCount = assets.length - assetFailures.length;
      setSuccess(
        assetFailures.length > 0
          ? `Visit created, but ${successfulAssetsCount} of ${assets.length} asset(s) saved successfully.`
          : `Visit created successfully${assets.length > 0 ? ` with ${assets.length} asset(s)` : ""}.`
      );

      setForm((previous) => ({
        ...previous,
        purpose: "",
        expected_out_time: "",
      }));

      if (onCreated) {
        onCreated(data);
      }
    } catch (err) {
      console.error("Create visit error:", err);

      setError(
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not connect to the visit API. Check the backend terminal for errors."
          : err.message || "Unable to create visit."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
      RESET
  ========================================================= */

  const handleCreateAnother = () => {
    setCreatedVisit(null);
    setAssetSaveWarning("");
    setSavedAssets([]);
    setLoadingSavedAssets(false);
    setQrVisible(false);

    setSuccess("");
    setError("");

    setForm({
      visitor_id: "",
      host_employee_id: "1",
      purpose: "",
      expected_out_time: "",
    });

    setAssets([]);
  };

  /* =========================================================
      QR URL
  ========================================================= */

  const scanUrl = createdVisit?.visit_id
    ? `${QR_BACKEND_URL}/visits/scan/${createdVisit.visit_id}`
    : "";

  const qrUrl = createdVisit?.visit_id
    ? `${API_BASE_URL}/visits/${createdVisit.visit_id}/qr`
    : "";

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    if (!qrUrl || !qrVisible) {
      setQrImageSrc("");
      return undefined;
    }

    const loadQrImage = async () => {
      try {
        setError("");
        const response = await authenticatedFetch(qrUrl);
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Your login session is invalid or expired. Please sign in again.");
          }
          throw new Error(`Unable to load QR code (HTTP ${response.status}).`);
        }

        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) {
          throw new Error("The QR endpoint did not return an image.");
        }

        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setQrImageSrc(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      } catch (err) {
        console.error("QR image loading error:", err);
        if (!cancelled) {
          setQrImageSrc("");
          setError(err.message || "Unable to load QR code.");
        }
      }
    };

    loadQrImage();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [qrUrl, qrVisible]);

  const handleCopyScanLink = async () => {
    if (!scanUrl) {
      setError("Scan link is not available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(scanUrl);

      setLinkCopied(true);
      setError("");

      setTimeout(() => {
        setLinkCopied(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setError("Unable to copy the scan link.");
    }
  };

  const handleDownloadQr = async () => {
    if (!qrUrl) {
      setError("QR code is not available.");
      return;
    }

    try {
      setError("");

      const response = await authenticatedFetch(qrUrl);

      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Your login session is invalid or expired. Please sign in again."
            : `Unable to download QR code (HTTP ${response.status}).`
        );
      }

      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("The QR endpoint did not return an image.");
      }
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `visitor-qr-${createdVisit.visit_id}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error(err);
      setError("Unable to download QR code.");
    }
  };

  const handlePrintQr = async () => {
    if (!qrUrl) {
      setError("QR code is not available.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=600,height=700");
    if (!printWindow) {
      setError("Please allow pop-ups to print the QR code.");
      return;
    }

    try {
      setError("");
      const response = await authenticatedFetch(qrUrl);
      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Your login session is invalid or expired. Please sign in again."
            : `Unable to load QR code (HTTP ${response.status}).`
        );
      }

      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("The QR endpoint did not return an image.");
      }

      const objectUrl = URL.createObjectURL(blob);
      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Visitor QR Code</title>
            <style>
              body { margin: 0; padding: 40px; font-family: Arial, Helvetica, sans-serif; text-align: center; color: #101828; }
              .container { max-width: 500px; margin: 0 auto; }
              h1 { margin-bottom: 8px; font-size: 24px; }
              p { color: #667085; font-size: 14px; }
              img { width: 320px; height: 320px; margin: 25px auto; display: block; object-fit: contain; }
              .visit-id { margin-top: 15px; padding: 12px; border: 1px solid #d0d5dd; border-radius: 8px; font-family: monospace; font-size: 12px; word-break: break-all; }
              .status { margin-top: 12px; color: #039855; font-weight: bold; }
              @media print { body { padding: 10px; } }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Visitor QR Code</h1>
              <p>Scan this code at the security entrance.</p>
              <img src="${objectUrl}" alt="Visitor QR Code" />
              <div class="visit-id">Visit ID: ${createdVisit.visit_id}</div>
              <div class="status">ACTIVE</div>
            </div>
            <script>
              const qrImage = document.querySelector("img");
              qrImage.addEventListener("load", () => setTimeout(() => window.print(), 150));
              qrImage.addEventListener("error", () => document.body.insertAdjacentText("beforeend", "Unable to display QR image."));
              window.addEventListener("afterprint", () => { URL.revokeObjectURL(${JSON.stringify(objectUrl)}); window.close(); });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("QR print error:", err);
      printWindow.close();
      setError(err.message || "Unable to print QR code.");
    }
  };

  /* =========================================================
      CREATED VISIT SCREEN
  ========================================================= */

  if (createdVisit) {
    return (
      <main className="main-content create-page">
        <header className="topbar">
          <div>
            <h2>Create Visit</h2>
            <p>Register a new visitor visit</p>
          </div>

          <div className="topbar-actions">
            <button
              className="back-button"
              onClick={onBack}
            >
              <ArrowLeft size={15} />
              Back to Dashboard
            </button>
          </div>
        </header>

        {success && (
          <div className="create-success-banner">
            <CheckCircle2 size={17} />
            <span>{success}</span>
          </div>
        )}

        {assetSaveWarning && (
          <div className="error-message" role="alert">
            {assetSaveWarning}
          </div>
        )}

        <section className="created-card">
          <div className="created-success">
            <CheckCircle2 size={25} />
            <div>
              <h2>Visit Created Successfully</h2>
              <p>
                The visitor is now active and ready
                for QR verification.
              </p>
            </div>
          </div>

          <div className="visit-summary">
            <div>
              <span>VISIT ID</span>
              <strong>{createdVisit.visit_id}</strong>
            </div>

            <div>
              <span>STATUS</span>
              <strong className="active-text">
                {createdVisit.status || "ACTIVE"}
              </strong>
            </div>

            <div>
              <span>PURPOSE</span>
              <strong>{createdVisit.purpose || "—"}</strong>
            </div>
          </div>

          {/* REGISTERED VISITOR ASSETS */}
          <section className="registered-assets-panel">
            <div className="registered-assets-header">
              <div>
                <h3>Registered Assets</h3>
                <p>Items registered against this visit.</p>
              </div>

              <span className="asset-count">
                {savedAssets.length}{" "}
                {savedAssets.length === 1 ? "asset" : "assets"}
              </span>
            </div>

            {loadingSavedAssets ? (
              <p className="registered-assets-message">
                Loading registered assets...
              </p>
            ) : savedAssets.length === 0 ? (
              <p className="registered-assets-message">
                No registered assets found for this visit.
              </p>
            ) : (
              <div className="registered-assets-list">
                {savedAssets.map((asset) => (
                  <div className="registered-asset-row" key={asset.asset_id}>
                    <div className="registered-asset-details">
                      <strong>{asset.asset_type}</strong>

                      <p>
                        {asset.brand_model || "Model not specified"}
                      </p>

                      <p>
                        Serial number: {asset.serial_number || "Not provided"}
                      </p>
                    </div>

                    <span
                      className={
                        asset.is_cleared_for_exit
                          ? "asset-clearance-status cleared"
                          : "asset-clearance-status pending"
                      }
                    >
                      {asset.is_cleared_for_exit
                        ? "Cleared for Exit"
                        : "Pending Clearance"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {!qrVisible ? (
            <div className="qr-prompt">
              <div className="qr-placeholder">
                <QrCode size={42} />
              </div>

              <h3>Generate Visitor QR</h3>
              <p>
                Generate the QR code that security
                will scan at the entrance.
              </p>

              <button
                className="primary-button"
                onClick={() => setQrVisible(true)}
              >
                <QrCode size={17} />
                Generate QR Code
              </button>
            </div>
          ) : (
            <div className="qr-section">
              <div className="qr-title-row">
                <div>
                  <h3>Visitor QR Code</h3>
                  <p>Scan this code using the Security Dashboard.</p>
                </div>

                <div className="qr-active-badge">
                  <span></span>
                  ACTIVE
                </div>
              </div>

              <div className="qr-image-wrapper">
                <img
                  src={qrImageSrc}
                  alt="Visitor QR Code"
                  className="qr-image"
                  onError={() =>
                    setError("Unable to load QR image. Please try again.")
                  }
                />
              </div>

              <div className="qr-visit-info">
                <div>
                  <span>VISIT ID</span>
                  <strong>{createdVisit.visit_id}</strong>
                </div>

                <div>
                  <span>PURPOSE</span>
                  <strong>{createdVisit.purpose || "—"}</strong>
                </div>

                <div>
                  <span>STATUS</span>
                  <strong className="qr-status">ACTIVE</strong>
                </div>
              </div>

              <div className="qr-url">
                <span>Scan Link</span>
                <strong>{scanUrl}</strong>
              </div>

              <div className="qr-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleDownloadQr}
                >
                  <Download size={15} />
                  Download QR
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={handlePrintQr}
                >
                  <Printer size={15} />
                  Print QR
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCopyScanLink}
                >
                  {linkCopied ? (
                    <>
                      <Check size={15} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Clipboard size={15} />
                      Copy Scan Link
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setQrVisible(false)}
                >
                  <XCircle size={15} />
                  Hide QR
                </button>
              </div>
            </div>
          )}

          <button
            className="secondary-button create-another"
            onClick={handleCreateAnother}
          >
            <UserPlus size={16} />
            Create Another Visit
          </button>
        </section>
      </main>
    );
  }

  /* =========================================================
      CREATE VISIT FORM
  ========================================================= */

  return (
    <main className="main-content create-page">
      <header className="topbar">
        <div>
          <h2>Create Visit</h2>
          <p>Register a new visitor visit</p>
        </div>

        <div className="topbar-actions">
          <button
            className="back-button"
            onClick={onBack}
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </button>
        </div>
      </header>

      <section className="welcome-banner">
        <div>
          <span className="banner-label">VISIT MANAGEMENT</span>
          <h1>Create New Visit</h1>
          <p>
            Select a registered visitor and create an active visit with QR
            verification.
          </p>
        </div>

        <button
          className="hero-button"
          onClick={onBack}
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </section>

      {error && (
        <div className="error-banner">
          <XCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="page-card create-form-card">
        <div className="section-header">
          <div>
            <h2>Visit Information</h2>
            <p>Enter the visitor and visit details below.</p>
          </div>

          <button
            className="refresh-button"
            onClick={fetchVisitors}
            disabled={loadingVisitors}
          >
            <RefreshCw
              size={15}
              className={loadingVisitors ? "spin" : ""}
            />
            Refresh
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="create-visit-form"
        >
          <div className="create-form-grid">
            {/* VISITOR */}
            <div className="detail-item">
              <label>
                Visitor <span>*</span>
              </label>

              <select
                name="visitor_id"
                value={form.visitor_id}
                onChange={handleChange}
                disabled={loadingVisitors}
                required
              >
                <option value="">
                  {loadingVisitors
                    ? "Loading visitors..."
                    : "Select Visitor"}
                </option>

                {visitors.map((visitor) => (
                  <option
                    key={visitor.visitor_id}
                    value={visitor.visitor_id}
                  >
                    {visitor.first_name} {visitor.last_name}
                    {" — "}
                    {visitor.company_name || "No Company"}
                  </option>
                ))}
              </select>

              {!loadingVisitors && visitors.length === 0 && (
                <small className="field-error">
                  No registered visitors found. Add a visitor first.
                </small>
              )}

              {(() => {
                const selectedVisitor = visitors.find(
                  (visitor) => String(visitor.visitor_id) === String(form.visitor_id)
                );
                const addressParts = selectedVisitor
                  ? [
                      selectedVisitor.address_line1,
                      selectedVisitor.address_line2,
                      selectedVisitor.city,
                      selectedVisitor.state,
                      selectedVisitor.postal_code,
                      selectedVisitor.country,
                    ].filter((part) => String(part || "").trim())
                  : [];
                return selectedVisitor ? (
                  <div className="visitor-address-summary" style={{ marginTop: "10px", padding: "12px", border: "1px solid #dbeafe", borderRadius: "10px", background: "#f8fbff" }}>
                    <strong style={{ display: "block", marginBottom: "4px" }}>Visitor Address</strong>
                    <span style={{ color: "#475467", fontSize: "13px" }}>
                      {addressParts.join(", ") || "No address recorded for this visitor."}
                    </span>
                  </div>
                ) : null;
              })()}
            </div>

            {/* HOST */}
            <div className="detail-item">
              <label>
                Host Employee ID <span>*</span>
              </label>

              <input
                name="host_employee_id"
                type="number"
                min="1"
                value={form.host_employee_id}
                onChange={handleChange}
                placeholder="Enter host employee ID"
                required
              />

              <small>
                Enter the employee ID of the host.
              </small>
            </div>

            {/* PURPOSE */}
            <div className="detail-item full-width">
              <label>
                Purpose <span>*</span>
              </label>

              <input
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                placeholder="Meeting, interview, delivery, etc."
                required
              />
            </div>

            {/* EXPECTED OUT */}
            <div className="detail-item">
              <label>Expected Out Time</label>

              <input
                name="expected_out_time"
                type="datetime-local"
                value={form.expected_out_time}
                onChange={handleChange}
              />

              <small>
                Optional expected checkout time.
              </small>
            </div>
          </div>

          {/* VISITOR ASSETS */}
          <section className="visitor-assets-section">
            <div className="section-header">
              <div>
                <h2>Visitor Assets</h2>
                <p>Register the items the visitor is carrying.</p>
              </div>
              <span className="asset-count">
                {assets.length} {assets.length === 1 ? "asset" : "assets"}
              </span>
            </div>

            <div className="create-form-grid">
              <div className="detail-item">
                <label>Asset Type</label>
                <select
                  name="asset_type"
                  value={assetForm.asset_type}
                  onChange={handleAssetChange}
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Mobile Phone">Mobile Phone</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Camera">Camera</option>
                  <option value="Hard Drive">Hard Drive</option>
                  <option value="USB Drive">USB Drive</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="detail-item">
                <label>Brand / Model</label>
                <input
                  name="brand_model"
                  value={assetForm.brand_model}
                  onChange={handleAssetChange}
                  placeholder="e.g. Samsung Galaxy"
                />
              </div>

              <div className="detail-item">
                <label>Serial Number (optional)</label>
                <input
                  name="serial_number"
                  value={assetForm.serial_number}
                  onChange={handleAssetChange}
                  placeholder="Enter serial number"
                />
              </div>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={handleAddAsset}
            >
              <UserPlus size={15} />
              Add Asset
            </button>

            {assets.length > 0 && (
              <div className="visitor-assets-list">
                {assets.map((asset) => (
                  <div className="visitor-asset-row" key={asset.localId}>
                    <div>
                      <strong>{asset.asset_type}</strong>
                      <p>
                        {asset.brand_model || "Model not specified"}
                        {asset.serial_number
                          ? ` · Serial: ${asset.serial_number}`
                          : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleRemoveAsset(asset.localId)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="create-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleCreateAnother}
            >
              Clear
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting || loadingVisitors}
            >
              {submitting ? (
                <>
                  <RefreshCw
                    size={15}
                    className="spin"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <QrCode size={15} />
                  Create Visit
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default CreateVisit;