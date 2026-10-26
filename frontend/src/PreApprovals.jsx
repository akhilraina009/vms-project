import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  Users,
  ClipboardList,
  Search,
  ArrowLeft,
  ChevronRight,
  X,
  Filter,
  Eye,
  Hourglass,
  Building2,
  MapPin,
  Laptop,
  Phone,
  Mail,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Check,
  AlertTriangle,
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

const emptyVisitorForm = {
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
};

const emptyForm = {
  visitor_id: "",
  host_employee_id: "",
  purpose: "",
  expected_in_time: "",
  expected_out_time: "",
};

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
      label: "Pending Review",
    },
    WAITING: {
      background: "#fff7ed",
      color: "#c2410c",
      border: "1px solid #fed7aa",
      label: "Host Busy (On Hold)",
    },
    APPROVED: {
      background: "#ecfdf5",
      color: "#047857",
      border: "1px solid #a7f3d0",
      label: "Approved for Entry",
    },
    REJECTED: {
      background: "#fef2f2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
      label: "Entry Rejected",
    },
    CHECKED_IN: {
      background: "#eef2ff",
      color: "#4338ca",
      border: "1px solid #c7d2fe",
      label: "Checked In",
    },
  };
  return styles[normalized] || {
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    label: normalized || "Unknown",
  };
}

