import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  Users,
  ClipboardList,
  UserPlus,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

const emptyForm = {
  visitor_id: "",
  host_employee_id: "",
  purpose: "",
  expected_in_time: "",
  expected_out_time: "",
};

const emptyVisitorForm = {
  first_name: "",
  last_name: "",
  phone_number: "",
  email: "",
  company_name: "",
};

const authenticatedFetch = (url, options = {}) => {
  const token = localStorage.getItem("vms_token");
  return window.fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};
async function readResponse(response, label) {
  let data = {};

  try {
    data = await response.json();
  } catch {
    // Some error responses may not contain JSON.
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
      background: "#fff7ed",
      color: "#c2410c",
    },
    APPROVED: {
      background: "#ecfdf3",
      color: "#027a48",
    },
    REJECTED: {
      background: "#fef3f2",
      color: "#b42318",
    },
    CHECKED_IN: {
      background: "#eff8ff",
      color: "#175cd3",
    },
  };

  return styles[normalized] || {
    background: "#f2f4f7",
    color: "#344054",
  };
}

// Return the date part supplied by the API without converting the
// timestamp through UTC. This preserves the scheduled calendar date.
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Inline visitor registration states
  const [showAddVisitorForm, setShowAddVisitorForm] = useState(false);
  const [visitorCreating, setVisitorCreating] = useState(false);
  const [visitorFormError, setVisitorFormError] = useState("");
  const [visitorForm, setVisitorForm] = useState(emptyVisitorForm);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [visitorData, hostData, approvalData] = await Promise.all([
        authenticatedFetch(`${API_BASE_URL}/visitors/`).then((response) =>
          readResponse(response, "Loading visitors")
        ),
        authenticatedFetch(`${API_BASE_URL}/employees/`).then((response) =>
          readResponse(response, "Loading hosts")
        ),
        authenticatedFetch(`${API_BASE_URL}/pre-approvals/`).then((response) =>
          readResponse(response, "Loading pre-approvals")
        ),
      ]);

      setVisitors(Array.isArray(visitorData) ? visitorData : []);
      setHosts(Array.isArray(hostData) ? hostData : []);
      setApprovals(Array.isArray(approvalData) ? approvalData : []);
    } catch (err) {
      console.error("Pre-Approval loading error:", err);
      setError(err.message || "Unable to load pre-approvals. Check the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const getVisitorName = (visitorId) => {
    const visitor = visitors.find(
      (item) => String(item.visitor_id) === String(visitorId)
    );

    if (!visitor) return `Visitor #${visitorId}`;

    return (
      `${visitor.first_name || ""} ${visitor.last_name || ""}`.trim() ||
      `Visitor #${visitorId}`
    );
  };

  const getHostName = (employeeId) => {
    const host = hosts.find(
      (item) => String(item.employee_id) === String(employeeId)
    );

    if (!host) return `Employee #${employeeId}`;

    return (
      `${host.first_name || ""} ${host.last_name || ""}`.trim() ||
      `Employee #${employeeId}`
    );
  };

  const todayKey = getTodayKey();

  const visibleApprovals = filterToday
    ? approvals.filter((item) => {
        const status = String(item.status || "")
          .trim()
          .toUpperCase();

        return (
          getDateKey(item.expected_in_time) === todayKey &&
          status === "APPROVED"
        );
      })
    : approvals;

  const pendingCount = visibleApprovals.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "PENDING"
  ).length;

  const approvedCount = visibleApprovals.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "APPROVED"
  ).length;

  const rejectedCount = visibleApprovals.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "REJECTED"
  ).length;

  const handleInput = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleNewVisitorInput = (event) => {
    const { name, value } = event.target;
    setVisitorForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateVisitorInline = async () => {
    const firstName = visitorForm.first_name.trim();

    if (!firstName) {
      setVisitorFormError("First name is required.");
      return;
    }

    try {
      setVisitorCreating(true);
      setVisitorFormError("");
      setError("");
      setSuccess("");

      const payload = {
        first_name: firstName,
        last_name: visitorForm.last_name.trim(),
        phone_number: visitorForm.phone_number.trim(),
        email: visitorForm.email.trim(),
        company_name: visitorForm.company_name.trim(),
      };

      const response = await authenticatedFetch(`${API_BASE_URL}/visitors/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const created = await readResponse(response, "Creating visitor");

      // Refresh the visitor list after saving.
      const refreshResponse = await authenticatedFetch(`${API_BASE_URL}/visitors/`);
      const visitorData = await readResponse(
        refreshResponse,
        "Refreshing visitors"
      );

      const refreshedVisitors = Array.isArray(visitorData)
        ? visitorData
        : Array.isArray(visitorData?.visitors)
        ? visitorData.visitors
        : [];

      const email = payload.email.toLowerCase();
      const phone = payload.phone_number;

      let newVisitor =
        created?.visitor_id != null
          ? refreshedVisitors.find(
              (item) =>
                String(item.visitor_id) === String(created.visitor_id)
            )
          : null;

      if (!newVisitor && email) {
        newVisitor = refreshedVisitors.find(
          (item) => String(item.email || "").trim().toLowerCase() === email
        );
      }

      if (!newVisitor && phone) {
        newVisitor = refreshedVisitors.find(
          (item) => String(item.phone_number || "").trim() === phone
        );
      }

      // Use the create response if the refreshed list did not contain it.
      if (!newVisitor && created?.visitor_id != null) {
        newVisitor = { ...payload, ...created };
      }

      if (!newVisitor || newVisitor.visitor_id == null) {
        setVisitors(refreshedVisitors);
        setVisitorFormError(
          "Visitor was saved, but could not be selected automatically. " +
          "Please refresh the page data and select the visitor manually."
        );
        return;
      }

      const updatedVisitors = refreshedVisitors.some(
        (item) =>
          String(item.visitor_id) === String(newVisitor.visitor_id)
      )
        ? refreshedVisitors
        : [newVisitor, ...refreshedVisitors];

      setVisitors(updatedVisitors);

      // Automatically select the newly registered visitor.
      setForm((previous) => ({
        ...previous,
        visitor_id: String(newVisitor.visitor_id),
      }));

      const visitorName =
        `${newVisitor.first_name || firstName} ${
          newVisitor.last_name || payload.last_name
        }`.trim();

      setVisitorForm(emptyVisitorForm);
      setShowAddVisitorForm(false);

      setSuccess(
        `${visitorName} registered and selected. Complete the remaining ` +
        "details and click Create Pre-Approval."
      );

      onNotification?.({
        title: "Visitor Registered",
        message: `${visitorName} has been registered and selected for pre-approval.`,
        type: "success",
        time: "Just now",
      });
    } catch (err) {
      console.error("Inline visitor registration error:", err);
      setVisitorFormError(
        err.message || "Unable to register visitor."
      );
    } finally {
      setVisitorCreating(false);
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

      const response = await authenticatedFetch(`${API_BASE_URL}/pre-approvals/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const created = await readResponse(response, "Creating pre-approval");
      setApprovals((previous) => [created, ...previous]);

      const visitorName = getVisitorName(created.visitor_id);
      setForm(emptyForm);
      setSuccess("Pre-approval created successfully.");

      onNotification?.({
        title: "Pre-Approval Created",
        message: `${visitorName} has been scheduled as an expected visitor.`,
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

  const handleDecision = async (approval, action) => {
    const approvalId = approval.pre_approval_id;

    try {
      setActionLoading(approvalId);
      setError("");
      setSuccess("");

      const response = await authenticatedFetch(
        `${API_BASE_URL}/pre-approvals/${approvalId}/${action}`,
        { method: "POST" }
      );

      const result = await readResponse(
        response,
        action === "approve" ? "Approving pre-approval" : "Rejecting pre-approval"
      );

      setApprovals((previous) =>
        previous.map((item) =>
          item.pre_approval_id === approvalId
            ? { ...item, status: result.status }
            : item
        )
      );

      const visitorName = getVisitorName(approval.visitor_id);
      const approved = action === "approve";

      setSuccess(
        approved
          ? "Pre-approval approved successfully."
          : "Pre-approval rejected successfully."
      );

      onNotification?.({
        title: approved ? "Pre-Approval Approved" : "Pre-Approval Rejected",
        message: `${visitorName}'s pre-approval has been ${approved ? "approved" : "rejected"}.`,
        type: approved ? "success" : "warning",
        time: "Just now",
      });
    } catch (err) {
      console.error("Pre-approval decision error:", err);
      setError(err.message || "Unable to update pre-approval.");
    } finally {
      setActionLoading("");
    }
  };

  const handleCheckIn = async (approval) => {
    const approvalId = approval.pre_approval_id;

    try {
      setActionLoading(approvalId);
      setError("");
      setSuccess("");

      const response = await authenticatedFetch(
        `${API_BASE_URL}/pre-approvals/${approvalId}/check-in`,
        { method: "POST" }
      );

      const result = await readResponse(response, "Checking in visitor");
      const visitorName = getVisitorName(approval.visitor_id);

      setApprovals((previous) =>
        previous.map((item) =>
          item.pre_approval_id === approvalId
            ? {
                ...item,
                status: result.pre_approval_status || result.status || "CHECKED_IN",
              }
            : item
        )
      );

      setSuccess(`${visitorName} checked in successfully.`);

      onNotification?.({
        title: "Visitor Checked In",
        message: `${visitorName} has checked in successfully and is now inside. Visit ID: ${result.visit_id}`,
        type: "success",
        time: "Just now",
      });

      onVisitCheckedIn?.(result);
    } catch (err) {
      console.error("Visitor check-in error:", err);
      setError(err.message || "Unable to check in visitor.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <>
      <div className="topbar preapproval-topbar">
        <div>
          <h2>Pre-Approval Management</h2>
          <p>
            {filterToday
              ? "Viewing approved visitor requests scheduled for today."
              : "Schedule expected visitors and manage approval requests."}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {filterToday && (
            <button
              type="button"
              className="back-button"
              onClick={onShowAll}
            >
              Show All Requests
            </button>
          )}

          <button
            type="button"
            className="back-button"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh
          </button>

          {onBack && (
            <button type="button" className="back-button" onClick={onBack}>
              Back to Dashboard
            </button>
          )}
        </div>
      </div>

      <section className="stats-grid preapproval-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <ClipboardList size={18} />
          </div>
          <div className="stat-content">
            <span>{filterToday ? "Today's Approved" : "Total Requests"}</span>
            <strong>{visibleApprovals.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Clock size={18} />
          </div>
          <div className="stat-content">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={18} />
          </div>
          <div className="stat-content">
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <XCircle size={18} />
          </div>
          <div className="stat-content">
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
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
            background: "#ecfdf3",
            color: "#027a48",
            border: "1px solid #abefc6",
            fontSize: "13px",
          }}
        >
          <CheckCircle2
            size={15}
            style={{ verticalAlign: "middle", marginRight: "7px" }}
          />
          {success}
        </div>
      )}

      <section className="page-card preapproval-create-card">
        <div className="section-header">
          <div>
            <h2>Create Pre-Approval</h2>
            <p>Register a visitor who is expected to arrive later.</p>
          </div>
          <CalendarClock size={22} color="#2563eb" />
        </div>

        <form
          className="preapproval-form"
          onSubmit={handleCreate}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          <div
            className={`form-field visitor-selector-field ${
              showAddVisitorForm ? "visitor-selector-expanded" : ""
            }`}
            style={{ gridColumn: showAddVisitorForm ? "1 / -1" : undefined }}
          >
            <label>
              Visitor <span>*</span>
            </label>

            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <select
                name="visitor_id"
                value={form.visitor_id}
                onChange={handleInput}
                required
                disabled={loading || visitors.length === 0}
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: "42px",
                }}
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
                  setShowAddVisitorForm((previous) => !previous);
                  setVisitorFormError("");
                }}
                disabled={visitorCreating}
                style={{
                  minHeight: "42px",
                  padding: "0 14px",
                  borderRadius: "8px",
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                }}
              >
                <UserPlus size={14} />
                {showAddVisitorForm ? "Close" : "Add New Visitor"}
              </button>
            </div>

            {showAddVisitorForm && (
              <div
                className="inline-visitor-panel"
                style={{
                  marginTop: "12px",
                  padding: "14px",
                  border: "1px solid #dbe3ef",
                  borderRadius: "10px",
                  background: "#f8fafc",
                }}
              >
                <strong style={{ fontSize: "13px" }}>
                  Register New Visitor
                </strong>

                <div
                  className="inline-visitor-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: "10px",
                    marginTop: "12px",
                  }}
                >
                  <div className="form-field">
                    <label>First Name *</label>
                    <input
                      name="first_name"
                      value={visitorForm.first_name}
                      onChange={handleNewVisitorInput}
                      placeholder="First name"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Last Name</label>
                    <input
                      name="last_name"
                      value={visitorForm.last_name}
                      onChange={handleNewVisitorInput}
                      placeholder="Last name"
                    />
                  </div>

                  <div className="form-field">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={visitorForm.phone_number}
                      onChange={handleNewVisitorInput}
                      placeholder="Phone number"
                    />
                  </div>

                  <div className="form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={visitorForm.email}
                      onChange={handleNewVisitorInput}
                      placeholder="Email address"
                    />
                  </div>

                  <div className="form-field">
                    <label>Company Name</label>
                    <input
                      name="company_name"
                      value={visitorForm.company_name}
                      onChange={handleNewVisitorInput}
                      placeholder="Company name"
                    />
                  </div>
                </div>

                {visitorFormError && (
                  <p
                    role="alert"
                    style={{
                      color: "#b42318",
                      fontSize: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    {visitorFormError}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                    marginTop: "12px",
                  }}
                >
                  <button
                    type="button"
                    className="back-button"
                    disabled={visitorCreating}
                    onClick={() => {
                      setShowAddVisitorForm(false);
                      setVisitorFormError("");
                      setVisitorForm(emptyVisitorForm);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    disabled={visitorCreating || !visitorForm.first_name.trim()}
                    onClick={handleCreateVisitorInline}
                  >
                    {visitorCreating ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        Register & Select
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

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
              placeholder="Enter the reason for this visit"
              maxLength={500}
              rows={3}
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
              disabled={
                submitting || loading || visitors.length === 0 || hosts.length === 0
              }
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CalendarClock size={14} />
                  Create Pre-Approval
                </>
              )}
            </button>
          </div>
        </form>

        {!loading && visitors.length === 0 && (
          <p style={{ color: "#b42318", fontSize: "12px" }}>
            No registered visitors were found. Add a visitor before creating a pre-approval.
          </p>
        )}

        {!loading && hosts.length === 0 && (
          <p style={{ color: "#b42318", fontSize: "12px" }}>
            No employees were found. Add a host before creating a pre-approval.
          </p>
        )}
      </section>

      <section className="table-card preapproval-table-card">
        <div className="table-toolbar">
          <div>
            <h2>{filterToday ? "Today's Expected Visitors" : "Expected Visitors"}</h2>
            <p>
              {filterToday
                ? `Approved requests scheduled for ${todayKey}.`
                : "Review scheduled visits and their approval status."}
            </p>
          </div>
          <Users size={20} color="#2563eb" />
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
                ? "No approved pre-approval requests are scheduled for today."
                : "No pre-approvals have been created yet."}
            </span>
            {filterToday && (
              <button
                type="button"
                className="back-button"
                onClick={onShowAll}
              >
                Show All Requests
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Host</th>
                  <th>Purpose</th>
                  <th>Expected Arrival</th>
                  <th>Expected Departure</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleApprovals.map((approval) => {
                  const currentStatus = String(approval.status || "")
                    .trim()
                    .toUpperCase();
                  const isActionLoading = actionLoading === approval.pre_approval_id;

                  const arrivalTimestamp = approval.expected_in_time
                    ? new Date(approval.expected_in_time).getTime()
                    : Number.NaN;

                  const canCheckIn =
                    Number.isFinite(arrivalTimestamp) &&
                    currentTime >= arrivalTimestamp;

                  return (
                    <tr key={approval.pre_approval_id}>
                      <td>
                        <strong>{getVisitorName(approval.visitor_id)}</strong>
                        <br />
                        <small>ID: {approval.visitor_id}</small>
                      </td>
                      <td>{getHostName(approval.host_employee_id)}</td>
                      <td>{approval.purpose}</td>
                      <td>{formatDateTime(approval.expected_in_time)}</td>
                      <td>{formatDateTime(approval.expected_out_time)}</td>
                      <td>
                        <span
                          style={{
                            ...getStatusStyle(currentStatus),
                            display: "inline-block",
                            padding: "5px 9px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {currentStatus || "UNKNOWN"}
                        </span>
                      </td>
                      <td>
                        {currentStatus === "PENDING" ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "7px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              className="primary-button"
                              style={{ background: "#039855" }}
                              disabled={isActionLoading}
                              onClick={() => handleDecision(approval, "approve")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="back-button"
                              style={{ color: "#b42318", borderColor: "#fecdca" }}
                              disabled={isActionLoading}
                              onClick={() => handleDecision(approval, "reject")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : currentStatus === "APPROVED" ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              gap: "6px",
                            }}
                          >
                            <button
                              type="button"
                              className="primary-button"
                              style={{
                                background: "#2563eb",
                                opacity: canCheckIn ? 1 : 0.55,
                                cursor: canCheckIn ? "pointer" : "not-allowed",
                              }}
                              disabled={isActionLoading || !canCheckIn}
                              onClick={() => handleCheckIn(approval)}
                            >
                              {isActionLoading ? (
                                <>
                                  <RefreshCw size={14} className="spin" />
                                  Checking In...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={14} />
                                  Check In
                                </>
                              )}
                            </button>

                            {!canCheckIn && (
                              <small
                                style={{
                                  color: "#b45309",
                                  fontSize: "11px",
                                  lineHeight: 1.4,
                                }}
                              >
                                {Number.isFinite(arrivalTimestamp)
                                  ? `Available at ${formatDateTime(approval.expected_in_time)}`
                                  : "Scheduled arrival time is missing or invalid."}
                              </small>
                            )}

                            {canCheckIn && (
                              <small
                                style={{
                                  color: "#027a48",
                                  fontSize: "11px",
                                }}
                              >
                                Check-in available
                              </small>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#98a2b3", fontSize: "12px" }}>
                            {currentStatus === "CHECKED_IN"
                              ? "Visitor checked in"
                              : "Decision recorded"}
                          </span>
                        )}
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