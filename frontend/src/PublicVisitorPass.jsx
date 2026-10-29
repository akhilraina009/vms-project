import { useEffect, useState, useRef } from "react";
import {
  ShieldCheck,
  AlertCircle,
  LoaderCircle,
  Printer,
  QrCode,
  UserRound,
  Clock,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  X,
  FileText,
  Calendar,
  Hourglass,
  RefreshCw,
  Phone,
  Mail,
  Briefcase,
  UserCheck,
  Copy,
  Check,
} from "lucide-react";
import QRCode from "qrcode";
import "./PublicVisitorPass.css";

const API_BASE_URL = "";
const PHOTO_BASE_URL = "";

const resolvePhotoUrl = (url) => {
  if (!url) return null;
  const clean = String(url).trim().replace(/\\/g, "/");
  if (clean.startsWith("data:") || clean.startsWith("blob:")) return clean;
  if (clean.includes("/uploads/")) {
    const uploadIndex = clean.indexOf("/uploads/");
    return clean.slice(uploadIndex);
  }
  if (clean.startsWith("uploads/")) {
    return `/${clean}`;
  }
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  return `/${clean}`;
};

export default function PublicVisitorPass({ token }) {
  const [pass, setPass] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [copiedBadge, setCopiedBadge] = useState(false);

  // Background polling ref
  const pollIntervalRef = useRef(null);

  const fetchPassData = async (isInitial = false) => {
    try {
      if (!token) {
        throw new Error(
          "The visitor pass link is missing its token. Please open the complete pass link."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/public-registration/verify-pass/${encodeURIComponent(token)}`
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 410) {
          throw new Error("This visitor pass has expired. Please contact reception.");
        }
        if (response.status === 404) {
          throw new Error("This visitor pass is invalid or has been revoked.");
        }
        throw new Error(data.detail || "Unable to verify this visitor pass.");
      }

      setPass(data);
      setLastUpdated(new Date());

      // Generate QR only once or if not generated
      if (!qrImage) {
        const passUrl = `${window.location.origin}/visitor-pass/${encodeURIComponent(token)}`;
        const generatedQr = await QRCode.toDataURL(passUrl, {
          width: 400,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
        setQrImage(generatedQr);
      }
    } catch (err) {
      if (isInitial) {
        setError(err.message || "Unable to connect to the VMS security server.");
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPassData(true);

    // Auto-refresh pass status every 4 seconds so admin approval or host-busy changes show instantly
    pollIntervalRef.current = setInterval(() => {
      fetchPassData(false);
    }, 4000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [token]);

  const copyBadgeRef = (badgeId) => {
    if (!badgeId) return;
    navigator.clipboard?.writeText(badgeId);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  if (loading) {
    return (
      <main className="public-pass-page">
        <section className="public-pass-card pass-loading-card">
          <div className="pass-loading-spinner-wrap">
            <LoaderCircle size={44} className="pass-spinner" />
          </div>
          <h2>Verifying Digital Pass</h2>
          <p>Connecting to Gate Security Server...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="public-pass-page">
        <section className="public-pass-card pass-error-card">
          <div className="pass-error-icon-wrap">
            <AlertCircle size={48} />
          </div>
          <h2>Pass Verification Failed</h2>
          <p className="pass-error-text">{error}</p>
          <div className="pass-error-help">
            <p>If you believe this is an error, please contact the reception desk.</p>
          </div>
        </section>
      </main>
    );
  }

  const visitorName = pass?.visitor_name || "Visitor";
  const rawStatus = String(pass?.status || "PENDING").trim().toUpperCase();
  const isITVisit = (pass?.purpose || "").includes("[IT_VISIT]");
  const passId = pass?.visit_id
    ? `VMS-${pass.visit_id.slice(0, 8).toUpperCase()}`
    : "VMS-PASS";

  const cleanPurpose = (() => {
    if (!pass?.purpose) return "Official Visit";
    return pass.purpose.replace(/\[IT_VISIT\]\s*/gi, "").trim() || "Official Visit";
  })();

  const checkInTime =
    pass?.check_in_at ??
    pass?.checked_in_at ??
    pass?.check_in_time ??
    pass?.checkin_time ??
    pass?.entry_time ??
    null;

  const formattedCheckIn = (() => {
    if (!checkInTime) {
      if (rawStatus === "APPROVED") return "Approved · Ready at Gate Desk";
      if (rawStatus === "PENDING") return "Awaiting Admin Review";
      if (rawStatus === "WAITING") return "Host Busy (On Hold)";
      if (rawStatus === "REJECTED") return "Entry Declined";
      return "Pending Gate Check-in";
    }
    const parsedTime = new Date(checkInTime);
    return Number.isNaN(parsedTime.getTime())
      ? "Not recorded"
      : parsedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  })();

  const formattedExpiry = (() => {
    if (!pass?.expires_at) return "Valid for Today";
    const parsedTime = new Date(pass.expires_at);
    return Number.isNaN(parsedTime.getTime())
      ? "Valid for Today"
      : parsedTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  })();

  // Format clean address without redundant duplicates
  const rawAddressParts = [
    pass?.address?.address_line1 ?? pass?.address_line1,
    pass?.address?.address_line2 ?? pass?.address_line2,
    pass?.address?.city ?? pass?.city,
    pass?.address?.state ?? pass?.state,
    pass?.address?.postal_code ?? pass?.postal_code,
    pass?.address?.country ?? pass?.country,
  ]
    .filter(Boolean)
    .map((p) => String(p).trim())
    .filter((p) => p.length > 0);

  const cleanAddress = [...new Set(rawAddressParts)].join(", ") || "On file";

  // Status configuration
  let statusBanner = null;
  let statusBadgeText = rawStatus;
  let statusBadgeClass = "pending";

  if (rawStatus === "PENDING") {
    statusBadgeText = "AWAITING ADMIN APPROVAL";
    statusBadgeClass = "amber";
    statusBanner = (
      <div className="pass-status-banner banner-amber">
        <div className="pass-banner-icon-box">
          <Hourglass size={20} className="pass-banner-icon" />
        </div>
        <div className="pass-banner-content">
          <strong className="pass-banner-title">
            Registration Submitted · Awaiting Admin Approval
          </strong>
          <p className="pass-banner-desc">
            Your request has been raised to reception management. Please wait comfortably in the visitor lobby while the administrator confirms your appointment with your host.
          </p>
          <span className="pass-banner-live-tag">
            <span className="pass-pulse-dot amber"></span>
            Updates automatically once approved
          </span>
        </div>
      </div>
    );
  } else if (rawStatus === "RESCHEDULED") {
    const nextDateStr = pass?.expected_in_time
      ? new Date(pass.expected_in_time).toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Next Scheduled Date";

    statusBadgeText = "HOST ABSENT · VISIT RESCHEDULED";
    statusBadgeClass = "blue";
    statusBanner = (
      <div className="pass-status-banner banner-blue" style={{ background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1" }}>
        <div className="pass-banner-icon-box" style={{ background: "#e0f2fe", color: "#0284c7" }}>
          <Calendar size={20} className="pass-banner-icon" />
        </div>
        <div className="pass-banner-content">
          <strong className="pass-banner-title" style={{ color: "#0369a1" }}>
            Host is Absent Today · Visit Rescheduled to {nextDateStr}
          </strong>
          <p className="pass-banner-desc" style={{ color: "#0c4a6e" }}>
            Your host ({pass?.host_name || "Host Employee"}) is not present in the office today. Your technical appointment has been rescheduled. Your digital pass and QR code remain active for this new date — you do not need to register again.
          </p>
          <span className="pass-banner-live-tag" style={{ color: "#0284c7" }}>
            <span className="pass-pulse-dot" style={{ background: "#0284c7" }}></span>
            Valid for entrance on {nextDateStr}
          </span>
        </div>
      </div>
    );
  } else if (rawStatus === "WAITING") {
    statusBadgeText = "HOST IS BUSY · ON HOLD";
    statusBadgeClass = "orange";
    statusBanner = (
      <div className="pass-status-banner banner-orange">
        <div className="pass-banner-icon-box">
          <Clock size={20} className="pass-banner-icon" />
        </div>
        <div className="pass-banner-content">
          <strong className="pass-banner-title">
            Host is Currently Busy · Please Wait in Lobby
          </strong>
          <p className="pass-banner-desc">
            Your host ({pass?.host_name || "Employee"}) is currently engaged in a meeting or unavailable. The admin has requested you to wait briefly in the reception area until clearance is granted.
          </p>
          <span className="pass-banner-live-tag">
            <span className="pass-pulse-dot orange"></span>
            Monitoring for host clearance...
          </span>
        </div>
      </div>
    );
  } else if (rawStatus === "APPROVED") {
    statusBadgeText = "ENTRY APPROVED · PROCEED TO GATE";
    statusBadgeClass = "emerald";
    statusBanner = (
      <div className="pass-status-banner banner-emerald">
        <div className="pass-banner-icon-box">
          <CheckCircle2 size={20} className="pass-banner-icon" />
        </div>
        <div className="pass-banner-content">
          <strong className="pass-banner-title">
            Visit Approved! Ready for Gate Check-in
          </strong>
          <p className="pass-banner-desc">
            Your visit request has been approved by the administration. Please present the QR code below to the Security Officer at the gate entrance to check in.
          </p>
        </div>
      </div>
    );
  } else if (rawStatus === "REJECTED") {
    statusBadgeText = "ENTRY REJECTED · ENTRY DENIED";
    statusBadgeClass = "red";
    statusBanner = (
      <div className="pass-status-banner banner-red">
        <div className="pass-banner-icon-box">
          <XCircle size={20} className="pass-banner-icon" />
        </div>
        <div className="pass-banner-content">
          <strong className="pass-banner-title">
            Visit Request Declined · Entry Not Authorized
          </strong>
          <p className="pass-banner-desc">
            The host or administration is unable to accommodate this visit at this time. Entry cannot be authorized. For assistance, please inquire at the reception desk.
          </p>
        </div>
      </div>
    );
  } else if (rawStatus === "ACTIVE") {
    statusBadgeText = "CHECKED IN · ON PREMISES";
    statusBadgeClass = "blue";
    statusBanner = (
      <div className="pass-status-banner banner-blue">
        <div className="pass-banner-icon-box">
          <ShieldCheck size={20} className="pass-banner-icon" />
        </div>
        <div className="pass-banner-content">
          <strong className="pass-banner-title">
            Gate Check-in Verified · Active Visitor
          </strong>
          <p className="pass-banner-desc">
            Checked in at {formattedCheckIn}. Please keep this digital pass accessible on your phone until building departure.
          </p>
        </div>
      </div>
    );
  } else if (rawStatus === "CHECKED_OUT") {
    statusBadgeText = "VISIT COMPLETED · CHECKED OUT";
    statusBadgeClass = "slate";
    statusBanner = (
      <div className="pass-status-banner banner-slate">
        <div className="pass-banner-icon-box">
          <CheckCircle2 size={20} className="pass-banner-icon" />
        </div>
        <div className="pass-banner-content">
          <strong className="pass-banner-title">
            Visit Completed · Successfully Checked Out
          </strong>
          <p className="pass-banner-desc">
            Thank you for visiting. Your exit has been recorded by gate security.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="public-pass-page">
      {/* Lightbox photo preview */}
      {lightboxImage && (
        <div className="pass-lightbox-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="pass-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pass-lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <img src={lightboxImage} alt="Enlarged view" className="pass-lightbox-img" />
          </div>
        </div>
      )}

      <div className="public-pass-card">
        {/* Lanyard badge clip notch */}
        <div className="pass-lanyard-notch" aria-hidden="true">
          <div className="pass-lanyard-hole"></div>
        </div>

        {/* Executive badge header */}
        <header className="pass-executive-header">
          <div className="pass-header-top">
            <div className="pass-seal-badge">
              <ShieldCheck size={15} className="pass-seal-icon" />
              <span>{isITVisit ? "IT SECURITY CLEARANCE" : "VMS ENTERPRISE SECURITY"}</span>
            </div>
            <div className={`pass-live-indicator ${statusBadgeClass}`}>
              <span className="pass-pulse-dot"></span>
              {statusBadgeText}
            </div>
          </div>

          <h1 className="pass-main-title">
            {isITVisit ? "IT CONTRACTOR PASS" : "OFFICIAL VISITOR PASS"}
          </h1>

          <div className="pass-badge-id-pill" onClick={() => copyBadgeRef(passId)} title="Click to copy badge reference">
            <span className="pass-badge-id-label">BADGE REF:</span>
            <span className="pass-badge-id-code">{passId}</span>
            {copiedBadge ? (
              <Check size={12} className="pass-badge-copy-icon copied" />
            ) : (
              <Copy size={12} className="pass-badge-copy-icon" />
            )}
          </div>
        </header>

        {/* Status Callout Banner */}
        {statusBanner}

        {/* Main Pass Body */}
        <div className="pass-body-container">
          {/* Section 1: Visitor Identity Profile */}
          <section className="pass-identity-section">
            <div className="pass-photo-frame">
              {pass?.photo_url ? (
                <div
                  className="pass-photo-wrapper"
                  onClick={() =>
                    setLightboxImage(
                      pass.photo_url.startsWith("http")
                        ? pass.photo_url
                        : `${PHOTO_BASE_URL}${pass.photo_url}`
                    )
                  }
                  title="Click to enlarge photo"
                >
                  <img
                    src={
                      pass.photo_url.startsWith("http")
                        ? pass.photo_url
                        : `${PHOTO_BASE_URL}${pass.photo_url}`
                    }
                    alt={`Photo of ${visitorName}`}
                    className="pass-hero-photo"
                  />
                  <div className="pass-photo-zoom-hint">View</div>
                </div>
              ) : (
                <div className="pass-hero-photo-placeholder">
                  <UserRound size={36} strokeWidth={1.5} />
                  <span>Photo on File</span>
                </div>
              )}
              <div className="pass-verified-seal" title="Verified Identity Credential">
                <CheckCircle2 size={13} strokeWidth={2.5} />
              </div>
            </div>

            <div className="pass-hero-details">
              <div className="pass-category-row">
                <span className={`pass-category-chip ${isITVisit ? "it-chip" : ""}`}>
                  {isITVisit ? "IT Technical Specialist" : "Authorized Guest"}
                </span>
              </div>

              <h2 className="pass-visitor-name">{visitorName}</h2>

              {pass?.company_name && (
                <div className="pass-company-name">
                  <Briefcase size={13} className="pass-detail-icon" />
                  <span>{pass.company_name}</span>
                </div>
              )}

              <div className="pass-contact-badges">
                {pass?.phone_number && (
                  <span className="pass-contact-pill">
                    <Phone size={12} />
                    <span>{pass.phone_number}</span>
                  </span>
                )}
                {pass?.email && (
                  <span className="pass-contact-pill">
                    <Mail size={12} />
                    <span>{pass.email}</span>
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: QR Gate Scanner Vault */}
          <section className="pass-qr-vault">
            <div className="pass-qr-frame">
              <div className="pass-qr-corner top-left"></div>
              <div className="pass-qr-corner top-right"></div>
              <div className="pass-qr-corner bottom-left"></div>
              <div className="pass-qr-corner bottom-right"></div>

              {qrImage ? (
                <img
                  className={`pass-qr-matrix ${rawStatus === "REJECTED" ? "qr-dimmed" : ""}`}
                  src={qrImage}
                  alt="Gate Security QR Verification Code"
                />
              ) : (
                <div className="pass-qr-fallback">
                  <LoaderCircle size={32} className="pass-spinner" />
                  <span>Generating Gate Token</span>
                </div>
              )}
            </div>

            <div className="pass-qr-instructions">
              <span className="pass-scan-instruction-title">
                {rawStatus === "APPROVED"
                  ? "PRESENT TO SECURITY GUARD FOR CHECK-IN"
                  : rawStatus === "ACTIVE"
                  ? "PASS IS ACTIVE ON PREMISES"
                  : rawStatus === "PENDING"
                  ? "AWAITING ADMIN CLEARANCE"
                  : rawStatus === "WAITING"
                  ? "HOST BUSY · PLEASE WAIT IN LOBBY"
                  : "ENTRY AUTHORIZATION STATUS"}
              </span>
              <p className="pass-scan-instruction-desc">
                {rawStatus === "APPROVED"
                  ? "Show this QR code at the Security Desk. The guard will scan this badge to check you in."
                  : rawStatus === "PENDING"
                  ? "Your request is under review. Gate security will be authorized to check you in as soon as admin approves."
                  : rawStatus === "WAITING"
                  ? "Host is occupied. Please remain comfortably in the reception lounge."
                  : rawStatus === "REJECTED"
                  ? "Entry authorization was denied for this visit."
                  : "Security gate officers scan this code for access control & exit clearance."}
              </p>
            </div>

            <div className="pass-qr-token-pill">
              <QrCode size={13} className="pass-qr-token-icon" />
              <span>Token:</span>
              <code>{token ? `${token.slice(0, 10)}...` : passId}</code>
            </div>
          </section>

          {/* Section 3: Official Verification Credentials Grid */}
          <section className="pass-info-grid">
            <div className="pass-info-card">
              <div className="pass-info-icon">
                <UserCheck size={16} />
              </div>
              <div className="pass-info-content">
                <span className="pass-info-label">Host Officer</span>
                <strong className="pass-info-value">{pass?.host_name || "Assigned Officer"}</strong>
                {pass?.host_department && (
                  <span className="pass-info-sub">{pass.host_department}</span>
                )}
              </div>
            </div>

            <div className="pass-info-card">
              <div className="pass-info-icon">
                <Clock size={16} />
              </div>
              <div className="pass-info-content">
                <span className="pass-info-label">Gate Check-in Status</span>
                <strong className="pass-info-value">{formattedCheckIn}</strong>
              </div>
            </div>

            <div className="pass-info-card">
              <div className="pass-info-icon">
                <MapPin size={16} />
              </div>
              <div className="pass-info-content">
                <span className="pass-info-label">Visitor Address</span>
                <strong className="pass-info-value pass-address-text">{cleanAddress}</strong>
              </div>
            </div>

            <div className="pass-info-card">
              <div className="pass-info-icon">
                <Calendar size={16} />
              </div>
              <div className="pass-info-content">
                <span className="pass-info-label">Pass Valid Until</span>
                <strong className="pass-info-value">{formattedExpiry}</strong>
              </div>
            </div>

            <div className="pass-info-card pass-info-card-purpose">
              <div className="pass-info-icon">
                <FileText size={16} />
              </div>
              <div className="pass-info-content">
                <span className="pass-info-label">Visit Purpose &amp; Scope</span>
                <strong className="pass-info-value pass-purpose-text">{cleanPurpose}</strong>
              </div>
            </div>
          </section>

          {/* Section 4: Declared Equipment & Assets */}
          {pass?.assets && pass.assets.length > 0 && (
            <section className="pass-assets-container">
              <div className="pass-assets-header">
                <div className="pass-assets-header-title">
                  <Building2 size={16} />
                  <h3>Declared Equipment &amp; Assets</h3>
                </div>
                <span className="pass-assets-count">
                  {pass.assets.length} {pass.assets.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              <div className="pass-assets-grid">
                {pass.assets.map((asset, index) => (
                  <div className="pass-asset-item-card" key={asset.asset_id || index}>
                    <div className="pass-asset-left">
                      {asset.photo_url ? (
                        <div
                          className="pass-asset-thumb-box"
                          onClick={() =>
                            setLightboxImage(
                              asset.photo_url.startsWith("http")
                                ? asset.photo_url
                                : `${PHOTO_BASE_URL}${asset.photo_url}`
                            )
                          }
                          title="Click to view photo"
                        >
                          <img
                            src={
                              asset.photo_url.startsWith("http")
                                ? asset.photo_url
                                : `${PHOTO_BASE_URL}${asset.photo_url}`
                            }
                            alt={asset.asset_type || "Asset"}
                            className="pass-asset-thumb"
                          />
                          <span className="pass-asset-zoom-hint">View</span>
                        </div>
                      ) : (
                        <div className="pass-asset-thumb-none">
                          <Building2 size={18} />
                        </div>
                      )}
                    </div>

                    <div className="pass-asset-right">
                      <div className="pass-asset-title-row">
                        <strong className="pass-asset-type">{asset.asset_type || "Equipment"}</strong>
                        {(() => {
                          const isRetained = (asset.cleared_by && asset.cleared_by.includes("RETAINED")) || asset.disposition === "RETAINED_ON_PREMISES";
                          if (isRetained) {
                            return (
                              <span className="pass-asset-pill" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontWeight: 700 }}>
                                📦 Retained in Facility
                              </span>
                            );
                          }
                          return (
                            <span
                              className={`pass-asset-pill ${
                                asset.is_cleared_for_exit ? "cleared" : "pending"
                              }`}
                            >
                              {asset.is_cleared_for_exit ? "✓ Cleared" : "Exit Pending"}
                            </span>
                          );
                        })()}
                      </div>

                      <p className="pass-asset-model">
                        {asset.brand_model ? asset.brand_model : "Model not specified"}
                      </p>

                      {asset.serial_number && (
                        <div className="pass-asset-serial-tag">
                          <span>S/N:</span> {asset.serial_number}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {pass.assets.some((a) => !a.is_cleared_for_exit && !((a.cleared_by && a.cleared_by.includes("RETAINED")) || a.disposition === "RETAINED_ON_PREMISES")) ? (
                <div className="pass-alert-notice warning">
                  <Clock size={14} />
                  <span>Items must be verified by gate security prior to building exit.</span>
                </div>
              ) : (
                <div className="pass-alert-notice success">
                  <CheckCircle2 size={14} />
                  <span>All registered items cleared / reconciled for building departure.</span>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Official Sign-Off for PDF / Printed Pass */}
        <div className="pass-print-footer">
          <div className="pass-signature-box">
            <div className="sig-line"></div>
            <span>Visitor Signature</span>
          </div>
          <div className="pass-signature-box">
            <div className="sig-line"></div>
            <span>Host Authorization</span>
          </div>
          <div className="pass-signature-box">
            <div className="sig-line"></div>
            <span>Security Gate Stamp</span>
          </div>
        </div>

        {/* Security Compliance Footer */}
        <footer className="pass-security-footer">
          <p className="pass-footer-disclaimer">
            This visitor pass is non-transferable and remains valid only for authorized designated premises during business hours.
          </p>

          <button
            type="button"
            className="pass-action-print"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print / Save as PDF
          </button>

          <div className="pass-footer-watermark">
            <ShieldCheck size={13} />
            <span>Official VMS Enterprise Security • Verified Cryptographically</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
