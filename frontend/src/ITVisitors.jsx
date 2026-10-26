import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Laptop,
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
  Check,
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
  const [dossierData, setDossierData] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [directCheckoutLoading, setDirectCheckoutLoading] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);

  // Portal QR Modal
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [portalQrData, setPortalQrData] = useState("");

  const openTechnicianDossier = async (item) => {
    setSelectedVisitor(item);
    setDossierData(null);
    setDossierLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/visitors/${item.visitor_id}`);
      if (res.ok) {
        const fullDetails = await res.json();
        setDossierData(fullDetails);
      }
    } catch (e) {
      console.warn("Could not fetch detailed dossier:", e);
    } finally {
      setDossierLoading(false);
    }
  };

  const handleDirectCheckout = async (visitId, visitorName, forceClear = false) => {
    if (!visitId) {
      alert("No active IT visit found for this technician.");
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
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  if (e.target.value) setFilterMode("all");
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  color: "#0f172a",
                  background: "#ffffff",
                  outline: "none",
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
                      onClick={() => openTechnicianDossier(item)}
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
                              onClick={() => handleDirectCheckout(activeVisitId, fullName)}
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

      {/* Detailed IT Visitor Dossier Modal */}
      {/* =========================================================
          COMPREHENSIVE IT TECHNICIAN DOSSIER & CHECKOUT MODAL
      ========================================================= */}
      {selectedVisitor && (() => {
        const vProfile = dossierData?.visitor || selectedVisitor;
        const fullName = `${vProfile.first_name || ""} ${vProfile.last_name || ""}`.trim() || "Unknown Technician";
        const resolvedPhoto = resolvePhotoUrl(vProfile.photo_url);
        const activeVisit = dossierData?.active_visit || selectedVisitor.active_visit || (selectedVisitor.is_inside ? selectedVisitor.latest_visit : null);
        const pendingVisit = selectedVisitor.pending_visit || (!activeVisit && ["PENDING", "APPROVED"].includes(selectedVisitor.latest_visit?.status) ? selectedVisitor.latest_visit : null);
        const isInside = Boolean(activeVisit || selectedVisitor.is_inside);
        const activeVisitId = activeVisit?.visit_id;
        const pendingVisitId = pendingVisit?.visit_id;
        const targetVisit = activeVisit || selectedVisitor.latest_visit;
        const declaredAssets = dossierData?.declared_assets || targetVisit?.assets || [];
        const allVisits = dossierData?.visits || selectedVisitor.visits || (targetVisit ? [targetVisit] : []);
        const areaBadge = getAreaBadge(targetVisit?.purpose);
        const ticketBadge = getTicketBadge(targetVisit?.purpose);
        const cleanPurpose = getCleanPurpose(targetVisit?.purpose);

        return (
          <div
            className="vms-dossier-overlay"
            onClick={() => setSelectedVisitor(null)}
            role="dialog"
            aria-modal="true"
          >
            <div className="vms-dossier-modal" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
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
                      onClick={() => handleDirectCheckout(activeVisitId, fullName)}
                      title="Check out IT technician from campus"
                    >
                      <LogOut size={14} />
                      <span>{directCheckoutLoading === String(activeVisitId) ? "Checking Out..." : "Check Out Technician"}</span>
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
                      <span>{directCheckoutLoading === String(pendingVisitId) ? "Checking In..." : "Check In Technician"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="vms-dossier-close-btn"
                    onClick={() => setSelectedVisitor(null)}
                    title="Close dossier"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body */}
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
                      className="vms-dossier-change-photo-btn"
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
                          Ref: <code>{String(targetVisit.visit_id).slice(0, 13)}...</code>
                        </span>
                      </div>
                      <div className="vms-active-visit-actions">
                        <button
                          type="button"
                          className="vms-btn-checkout-prominent"
                          disabled={directCheckoutLoading === String(targetVisit.visit_id)}
                          onClick={() => handleDirectCheckout(targetVisit.visit_id, fullName)}
                          title="Clear declared hardware and check out technician from campus"
                        >
                          <LogOut size={14} />
                          <span>{directCheckoutLoading === String(targetVisit.visit_id) ? "Checking Out..." : "CONFIRM EXIT & AUTHORIZE CHECK-OUT"}</span>
                        </button>
                        <button
                          type="button"
                          className="vms-btn-pass-link"
                          onClick={() => window.open(`/guard?scan=${targetVisit.visit_id}`, "_blank")}
                          title="Open gate terminal pass verification"
                        >
                          <ExternalLink size={13} />
                          <span>Gate Pass</span>
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
                        <span style={{ display: "block", fontSize: "11px", color: "#0369a1" }}>
                          {targetVisit.host_employee?.department || "IT Infrastructure & Security"}
                        </span>
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

                {/* Declared Hardware & Assets */}
                <div className="vms-dossier-section">
                  <div className="vms-dossier-section-header">
                    <div className="vms-dossier-section-title">
                      <Laptop size={16} color="#0284c7" />
                      <span>Declared Hardware &amp; Diagnostic Assets ({declaredAssets.length})</span>
                    </div>
                  </div>
                  {declaredAssets.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                      No personal or company hardware declared for this visit.
                    </div>
                  ) : (
                    <div className="vms-asset-cards-grid" style={{ padding: "16px" }}>
                      {declaredAssets.map((asset) => (
                        <div key={asset.asset_id} className="vms-asset-card">
                          <div
                            className="vms-asset-img-box"
                            style={{ cursor: asset.photo_url ? "pointer" : "default" }}
                            onClick={() => { if (asset.photo_url) setLightboxImage(resolvePhotoUrl(asset.photo_url)); }}
                            title={asset.photo_url ? "Click to enlarge hardware photo" : ""}
                          >
                            {asset.photo_url ? (
                              <img src={resolvePhotoUrl(asset.photo_url)} alt={asset.asset_type} />
                            ) : (
                              <Laptop size={24} color="#94a3b8" />
                            )}
                          </div>
                          <div className="vms-asset-meta">
                            <div className="vms-asset-type">{asset.asset_type || "Diagnostic Equipment"}</div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>{asset.brand_model || "Hardware"}</div>
                            {asset.serial_number && (
                              <div className="vms-asset-sn">SN: {asset.serial_number}</div>
                            )}
                            <div style={{ marginTop: "4px" }}>
                              {asset.is_cleared_for_exit ? (
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
                                    borderRadius: "4px",
                                    padding: "2px 7px",
                                  }}
                                >
                                  <CheckCircle2 size={12} />
                                  Cleared for Departure {asset.cleared_by ? `(${asset.cleared_by})` : ""}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "#b45309",
                                    background: "#fffbeb",
                                    border: "1px solid #fde68a",
                                    borderRadius: "4px",
                                    padding: "2px 7px",
                                  }}
                                >
                                  <AlertTriangle size={12} />
                                  Exit Clearance Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visit History */}
                {allVisits.length > 0 && (
                  <div className="vms-dossier-section">
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="vms-dossier-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: "0 0 16px 16px" }}>
                <button
                  type="button"
                  className="it-qr-portal-btn"
                  onClick={() => setSelectedVisitor(null)}
                >
                  Close Dossier
                </button>
                {isInside && activeVisitId && (
                  <button
                    type="button"
                    className="btn-dossier-checkout"
                    disabled={directCheckoutLoading === String(activeVisitId)}
                    onClick={() => handleDirectCheckout(activeVisitId, fullName)}
                    title="Check out IT technician from campus"
                  >
                    <LogOut size={14} />
                    <span>{directCheckoutLoading === String(activeVisitId) ? "Checking Out..." : "Check Out & Clear Hardware"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      {/* Lightbox for zooming photos */}
      {lightboxImage && (
        <div className="vms-lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div
            className="vms-lightbox-card"
            style={{ maxWidth: "560px", padding: "16px", background: "#ffffff" }}
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
