import { useCallback, useEffect, useState } from "react";
import {
  Laptop,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  Users,
  Search,
  ArrowLeft,
  X,
  Eye,
  Hourglass,
  Building2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Server,
  QrCode,
  FileCode,
  Tag,
  AlertTriangle,
  HardDrive,
  ExternalLink,
} from "lucide-react";

const API_BASE_URL = "";
const PHOTO_BASE_URL = "";

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("vms_token");

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

async function readResponse(response, label) {
  let data = {};
  try {
    data = await response.json();
  } catch {
    // Response may not be JSON
  }

  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((item) => item.msg).join(", ")
      : data?.detail;

    throw new Error(detail || `${label} failed (${response.status})`);
  }

  return data;
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

function getStatusStyle(status) {
  const normalized = String(status || "").trim().toUpperCase();
  const styles = {
    PENDING: {
      background: "#fffbeb",
      color: "#b45309",
      border: "1px solid #fde68a",
      label: "Pending IT Review",
    },
    WAITING: {
      background: "#fff7ed",
      color: "#c2410c",
      border: "1px solid #fed7aa",
      label: "IT Host Busy (Waiting)",
    },
    APPROVED: {
      background: "#ecfdf5",
      color: "#047857",
      border: "1px solid #a7f3d0",
      label: "IT Clearance Approved",
    },
    REJECTED: {
      background: "#fef2f2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
      label: "Clearance Denied",
    },
    CHECKED_IN: {
      background: "#eef2ff",
      color: "#4338ca",
      border: "1px solid #c7d2fe",
      label: "Checked In (On Site)",
    },
  };
  return styles[normalized] || {
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    label: normalized || "Unknown",
  };
}

