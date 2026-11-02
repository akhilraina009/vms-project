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
  Download,
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


const generateAndDownloadPass = async (passData, qrDataUrl, token) => {
  try {
    const canvas = document.createElement("canvas");
    const width = 720;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Rounded card background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const isIT = passData?.visit_type === "IT_VISIT" || 
                 passData?.purpose?.includes("IT_VISIT") || 
                 passData?.category === "IT" || 
                 Boolean(passData?.assets?.length);

    // 1. Executive Top Header (Gradient Dark Blue #0a1428 -> #1e3a8a)
    const headerGrad = ctx.createLinearGradient(0, 0, width, 220);
    headerGrad.addColorStop(0, "#09101d");
    headerGrad.addColorStop(0.5, "#0f172a");
    headerGrad.addColorStop(1, "#1e3a8a");
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, width, 220);

    // Grid pattern / subtle tech lines in header
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 220);
      ctx.stroke();
    }
    for (let y = 0; y < 220; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Top Notch (lanyard slot)
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(width / 2 - 40, 10, 80, 8, 4);
    ctx.fill();

    // Seal Pill: IT SECURITY CLEARANCE
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.roundRect(30, 36, isIT ? 200 : 220, 26, 13);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillText(isIT ? "🛡️ IT SECURITY CLEARANCE" : "🛡️ VMS ENTERPRISE SECURITY", 42, 53);

    // Status Live Pill (Right)
    const rawStatus = (passData?.status || "APPROVED").toUpperCase();
    ctx.fillStyle = rawStatus === "ACTIVE" ? "#0284c7" : rawStatus === "APPROVED" ? "#059669" : "#d97706";
    ctx.beginPath();
    ctx.roundRect(width - 220, 36, 190, 26, 13);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
    ctx.fillText(rawStatus === "ACTIVE" ? "● CHECKED IN · ON PREMISES" : rawStatus === "APPROVED" ? "● APPROVED FOR ENTRY" : "● AWAITING CLEARANCE", width - 210, 53);

    // Title: IT CONTRACTOR PASS
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isIT ? "IT CONTRACTOR PASS" : "OFFICIAL VISITOR PASS", width / 2, 115);

    // Badge Ref Pill: BADGE REF: VMS-...
    const passId = passData?.badge_id || passData?.pass_id || passData?.qr_token?.slice(0, 10).toUpperCase() || "VMS-PASS";
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(width / 2 - 130, 135, 260, 28, 14);
    ctx.fill();
    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    ctx.fillText(`BADGE REF: ${passId}`, width / 2, 154);
    ctx.textAlign = "left";

    // 2. Status Callout Banner
    ctx.fillStyle = "#eff6ff";
    ctx.fillRect(0, 220, width, 65);
    ctx.strokeStyle = "#bfdbfe";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 285);
    ctx.lineTo(width, 285);
    ctx.stroke();

    ctx.fillStyle = "#1e40af";
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.fillText("🛡️ Gate Check-in Verified · Active Digital Visitor Pass", 35, 248);
    ctx.fillStyle = "#3b82f6";
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillText("Please keep this digital pass accessible on your phone until building departure.", 35, 268);

    // 3. Visitor Profile Section
    const photoX = 40;
    const photoY = 310;
    const photoSize = 100;

    let photoDrawn = false;
    const rawPhotoUrl = passData?.photo_url;
    if (rawPhotoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const cleanUrl = rawPhotoUrl.startsWith("http") ? rawPhotoUrl : `${window.location.origin}/${rawPhotoUrl.replace(/^\//, "")}`;
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(photoX, photoY, photoSize, photoSize, 16);
            ctx.clip();
            ctx.drawImage(img, photoX, photoY, photoSize, photoSize);
            ctx.restore();
            ctx.strokeStyle = "#2563eb";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(photoX, photoY, photoSize, photoSize, 16);
            ctx.stroke();
            photoDrawn = true;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = cleanUrl;
          setTimeout(resolve, 800);
        });
      } catch (e) {
        photoDrawn = false;
      }
    }

    if (!photoDrawn) {
      ctx.fillStyle = "#eff6ff";
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoSize, photoSize, 16);
      ctx.fill();
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#1e40af";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      const initials = (passData?.visitor_name || passData?.name || "V")
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      ctx.fillText(initials, photoX + photoSize / 2, photoY + photoSize / 2 + 11);
      ctx.textAlign = "left";
    }

    // Verified checkmark seal on photo
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.arc(photoX + photoSize - 6, photoY + photoSize - 6, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✓", photoX + photoSize - 6, photoY + photoSize - 2);
    ctx.textAlign = "left";

    // Details next to photo
    const detailsX = photoX + photoSize + 25;
    ctx.fillStyle = "#f3e8ff";
    ctx.beginPath();
    ctx.roundRect(detailsX, photoY, isIT ? 160 : 130, 24, 6);
    ctx.fill();
    ctx.fillStyle = "#7c3aed";
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillText(isIT ? "IT Technical Specialist" : "Authorized Guest", detailsX + 10, photoY + 16);

    const vName = passData?.visitor_name || passData?.name || "Visitor";
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
    ctx.fillText(vName, detailsX, photoY + 54);

    ctx.fillStyle = "#64748b";
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    const comp = passData?.company_name || passData?.affiliated_organization || "IT Department";
    ctx.fillText(`🏢 ${comp}`, detailsX, photoY + 76);

    const phone = passData?.phone_number || passData?.phone || "";
    const email = passData?.email || "";
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#475569";
    if (phone) ctx.fillText(`📞 ${phone}`, detailsX, photoY + 96);
    if (email) ctx.fillText(`✉️ ${email}`, detailsX + (phone ? 140 : 0), photoY + 96);

    // 4. QR Code Vault (Centered)
    const qrBoxSize = 250;
    const qrBoxX = (width - qrBoxSize) / 2;
    const qrBoxY = 440;

    // Viewfinder corner brackets
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 4;
    const bLen = 24;

    ctx.beginPath();
    ctx.moveTo(qrBoxX, qrBoxY + bLen);
    ctx.lineTo(qrBoxX, qrBoxY);
    ctx.lineTo(qrBoxX + bLen, qrBoxY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(qrBoxX + qrBoxSize - bLen, qrBoxY);
    ctx.lineTo(qrBoxX + qrBoxSize, qrBoxY);
    ctx.lineTo(qrBoxX + qrBoxSize, qrBoxY + bLen);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(qrBoxX, qrBoxY + qrBoxSize - bLen);
    ctx.lineTo(qrBoxX, qrBoxY + qrBoxSize);
    ctx.lineTo(qrBoxX + bLen, qrBoxY + qrBoxSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(qrBoxX + qrBoxSize - bLen, qrBoxY + qrBoxSize);
    ctx.lineTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize);
    ctx.lineTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize - bLen);
    ctx.stroke();

    if (qrDataUrl) {
      const qrImg = new Image();
      await new Promise((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, qrBoxX + 15, qrBoxY + 15, qrBoxSize - 30, qrBoxSize - 30);
          resolve();
        };
        qrImg.onerror = () => resolve();
        qrImg.src = qrDataUrl;
      });
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
    ctx.fillText("PASS IS ACTIVE ON PREMISES", width / 2, qrBoxY + qrBoxSize + 30);

    ctx.fillStyle = "#64748b";
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillText("Security gate officers scan this code for access control & exit clearance.", width / 2, qrBoxY + qrBoxSize + 50);

    const tokenStr = passData?.qr_token || token || passId;
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(width / 2 - 140, qrBoxY + qrBoxSize + 65, 280, 26, 8);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#2563eb";
    ctx.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(`Token: ${String(tokenStr).slice(0, 16)}...`, width / 2, qrBoxY + qrBoxSize + 82);

    // 5. Host & Gate Check-In Details Box (2 Columns)
    const infoY = 825;
    ctx.textAlign = "left";

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(35, infoY, (width - 90) / 2, 70, 12);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillText("👤 HOST OFFICER", 50, infoY + 28);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
    ctx.fillText(passData?.host_name || "IT Infrastructure Host", 50, infoY + 52);

    const rightX = 35 + (width - 90) / 2 + 20;
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(rightX, infoY, (width - 90) / 2, 70, 12);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillText("🕒 GATE CHECK-IN STATUS", rightX + 15, infoY + 28);
    ctx.fillStyle = "#059669";
    ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
    const dateFormatted = passData?.check_in_time
      ? new Date(passData.check_in_time).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
      : "Active On Premises";
    ctx.fillText(dateFormatted, rightX + 15, infoY + 52);

    // 6. Security Footer
    const footerY = 920;
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(35, footerY);
    ctx.lineTo(width - 35, footerY);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.fillText("This pass remains valid only for designated premises during business hours.", width / 2, footerY + 25);

    ctx.fillStyle = "#1e3a8a";
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    ctx.fillText("🛡️ Official VMS Enterprise Security • Verified Cryptographically", width / 2, footerY + 48);

    const filename = `${isIT ? "VMS-IT-Contractor-Pass" : "VMS-Visitor-Pass"}-${passId}.png`;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return true;
  } catch (err) {
    console.error("Pass image generation failed:", err);
    return false;
  }
};