function getDateKey(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const isoDateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDateMatch) return isoDateMatch[1];
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PreApprovals({
  onBack,
  onNotification,
  onVisitCheckedIn,
  filterToday = false,
  onShowAll,
}) {
  const [visitors, setVisitors] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [approvals, setApprovals] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [showNewVisitor, setShowNewVisitor] = useState(false);
  const [newVisitor, setNewVisitor] = useState(emptyVisitorForm);
  const [registeringVisitor, setRegisteringVisitor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Detailed Cross-Check Modal State
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [visitorData, hostData, approvalData] = await Promise.all([
        apiFetch(`${API_BASE_URL}/visitors/`).then((res) =>
          readResponse(res, "Loading visitors")
        ),
        apiFetch(`${API_BASE_URL}/employees/`).then((res) =>
          readResponse(res, "Loading hosts")
        ),
        apiFetch(`${API_BASE_URL}/pre-approvals/`).then((res) =>
          readResponse(res, "Loading pre-approvals")
        ),
      ]);

      setVisitors(Array.isArray(visitorData) ? visitorData : []);
      setHosts(Array.isArray(hostData) ? hostData : []);

      // Filter out IT department visits from General Pre-Approvals
      // IT visits submitted via the IT Visit form ([IT_VISIT]) are exclusively in IT Pre-Approvals!
      const generalApprovals = (Array.isArray(approvalData) ? approvalData : []).filter(
        (item) => {
          const purpose = String(item.purpose || "").toUpperCase();
          const isIT = purpose.includes("[IT_VISIT]");
          return !isIT;
        }
      );

      setApprovals(generalApprovals);
    } catch (err) {
      console.error("Pre-Approval loading error:", err);
      setError(err.message || "Unable to load pre-approvals. Check backend connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getVisitor = (approval) => {
    if (approval?.visitor) return approval.visitor;
    return visitors.find((item) => String(item.visitor_id) === String(approval?.visitor_id)) || null;
  };

  const getVisitorName = (approval) => {
    const v = getVisitor(approval);
    if (!v) return `Visitor #${approval?.visitor_id || ""}`;
    return `${v.first_name || ""} ${v.last_name || ""}`.trim() || `Visitor #${v.visitor_id}`;
  };

  const getHost = (approval) => {
    if (approval?.host_employee) return approval.host_employee;
    return hosts.find((item) => String(item.employee_id) === String(approval?.host_employee_id)) || null;
  };

  const getHostName = (approval) => {
    const h = getHost(approval);
    if (!h) return `Employee #${approval?.host_employee_id || ""}`;
    return `${h.first_name || ""} ${h.last_name || ""}`.trim() || `Employee #${h.employee_id}`;
  };

  const todayKey = getTodayKey();
  const baseApprovals = filterToday
    ? approvals.filter((item) => getDateKey(item.expected_in_time) === todayKey)
    : approvals;

  const totalCount = baseApprovals.length;
  const pendingCount = baseApprovals.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "PENDING"
  ).length;

  const waitingCount = baseApprovals.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "WAITING"
  ).length;

  const approvedCount = baseApprovals.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "APPROVED"
  ).length;

  const rejectedCount = baseApprovals.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "REJECTED"
  ).length;

  const visibleApprovals = baseApprovals.filter((item) => {
    const status = String(item.status || "").trim().toUpperCase();
    if (statusFilter !== "all" && status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const visitorName = getVisitorName(item).toLowerCase();
      const hostName = getHostName(item).toLowerCase();
      const purpose = (item.purpose || "").toLowerCase();
      const comp = (item.visitor?.company_name || "").toLowerCase();
      if (!visitorName.includes(q) && !hostName.includes(q) && !purpose.includes(q) && !comp.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleInput = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleNewVisitorInput = (event) => {
    const { name, value } = event.target;
    setNewVisitor((previous) => ({ ...previous, [name]: value }));
  };

  const handleRegisterVisitor = async (event) => {
    event.preventDefault();
    try {
      setRegisteringVisitor(true);
      setError("");
      setSuccess("");

      const payload = {
        ...newVisitor,
        first_name: newVisitor.first_name.trim(),
        last_name: newVisitor.last_name.trim(),
        phone_number: newVisitor.phone_number.trim(),
        email: newVisitor.email.trim() || null,
        company_name: newVisitor.company_name.trim() || null,
        address_line1: newVisitor.address_line1.trim() || null,
        address_line2: newVisitor.address_line2.trim() || null,
        city: newVisitor.city.trim() || null,
        state: newVisitor.state.trim() || null,
        postal_code: newVisitor.postal_code.trim() || null,
        country: newVisitor.country.trim() || null,
      };

      const response = await apiFetch(`${API_BASE_URL}/visitors/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const createdVisitor = await readResponse(response, "Registering visitor");

      setVisitors((previous) => [
        createdVisitor,
        ...previous.filter((item) => String(item.visitor_id) !== String(createdVisitor.visitor_id)),
      ]);
      setForm((previous) => ({ ...previous, visitor_id: String(createdVisitor.visitor_id) }));
      setNewVisitor(emptyVisitorForm);
      setShowNewVisitor(false);
      setSuccess("Visitor registered successfully and selected for this pre-approval.");
      onNotification?.({
        title: "Visitor Registered",
        message: `${createdVisitor.first_name} ${createdVisitor.last_name} was registered with address details.`,
        type: "success",
        time: "Just now",
      });
    } catch (err) {
      console.error("Register visitor error:", err);
      setError(err.message || "Unable to register visitor. Check backend and database.");
    } finally {
      setRegisteringVisitor(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (
        form.expected_out_time &&
        new Date(form.expected_out_time) < new Date(form.expected_in_time)
      ) {
        throw new Error("Expected departure must be after arrival.");
      }

      const payload = {
        visitor_id: Number(form.visitor_id),
        host_employee_id: Number(form.host_employee_id),
        purpose: form.purpose.trim(),
        expected_in_time: form.expected_in_time,
        expected_out_time: form.expected_out_time || null,
      };

      const response = await apiFetch(`${API_BASE_URL}/pre-approvals/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const created = await readResponse(response, "Creating pre-approval");

      setApprovals((previous) => [created, ...previous]);

      const visitorName = getVisitorName(created);
      setForm(emptyForm);
      setSuccess("Pre-approval created successfully in PENDING status. Admin can review and approve.");

      onNotification?.({
        title: "Pre-Approval Created",
        message: `${visitorName} has been scheduled for admin review.`,
        type: "info",
        time: "Just now",
      });
    } catch (err) {
      console.error("Create pre-approval error:", err);
      setError(err.message || "Unable to create pre-approval.");
    } finally {
      setSubmitting(false);
    }
  };

  // Three Admin Decisions: approve, wait, reject
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
          ? "Approving request"
          : action === "wait"
          ? "Putting request on hold"
          : "Rejecting request";

      const result = await readResponse(response, actionLabel);

      setApprovals((previous) =>
        previous.map((item) =>
          item.pre_approval_id === approvalId
            ? { ...item, status: result.status }
            : item
        )
      );

      // If the modal was open for this approval, update it as well
      if (selectedApproval && selectedApproval.pre_approval_id === approvalId) {
        setSelectedApproval((prev) => ({ ...prev, status: result.status }));
      }

      const visitorName = getVisitorName(approval);

      if (action === "approve") {
        setSuccess(`Pre-approval approved! ${visitorName} is now cleared for gate check-in.`);
        onNotification?.({
          title: "Pre-Approval Approved",
          message: `${visitorName}'s visit request has been approved. Gate security can now check in the visitor.`,
          type: "success",
          time: "Just now",
        });
      } else if (action === "wait") {
        setSuccess(`Host is busy. ${visitorName} was asked to wait in the reception lobby.`);
        onNotification?.({
          title: "Visitor Put on Hold",
          message: `Host is busy. ${visitorName} requested to wait in reception lobby.`,
          type: "warning",
          time: "Just now",
        });
      } else {
        setSuccess(`Pre-approval rejected. ${visitorName}'s entry has been denied.`);
        onNotification?.({
          title: "Pre-Approval Rejected",
          message: `${visitorName}'s request was rejected by host/admin. Entry denied.`,
          type: "warning",
          time: "Just now",
        });
      }
    } catch (err) {
      console.error("Pre-approval decision error:", err);
      setError(err.message || "Unable to update pre-approval.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <>
      {/* Lightbox for inspecting photos */}
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
              alt="Inspection enlarged view"
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

      {/* CROSS-CHECK & VERIFICATION MODAL */}
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
              maxWidth: "760px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              animation: "modalFadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                color: "#ffffff",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <ShieldCheck size={18} color="#38bdf8" />
                  <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.8px", color: "#38bdf8" }}>
                    VISITOR VERIFICATION DESK
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 700 }}>
                  Cross-Check Visitor Details &amp; Pass
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

            {/* Modal Content */}
            <div style={{ padding: "24px", maxHeight: "72vh", overflowY: "auto" }}>
              {/* Profile Card */}
              <div
                style={{
                  display: "flex",
                  gap: "20px",
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
                    position: "relative",
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
                      alt="Visitor"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                      <Users size={32} />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: "17px", color: "#0f172a" }}>
                      {getVisitorName(selectedApproval)}
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
                  <p style={{ margin: "0 0 6px", color: "#475569", fontSize: "13px" }}>
                    {selectedApproval.visitor?.company_name || "Independent Visitor"}
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

              {/* Grid of verified credentials */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                {/* Host Info */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>
                    <Building2 size={14} color="#3b82f6" />
                    <strong>Host Officer &amp; Department</strong>
                  </div>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>{getHostName(selectedApproval)}</strong>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    {selectedApproval.host_employee?.department || "General"} · {selectedApproval.host_employee?.email || ""}
                  </div>
                </div>

                {/* Visit Purpose */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>
                    <ClipboardList size={14} color="#8b5cf6" />
                    <strong>Purpose of Visit</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", fontWeight: 500 }}>
                    {selectedApproval.purpose || "Official Visit"}
                  </p>
                </div>

                {/* Expected Times */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>
                    <Clock size={14} color="#10b981" />
                    <strong>Scheduled Timing</strong>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#0f172a" }}>
                    Arrival: <strong>{formatDateTime(selectedApproval.expected_in_time)}</strong>
                  </div>
                  {selectedApproval.expected_out_time && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      Departure: {formatDateTime(selectedApproval.expected_out_time)}
                    </div>
                  )}
                </div>

                {/* Address Card */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>
                    <MapPin size={14} color="#ef4444" />
                    <strong>Visitor Residence Address</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#334155", lineHeight: "1.4" }}>
                    {[
                      selectedApproval.visitor?.address_line1,
                      selectedApproval.visitor?.address_line2,
                      selectedApproval.visitor?.city,
                      selectedApproval.visitor?.state,
                      selectedApproval.visitor?.postal_code,
                      selectedApproval.visitor?.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "No address entered on registration form."}
                  </p>
                </div>
              </div>

              {/* Registered Assets Section */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "20px", background: "#f8fafc" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Laptop size={17} color="#2563eb" />
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>Declared Assets &amp; Items</strong>
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                    {selectedApproval.assets?.length || 0} Registered
                  </span>
                </div>

                {selectedApproval.assets && selectedApproval.assets.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                    {selectedApproval.assets.map((asset, idx) => (
                      <div
                        key={asset.asset_id || idx}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "10px",
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
                            alt="Asset"
                            style={{ width: "42px", height: "42px", borderRadius: "6px", objectFit: "cover", cursor: "pointer" }}
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
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {asset.brand_model || "No model"}
                          </span>
                          {asset.serial_number && (
                            <div style={{ fontSize: "10.5px", color: "#475569", marginTop: "2px", fontFamily: "monospace" }}>
                              S/N: {asset.serial_number}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                    No personal devices or hardware were declared by this visitor.
                  </p>
                )}
              </div>

              {/* Status Explanation Banner */}
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
                      <strong>Approved for Entry:</strong> Visitor pass is cleared. Gate Security Guard can now check in this visitor.
                    </span>
                  </>
                ) : selectedApproval.status === "WAITING" ? (
                  <>
                    <Clock size={18} color="#ea580c" />
                    <span style={{ color: "#9a3412" }}>
                      <strong>On Hold (Host Busy):</strong> Visitor has been asked to wait in reception lobby. Click Approve once host is ready.
                    </span>
                  </>
                ) : selectedApproval.status === "REJECTED" ? (
                  <>
                    <XCircle size={18} color="#dc2626" />
                    <span style={{ color: "#991b1b" }}>
                      <strong>Request Rejected:</strong> Host declined this meeting. Gate Security will deny entry.
                    </span>
                  </>
                ) : (
                  <>
                    <Hourglass size={18} color="#d97706" />
                    <span style={{ color: "#92400e" }}>
                      <strong>Pending Admin Review:</strong> Cross-check all details with visitor registration pass before making an entry decision.
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
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
                    Approve Entry
                  </button>
                )}

                {/* 2. ASK TO WAIT (HOST BUSY) BUTTON */}
                {selectedApproval.status === "PENDING" && (
                  <button
                    type="button"
                    className="primary-button"
                    style={{ background: "#d97706" }}
                    disabled={actionLoading === selectedApproval.pre_approval_id}
                    onClick={() => handleDecision(selectedApproval, "wait")}
                    title="Notify visitor that host is busy and ask them to wait in lobby"
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
                    Reject (Host Declined)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Header */}
      <div className="it-management-header">
        <div className="it-header-title-box">
          <div className="it-header-badge-row">
            <span className="it-division-pill">Corporate &amp; General Visitors</span>
            <span className="it-telemetry-pill">
              <span className="status-dot"></span>
              Admin Approval Desk Active
            </span>
          </div>
          <h2 className="it-page-title">General Visitor Pre-Approvals</h2>
          <p className="it-page-desc">
            Review incoming registration requests, cross-check identity and address records, and grant entry clearance for Gate Security.
          </p>
        </div>

        <div className="it-header-controls">
          <button
            type="button"
            className="it-qr-portal-btn"
            onClick={() => window.open("/register-visitor", "_blank")}
            title="Open Visitor Registration Form in a separate window"
          >
            <ExternalLink size={14} />
            <span>Visitor Form</span>
          </button>

          <button
            type="button"
            className="it-qr-portal-btn"
            onClick={() => window.open("/guard", "_blank")}
            title="Open Gate Security Desk in a separate window"
          >
            <ExternalLink size={14} />
            <span>Gate Terminal</span>
          </button>

          {filterToday && (
            <button
              type="button"
              className="it-qr-portal-btn"
              onClick={onShowAll}
            >
              <span>Show All Requests</span>
            </button>
          )}

          <button
            type="button"
            className="it-refresh-btn"
            onClick={fetchData}
            disabled={loading}
            title="Refresh pre-approvals"
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
            <ClipboardList size={18} />
          </div>
          <div className="stat-content">
            <span>{filterToday ? "Today's Requests" : "Total Requests"}</span>
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
            <span>Pending Review</span>
            <strong style={{ color: "#d97706" }}>{pendingCount}</strong>
            <span className="stat-interactive-hint">
              {statusFilter === "PENDING" ? "● Active View" : "Awaiting approval"}
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
            <span>Approved</span>
            <strong style={{ color: "#059669" }}>{approvedCount}</strong>
            <span className="stat-interactive-hint">
              {statusFilter === "APPROVED" ? "● Active View" : "Ready for gate"}
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
              {statusFilter === "REJECTED" ? "● Active View" : "Entry denied"}
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

      {/* Manual Pre-Approval Creation Form */}
      <section className="page-card">
        <div className="section-header">
          <div>
            <h2>Schedule New Expected Visitor</h2>
            <p>Add an advance appointment or expected visitor to the pre-clearance register.</p>
          </div>
          <CalendarClock size={22} color="#4f46e5" />
        </div>

        <form
          onSubmit={handleCreate}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <label>
              Visitor <span>*</span>
            </label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select
                name="visitor_id"
                value={form.visitor_id}
                onChange={handleInput}
                required
                disabled={loading}
                style={{ flex: "1 1 260px", minWidth: 0 }}
              >
                <option value="">Select visitor</option>
                {visitors.map((visitor) => (
                  <option key={visitor.visitor_id} value={visitor.visitor_id}>
                    {`${visitor.first_name || ""} ${visitor.last_name || ""}`.trim()}
                    {visitor.company_name ? ` — ${visitor.company_name}` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="back-button"
                onClick={() => {
                  setShowNewVisitor((previous) => !previous);
                  setError("");
                  setSuccess("");
                }}
                disabled={registeringVisitor}
              >
                {showNewVisitor ? "Close Form" : "+ Register New Visitor"}
              </button>
            </div>
          </div>

          {showNewVisitor && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "20px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                background: "#f8fafc",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "14px",
              }}
            >
              <div style={{ gridColumn: "1 / -1" }}>
                <h3 style={{ margin: "0 0 5px", fontSize: "16px", color: "#0f172a" }}>
                  Register New Visitor Identity
                </h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>
                  Enter contact and complete address details.
                </p>
              </div>
              {[
                ["first_name", "First Name *", "First name", true],
                ["last_name", "Last Name *", "Last name", true],
                ["phone_number", "Phone Number *", "Phone number", true],
                ["email", "Email Address", "Email address", false],
                ["company_name", "Company Name", "Company name", false],
              ].map(([name, label, placeholder, required]) => (
                <div className="form-field" key={name}>
                  <label>{label}</label>
                  <input
                    name={name}
                    value={newVisitor[name]}
                    onChange={handleNewVisitorInput}
                    placeholder={placeholder}
                    required={required}
                    type={name === "email" ? "email" : "text"}
                  />
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "14px", color: "#0f172a" }}>Address Details</h4>
              </div>
              {[
                ["address_line1", "Address Line 1", "Building / Street"],
                ["address_line2", "Address Line 2 (Optional)", "Area / Locality"],
                ["city", "City", "City"],
                ["state", "State", "State"],
                ["postal_code", "PIN Code", "Postal Code"],
                ["country", "Country", "Country"],
              ].map(([name, label, placeholder]) => (
                <div className="form-field" key={name}>
                  <label>{label}</label>
                  <input
                    name={name}
                    value={newVisitor[name]}
                    onChange={handleNewVisitorInput}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="back-button"
                  onClick={() => setShowNewVisitor(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  disabled={registeringVisitor}
                  onClick={(event) => {
                    const formElement = event.currentTarget.closest("form");
                    if (!newVisitor.first_name.trim() || !newVisitor.last_name.trim() || !newVisitor.phone_number.trim()) {
                      setError("First name, last name, and phone number are required.");
                      return;
                    }
                    void handleRegisterVisitor({ preventDefault: () => {}, currentTarget: formElement });
                  }}
                >
                  {registeringVisitor ? "Saving..." : "Save & Select"}
                </button>
              </div>
            </div>
          )}

          <div className="form-field">
            <label>
              Host / Employee <span>*</span>
            </label>
            <select
              name="host_employee_id"
              value={form.host_employee_id}
              onChange={handleInput}
              required
              disabled={loading || hosts.length === 0}
            >
              <option value="">Select host</option>
              {hosts.map((host) => (
                <option key={host.employee_id} value={host.employee_id}>
                  {`${host.first_name || ""} ${host.last_name || ""}`.trim()}
                  {host.department ? ` — ${host.department}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>
              Expected Arrival <span>*</span>
            </label>
            <input
              type="datetime-local"
              name="expected_in_time"
              value={form.expected_in_time}
              onChange={handleInput}
              required
            />
          </div>

          <div className="form-field">
            <label>Expected Departure</label>
            <input
              type="datetime-local"
              name="expected_out_time"
              value={form.expected_out_time}
              onChange={handleInput}
              min={form.expected_in_time || undefined}
            />
          </div>

          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <label>
              Purpose of Visit <span>*</span>
            </label>
            <textarea
              name="purpose"
              value={form.purpose}
              onChange={handleInput}
              placeholder="Enter official reason for this visit"
              maxLength={500}
              rows={2}
              required
            />
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              type="button"
              className="back-button"
              onClick={() => {
                setForm(emptyForm);
                setError("");
                setSuccess("");
              }}
              disabled={submitting}
            >
              Reset
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting || loading || visitors.length === 0 || hosts.length === 0}
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarClock size={14} />
                  Schedule Pre-Approval
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Pre-Approval Table */}
      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <h2>{filterToday ? "Today's General Visitors" : "General Visitor Pre-Approval Queue"}</h2>
            <p>
              {visibleApprovals.length} request{visibleApprovals.length === 1 ? "" : "s"} found · Cross-check visitor details before granting gate clearance.
            </p>
          </div>
          <div className="visitor-toolbar-actions">
            <div className="search-field">
              <Search size={14} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitor, host, company..."
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
            Loading pre-approvals...
          </div>
        ) : visibleApprovals.length === 0 ? (
          <div className="empty-state">
            <CalendarClock size={24} />
            <span>
              {filterToday
                ? "No general pre-approval requests scheduled for today."
                : "No requests found for the selected filter."}
            </span>
          </div>
        ) : (
          <div className="table-wrap" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Visitor Profile</th>
                  <th>Host / Department</th>
                  <th>Purpose &amp; Assets</th>
                  <th>Expected Arrival</th>
                  <th>Status</th>
                  <th>Inspection &amp; Admin Decision</th>
                </tr>
              </thead>
              <tbody>
                {visibleApprovals.map((approval) => {
                  const currentStatus = String(approval.status || "").trim().toUpperCase();
                  const isActionLoading = actionLoading === approval.pre_approval_id;
                  const v = getVisitor(approval);
                  const h = getHost(approval);

                  return (
                    <tr key={approval.pre_approval_id}>
                      {/* Visitor Profile */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              background: "#e2e8f0",
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
                                alt="Visitor"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <Users size={16} color="#64748b" />
                            )}
                          </div>
                          <div>
                            <strong>{getVisitorName(approval)}</strong>
                            {v?.company_name && (
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{v.company_name}</div>
                            )}
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{v?.phone_number || ""}</div>
                          </div>
                        </div>
                      </td>

                      {/* Host Info */}
                      <td>
                        <strong>{getHostName(approval)}</strong>
                        {h?.department && (
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{h.department}</div>
                        )}
                      </td>

                      {/* Purpose & Assets */}
                      <td>
                        <div style={{ maxWidth: "220px", fontSize: "12.5px" }}>
                          {approval.purpose}
                        </div>
                        {approval.assets && approval.assets.length > 0 && (
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: "4px",
                              fontSize: "10.5px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "#eff6ff",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            📦 {approval.assets.length} Asset{approval.assets.length === 1 ? "" : "s"}
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
                            title="Cross-check all visitor details and pass"
                          >
                            <Eye size={13} />
                            <span>Verify Details</span>
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
                                title="Host is busy. Ask visitor to wait in lobby."
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
                              ✓ Cleared for Gate
                            </span>
                          )}

                          {currentStatus === "CHECKED_IN" && (
                            <span style={{ color: "#4338ca", fontSize: "12px", fontWeight: 600 }}>
                              ● On Premises
                            </span>
                          )}

                          {currentStatus === "REJECTED" && (
                            <span style={{ color: "#dc2626", fontSize: "12px" }}>
                              ✕ Entry Denied
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