export default function ITPreApprovals({ onBack, onNotification }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Detailed Modal State
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(`${API_BASE_URL}/pre-approvals/`);
      const data = await readResponse(response, "Loading IT pre-approvals");

      // Strictly isolate IT Department workflow:
      // Only include entries submitted through the IT Visit form ([IT_VISIT] tag in purpose)
      const itWorkflowApprovals = (Array.isArray(data) ? data : []).filter((item) => {
        const purpose = String(item.purpose || "").toUpperCase();
        return purpose.includes("[IT_VISIT]");
      });

      setApprovals(itWorkflowApprovals);
    } catch (err) {
      console.error("IT Pre-Approval loading error:", err);
      setError(err.message || "Unable to load IT pre-approvals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTechnicianName = (approval) => {
    if (approval?.visitor) {
      return `${approval.visitor.first_name || ""} ${approval.visitor.last_name || ""}`.trim();
    }
    return `Technician #${approval?.visitor_id || ""}`;
  };

  const getITHostName = (approval) => {
    if (approval?.host_employee) {
      return `${approval.host_employee.first_name || ""} ${approval.host_employee.last_name || ""}`.trim();
    }
    return `IT Engineer #${approval?.host_employee_id || ""}`;
  };

  // Clean IT purpose to remove technical tags for display
  const getCleanPurpose = (purpose) => {
    if (!purpose) return "IT Technical Maintenance";
    return purpose.replace(/\[IT_VISIT\]\s*/gi, "").trim() || "IT Technical Support";
  };

  const totalCount = approvals.length;
  const pendingCount = approvals.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "PENDING"
  ).length;

  const waitingCount = approvals.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "WAITING"
  ).length;

  const approvedCount = approvals.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "APPROVED"
  ).length;

  const rejectedCount = approvals.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "REJECTED"
  ).length;

  const visibleApprovals = approvals.filter((item) => {
    const status = String(item.status || "").trim().toUpperCase();
    if (statusFilter !== "all" && status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const techName = getTechnicianName(item).toLowerCase();
      const hostName = getITHostName(item).toLowerCase();
      const purpose = (item.purpose || "").toLowerCase();
      const comp = (item.visitor?.company_name || "").toLowerCase();
      if (!techName.includes(q) && !hostName.includes(q) && !purpose.includes(q) && !comp.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleDecision = async (approval, action) => {
    const approvalId = approval.pre_approval_id;

    try {
      setActionLoading(approvalId);
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `${API_BASE_URL}/pre-approvals/${approvalId}/${action}`,
        { method: "POST" }
      );

      const actionLabel =
        action === "approve"
          ? "Approving IT clearance"
          : action === "wait"
          ? "Putting IT visitor on hold"
          : "Rejecting IT clearance";

      const result = await readResponse(response, actionLabel);

      setApprovals((previous) =>
        previous.map((item) =>
          item.pre_approval_id === approvalId
            ? { ...item, status: result.status }
            : item
        )
      );

      if (selectedApproval && selectedApproval.pre_approval_id === approvalId) {
        setSelectedApproval((prev) => ({ ...prev, status: result.status }));
      }

      const techName = getTechnicianName(approval);

      if (action === "approve") {
        setSuccess(`IT clearance approved for ${techName}. Gate Security can now check in the technician.`);
        onNotification?.({
          title: "IT Pre-Approval Approved",
          message: `${techName}'s IT technical visit has been approved. Gate security can now check in the technician.`,
          type: "it-visitor",
          time: "Just now",
        });
      } else if (action === "wait") {
        setSuccess(`IT host is occupied. ${techName} requested to wait in reception lobby.`);
        onNotification?.({
          title: "IT Visitor On Hold",
          message: `IT Host is busy in server room/meeting. ${techName} asked to wait in reception.`,
          type: "warning",
          time: "Just now",
        });
      } else {
        setSuccess(`IT access rejected for ${techName}. Entry denied.`);
        onNotification?.({
          title: "IT Pre-Approval Rejected",
          message: `${techName}'s IT clearance request was rejected. Entry denied.`,
          type: "warning",
          time: "Just now",
        });
      }
    } catch (err) {
      console.error("IT decision error:", err);
      setError(err.message || "Unable to update IT pre-approval.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <>
      {/* Lightbox for inspecting hardware photos */}
      {lightboxImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.85)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              style={{
                position: "absolute",
                top: "-12px",
                right: "-12px",
                background: "#0f172a",
                color: "white",
                border: "2px solid #334155",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
            <img
              src={lightboxImage}
              alt="Hardware inspection"
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: "10px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        </div>
      )}

      {/* IT CROSS-CHECK MODAL */}
      {selectedApproval && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflowY: "auto",
          }}
          onClick={() => setSelectedApproval(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              maxWidth: "780px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: "1px solid #cbd5e1",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a, #1e1b4b)",
                color: "#ffffff",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <Server size={18} color="#818cf8" />
                  <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.8px", color: "#818cf8" }}>
                    IT SECURITY &amp; CONTRACTOR CLEARANCE
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 700 }}>
                  IT Visitor &amp; Hardware Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApproval(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "#cbd5e1",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", maxHeight: "72vh", overflowY: "auto" }}>
              {/* Profile Card */}
              <div
                style={{
                  display: "flex",
                  gap: "18px",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "20px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "#e2e8f0",
                    flexShrink: 0,
                    cursor: selectedApproval.visitor?.photo_url ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (selectedApproval.visitor?.photo_url) {
                      setLightboxImage(
                        selectedApproval.visitor.photo_url.startsWith("http")
                          ? selectedApproval.visitor.photo_url
                          : `${PHOTO_BASE_URL}${selectedApproval.visitor.photo_url}`
                      );
                    }
                  }}
                >
                  {selectedApproval.visitor?.photo_url ? (
                    <img
                      src={
                        selectedApproval.visitor.photo_url.startsWith("http")
                          ? selectedApproval.visitor.photo_url
                          : `${PHOTO_BASE_URL}${selectedApproval.visitor.photo_url}`
                      }
                      alt="IT Technician"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                      <Laptop size={32} />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: "17px", color: "#0f172a" }}>
                      {getTechnicianName(selectedApproval)}
                    </h4>
                    <span
                      style={{
                        ...getStatusStyle(selectedApproval.status),
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {getStatusStyle(selectedApproval.status).label}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 6px", color: "#4f46e5", fontSize: "13px", fontWeight: 600 }}>
                    {selectedApproval.visitor?.company_name || "External IT Vendor / Contractor"}
                  </p>
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "#64748b" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Phone size={13} /> {selectedApproval.visitor?.phone_number || "No phone"}
                    </span>
                    {selectedApproval.visitor?.email && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Mail size={13} /> {selectedApproval.visitor.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* IT Credentials Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                {/* IT Host */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>
                    <Server size={14} color="#4f46e5" />
                    <strong>IT Host Engineer</strong>
                  </div>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>{getITHostName(selectedApproval)}</strong>
                  <div style={{ fontSize: "12px", color: "#4f46e5", marginTop: "2px", fontWeight: 600 }}>
                    IT Department · {selectedApproval.host_employee?.email || ""}
                  </div>
                </div>

                {/* Scope & Purpose */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>
                    <FileCode size={14} color="#059669" />
                    <strong>Work Authorization &amp; Scope</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", fontWeight: 500 }}>
                    {getCleanPurpose(selectedApproval.purpose)}
                  </p>
                </div>

                {/* Scheduled Times */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>
                    <Clock size={14} color="#d97706" />
                    <strong>Clearance Window</strong>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#0f172a" }}>
                    Arrival: <strong>{formatDateTime(selectedApproval.expected_in_time)}</strong>
                  </div>
                  {selectedApproval.expected_out_time && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      Expected Exit: {formatDateTime(selectedApproval.expected_out_time)}
                    </div>
                  )}
                </div>

                {/* Vendor Address */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>
                    <MapPin size={14} color="#ef4444" />
                    <strong>Technician Base Address</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#334155" }}>
                    {[
                      selectedApproval.visitor?.address_line1,
                      selectedApproval.visitor?.city,
                      selectedApproval.visitor?.state,
                      selectedApproval.visitor?.postal_code,
                      selectedApproval.visitor?.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "On contractor file"}
                  </p>
                </div>
              </div>

              {/* Declared Hardware & Assets Section */}
              <div
                style={{
                  border: "1px solid #c7d2fe",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "20px",
                  background: "#f5f3ff",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <HardDrive size={18} color="#6366f1" />
                    <strong style={{ fontSize: "14px", color: "#312e81" }}>
                      IT Hardware, Laptops &amp; Equipment Brought On Premises
                    </strong>
                  </div>
                  <span style={{ fontSize: "12px", color: "#4338ca", fontWeight: 700 }}>
                    {selectedApproval.assets?.length || 0} Registered Items
                  </span>
                </div>

                {selectedApproval.assets && selectedApproval.assets.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                    {selectedApproval.assets.map((asset, idx) => (
                      <div
                        key={asset.asset_id || idx}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e0e7ff",
                          borderRadius: "8px",
                          padding: "12px",
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        {asset.photo_url && (
                          <img
                            src={
                              asset.photo_url.startsWith("http")
                                ? asset.photo_url
                                : `${PHOTO_BASE_URL}${asset.photo_url}`
                            }
                            alt="Hardware"
                            style={{ width: "48px", height: "48px", borderRadius: "6px", objectFit: "cover", cursor: "pointer" }}
                            onClick={() =>
                              setLightboxImage(
                                asset.photo_url.startsWith("http")
                                  ? asset.photo_url
                                  : `${PHOTO_BASE_URL}${asset.photo_url}`
                              )
                            }
                          />
                        )}
                        <div>
                          <strong style={{ fontSize: "13px", color: "#0f172a", display: "block" }}>
                            {asset.asset_type}
                          </strong>
                          <span style={{ fontSize: "12px", color: "#4338ca" }}>
                            {asset.brand_model || "Technical Asset"}
                          </span>
                          {asset.serial_number && (
                            <div style={{ fontSize: "11px", color: "#1e1b4b", marginTop: "3px", fontFamily: "monospace", fontWeight: 700 }}>
                              S/N: {asset.serial_number}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "12px", color: "#6366f1" }}>
                    No specialized technical hardware declared. Pass serves as contractor personnel clearance only.
                  </p>
                )}
              </div>

              {/* Status Banner */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background:
                    selectedApproval.status === "APPROVED"
                      ? "#ecfdf5"
                      : selectedApproval.status === "WAITING"
                      ? "#fff7ed"
                      : selectedApproval.status === "REJECTED"
                      ? "#fef2f2"
                      : "#fffbeb",
                  border: `1px solid ${
                    selectedApproval.status === "APPROVED"
                      ? "#a7f3d0"
                      : selectedApproval.status === "WAITING"
                      ? "#fed7aa"
                      : selectedApproval.status === "REJECTED"
                      ? "#fecaca"
                      : "#fde68a"
                  }`,
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {selectedApproval.status === "APPROVED" ? (
                  <>
                    <CheckCircle2 size={18} color="#059669" />
                    <span style={{ color: "#065f46" }}>
                      <strong>IT Clearance Approved:</strong> Authorized for gate check-in. Security guard can now scan and admit the technician.
                    </span>
                  </>
                ) : selectedApproval.status === "WAITING" ? (
                  <>
                    <Clock size={18} color="#ea580c" />
                    <span style={{ color: "#9a3412" }}>
                      <strong>IT Host Busy (Waiting in Lobby):</strong> Host is currently occupied in data center or meeting. Approve when ready.
                    </span>
                  </>
                ) : selectedApproval.status === "REJECTED" ? (
                  <>
                    <XCircle size={18} color="#dc2626" />
                    <span style={{ color: "#991b1b" }}>
                      <strong>IT Access Denied:</strong> Contractor entry rejected. Security will deny access at gate.
                    </span>
                  </>
                ) : (
                  <>
                    <Hourglass size={18} color="#d97706" />
                    <span style={{ color: "#92400e" }}>
                      <strong>Awaiting IT Admin Approval:</strong> Review technician credentials and declared hardware before approving gate entry.
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                background: "#f8fafc",
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="back-button"
                onClick={() => setSelectedApproval(null)}
              >
                Close Inspection
              </button>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {/* 1. APPROVE BUTTON */}
                {selectedApproval.status !== "APPROVED" && selectedApproval.status !== "CHECKED_IN" && (
                  <button
                    type="button"
                    className="primary-button"
                    style={{ background: "#059669" }}
                    disabled={actionLoading === selectedApproval.pre_approval_id}
                    onClick={() => handleDecision(selectedApproval, "approve")}
                  >
                    <CheckCircle2 size={15} />
                    Approve IT Clearance
                  </button>
                )}

                {/* 2. ASK TO WAIT (IT HOST BUSY) */}
                {selectedApproval.status === "PENDING" && (
                  <button
                    type="button"
                    className="primary-button"
                    style={{ background: "#d97706" }}
                    disabled={actionLoading === selectedApproval.pre_approval_id}
                    onClick={() => handleDecision(selectedApproval, "wait")}
                    title="Notify technician that IT host is busy in server room"
                  >
                    <Clock size={15} />
                    Ask to Wait (Host Busy)
                  </button>
                )}

                {/* 3. REJECT BUTTON */}
                {selectedApproval.status !== "REJECTED" && selectedApproval.status !== "CHECKED_IN" && (
                  <button
                    type="button"
                    className="back-button"
                    style={{ color: "#dc2626", borderColor: "#fecaca" }}
                    disabled={actionLoading === selectedApproval.pre_approval_id}
                    onClick={() => handleDecision(selectedApproval, "reject")}
                  >
                    <XCircle size={15} />
                    Reject Clearance
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="it-management-header">
        <div className="it-header-title-box">
          <div className="it-header-badge-row">
            <span className="it-division-pill">IT Department Clearances</span>
            <span className="it-telemetry-pill">
              <span className="status-dot"></span>
              Technical Infrastructure Access
            </span>
          </div>
          <h2 className="it-page-title">IT Department Pre-Approvals</h2>
          <p className="it-page-desc">
            Dedicated workflow for IT contractors, vendor engineers, and technical personnel. Cross-check hardware and authorize gate security check-in.
          </p>
        </div>

        <div className="it-header-controls">
          <button
            type="button"
            className="it-qr-portal-btn"
            onClick={() => window.open("/it-visit", "_blank")}
            title="Open Public IT Registration Form in separate window"
          >
            <QrCode size={14} />
            <span>Open IT Portal</span>
          </button>

          <button
            type="button"
            className="it-qr-portal-btn"
            onClick={() => window.open("/guard", "_blank")}
            title="Open Gate Security Terminal in separate window"
          >
            <ExternalLink size={14} />
            <span>Gate Terminal</span>
          </button>

          <button
            type="button"
            className="it-refresh-btn"
            onClick={fetchData}
            disabled={loading}
            title="Refresh IT pre-approvals"
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
      <section className="stats-grid stats-grid-5">
        <div
          className={`stat-card clickable ${statusFilter === "all" ? "active-filter filter-blue" : ""}`}
          onClick={() => setStatusFilter("all")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon blue">
            <Server size={18} />
          </div>
          <div className="stat-content">
            <span>Total IT Requests</span>
            <strong>{totalCount}</strong>
            <span className="stat-interactive-hint">
              {statusFilter === "all" ? "● Active View" : "View all"}
            </span>
          </div>
        </div>

        <div
          className={`stat-card clickable ${statusFilter === "PENDING" ? "active-filter filter-amber" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "PENDING" ? "all" : "PENDING")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon amber">
            <Hourglass size={18} />
          </div>
          <div className="stat-content">
            <span>Pending IT Review</span>
            <strong style={{ color: "#d97706" }}>{pendingCount}</strong>
            <span className="stat-interactive-hint">
              {statusFilter === "PENDING" ? "● Active View" : "Requires approval"}
            </span>
          </div>
        </div>

        <div
          className={`stat-card clickable ${statusFilter === "WAITING" ? "active-filter filter-orange" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "WAITING" ? "all" : "WAITING")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon orange" style={{ background: "#fff7ed", color: "#ea580c" }}>
            <Clock size={18} />
          </div>
          <div className="stat-content">
            <span>Host Busy (Waiting)</span>
            <strong style={{ color: "#ea580c" }}>{waitingCount}</strong>
            <span className="stat-interactive-hint">
              {statusFilter === "WAITING" ? "● Active View" : "Waiting in lobby"}
            </span>
          </div>
        </div>

        <div
          className={`stat-card clickable ${statusFilter === "APPROVED" ? "active-filter filter-green" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "APPROVED" ? "all" : "APPROVED")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon green">
            <CheckCircle2 size={18} />
          </div>
          <div className="stat-content">
            <span>Approved for Gate</span>
            <strong style={{ color: "#059669" }}>{approvedCount}</strong>
            <span className="stat-interactive-hint">
              {statusFilter === "APPROVED" ? "● Active View" : "Cleared for entry"}
            </span>
          </div>
        </div>

        <div
          className={`stat-card clickable ${statusFilter === "REJECTED" ? "active-filter filter-purple" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "REJECTED" ? "all" : "REJECTED")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon purple">
            <XCircle size={18} />
          </div>
          <div className="stat-content">
            <span>Rejected</span>
            <strong style={{ color: "#dc2626" }}>{rejectedCount}</strong>
            <span className="stat-interactive-hint">
              {statusFilter === "REJECTED" ? "● Active View" : "Access denied"}
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="error-banner" role="alert">
          <XCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            padding: "12px 15px",
            marginBottom: "14px",
            borderRadius: "8px",
            background: "rgba(16, 185, 129, 0.15)",
            color: "#047857",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Table Card */}
      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <h2>IT Visitor &amp; Technical Contractor Queue</h2>
            <p>
              {visibleApprovals.length} IT request{visibleApprovals.length === 1 ? "" : "s"} found · Dedicated IT Department clearance workflow connected to Gate Security.
            </p>
          </div>
          <div className="visitor-toolbar-actions">
            <div className="search-field">
              <Search size={14} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search technician, IT host, company..."
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
            {statusFilter !== "all" && (
              <button
                type="button"
                className="clear-filter-btn"
                onClick={() => setStatusFilter("all")}
              >
                <X size={12} />
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw size={20} className="spin" />
            Loading IT pre-approvals...
          </div>
        ) : visibleApprovals.length === 0 ? (
          <div className="empty-state">
            <Server size={24} />
            <span>No IT Department pre-approval requests found for the selected view.</span>
          </div>
        ) : (
          <div className="table-wrap" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Technician / Contractor</th>
                  <th>IT Host Engineer</th>
                  <th>Scope &amp; Hardware Assets</th>
                  <th>Expected Arrival</th>
                  <th>Clearance Status</th>
                  <th>Hardware Verification &amp; Decision</th>
                </tr>
              </thead>
              <tbody>
                {visibleApprovals.map((approval) => {
                  const currentStatus = String(approval.status || "").trim().toUpperCase();
                  const isActionLoading = actionLoading === approval.pre_approval_id;
                  const v = approval.visitor;
                  const h = approval.host_employee;

                  return (
                    <tr key={approval.pre_approval_id}>
                      {/* Technician */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "8px",
                              background: "#e0e7ff",
                              overflow: "hidden",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {v?.photo_url ? (
                              <img
                                src={
                                  v.photo_url.startsWith("http")
                                    ? v.photo_url
                                    : `${PHOTO_BASE_URL}${v.photo_url}`
                                }
                                alt="Technician"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <Laptop size={18} color="#4338ca" />
                            )}
                          </div>
                          <div>
                            <strong>{getTechnicianName(approval)}</strong>
                            <div style={{ fontSize: "11px", color: "#4f46e5", fontWeight: 600 }}>
                              {v?.company_name || "IT Contractor"}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{v?.phone_number || ""}</div>
                          </div>
                        </div>
                      </td>

                      {/* IT Host */}
                      <td>
                        <strong>{getITHostName(approval)}</strong>
                        <div style={{ fontSize: "11px", color: "#4338ca" }}>
                          {h?.department || "IT Department"}
                        </div>
                      </td>

                      {/* Scope & Hardware */}
                      <td>
                        <div style={{ maxWidth: "240px", fontSize: "12.5px" }}>
                          {getCleanPurpose(approval.purpose)}
                        </div>
                        {approval.assets && approval.assets.length > 0 && (
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: "4px",
                              fontSize: "10.5px",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              background: "#ede9fe",
                              color: "#6d28d9",
                              border: "1px solid #ddd6fe",
                              fontWeight: 600,
                            }}
                          >
                            💻 {approval.assets.length} Hardware Item{approval.assets.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </td>

                      {/* Expected Time */}
                      <td>
                        <div style={{ fontSize: "12.5px" }}>{formatDateTime(approval.expected_in_time)}</div>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          style={{
                            ...getStatusStyle(currentStatus),
                            display: "inline-block",
                            padding: "4px 9px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getStatusStyle(currentStatus).label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          {/* Cross-Check Button */}
                          <button
                            type="button"
                            className="back-button"
                            style={{ padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                            onClick={() => setSelectedApproval(approval)}
                            title="Cross-check IT technician details, ticket, and hardware"
                          >
                            <Eye size={13} />
                            <span>Verify Hardware</span>
                          </button>

                          {currentStatus === "PENDING" && (
                            <>
                              <button
                                type="button"
                                className="primary-button"
                                style={{ background: "#059669", padding: "6px 11px", fontSize: "12px" }}
                                disabled={isActionLoading}
                                onClick={() => handleDecision(approval, "approve")}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="back-button"
                                style={{ color: "#d97706", borderColor: "#fde68a", padding: "6px 9px", fontSize: "12px" }}
                                disabled={isActionLoading}
                                onClick={() => handleDecision(approval, "wait")}
                                title="Host is in server room/meeting. Ask visitor to wait in lobby."
                              >
                                Host Busy
                              </button>
                              <button
                                type="button"
                                className="back-button"
                                style={{ color: "#dc2626", borderColor: "#fecaca", padding: "6px 9px", fontSize: "12px" }}
                                disabled={isActionLoading}
                                onClick={() => handleDecision(approval, "reject")}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {currentStatus === "WAITING" && (
                            <>
                              <button
                                type="button"
                                className="primary-button"
                                style={{ background: "#059669", padding: "6px 11px", fontSize: "12px" }}
                                disabled={isActionLoading}
                                onClick={() => handleDecision(approval, "approve")}
                              >
                                Approve Now
                              </button>
                              <button
                                type="button"
                                className="back-button"
                                style={{ color: "#dc2626", borderColor: "#fecaca", padding: "6px 9px", fontSize: "12px" }}
                                disabled={isActionLoading}
                                onClick={() => handleDecision(approval, "reject")}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {currentStatus === "APPROVED" && (
                            <span style={{ color: "#059669", fontSize: "12px", fontWeight: 600 }}>
                              ✓ Ready for Gate Check-in
                            </span>
                          )}

                          {currentStatus === "CHECKED_IN" && (
                            <span style={{ color: "#4338ca", fontSize: "12px", fontWeight: 600 }}>
                              ● Inside Premises
                            </span>
                          )}

                          {currentStatus === "REJECTED" && (
                            <span style={{ color: "#dc2626", fontSize: "12px" }}>
                              ✕ Access Denied
                            </span>
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
    </>
  );
}