export default function PublicVisitorPass({ token }) {
  const [pass, setPass] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [downloadToast, setDownloadToast] = useState("");
  const autoDownloadedRef = useRef(false);

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

  // Auto-download pass once if redirected from form submission or autodownload param
  useEffect(() => {
    if (!pass || !qrImage || autoDownloadedRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const shouldAutoDownload =
      urlParams.get("autodownload") === "1" ||
      sessionStorage.getItem("vms_auto_download_pass") === "true";

    if (shouldAutoDownload) {
      autoDownloadedRef.current = true;
      sessionStorage.removeItem("vms_auto_download_pass");
      generateAndDownloadPass(pass, qrImage, token).then((success) => {
        if (success) {
          setDownloadToast("Digital Pass automatically downloaded to your device!");
          setTimeout(() => setDownloadToast(""), 5000);
        }
      });
    }
  }, [pass, qrImage, token]);

  const copyBadgeRef = (badgeId) => {
    if (!badgeId) return;
    navigator.clipboard?.writeText(badgeId);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  if (loading) {
    return (
      <main className="public-pass-page">
      {downloadToast && (
        <div className="pass-download-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{downloadToast}</span>
        </div>
      )}
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
      {downloadToast && (
        <div className="pass-download-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{downloadToast}</span>
        </div>
      )}
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
      {downloadToast && (
        <div className="pass-download-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{downloadToast}</span>
        </div>
      )}
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

          <div className="pass-actions-row">
            <button
              type="button"
              className="pass-action-download"
              onClick={() => {
                generateAndDownloadPass(pass, qrImage, token).then((success) => {
                  if (success) {
                    setDownloadToast("Digital Pass downloaded successfully!");
                    setTimeout(() => setDownloadToast(""), 4000);
                  }
                });
              }}
            >
              <Download size={16} /> Download Pass (PNG)
            </button>
            <button
              type="button"
              className="pass-action-print"
              onClick={() => window.print()}
            >
              <Printer size={16} /> Print / Save as PDF
            </button>
          </div>

          <div className="pass-footer-watermark">
            <ShieldCheck size={13} />
            <span>Official VMS Enterprise Security • Verified Cryptographically</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
