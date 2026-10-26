import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  LogOut,
  Search,
  QrCode,
  Clock,
  CalendarClock,
  Building2,
  Bell,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  UserPlus,
  History,
  Printer,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

import CreateVisit from "./CreateVisit";
import PreApprovals from "./PreApprovals";
import Login from "./Login";
import "./App.css";

/* =========================================================
   BACKEND API
========================================================= */
const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  /* =========================================================
     AUTHENTICATION STATE
  ========================================================= */
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("vms_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (err) {
      console.error("Unable to load stored user:", err);
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("vms_token") || null;
  });

  const [authChecked, setAuthChecked] = useState(false);

  const clearSession = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem("vms_user");
    localStorage.removeItem("vms_token");
  };

  const handleLoginSuccess = (accessToken, userData) => {
    setCurrentUser(userData);
    setToken(accessToken);
    localStorage.setItem("vms_user", JSON.stringify(userData));
    localStorage.setItem("vms_token", accessToken);
    setAuthChecked(true);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentPage("dashboard");
    setAuthChecked(true);
  };

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      if (!token) {
        if (!cancelled) {
          setCurrentUser(null);
          localStorage.removeItem("vms_user");
          setAuthChecked(true);
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("Your session has expired. Please sign in again.");
        }
        const userData = await response.json();
        if (!cancelled) {
          setCurrentUser(userData);
          localStorage.setItem("vms_user", JSON.stringify(userData));
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Session validation failed:", error);
          clearSession();
        }
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    };

    validateSession();
    return () => { cancelled = true; };
  }, [token]);

  /* =========================================================
     NAVIGATION & FILTER STATE
  ========================================================= */
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [preApprovalTodayOnly, setPreApprovalTodayOnly] = useState(false);

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */
  const [notifications, setNotifications] = useState(() => {
    try {
      const savedNotifications = localStorage.getItem("vms_notifications");
      if (savedNotifications) {
        return JSON.parse(savedNotifications);
      }
    } catch (error) {
      console.error("Unable to load notifications:", error);
    }

    return [
      {
        id: 1,
        title: "New Visitor Checked In",
        message: "A visitor has successfully checked in and is waiting for verification.",
        type: "visitor",
        time: "Just now",
        read: false,
      },
      {
        id: 2,
        title: "Visitor Checked Out",
        message: "Visitor checkout has been completed successfully.",
        type: "success",
        time: "10 minutes ago",
        read: false,
      },
      {
        id: 3,
        title: "Entry Rejected",
        message: "A visitor entry request was rejected by security.",
        type: "warning",
        time: "25 minutes ago",
        read: true,
      },
      {
        id: 4,
        title: "Expected Visitor",
        message: "An expected visitor is scheduled to arrive today.",
        type: "info",
        time: "1 hour ago",
        read: true,
      },
    ];
  });

  const [notificationFilter, setNotificationFilter] = useState("all");

  useEffect(() => {
    try {
      localStorage.setItem("vms_notifications", JSON.stringify(notifications));
    } catch (error) {
      console.error("Unable to save notifications:", error);
    }
  }, [notifications]);

  const markNotificationAsRead = (id) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: `${Date.now()}-${Math.random()}`,
      title: notification.title,
      message: notification.message,
      type: notification.type || "info",
      time: notification.time || "Just now",
      read: false,
    };
    setNotifications((previous) => [newNotification, ...previous]);
  };

  /* =========================================================
     VISIT VERIFICATION
  ========================================================= */
  const [visit, setVisit] = useState(null);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutReceipt, setCheckoutReceipt] = useState(null);

  // Checkout History
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [checkoutHistoryLoading, setCheckoutHistoryLoading] = useState(false);
  const [checkoutHistoryError, setCheckoutHistoryError] = useState("");
  const [checkoutHistorySearch, setCheckoutHistorySearch] = useState("");
  const [selectedHistoryVisit, setSelectedHistoryVisit] = useState(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");
  const [auditLogsSearch, setAuditLogsSearch] = useState("");
  const [auditLogsAction, setAuditLogsAction] = useState("ALL");
  const [auditLogsStartDate, setAuditLogsStartDate] = useState("");
  const [auditLogsEndDate, setAuditLogsEndDate] = useState("");
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsPageSize, setAuditLogsPageSize] = useState(10);
  const historyDetailsRef = useRef(null);

  // Visitor asset clearance
  const [visitAssets, setVisitAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState("");
  const [clearingAssetId, setClearingAssetId] = useState(null);

  /* =========================================================
     DASHBOARD
  ========================================================= */
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingAssetClearances, setPendingAssetClearances] = useState([]);
  const [pendingAssetsLoading, setPendingAssetsLoading] = useState(false);
  const [pendingAssetsError, setPendingAssetsError] = useState("");
  const [preApprovalRecords, setPreApprovalRecords] = useState([]);
  const [preApprovalsLoading, setPreApprovalsLoading] = useState(false);
  const [preApprovalsError, setPreApprovalsError] = useState("");
  const [preApprovalActionLoading, setPreApprovalActionLoading] = useState(null);
  const autoRefreshInProgressRef = useRef(false);

  /* =========================================================
     VISITORS DIRECTORY
  ========================================================= */
  const [visitorList, setVisitorList] = useState([]);
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [visitorError, setVisitorError] = useState("");
  const [visitorSearch, setVisitorSearch] = useState("");
  const [showAddVisitor, setShowAddVisitor] = useState(false);
  const [visitorCreateLoading, setVisitorCreateLoading] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    company_name: "",
  });

  /* =========================================================
     HOSTS DIRECTORY
  ========================================================= */
  const [hostList, setHostList] = useState([]);
  const [hostLoading, setHostLoading] = useState(false);
  const [hostError, setHostError] = useState("");
  const [hostSearch, setHostSearch] = useState("");
  const [showAddHost, setShowAddHost] = useState(false);
  const [hostCreating, setHostCreating] = useState(false);
  const [hostCreateError, setHostCreateError] = useState("");
  const [hostForm, setHostForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    department: "",
  });

  /* =========================================================
     SCANNER
  ========================================================= */
  const [scannerError, setScannerError] = useState("");
  const [scannerMessage, setScannerMessage] = useState(
    "Scan a visitor QR code to verify entry."
  );

  /* =========================================================
     FETCH CALLS
  ========================================================= */
  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError("");
      const response = await fetch(`${API_BASE_URL}/visits/dashboard`);
      if (!response.ok) throw new Error(`Dashboard request failed: ${response.status}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setDashboardData(null);
      setDashboardError(err.message || "Unable to fetch dashboard data");
    } finally {
      setDashboardLoading(false);
    }
  };

  // Load real pre-approval records from the existing FastAPI endpoint.
  const fetchPreApprovals = async () => {
    try {
      setPreApprovalsLoading(true);
      setPreApprovalsError("");
      const response = await fetch(`${API_BASE_URL}/pre-approvals/`);
      if (!response.ok) {
        throw new Error(`Pre-approvals request failed: ${response.status}`);
      }
      const data = await response.json();
      const records = Array.isArray(data)
        ? data
        : Array.isArray(data?.pre_approvals)
          ? data.pre_approvals
          : Array.isArray(data?.items)
            ? data.items
            : null;
      if (!records) {
        throw new Error("Unexpected pre-approvals response format");
      }
      setPreApprovalRecords(records);
    } catch (err) {
      console.error("Pre-approvals dashboard error:", err);
      setPreApprovalsError(
        err.message || "Unable to load pre-approvals. Check the backend."
      );
    } finally {
      setPreApprovalsLoading(false);
    }
  };

  // Allow security staff to approve or reject a pending request directly from the dashboard.
  const handleDashboardPreApprovalDecision = async (approval, action) => {
    const approvalId = approval?.pre_approval_id;
    if (!approvalId) {
      setPreApprovalsError("This pre-approval is missing its ID. Refresh and try again.");
      return;
    }

    const visitorName = getDashboardVisitorName(approval.visitor_id);
    const isApprove = action === "approve";
    const confirmed = window.confirm(
      `${isApprove ? "Approve" : "Reject"} the pre-approval for ${visitorName}?`
    );
    if (!confirmed) return;

    try {
      setPreApprovalActionLoading(approvalId);
      setPreApprovalsError("");

      const response = await fetch(
        `${API_BASE_URL}/pre-approvals/${approvalId}/${action}`,
        { method: "POST" }
      );
      let result = {};
      try {
        result = await response.json();
      } catch {
        // Keep a useful fallback for non-JSON responses.
      }

      if (!response.ok) {
        const detail = Array.isArray(result?.detail)
          ? result.detail.map((item) => item.msg).join(", ")
          : result?.detail;
        throw new Error(detail || `${isApprove ? "Approval" : "Rejection"} failed (${response.status})`);
      }

      const updatedStatus = String(result.status || (isApprove ? "APPROVED" : "REJECTED"))
        .trim()
        .toUpperCase();

      setPreApprovalRecords((previous) =>
        previous.map((item) =>
          String(item.pre_approval_id) === String(approvalId)
            ? { ...item, status: updatedStatus }
            : item
        )
      );

      addNotification({
        title: isApprove ? "Pre-Approval Approved" : "Pre-Approval Rejected",
        message: `${visitorName}'s pre-approval has been ${isApprove ? "approved" : "rejected"}.`,
        type: isApprove ? "success" : "warning",
        time: "Just now",
      });

      await fetchDashboard();
      await fetchPreApprovals();
    } catch (err) {
      console.error("Dashboard pre-approval decision error:", err);
      setPreApprovalsError(err.message || "Unable to update this pre-approval.");
    } finally {
      setPreApprovalActionLoading(null);
    }
  };

  // Count uncleared assets for active visits present in today's dashboard records.
  const fetchPendingAssetClearances = async (sourceData = dashboardData) => {
    const activeVisits = (sourceData?.visitors || []).filter(
      (item) => item.status === "ACTIVE" && item.visit_id
    );

    setPendingAssetsLoading(true);
    setPendingAssetsError("");

    try {
      const results = await Promise.all(
        activeVisits.map(async (item) => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/assets/?visit_id=${encodeURIComponent(item.visit_id)}`
            );
            if (!response.ok) {
              throw new Error(`Asset request failed (${response.status})`);
            }
            const assets = await response.json();
            if (!Array.isArray(assets)) {
              throw new Error("Unexpected asset response format");
            }

            return {
              visitorName: item.visitor_name || "Unknown Visitor",
              visitId: item.visit_id,
              assets: assets
                .filter((asset) => !asset.is_cleared_for_exit)
                .map((asset) => ({
                  ...asset,
                  visitorName: item.visitor_name || "Unknown Visitor",
                  visitId: item.visit_id,
                })),
            };
          } catch (error) {
            return { error: error.message || "Unable to load assets" };
          }
        })
      );

      const failed = results.filter((item) => item.error);
      const pending = results.flatMap((item) => item.assets || []);
      setPendingAssetClearances(pending);

      if (failed.length > 0) {
        setPendingAssetsError(
          `Could not verify assets for ${failed.length} active visit${failed.length === 1 ? "" : "s"}. Refresh and try again.`
        );
      }
    } finally {
      setPendingAssetsLoading(false);
    }
  };

  const fetchCheckoutHistory = async () => {
    try {
      setCheckoutHistoryLoading(true);
      setCheckoutHistoryError("");

      const response = await fetch(
        `${API_BASE_URL}/visits/checkouts/history?limit=100`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load checkout history (${response.status})`
        );
      }

      const data = await response.json();

      setCheckoutHistory(
        Array.isArray(data.checkouts) ? data.checkouts : []
      );
    } catch (err) {
      console.error("Checkout history error:", err);
      setCheckoutHistoryError(
        err.message || "Unable to load checkout history."
      );
    } finally {
      setCheckoutHistoryLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLogsLoading(true);
      setAuditLogsError("");

      const response = await fetch(
        `${API_BASE_URL}/audit-logs/?limit=500`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error(`Failed to load audit logs (${response.status})`);
      }

      const data = await response.json();

      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Audit logs error:", err);
      setAuditLogsError(err.message || "Unable to load audit logs.");
    } finally {
      setAuditLogsLoading(false);
    }
  };

  const fetchVisitors = async () => {
    try {
      setVisitorLoading(true);
      setVisitorError("");
      const response = await fetch(`${API_BASE_URL}/visitors/`);
      if (!response.ok) throw new Error(`Visitors request failed: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setVisitorList(data);
      } else if (Array.isArray(data?.visitors)) {
        setVisitorList(data.visitors);
      } else {
        setVisitorList([]);
      }
    } catch (err) {
      console.error("Visitors error:", err);
      setVisitorList([]);
      setVisitorError(err.message || "Unable to fetch visitors");
    } finally {
      setVisitorLoading(false);
    }
  };

  const fetchHosts = async () => {
    try {
      setHostLoading(true);
      setHostError("");
      const response = await fetch(`${API_BASE_URL}/employees/`);
      if (!response.ok) throw new Error(`Unable to fetch hosts: ${response.status}`);
      const data = await response.json();
      setHostList(data);
    } catch (err) {
      console.error("Hosts error:", err);
      setHostError(err.message || "Unable to load hosts. Make sure FastAPI is running.");
    } finally {
      setHostLoading(false);
    }
  };

  const createHost = async (event) => {
    event.preventDefault();
    try {
      setHostCreating(true);
      setHostCreateError("");
      const response = await fetch(`${API_BASE_URL}/employees/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hostForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to create host.");

      setHostForm({ first_name: "", last_name: "", email: "", department: "" });
      setShowAddHost(false);
      await fetchHosts();
    } catch (err) {
      console.error("Create host error:", err);
      setHostCreateError(err.message || "Unable to create host.");
    } finally {
      setHostCreating(false);
    }
  };

  const fetchVisit = async (visitId, notifyRejection = true) => {
    if (!visitId) {
      setError("Visit ID is missing.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setVisit(null);
      setDecision(null);
      setVisitAssets([]);
      setAssetsError("");
      setAssetsLoading(true);

      const visitResponse = await fetch(`${API_BASE_URL}/visits/security/${visitId}`);
      if (!visitResponse.ok) throw new Error(`Visitor verification failed: ${visitResponse.status}`);
      const visitData = await visitResponse.json();

      const decisionResponse = await fetch(`${API_BASE_URL}/visits/entry-decision/${visitId}`);
      if (!decisionResponse.ok) throw new Error(`Entry decision failed: ${decisionResponse.status}`);
      const decisionData = await decisionResponse.json();

      setVisit(visitData);
      setDecision(decisionData);

      try {
        const assetsResponse = await fetch(
          `${API_BASE_URL}/assets/?visit_id=${encodeURIComponent(visitId)}`
        );
        if (!assetsResponse.ok) {
          throw new Error(`Unable to load visitor assets: ${assetsResponse.status}`);
        }
        const assetsData = await assetsResponse.json();
        setVisitAssets(Array.isArray(assetsData) ? assetsData : []);
      } catch (assetError) {
        console.error("Fetch visitor assets error:", assetError);
        setAssetsError(assetError.message || "Unable to load visitor assets.");
      } finally {
        setAssetsLoading(false);
      }

      if (notifyRejection && decisionData?.decision === "REJECT") {
        const visitorName = visitData?.visitor
          ? `${visitData.visitor.first_name} ${visitData.visitor.last_name}`
          : "Visitor";

        addNotification({
          title: "Entry Rejected",
          message: `${visitorName}'s entry has been rejected. ${decisionData.reason}`,
          type: "warning",
          time: "Just now",
        });
      }
      await fetchDashboard();
    } catch (err) {
      console.error("Visit verification error:", err);
      setError(err.message || "Unable to verify visitor.");
      setVisit(null);
      setDecision(null);
    } finally {
      setAssetsLoading(false);
      setLoading(false);
    }
  };

  const handleClearAssetForExit = async (assetId) => {
    try {
      setClearingAssetId(assetId);
      setAssetsError("");

      const response = await fetch(
        `${API_BASE_URL}/assets/${assetId}/clear-for-exit`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to clear this asset for exit."
        );
      }

      setVisitAssets((previous) =>
        previous.map((asset) =>
          asset.asset_id === assetId
            ? {
                ...asset,
                is_cleared_for_exit:
                  data.is_cleared_for_exit ?? true,
                cleared_by: data.cleared_by ?? asset.cleared_by ?? null,
                cleared_at: data.cleared_at ?? asset.cleared_at ?? null,
              }
            : asset
        )
      );

      addNotification({
        title: "Asset Cleared for Exit",
        message: `${data.asset_type || "Visitor asset"} has been cleared for exit.`,
        type: "success",
        time: "Just now",
      });
    } catch (err) {
      console.error("Asset clearance error:", err);
      setAssetsError(err.message || "Unable to clear asset.");
    } finally {
      setClearingAssetId(null);
    }
  };

  const handleCheckout = async () => {
    if (!visit?.visit_id) {
      setError("No active visitor selected for checkout.");
      return;
    }
    if (visit.status !== "ACTIVE") {
      setError("This visitor is not currently active.");
      return;
    }
    if (assetsLoading) {
      setError("Please wait while registered assets are being verified.");
      return;
    }
    if (assetsError) {
      setError("Checkout is blocked because asset clearance could not be verified. Refresh the visitor details and try again.");
      return;
    }

    const visitorName = `${visit.visitor?.first_name || ""} ${
      visit.visitor?.last_name || ""
    }`.trim() || "this visitor";

    const pendingAssets = visitAssets.filter(
      (asset) => !asset.is_cleared_for_exit
    );

    if (pendingAssets.length > 0) {
      const pendingNames = pendingAssets
        .map((asset) => `${asset.asset_type || "Asset"}${asset.serial_number ? ` (${asset.serial_number})` : ""}`)
        .join(", ");
      setError(`Checkout blocked. Clear all registered assets before the visitor exits. Pending: ${pendingNames}`);
      return;
    }

    const assetStatus = "All registered assets are cleared for exit.";

    const confirmed = window.confirm(
      `Confirm visitor checkout?\n\n` +
      `Visitor: ${visitorName}\n` +
      `Current status: ${visit.status}\n` +
      `Asset clearance: ${assetStatus}\n\n` +
      `Do you want to proceed?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setCheckoutLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/visits/checkout/${visit.visit_id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let message = `Checkout failed: ${response.status}`;
        try {
          const data = await response.json();
          if (data?.detail) {
            message = typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail);
          }
        } catch {
          // ignore parsing error
        }
        throw new Error(message);
      }

      const checkoutTime = new Date().toISOString();

      setCheckoutReceipt({
        receiptNumber: `VMS-${Date.now()}`,
        visitId: visit.visit_id,
        visitorName,
        companyName: visit.visitor?.company_name || "Not specified",
        purpose: visit.purpose || "Not specified",
        hostName: `${visit.host_employee?.first_name || ""} ${
          visit.host_employee?.last_name || ""
        }`.trim() || "Not specified",
        checkInTime: visit.check_in_time || null,
        checkoutTime,
        assets: visitAssets.map((asset) => ({
          assetType: asset.asset_type,
          brandModel: asset.brand_model || "Not specified",
          serialNumber: asset.serial_number || "Not provided",
          cleared: Boolean(asset.is_cleared_for_exit),
          clearedBy: asset.cleared_by || "Not recorded",
          clearedAt: asset.cleared_at || null,
        })),
      });

      addNotification({
        title: "Visitor Checked Out",
        message: `${visitorName} has been checked out successfully.`,
        type: "success",
        time: "Just now",
      });

      await fetchVisit(visit.visit_id, false);
      await fetchDashboard();
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Unable to checkout visitor.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleVisitorInput = (event) => {
    const { name, value } = event.target;
    setNewVisitor((previous) => ({ ...previous, [name]: value }));
  };

  const createVisitor = async (event) => {
    event.preventDefault();
    if (!newVisitor.first_name.trim()) {
      setVisitorError("First name is required.");
      return;
    }

    try {
      setVisitorCreateLoading(true);
      setVisitorError("");

      const response = await fetch(`${API_BASE_URL}/visitors/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newVisitor.first_name.trim(),
          last_name: newVisitor.last_name.trim(),
          phone_number: newVisitor.phone_number.trim(),
          email: newVisitor.email.trim(),
          company_name: newVisitor.company_name.trim(),
        }),
      });

      if (!response.ok) {
        let message = `Unable to create visitor: ${response.status}`;
        try {
          const data = await response.json();
          if (data?.detail) {
            message = Array.isArray(data.detail)
              ? data.detail.map((item) => item.msg).join(", ")
              : data.detail;
          }
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      await response.json();
      setNewVisitor({
        first_name: "",
        last_name: "",
        phone_number: "",
        email: "",
        company_name: "",
      });
      setShowAddVisitor(false);
      await fetchVisitors();
    } catch (err) {
      console.error("Create visitor error:", err);
      setVisitorError(err.message || "Unable to create visitor.");
    } finally {
      setVisitorCreateLoading(false);
    }
  };

  /* =========================================================
     QR CODE EXTRACTION & SCANNER
  ========================================================= */
  const extractVisitId = (decodedText) => {
    if (!decodedText) return null;
    const value = decodedText.trim();
    const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
    const uuidMatch = value.match(uuidRegex);
    if (uuidMatch) return uuidMatch[0];

    try {
      const url = new URL(value);
      const parts = url.pathname.split("/").filter(Boolean);
      for (let i = parts.length - 1; i >= 0; i--) {
        if (uuidRegex.test(parts[i])) {
          const match = parts[i].match(uuidRegex);
          if (match) return match[0];
        }
      }
    } catch {
      // Not a valid URL
    }
    return null;
  };

  const openScanner = () => {
    setCurrentPage("scanner");
    setScannerError("");
    setScannerMessage("Scan a visitor QR code to verify entry.");
    setVisit(null);
    setDecision(null);
    setVisitAssets([]);
    setAssetsError("");
    setError("");
  };

  useEffect(() => {
    if (currentPage !== "scanner" || !currentUser) return;

    let scanner = null;
    const startScanner = async () => {
      try {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
          },
          false
        );

        scanner.render(
          async (decodedText) => {
            const visitId = extractVisitId(decodedText);
            if (!visitId) {
              setScannerError("Invalid QR code. No valid Visit ID was found.");
              return;
            }
            setScannerError("");
            setScannerMessage("QR detected. Verifying visitor...");

            try {
              await scanner.clear();
            } catch {
              // ignore
            }

            await fetchVisit(visitId);
            setScannerMessage("Visitor verification completed.");
          },
          () => {}
        );
      } catch (err) {
        console.error("Scanner initialization error:", err);
        setScannerError("Unable to start QR scanner. Please allow camera access.");
      }
    };

    startScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [currentPage, currentUser]);

  /* =========================================================
     LIFECYCLE HOOKS
  ========================================================= */
  useEffect(() => {
    if (!currentUser) return;
    fetchDashboard();
    fetchVisitors();
    fetchHosts();
    fetchPreApprovals();
  }, [currentUser]);

  // Automatically refresh dashboard-related records every 30 seconds while
  // the Dashboard is open and the browser tab is visible.
  useEffect(() => {
    if (!currentUser || currentPage !== "dashboard") return undefined;

    let isMounted = true;

    const refreshDashboardRecords = async () => {
      if (
        !isMounted ||
        document.visibilityState === "hidden" ||
        autoRefreshInProgressRef.current
      ) {
        return;
      }

      autoRefreshInProgressRef.current = true;
      try {
        await Promise.all([
          fetchDashboard(),
          fetchVisitors(),
          fetchPreApprovals(),
        ]);
        // Pending asset clearances refresh automatically when dashboardData changes.
      } finally {
        autoRefreshInProgressRef.current = false;
      }
    };

    const intervalId = window.setInterval(refreshDashboardRecords, 30000);
    window.addEventListener("focus", refreshDashboardRecords);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDashboardRecords);
    };
  }, [currentPage, currentUser]);

  useEffect(() => {
    if (dashboardData) {
      fetchPendingAssetClearances(dashboardData);
    } else {
      setPendingAssetClearances([]);
    }
  }, [dashboardData]);

  useEffect(() => {
    if (currentPage === "hosts" && currentUser) {
      fetchHosts();
    }
  }, [currentPage, currentUser]);

  useEffect(() => {
    if (currentPage === "checkout-history" && currentUser) {
      fetchCheckoutHistory();
    }
  }, [currentPage, currentUser]);

  useEffect(() => {
    if (selectedHistoryVisit && historyDetailsRef.current) {
      historyDetailsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedHistoryVisit]);

  /* =========================================================
     HELPERS & NAVIGATION
  ========================================================= */
  const formatTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name) => {
    if (!name) return "V";
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const statistics = dashboardData?.statistics || {};
  const visitorsToday = statistics.visitors_today ?? 0;
  const currentlyInside = statistics.currently_inside ?? 0;
  const expectedVisitors = statistics.expected_visitors ?? 0;
  const checkedOut = statistics.checked_out ?? 0;

  const visitors = dashboardData?.visitors || [];
  const localDateKey = (value) => {
    if (!value) return "";
    if (typeof value === "string") {
      const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const now = new Date();
  const todayDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const pendingPreApprovalCount = preApprovalRecords.filter(
    (item) => String(item.status || "").trim().toUpperCase() === "PENDING"
  ).length;
  const expectedTodayApprovals = preApprovalRecords
    .filter((item) => {
      const status = String(item.status || "").trim().toUpperCase();
      return (
        localDateKey(item.expected_in_time) === todayDateKey &&
        status !== "REJECTED" &&
        status !== "CHECKED_IN"
      );
    })
    .sort((a, b) => new Date(a.expected_in_time || 0) - new Date(b.expected_in_time || 0));
  const getDashboardVisitorName = (visitorId) => {
    const person = visitorList.find(
      (item) => String(item.visitor_id) === String(visitorId)
    );
    if (!person) return `Visitor #${visitorId ?? "—"}`;
    return `${person.first_name || ""} ${person.last_name || ""}`.trim() || `Visitor #${visitorId}`;
  };
  const getDashboardHostName = (employeeId) => {
    const host = hostList.find(
      (item) => String(item.employee_id) === String(employeeId)
    );
    if (!host) return employeeId ? `Employee #${employeeId}` : "—";
    return `${host.first_name || ""} ${host.last_name || ""}`.trim() || `Employee #${employeeId}`;
  };
  const filteredVisitors = visitors.filter((item) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    return (
      item.visitor_name?.toLowerCase().includes(search) ||
      item.company_name?.toLowerCase().includes(search) ||
      item.purpose?.toLowerCase().includes(search) ||
      item.host_name?.toLowerCase().includes(search) ||
      item.status?.toLowerCase().includes(search)
    );
  });

  const filteredDirectoryVisitors = visitorList.filter((item) => {
    const search = visitorSearch.trim().toLowerCase();
    if (!search) return true;
    const name = `${item.first_name || ""} ${item.last_name || ""}`.trim().toLowerCase();
    return (
      name.includes(search) ||
      item.company_name?.toLowerCase().includes(search) ||
      item.email?.toLowerCase().includes(search) ||
      item.phone_number?.toLowerCase().includes(search)
    );
  });

  const openDashboard = () => {
    setCurrentPage("dashboard");
    setError("");
    setVisit(null);
    setDecision(null);
    fetchDashboard();
  };

  const openVisitors = () => {
    setCurrentPage("visitors");
    setVisitorError("");
    fetchVisitors();
  };

  const openCheckout = () => {
    setCurrentPage("checkout");
  };

  const openCheckoutHistory = () => {
    setCurrentPage("checkout-history");
    fetchCheckoutHistory();
  };

  const openAuditLogs = () => {
    setCurrentPage("audit-logs");
    fetchAuditLogs();
  };

  const openCreateVisit = () => {
    setCurrentPage("create");
  };

  const openPreApprovals = (todayOnly = false) => {
    setPreApprovalTodayOnly(todayOnly);
    setCurrentPage("pre-approvals");
  };

  /* =========================================================
     PAGE RENDERERS
  ========================================================= */
  const renderNotifications = () => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    const filtered = notifications.filter((n) =>
      notificationFilter === "unread" ? !n.read : true
    );

    return (
      <>
        <div className="topbar">
          <div>
            <h2>Notifications</h2>
            <p>Stay updated with visitor management activities</p>
          </div>
          <div className="topbar-actions">
            <div className="system-status">
              <span className="status-dot"></span>
              System Online
            </div>
            <button
              className="icon-button"
              onClick={() => setCurrentPage("notifications")}
              style={{ position: "relative" }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                  }}
                ></span>
              )}
            </button>
          </div>
        </div>

        <section className="hero-card">
          <div>
            <span className="hero-label">NOTIFICATION CENTER</span>
            <h1>System Notifications</h1>
            <p>View important visitor, security and access updates.</p>
          </div>
          <div className="dashboard-actions">
            <strong style={{ fontSize: "18px" }}>{unreadCount} unread</strong>
          </div>
        </section>

        <section className="verification-card">
          <div
            className="verification-header"
            style={{
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2>Notifications</h2>
              <p>Manage your notification activity</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className={notificationFilter === "all" ? "checkout-button" : "back-button"}
                onClick={() => setNotificationFilter("all")}
              >
                All
              </button>
              <button
                className={notificationFilter === "unread" ? "checkout-button" : "back-button"}
                onClick={() => setNotificationFilter("unread")}
              >
                Unread
              </button>
              {unreadCount > 0 && (
                <button className="back-button" onClick={markAllNotificationsAsRead}>
                  Mark all as read
                </button>
              )}
              <button className="back-button" onClick={clearNotifications}>
                Clear all
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Bell size={24} />
              <span>No notifications available.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filtered.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markNotificationAsRead(notification.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "18px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    background: notification.read ? "#ffffff" : "#f0f7ff",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        notification.type === "success"
                          ? "#dcfce7"
                          : notification.type === "warning"
                          ? "#fef3c7"
                          : "#dbeafe",
                      color:
                        notification.type === "success"
                          ? "#16a34a"
                          : notification.type === "warning"
                          ? "#d97706"
                          : "#2563eb",
                    }}
                  >
                    {notification.type === "success" ? (
                      <CheckCircle2 size={21} />
                    ) : notification.type === "warning" ? (
                      <XCircle size={21} />
                    ) : (
                      <Bell size={21} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "5px",
                      }}
                    >
                      <strong>{notification.title}</strong>
                      {!notification.read && (
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: "#2563eb",
                          }}
                        />
                      )}
                    </div>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                      {notification.message}
                    </p>
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {notification.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  };

  const renderDashboard = () => {
    // These charts use the same live "today's visitors" records returned by the backend.
    const activeTodayCount = visitors.filter((item) => item.status === "ACTIVE").length;
    const checkedOutTodayCount = visitors.filter((item) => item.status === "CHECKED_OUT").length;
    const allowedTodayCount = visitors.filter((item) => item.decision === "ALLOW").length;
    const rejectedTodayCount = visitors.filter((item) => item.decision === "REJECT").length;
    const statusTotal = Math.max(activeTodayCount + checkedOutTodayCount, 1);
    const decisionTotal = Math.max(allowedTodayCount + rejectedTodayCount, 1);

    const displayName = currentUser?.first_name
      ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
      : "Security Guard";

    const renderDashboardBar = (label, count, total, color) => (
      <div key={label} style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "7px", fontSize: "12px" }}>
          <span style={{ color: "#475467", fontWeight: 600 }}>{label}</span>
          <strong style={{ color: "#101828" }}>{dashboardLoading ? "..." : count}</strong>
        </div>
        <div style={{ height: "9px", borderRadius: "999px", overflow: "hidden", background: "#eef2f6" }}>
          <div style={{ height: "100%", width: `${dashboardLoading ? 0 : (count / total) * 100}%`, background: color, borderRadius: "999px", transition: "width 250ms ease" }} />
        </div>
      </div>
    );

    return (
      <>
        <div className="topbar">
          <div>
            <h2>Security Dashboard</h2>
            <p>Monitor and manage visitor access</p>
          </div>
          <div className="topbar-actions">
            <div className="system-status">
              <span className="status-dot"></span>
              System Online
            </div>
            <button
              className="icon-button"
              title="Notifications"
              onClick={() => setCurrentPage("notifications")}
              style={{ position: "relative" }}
            >
              <Bell size={16} />
              {notifications.some((notif) => !notif.read) && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                  }}
                ></span>
              )}
            </button>
          </div>
        </div>

        <section className="hero-card">
          <div>
            <div className="hero-label">SECURITY CONTROL</div>
            <h1>Good evening, {displayName}</h1>
            <p>
              Keep track of visitor entries, verify QR codes and manage
              checkouts from one place.
            </p>
          </div>
          <div className="dashboard-actions">
            <button className="create-visit-button" onClick={openCreateVisit}>
              <UserPlus size={16} />
              Create Visit
            </button>
            <button className="hero-button scan-button" onClick={openScanner}>
              <QrCode size={16} />
              Scan Visitor QR
            </button>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Users size={18} />
            </div>
            <div className="stat-content">
              <span>Visitors Today</span>
              <strong>{dashboardLoading ? "..." : visitorsToday}</strong>
            </div>
            <ChevronRight size={15} color="#98a2b3" />
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <UserCheck size={18} />
            </div>
            <div className="stat-content">
              <span>Currently Inside</span>
              <strong>{dashboardLoading ? "..." : currentlyInside}</strong>
            </div>
            <ChevronRight size={15} color="#98a2b3" />
          </div>

          <div
            className="stat-card"
            role="button"
            tabIndex={0}
            aria-label="View today's expected visitors"
            style={{ cursor: "pointer" }}
            onClick={() => openPreApprovals(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPreApprovals(true);
              }
            }}
          >
            <div className="stat-icon amber">
              <Clock size={18} />
            </div>
            <div className="stat-content">
              <span>Expected Visitors</span>
              <strong>{dashboardLoading ? "..." : expectedVisitors}</strong>
            </div>
            <ChevronRight size={15} color="#98a2b3" />
          </div>

          <div
            className="stat-card"
            role="button"
            tabIndex={0}
            aria-label="View checkout history"
            style={{ cursor: "pointer" }}
            onClick={openCheckoutHistory}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCheckoutHistory();
              }
            }}
          >
            <div className="stat-icon purple">
              <LogOut size={18} />
            </div>
            <div className="stat-content">
              <span>Checked Out</span>
              <strong>{dashboardLoading ? "..." : checkedOut}</strong>
            </div>
            <ChevronRight size={15} color="#98a2b3" />
          </div>
        </section>

        <section
          aria-label="Today's visitor analytics"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "22px" }}
        >
          <div className="table-card" style={{ padding: "20px", minWidth: 0 }}>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ margin: "0 0 5px", fontSize: "16px" }}>Visit Status</h2>
              <p style={{ margin: 0, color: "#667085", fontSize: "12px" }}>Today's visitor records by current visit status</p>
            </div>
            {renderDashboardBar("Currently inside", activeTodayCount, statusTotal, "#16a34a")}
            {renderDashboardBar("Checked out", checkedOutTodayCount, statusTotal, "#7c3aed")}
            {!dashboardLoading && visitors.length === 0 && (
              <p style={{ margin: 0, color: "#667085", fontSize: "12px" }}>No visitor activity recorded today.</p>
            )}
          </div>

          <div className="table-card" style={{ padding: "20px", minWidth: 0 }}>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ margin: "0 0 5px", fontSize: "16px" }}>Entry Decisions</h2>
              <p style={{ margin: 0, color: "#667085", fontSize: "12px" }}>Allowed and rejected decisions in today's records</p>
            </div>
            {renderDashboardBar("Entry allowed", allowedTodayCount, decisionTotal, "#2563eb")}
            {renderDashboardBar("Entry rejected", rejectedTodayCount, decisionTotal, "#dc2626")}
            {!dashboardLoading && visitors.length > 0 && allowedTodayCount + rejectedTodayCount === 0 && (
              <p style={{ margin: 0, color: "#667085", fontSize: "12px" }}>No entry-decision data is available for today's records.</p>
            )}
          </div>
        </section>

        <section
          className="table-card"
          aria-label="Pending asset clearances"
          style={{ padding: "20px", marginBottom: "22px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "14px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 5px", fontSize: "16px" }}>
                Pending Asset Clearance
              </h2>
              <p style={{ margin: 0, color: "#667085", fontSize: "12px" }}>
                Uncleared assets linked to today's active visits
              </p>
            </div>
            <button
              type="button"
              className="refresh-button"
              onClick={() => fetchPendingAssetClearances()}
              disabled={pendingAssetsLoading}
            >
              <RefreshCw size={13} className={pendingAssetsLoading ? "spin" : ""} />
              Refresh
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 16px",
              borderRadius: "10px",
              border: `1px solid ${pendingAssetClearances.length > 0 ? "#fed7aa" : "#bbf7d0"}`,
              background: pendingAssetClearances.length > 0 ? "#fff7ed" : "#f0fdf4",
              marginBottom: pendingAssetClearances.length > 0 ? "14px" : 0,
            }}
          >
            {pendingAssetClearances.length > 0 ? (
              <AlertTriangle size={20} color="#c2410c" />
            ) : (
              <ShieldCheck size={20} color="#15803d" />
            )}
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: "14px" }}>
                {pendingAssetsLoading
                  ? "Checking asset clearances..."
                  : `${pendingAssetClearances.length} pending asset${pendingAssetClearances.length === 1 ? "" : "s"}`}
              </strong>
              <span style={{ color: "#667085", fontSize: "12px" }}>
                {pendingAssetClearances.length > 0
                  ? "These assets must be cleared before the related visitor can check out."
                  : "No pending asset clearances found in today's active visits."}
              </span>
            </div>
          </div>

          {pendingAssetsError && (
            <div className="error-banner" style={{ marginBottom: "12px" }}>
              <XCircle size={16} />
              {pendingAssetsError}
            </div>
          )}

          {!pendingAssetsLoading && pendingAssetClearances.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Asset</th>
                    <th>Brand / Model</th>
                    <th>Serial Number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAssetClearances.map((asset) => (
                    <tr key={asset.asset_id}>
                      <td>{asset.visitorName}</td>
                      <td>{asset.asset_type || "Asset"}</td>
                      <td>{asset.brand_model || "—"}</td>
                      <td>{asset.serial_number || "—"}</td>
                      <td>
                        <span
                          className="asset-clearance-status pending"
                          style={{ display: "inline-flex" }}
                        >
                          Pending Clearance
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>

        <section
          className="table-card"
          aria-label="Pending pre-approvals and expected visitors"
          style={{ padding: "20px", marginBottom: "22px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 5px", fontSize: "16px" }}>
                Pending Pre-Approvals
              </h2>
              <p style={{ margin: 0, color: "#667085", fontSize: "12px" }}>
                Requests awaiting a decision and visitors scheduled to arrive today
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="refresh-button"
                onClick={fetchPreApprovals}
                disabled={preApprovalsLoading}
              >
                <RefreshCw size={13} className={preApprovalsLoading ? "spin" : ""} />
                Refresh
              </button>
              <button
                type="button"
                className="back-button"
                onClick={() => openPreApprovals(false)}
              >
                View all requests <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div style={{ border: "1px solid #fed7aa", background: "#fff7ed", borderRadius: "10px", padding: "14px" }}>
              <div style={{ color: "#9a3412", fontSize: "12px", marginBottom: "5px" }}>Awaiting approval</div>
              <strong style={{ color: "#9a3412", fontSize: "24px" }}>
                {preApprovalsLoading ? "…" : pendingPreApprovalCount}
              </strong>
            </div>
            <div style={{ border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: "10px", padding: "14px" }}>
              <div style={{ color: "#1d4ed8", fontSize: "12px", marginBottom: "5px" }}>Expected today</div>
              <strong style={{ color: "#1d4ed8", fontSize: "24px" }}>
                {preApprovalsLoading ? "…" : expectedTodayApprovals.length}
              </strong>
            </div>
          </div>

          {preApprovalsError && (
            <div className="error-banner" style={{ marginBottom: "12px" }}>
              <XCircle size={16} />
              <div>
                <strong>Unable to load pre-approvals</strong>
                <div style={{ marginTop: "3px", fontSize: "11px" }}>{preApprovalsError}</div>
              </div>
            </div>
          )}

          {preApprovalsLoading ? (
            <div style={{ padding: "18px", color: "#667085", fontSize: "12px" }}>
              <RefreshCw size={14} className="spin" style={{ marginRight: "8px", verticalAlign: "middle" }} />
              Loading scheduled visitors…
            </div>
          ) : expectedTodayApprovals.length === 0 ? (
            <div style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", color: "#667085", fontSize: "12px" }}>
              No non-rejected pre-approvals are scheduled to arrive today.
            </div>
          ) : (
            <div className="table-wrap" style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Purpose</th>
                    <th>Expected Arrival</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expectedTodayApprovals.slice(0, 5).map((approval) => {
                    const status = String(approval.status || "PENDING").trim().toUpperCase();
                    const statusStyle = status === "APPROVED"
                      ? { background: "#ecfdf3", color: "#027a48" }
                      : status === "CHECKED_IN"
                        ? { background: "#eff8ff", color: "#175cd3" }
                        : { background: "#fff7ed", color: "#c2410c" };
                    return (
                      <tr key={approval.pre_approval_id || `${approval.visitor_id}-${approval.expected_in_time}`}>
                        <td>
                          <strong>{getDashboardVisitorName(approval.visitor_id)}</strong>
                          <br />
                          <small>Host: {getDashboardHostName(approval.host_employee_id)}</small>
                        </td>
                        <td>{approval.purpose || "—"}</td>
                        <td>{formatTime(approval.expected_in_time)}</td>
                        <td>
                          <span style={{ display: "inline-flex", padding: "4px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, background: statusStyle.background, color: statusStyle.color }}>
                            {status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td>
                          {status === "PENDING" ? (
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              <button
                                type="button"
                                className="primary-button"
                                style={{ background: "#039855", padding: "7px 10px", fontSize: "11px" }}
                                disabled={preApprovalActionLoading === approval.pre_approval_id}
                                onClick={() => handleDashboardPreApprovalDecision(approval, "approve")}
                              >
                                {preApprovalActionLoading === approval.pre_approval_id ? (
                                  <RefreshCw size={12} className="spin" />
                                ) : (
                                  <CheckCircle2 size={12} />
                                )}
                                Approve
                              </button>
                              <button
                                type="button"
                                className="back-button"
                                style={{ color: "#b42318", borderColor: "#fecdca", padding: "7px 10px", fontSize: "11px" }}
                                disabled={preApprovalActionLoading === approval.pre_approval_id}
                                onClick={() => handleDashboardPreApprovalDecision(approval, "reject")}
                              >
                                <XCircle size={12} />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "#98a2b3", fontSize: "11px" }}>
                              {status === "APPROVED" ? "Approved" : status === "CHECKED_IN" ? "Checked in" : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {expectedTodayApprovals.length > 5 && (
                <p style={{ color: "#667085", fontSize: "11px", margin: "10px 0 0" }}>
                  Showing 5 of {expectedTodayApprovals.length} scheduled visitors. Use View all requests to see the rest.
                </p>
              )}
            </div>
          )}
        </section>

        {dashboardError && (
          <div className="error-banner">
            <XCircle size={17} />
            <div>
              <strong>Unable to fetch dashboard data</strong>
              <div style={{ marginTop: "3px", fontSize: "11px" }}>{dashboardError}</div>
            </div>
          </div>
        )}

        <section className="table-card">
          <div className="table-toolbar">
            <div>
              <h2>Today's Visitors</h2>
              <p>
                {dashboardLoading
                  ? "Loading visitor records..."
                  : `${visitors.length} visitor record${
                      visitors.length === 1 ? "" : "s"
                    } found today`}
              </p>
            </div>
            <div className="search-field">
              <Search size={14} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search visitor..."
              />
            </div>
          </div>

          {dashboardLoading ? (
            <div className="empty-state">
              <RefreshCw className="spin" size={20} />
              Loading today's visitors...
            </div>
          ) : dashboardError ? (
            <div className="empty-state">
              <XCircle size={20} />
              Unable to fetch dashboard data
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="empty-state">
              <Users size={22} />
              No visitors match your search.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Purpose</th>
                    <th>Host</th>
                    <th>Company</th>
                    <th>Check In</th>
                    <th>Status</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map((item) => (
                    <tr key={item.visit_id}>
                      <td>
                        <div className="visitor-cell">
                          <div className="visitor-avatar">
                            {getInitials(item.visitor_name)}
                          </div>
                          <div>
                            <strong>{item.visitor_name || "Unknown Visitor"}</strong>
                            <span>Visitor ID: {item.visitor_id}</span>
                          </div>
                        </div>
                      </td>
                      <td>{item.purpose || "—"}</td>
                      <td>{item.host_name || "—"}</td>
                      <td>{item.company_name || "—"}</td>
                      <td>{formatTime(item.check_in_time)}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            item.status === "ACTIVE" ? "active" : "checked"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "4px 8px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background:
                              item.decision === "ALLOW" ? "#ecfdf3" : "#fef3f2",
                            color:
                              item.decision === "ALLOW" ? "#039855" : "#b42318",
                          }}
                        >
                          {item.decision}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="quick-section">
          <div>
            <h2>Quick Actions</h2>
            <p>Common security operations</p>
          </div>
          <div className="quick-grid">
            <button className="quick-card" onClick={openScanner}>
              <div className="quick-icon blue-icon">
                <QrCode size={18} />
              </div>
              <div>
                <strong>Scan QR Code</strong>
                <span>Verify visitor entry</span>
              </div>
              <ChevronRight size={16} />
            </button>
            <button className="quick-card" onClick={openCreateVisit}>
              <div className="quick-icon green-icon">
                <UserPlus size={18} />
              </div>
              <div>
                <strong>Create Visit</strong>
                <span>Register a new visit</span>
              </div>
              <ChevronRight size={16} />
            </button>
            <button
              className="quick-card"
              onClick={openCheckout}
              disabled={!visit || visit.status !== "ACTIVE"}
            >
              <div className="quick-icon amber-icon">
                <UserX size={18} />
              </div>
              <div>
                <strong>Checkout</strong>
                <span>Process visitor exit</span>
              </div>
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </>
    );
  };

  const renderScanner = () => {
    return (
      <>
        <div className="topbar">
          <div>
            <h2>Scan Visitor</h2>
            <p>Verify visitor entry using QR code</p>
          </div>
          <button className="back-button" onClick={openDashboard}>
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        <section className="verification-card">
          <div className="section-header">
            <div>
              <h2>QR Code Scanner</h2>
              <p>Scan the visitor QR code using the security camera.</p>
            </div>
          </div>
          <div className="scanner-container">
            <div id="qr-reader" className="qr-reader"></div>
            <p>{scannerMessage}</p>
            {scannerError && (
              <div className="error-banner">
                <XCircle size={16} />
                {scannerError}
              </div>
            )}
          </div>
        </section>

        {loading && (
          <section className="verification-card">
            <div className="verification-loading">
              <RefreshCw size={20} className="spin" />
              Verifying visitor...
            </div>
          </section>
        )}

        {error && !loading && (
          <section className="verification-card">
            <div className="error-banner">
              <XCircle size={17} />
              {error}
            </div>
          </section>
        )}

        {visit && !loading && (
          <>
            <section className="verification-card">
              <div className="section-header">
                <div>
                  <h2>Security Verification</h2>
                  <p>Live visitor verification from VMS backend</p>
                </div>
                <button
                  className="refresh-button"
                  onClick={() => fetchVisit(visit.visit_id)}
                >
                  <RefreshCw size={13} />
                  Refresh
                </button>
              </div>

              {decision && (
                <div
                  className={`decision-banner ${
                    decision.decision === "ALLOW" ? "allow" : "reject"
                  }`}
                >
                  {decision.decision === "ALLOW" ? (
                    <CheckCircle2 size={19} />
                  ) : (
                    <XCircle size={19} />
                  )}
                  <div>
                    <strong>
                      {decision.decision === "ALLOW"
                        ? "ENTRY ALLOWED"
                        : "ENTRY REJECTED"}
                    </strong>
                    <div style={{ fontSize: "11px", marginTop: "3px" }}>
                      {decision.reason}
                    </div>
                  </div>
                </div>
              )}

              <div className="visitor-verification">
                <div className="verification-avatar">
                  {getInitials(
                    `${visit.visitor?.first_name || ""} ${
                      visit.visitor?.last_name || ""
                    }`
                  )}
                </div>
                <div className="verification-info">
                  <strong>
                    {visit.visitor?.first_name} {visit.visitor?.last_name}
                  </strong>
                  <span>{visit.visitor?.company_name || "No company"}</span>
                </div>
                <div>
                  <small>HOST</small>
                  <strong>
                    {visit.host_employee?.first_name}{" "}
                    {visit.host_employee?.last_name}
                  </strong>
                </div>
                <div>
                  <small>DEPARTMENT</small>
                  <strong>{visit.host_employee?.department || "—"}</strong>
                </div>
                <div>
                  <small>PURPOSE</small>
                  <strong>{visit.purpose || "—"}</strong>
                </div>
                <div>
                  <small>STATUS</small>
                  <strong>{visit.status}</strong>
                </div>

                {visit.status === "ACTIVE" ? (
                  <button
                    className="checkout-button"
                    onClick={handleCheckout}
                    disabled={checkoutLoading || assetsLoading}
                    title={
                      visitAssets.some((asset) => !asset.is_cleared_for_exit)
                        ? "Clear all registered assets before checkout"
                        : undefined
                    }
                  >
                    {checkoutLoading ? (
                      <RefreshCw size={12} className="spin" />
                    ) : (
                      <LogOut size={12} />
                    )}
                    {checkoutLoading ? "Processing..." : "Checkout"}
                  </button>
                ) : (
                  <span className="checked-message">
                    <CheckCircle2 size={13} />
                    Visitor has been checked out.
                  </span>
                )}
              </div>
            </section>

            <section className="verification-card asset-clearance-card">
              <div className="section-header">
                <div>
                  <h2>Visitor Asset Clearance</h2>
                  <p>Review and clear registered assets before checkout.</p>
                </div>
                <button
                  type="button"
                  className="refresh-button"
                  onClick={() => fetchVisit(visit.visit_id, false)}
                  disabled={assetsLoading}
                >
                  <RefreshCw size={13} className={assetsLoading ? "spin" : ""} />
                  Refresh
                </button>
              </div>

              {assetsError && (
                <div className="error-banner">
                  <XCircle size={16} />
                  {assetsError}
                </div>
              )}

              {assetsLoading ? (
                <div className="empty-state">
                  <RefreshCw size={20} className="spin" />
                  Loading visitor assets...
                </div>
              ) : visitAssets.length === 0 ? (
                <div className="empty-state">
                  <ShieldCheck size={22} />
                  No registered assets for this visit.
                </div>
              ) : (
                <div className="security-assets-list">
                  {visitAssets.map((asset) => (
                    <div className="security-asset-row" key={asset.asset_id}>
                      <div className="security-asset-details">
                        <strong>{asset.asset_type}</strong>

                        <span>{asset.brand_model || "Model not specified"}</span>

                        <small>
                          Serial number: {asset.serial_number || "Not provided"}
                        </small>

                        {asset.is_cleared_for_exit && (
                          <div
                            style={{
                              marginTop: "8px",
                              padding: "10px",
                              borderRadius: "8px",
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              color: "#166534",
                            }}
                          >
                            <div style={{ fontSize: "12px", fontWeight: 600 }}>
                              Security Clearance Audit
                            </div>

                            <div style={{ marginTop: "5px", fontSize: "12px" }}>
                              Cleared by: {asset.cleared_by || "Not recorded"}
                            </div>

                            <div style={{ marginTop: "4px", fontSize: "12px" }}>
                              Cleared at:{" "}
                              {asset.cleared_at
                                ? new Date(asset.cleared_at).toLocaleString()
                                : "Not recorded"}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="security-asset-actions">
                        <span
                          className={`asset-clearance-status ${
                            asset.is_cleared_for_exit ? "cleared" : "pending"
                          }`}
                        >
                          {asset.is_cleared_for_exit ? "Cleared for Exit" : "Pending Clearance"}
                        </span>
                        {!asset.is_cleared_for_exit && (
                          <button
                            type="button"
                            className="checkout-button"
                            onClick={() => handleClearAssetForExit(asset.asset_id)}
                            disabled={clearingAssetId !== null}
                          >
                            {clearingAssetId === asset.asset_id ? (
                              <RefreshCw size={13} className="spin" />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            {clearingAssetId === asset.asset_id ? "Clearing..." : "Clear for Exit"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </>
    );
  };

  const renderVisitors = () => {
    const totalVisitors = Array.isArray(visitorList) ? visitorList.length : 0;
    const filteredVisitorsList = Array.isArray(filteredDirectoryVisitors)
      ? filteredDirectoryVisitors
      : [];
    const companyCount = new Set(
      visitorList.map((item) => item.company_name).filter(Boolean)
    ).size;

    return (
      <>
        <div className="topbar">
          <div>
            <h2>Visitors</h2>
            <p>Manage and view all registered visitors</p>
          </div>
          <div className="topbar-actions">
            <div className="system-status">
              <span className="status-dot"></span>
              System Online
            </div>
            <button
              className="primary-button"
              onClick={() => {
                setShowAddVisitor(!showAddVisitor);
                setVisitorError("");
              }}
            >
              <UserPlus size={14} />
              {showAddVisitor ? "Close Form" : "Add Visitor"}
            </button>
          </div>
        </div>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Users size={18} />
            </div>
            <div className="stat-content">
              <span>Total Visitors</span>
              <strong>{totalVisitors}</strong>
            </div>
            <ChevronRight size={15} color="#98a2b3" />
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <UserCheck size={18} />
            </div>
            <div className="stat-content">
              <span>Currently Inside</span>
              <strong>{totalVisitors}</strong>
            </div>
            <ChevronRight size={15} color="#98a2b3" />
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Building2 size={18} />
            </div>
            <div className="stat-content">
              <span>Companies</span>
              <strong>{companyCount}</strong>
            </div>
            <ChevronRight size={15} color="#98a2b3" />
          </div>

          <div className="stat-card">
            <div className="stat-icon amber">
              <ShieldCheck size={18} />
            </div>
            <div className="stat-content">
              <span>Directory Status</span>
              <strong>ACTIVE</strong>
            </div>
            <ChevronRight size={15} color="#98a2b3" />
          </div>
        </section>

        {showAddVisitor && (
          <section className="page-card visitor-create-card">
            <div className="section-header">
              <div>
                <h2>Add New Visitor</h2>
                <p>Register a visitor in the VMS directory.</p>
              </div>
            </div>
            <form className="visitor-form" onSubmit={createVisitor}>
              <div className="form-field">
                <label>
                  First Name <span>*</span>
                </label>
                <input
                  name="first_name"
                  value={newVisitor.first_name}
                  onChange={handleVisitorInput}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="form-field">
                <label>Last Name</label>
                <input
                  name="last_name"
                  value={newVisitor.last_name}
                  onChange={handleVisitorInput}
                  placeholder="Enter last name"
                />
              </div>
              <div className="form-field">
                <label>Phone Number</label>
                <input
                  name="phone_number"
                  value={newVisitor.phone_number}
                  onChange={handleVisitorInput}
                  placeholder="Enter phone number"
                  type="tel"
                />
              </div>
              <div className="form-field">
                <label>Email Address</label>
                <input
                  name="email"
                  value={newVisitor.email}
                  onChange={handleVisitorInput}
                  placeholder="Enter email address"
                  type="email"
                />
              </div>
              <div className="form-field form-field-full">
                <label>Company Name</label>
                <input
                  name="company_name"
                  value={newVisitor.company_name}
                  onChange={handleVisitorInput}
                  placeholder="Enter company name"
                />
              </div>
              <div className="visitor-form-actions">
                <button
                  type="button"
                  className="back-button"
                  onClick={() => {
                    setShowAddVisitor(false);
                    setVisitorError("");
                  }}
                >
                  <XCircle size={14} />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={visitorCreateLoading}
                >
                  {visitorCreateLoading ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      Create Visitor
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {visitorError && (
          <div className="error-banner">
            <XCircle size={17} />
            <div>
              <strong>Visitor operation failed</strong>
              <div style={{ marginTop: "3px", fontSize: "11px" }}>{visitorError}</div>
            </div>
          </div>
        )}

        <section className="table-card">
          <div className="table-toolbar">
            <div>
              <h2>Visitor Directory</h2>
              <p>
                {visitorLoading
                  ? "Loading visitor records..."
                  : `${filteredVisitorsList.length} visitor${
                      filteredVisitorsList.length === 1 ? "" : "s"
                    } found`}
              </p>
            </div>
            <div className="visitor-toolbar-actions">
              <div className="search-field">
                <Search size={14} />
                <input
                  value={visitorSearch}
                  onChange={(event) => setVisitorSearch(event.target.value)}
                  placeholder="Search visitors..."
                />
              </div>
              <button
                className="refresh-button"
                onClick={fetchVisitors}
                disabled={visitorLoading}
                title="Refresh visitors"
              >
                <RefreshCw
                  size={14}
                  className={visitorLoading ? "spin" : ""}
                />
              </button>
            </div>
          </div>

          {visitorLoading ? (
            <div className="empty-state">
              <RefreshCw size={20} className="spin" />
              Loading visitors...
            </div>
          ) : filteredVisitorsList.length === 0 ? (
            <div
              className="empty-state"
              style={{ flexDirection: "column", minHeight: "230px" }}
            >
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
                No visitors found
              </strong>
              <span style={{ color: "#98a2b3", fontSize: "12px", marginBottom: "12px" }}>
                Try a different search or add a new visitor.
              </span>
              <button
                className="primary-button"
                onClick={() => setShowAddVisitor(true)}
              >
                <UserPlus size={14} />
                Add Visitor
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Visitor ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitorsList.map((item) => {
                    const name = `${item.first_name || ""} ${item.last_name || ""}`.trim();
                    return (
                      <tr key={item.visitor_id}>
                        <td>
                          <div className="visitor-cell">
                            <div className="visitor-avatar">
                              {getInitials(name || "Visitor")}
                            </div>
                            <div>
                              <strong>{name || "Unknown Visitor"}</strong>
                              <span>Registered visitor</span>
                            </div>
                          </div>
                        </td>
                        <td>{item.phone_number || "—"}</td>
                        <td>{item.email || "—"}</td>
                        <td>
                          <div className="company-cell">
                            <Building2 size={13} />
                            <span>{item.company_name || "—"}</span>
                          </div>
                        </td>
                        <td>
                          <span className="visitor-id-badge">#{item.visitor_id}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div
          className="visitor-security-note"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            marginTop: "12px",
            color: "#98a2b3",
            fontSize: "12px",
          }}
        >
          <ShieldCheck size={14} color="#12b76a" />
          Visitor information is stored securely in the VMS database.
        </div>
      </>
    );
  };

  const renderCheckout = () => {
    const pendingAssets = visitAssets.filter(
      (asset) => !asset.is_cleared_for_exit
    );

    return (
      <>
        <div className="topbar">
          <div>
            <h2>Checkout</h2>
            <p>Process visitor exit</p>
          </div>
          <button className="back-button" onClick={openDashboard}>
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        {error && !loading && (
          <div className="error-banner">
            <XCircle size={17} />
            <div>
              <strong>Checkout requires attention</strong>
              <div style={{ marginTop: "3px", fontSize: "12px" }}>{error}</div>
            </div>
          </div>
        )}

        <section className="page-card">
          {!visit ? (
            <div className="checkout-empty">
              <UserX size={30} />
              <strong>No visitor selected</strong>
              <p>Scan a visitor QR code first.</p>
              <button className="primary-button" onClick={openScanner}>
                <QrCode size={14} />
                Scan Visitor QR
              </button>
            </div>
          ) : (
            <div className="checkout-panel">
              <div className="verification-avatar">
                {getInitials(
                  `${visit.visitor?.first_name || ""} ${
                    visit.visitor?.last_name || ""
                  }`
                )}
              </div>
              <div>
                <h3>
                  {visit.visitor?.first_name} {visit.visitor?.last_name}
                </h3>
                <p>{visit.visitor?.company_name || "No company"}</p>
              </div>
              <div className="checkout-details">
                <span>STATUS</span>
                <strong>{visit.status}</strong>
              </div>
              <div className="checkout-details">
                <span>PURPOSE</span>
                <strong>{visit.purpose || "—"}</strong>
              </div>

              {visit.status === "ACTIVE" ? (
                <button
                  className="checkout-button"
                  onClick={handleCheckout}
                  disabled={
                    checkoutLoading ||
                    assetsLoading ||
                    Boolean(assetsError) ||
                    pendingAssets.length > 0
                  }
                  title={
                    pendingAssets.length > 0
                      ? "Clear all registered assets below before checkout"
                      : assetsError
                      ? "Asset clearance could not be verified"
                      : undefined
                  }
                >
                  {checkoutLoading ? (
                    <RefreshCw size={12} className="spin" />
                  ) : (
                    <LogOut size={12} />
                  )}
                  {checkoutLoading ? "Processing..." : "Checkout Visitor"}
                </button>
              ) : (
                <span className="checked-message">
                  <CheckCircle2 size={14} />
                  Checked Out
                </span>
              )}
            </div>
          )}
        </section>

        {visit && (
          <section className="verification-card asset-clearance-card">
            <div className="section-header">
              <div>
                <h2>Visitor Asset Clearance</h2>
                <p>Security must clear every registered asset before checkout.</p>
              </div>
              <button
                type="button"
                className="refresh-button"
                onClick={() => fetchVisit(visit.visit_id, false)}
                disabled={assetsLoading}
              >
                <RefreshCw size={13} className={assetsLoading ? "spin" : ""} />
                Refresh
              </button>
            </div>

            {pendingAssets.length > 0 && (
              <div className="error-banner">
                <ShieldCheck size={17} />
                <div>
                  <strong>Checkout blocked — clearance pending</strong>
                  <div style={{ marginTop: "3px", fontSize: "12px" }}>
                    {pendingAssets.length} asset(s) must be cleared before the visitor can exit.
                  </div>
                </div>
              </div>
            )}

            {assetsError && (
              <div className="error-banner">
                <XCircle size={16} />
                <div>
                  <strong>Unable to verify assets</strong>
                  <div style={{ marginTop: "3px", fontSize: "12px" }}>{assetsError}</div>
                </div>
              </div>
            )}

            {assetsLoading ? (
              <div className="empty-state">
                <RefreshCw size={20} className="spin" />
                Loading visitor assets...
              </div>
            ) : visitAssets.length === 0 ? (
              <div className="empty-state">
                <ShieldCheck size={22} />
                No registered assets for this visit.
              </div>
            ) : (
              <div className="security-assets-list">
                {visitAssets.map((asset) => (
                  <div className="security-asset-row" key={asset.asset_id}>
                    <div className="security-asset-details">
                      <strong>{asset.asset_type || "Unspecified asset"}</strong>
                      <span>{asset.brand_model || "Model not specified"}</span>
                      <small>
                        Serial number: {asset.serial_number || "Not provided"}
                      </small>

                      {asset.is_cleared_for_exit && (
                        <div
                          style={{
                            marginTop: "8px",
                            padding: "10px",
                            borderRadius: "8px",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#166534",
                          }}
                        >
                          <div style={{ fontSize: "12px", fontWeight: 600 }}>
                            Security Clearance Audit
                          </div>
                          <div style={{ marginTop: "5px", fontSize: "12px" }}>
                            Cleared by: {asset.cleared_by || "Not recorded"}
                          </div>
                          <div style={{ marginTop: "4px", fontSize: "12px" }}>
                            Cleared at:{" "}
                            {asset.cleared_at
                              ? new Date(asset.cleared_at).toLocaleString()
                              : "Not recorded"}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="security-asset-actions">
                      <span
                        className={`asset-clearance-status ${
                          asset.is_cleared_for_exit ? "cleared" : "pending"
                        }`}
                      >
                        {asset.is_cleared_for_exit ? "Cleared for Exit" : "Pending Clearance"}
                      </span>
                      {!asset.is_cleared_for_exit && (
                        <button
                          type="button"
                          className="checkout-button"
                          onClick={() => handleClearAssetForExit(asset.asset_id)}
                          disabled={clearingAssetId !== null || assetsLoading}
                        >
                          {clearingAssetId === asset.asset_id ? (
                            <RefreshCw size={13} className="spin" />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          {clearingAssetId === asset.asset_id ? "Clearing..." : "Clear for Exit"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {checkoutReceipt && renderCheckoutReceipt()}
      </>
    );
  };

  const renderCheckoutHistory = () => {
    const query = checkoutHistorySearch.trim().toLowerCase();

    const filteredHistory = checkoutHistory.filter((item) => {
      const visitor = item.visitor || {};
      const host = item.host_employee || {};

      const visitorName =
        `${visitor.first_name || ""} ${visitor.last_name || ""}`.trim();

      const hostName =
        `${host.first_name || ""} ${host.last_name || ""}`.trim();

      const searchableFields = [
        visitorName,
        visitor.company_name,
        visitor.phone_number,
        visitor.email,
        hostName,
        host.department,
        item.visit_id,
        item.purpose,
        ...(item.assets || []).flatMap((asset) => [
          asset.asset_type,
          asset.brand_model,
          asset.serial_number,
        ]),
      ];

      return searchableFields.some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    });

    const formatDate = (value) => {
      if (!value) return "Not recorded";
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? "Not recorded"
        : date.toLocaleString();
    };

    return (
      <div className="checkout-history-page">
        <div className="topbar">
          <div>
            <h2>Checkout History</h2>
            <p>Search previous visits and review complete checkout records.</p>
          </div>
          <button
            className="back-button"
            onClick={openDashboard}
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        <section className="page-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 5px" }}>
                Previous Checkouts
              </h3>
              <p style={{ margin: 0, color: "#667085" }}>
                {filteredHistory.length} record(s) found
              </p>
            </div>

            <button
              className="back-button"
              onClick={fetchCheckoutHistory}
              disabled={checkoutHistoryLoading}
            >
              <RefreshCw
                size={14}
                className={checkoutHistoryLoading ? "spin" : ""}
              />
              Refresh
            </button>
          </div>

          <input
            type="text"
            value={checkoutHistorySearch}
            onChange={(event) =>
              setCheckoutHistorySearch(event.target.value)
            }
            placeholder="Search visitor, company, visit ID, host or asset serial..."
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid #d0d5dd",
              borderRadius: "9px",
              marginBottom: "18px",
              boxSizing: "border-box",
            }}
          />

          {checkoutHistoryLoading ? (
            <p>Loading checkout history...</p>
          ) : checkoutHistoryError ? (
            <p style={{ color: "#b42318" }}>
              {checkoutHistoryError}
            </p>
          ) : filteredHistory.length === 0 ? (
            <p>No checkout records match your search.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[
                      "Visitor",
                      "Company",
                      "Host",
                      "Check-in",
                      "Checkout",
                      "Assets",
                      "Details",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #e5e7eb",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredHistory.map((item) => {
                    const visitor = item.visitor || {};
                    const host = item.host_employee || {};

                    return (
                      <tr key={item.visit_id}>
                        <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                          <strong>
                            {visitor.first_name || ""}{" "}
                            {visitor.last_name || ""}
                          </strong>
                          <div style={{ fontSize: "12px", color: "#667085" }}>
                            {visitor.phone_number || "No phone"}
                          </div>
                        </td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                          {visitor.company_name || "Not specified"}
                        </td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                          {`${host.first_name || ""} ${host.last_name || ""}`.trim() || "Not recorded"}
                        </td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
                          {formatDate(item.check_in_time)}
                        </td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
                          {formatDate(item.check_out_time)}
                        </td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                          {(item.assets || []).length}
                        </td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                          <button
                            type="button"
                            className="back-button"
                            onClick={() => setSelectedHistoryVisit(item)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedHistoryVisit && (
          <section
            ref={historyDetailsRef}
            className="page-card checkout-history-details"
            style={{
              marginTop: "20px",
              scrollMarginTop: "24px",
              maxWidth: "1100px",
              width: "100%",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <div>
                <h3 style={{ marginTop: 0 }}>Checkout Details</h3>
                <p>Visit ID: {selectedHistoryVisit.visit_id}</p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="back-button"
                  onClick={() => setSelectedHistoryVisit(null)}
                >
                  Close Details
                </button>

                <button
                  type="button"
                  className="back-button"
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  Print / Save as PDF
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "14px",
                marginTop: "20px",
                marginBottom: "20px",
                width: "100%",
              }}
            >
              <div style={{ padding: "18px", border: "1px solid #dbeafe", borderRadius: "12px", background: "#eff6ff" }}>
                <div style={{ color: "#1d4ed8", fontSize: "12px", fontWeight: 600 }}>VISITOR</div>
                <h3 style={{ margin: "8px 0" }}>
                  {`${selectedHistoryVisit.visitor?.first_name || ""} ${selectedHistoryVisit.visitor?.last_name || ""}`.trim() || "Unknown"}
                </h3>
                <div style={{ fontSize: "12px", color: "#475467" }}>
                  {selectedHistoryVisit.visitor?.company_name || "No company specified"}
                </div>
              </div>

              <div style={{ padding: "18px", border: "1px solid #d1fae5", borderRadius: "12px", background: "#ecfdf3" }}>
                <div style={{ color: "#047857", fontSize: "12px", fontWeight: 600 }}>HOST</div>
                <h3 style={{ margin: "8px 0" }}>
                  {`${selectedHistoryVisit.host_employee?.first_name || ""} ${selectedHistoryVisit.host_employee?.last_name || ""}`.trim() || "Not recorded"}
                </h3>
                <div style={{ fontSize: "12px", color: "#475467" }}>
                  {selectedHistoryVisit.host_employee?.department || "Department not recorded"}
                </div>
              </div>

              <div style={{ padding: "18px", border: "1px solid #e9d5ff", borderRadius: "12px", background: "#faf5ff" }}>
                <div style={{ color: "#7e22ce", fontSize: "12px", fontWeight: 600 }}>VISITOR DURATION</div>
                <h3 style={{ margin: "8px 0" }}>
                  {(() => {
                    const start = selectedHistoryVisit.check_in_time
                      ? new Date(selectedHistoryVisit.check_in_time).getTime()
                      : NaN;
                    const end = selectedHistoryVisit.check_out_time
                      ? new Date(selectedHistoryVisit.check_out_time).getTime()
                      : NaN;

                    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
                      return "Not available";
                    }

                    const minutes = Math.floor((end - start) / 60000);
                    const hours = Math.floor(minutes / 60);
                    const remainingMinutes = minutes % 60;

                    return hours > 0
                      ? `${hours}h ${remainingMinutes}m`
                      : `${remainingMinutes} min`;
                  })()}
                </h3>
                <div style={{ fontSize: "12px", color: "#475467" }}>
                  Check-in to checkout
                </div>
              </div>

              <div style={{ padding: "18px", border: "1px solid #fed7aa", borderRadius: "12px", background: "#fff7ed" }}>
                <div style={{ color: "#c2410c", fontSize: "12px", fontWeight: 600 }}>REGISTERED ASSETS</div>
                <h3 style={{ margin: "8px 0" }}>
                  {(selectedHistoryVisit.assets || []).length}
                </h3>
                <div style={{ fontSize: "12px", color: "#475467" }}>
                  {(selectedHistoryVisit.assets || []).filter(
                    (asset) => asset.is_cleared_for_exit
                  ).length} cleared for exit
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
              <span
                style={{
                  padding: "7px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: selectedHistoryVisit.status === "CHECKED_OUT" ? "#dcfce7" : "#fef3c7",
                  color: selectedHistoryVisit.status === "CHECKED_OUT" ? "#166534" : "#92400e",
                }}
              >
                Visit: {selectedHistoryVisit.status || "Unknown"}
              </span>

              <span
                style={{
                  padding: "7px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: (selectedHistoryVisit.assets || []).every(
                    (asset) => asset.is_cleared_for_exit
                  ) ? "#dcfce7" : "#fee2e2",
                  color: (selectedHistoryVisit.assets || []).every(
                    (asset) => asset.is_cleared_for_exit
                  ) ? "#166534" : "#991b1b",
                }}
              >
                Assets: {(selectedHistoryVisit.assets || []).every(
                  (asset) => asset.is_cleared_for_exit
                ) ? "All cleared" : "Clearance pending"}
              </span>
            </div>

            <hr />

            <h4>Visitor Information</h4>
            <p>
              <strong>Name:</strong>{" "}
              {`${selectedHistoryVisit.visitor?.first_name || ""} ${selectedHistoryVisit.visitor?.last_name || ""}`.trim() || "Not recorded"}
            </p>
            <p>
              <strong>Company:</strong>{" "}
              {selectedHistoryVisit.visitor?.company_name || "Not specified"}
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              {selectedHistoryVisit.visitor?.phone || selectedHistoryVisit.visitor?.phone_number || "Not recorded"}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              {selectedHistoryVisit.visitor?.email || "Not recorded"}
            </p>

            <h4>Visit Information</h4>
            <p><strong>Purpose:</strong> {selectedHistoryVisit.purpose || "Not recorded"}</p>
            <p>
              <strong>Host:</strong>{" "}
              {`${selectedHistoryVisit.host_employee?.first_name || ""} ${selectedHistoryVisit.host_employee?.last_name || ""}`.trim() || "Not recorded"}
            </p>
            <p><strong>Host Email:</strong> {selectedHistoryVisit.host_employee?.email || "Not recorded"}</p>
            <p><strong>Department:</strong> {selectedHistoryVisit.host_employee?.department || "Not recorded"}</p>
            <p><strong>Status:</strong> {selectedHistoryVisit.status || "Not recorded"}</p>
            <p><strong>Expected Checkout:</strong> {selectedHistoryVisit.expected_out_time ? new Date(selectedHistoryVisit.expected_out_time).toLocaleString() : "Not recorded"}</p>
            <p><strong>Check-in:</strong> {selectedHistoryVisit.check_in_time ? new Date(selectedHistoryVisit.check_in_time).toLocaleString() : "Not recorded"}</p>
            <p><strong>Checkout:</strong> {selectedHistoryVisit.check_out_time ? new Date(selectedHistoryVisit.check_out_time).toLocaleString() : "Not recorded"}</p>

            <h4>Registered Assets & Security Clearance</h4>

            {(!selectedHistoryVisit.assets || selectedHistoryVisit.assets.length === 0) ? (
              <p>No assets registered for this visit.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px" }}>Asset Type</th>
                      <th style={{ padding: "10px" }}>Brand / Model</th>
                      <th style={{ padding: "10px" }}>Serial Number</th>
                      <th style={{ padding: "10px" }}>Clearance</th>
                      <th style={{ padding: "10px" }}>Cleared By</th>
                      <th style={{ padding: "10px" }}>Cleared At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedHistoryVisit.assets.map((asset) => (
                      <tr key={asset.asset_id}>
                        <td style={{ padding: "10px" }}>{asset.asset_type || "Not recorded"}</td>
                        <td style={{ padding: "10px" }}>{asset.brand_model || "Not recorded"}</td>
                        <td style={{ padding: "10px" }}>{asset.serial_number || "Not recorded"}</td>
                        <td style={{ padding: "10px" }}>{asset.is_cleared_for_exit ? "Cleared" : "Not cleared"}</td>
                        <td style={{ padding: "10px" }}>{asset.cleared_by || "Not recorded"}</td>
                        <td style={{ padding: "10px" }}>{asset.cleared_at ? new Date(asset.cleared_at).toLocaleString() : "Not recorded"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    );
  };

  const renderCheckoutReceipt = () => {
    if (!checkoutReceipt) return null;

    const formatReceiptDate = (value) => {
      if (!value) return "Not recorded";
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? "Not recorded"
        : date.toLocaleString();
    };

    return (
      <section
        className="page-card"
        style={{ marginTop: "20px" }}
      >
        <div
          id="checkout-receipt"
          style={{
            background: "#ffffff",
            color: "#1f2937",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              flexWrap: "wrap",
              borderBottom: "2px solid #2563eb",
              paddingBottom: "18px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: "#1d4ed8" }}>
                VMS
              </h2>
              <p style={{ margin: "5px 0", color: "#64748b" }}>
                Visitor Management System
              </p>
              <h3 style={{ marginBottom: 0 }}>
                Visitor Checkout Receipt
              </h3>
            </div>

            <div style={{ textAlign: "right", fontSize: "13px" }}>
              <strong>{checkoutReceipt.receiptNumber}</strong>
              <p style={{ marginBottom: 0 }}>
                Status: CHECKED OUT
              </p>
            </div>
          </div>

          <h3>Visitor Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <small>Visitor Name</small>
              <p><strong>{checkoutReceipt.visitorName}</strong></p>
            </div>
            <div>
              <small>Company</small>
              <p><strong>{checkoutReceipt.companyName}</strong></p>
            </div>
            <div>
              <small>Host</small>
              <p><strong>{checkoutReceipt.hostName}</strong></p>
            </div>
            <div>
              <small>Purpose</small>
              <p><strong>{checkoutReceipt.purpose}</strong></p>
            </div>
            <div>
              <small>Visit ID</small>
              <p style={{ overflowWrap: "anywhere" }}>
                <strong>{checkoutReceipt.visitId}</strong>
              </p>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />

          <h3>Visit Timeline</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <small>Check-in Time</small>
              <p><strong>{formatReceiptDate(checkoutReceipt.checkInTime)}</strong></p>
            </div>
            <div>
              <small>Checkout Time</small>
              <p><strong>{formatReceiptDate(checkoutReceipt.checkoutTime)}</strong></p>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />

          <h3>Registered Asset Clearance</h3>

          {checkoutReceipt.assets.length === 0 ? (
            <p>No assets were registered for this visit.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Asset</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Model</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Serial No.</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Clearance</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Cleared By</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Cleared At</th>
                  </tr>
                </thead>
                <tbody>
                  {checkoutReceipt.assets.map((asset, index) => (
                    <tr key={`${asset.serialNumber}-${index}`}>
                      <td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>{asset.assetType}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>{asset.brandModel}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>{asset.serialNumber}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb", color: asset.cleared ? "#15803d" : "#b91c1c" }}>
                        {asset.cleared ? "Cleared" : "Pending"}
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>{asset.clearedBy}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>{formatReceiptDate(asset.clearedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p style={{ marginTop: "24px", color: "#64748b", fontSize: "12px" }}>
            This receipt records the checkout details captured by the Visitor
            Management System.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "16px",
          }}
        >
          <button
            type="button"
            className="back-button"
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>

          <button
            type="button"
            className="back-button"
            onClick={() => setCheckoutReceipt(null)}
          >
            Close Receipt
          </button>
        </div>
      </section>
    );
  };

  const renderAuditLogs = () => {
    const query = auditLogsSearch.trim().toLowerCase();

    const filteredLogs = auditLogs.filter((log) => {
      const matchesSearch = [
        log.action,
        log.description,
        log.performed_by,
        log.visit_id,
        log.audit_id,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const matchesAction =
        auditLogsAction === "ALL" || log.action === auditLogsAction;

      const logDate = log.created_at ? new Date(log.created_at) : null;
      const startDate = auditLogsStartDate
        ? new Date(`${auditLogsStartDate}T00:00:00`)
        : null;
      const endDate = auditLogsEndDate
        ? new Date(`${auditLogsEndDate}T23:59:59.999`)
        : null;
      const matchesStartDate = !startDate || (logDate && !Number.isNaN(logDate.getTime()) && logDate >= startDate);
      const matchesEndDate = !endDate || (logDate && !Number.isNaN(logDate.getTime()) && logDate <= endDate);

      return matchesSearch && matchesAction && matchesStartDate && matchesEndDate;
    });

    const actionTypes = [
      ...new Set(auditLogs.map((log) => log.action).filter(Boolean)),
    ].sort();

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / auditLogsPageSize));
    const safePage = Math.min(auditLogsPage, totalPages);
    const pageStartIndex = (safePage - 1) * auditLogsPageSize;
    const pageLogs = filteredLogs.slice(pageStartIndex, pageStartIndex + auditLogsPageSize);
    const firstVisibleRecord = filteredLogs.length ? pageStartIndex + 1 : 0;
    const lastVisibleRecord = Math.min(pageStartIndex + auditLogsPageSize, filteredLogs.length);

    const exportAuditLogsCsv = () => {
      const headers = ["Date & Time", "Action", "Description", "Performed By", "Visit ID", "Audit ID"];
      const rows = filteredLogs.map((log) => [
        log.created_at ? new Date(log.created_at).toLocaleString() : "",
        log.action || "",
        log.description || "",
        log.performed_by || "",
        log.visit_id || "",
        log.audit_id || "",
      ]);
      const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vms-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    return (
      <>
        <div className="topbar">
          <div>
            <h2>Audit Logs</h2>
            <p>Review recorded visitor and security activities.</p>
          </div>
          <button className="back-button" onClick={openDashboard}>
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            marginBottom: "18px",
          }}
        >
          {[
            {
              label: "Total Activities",
              count: auditLogs.length,
              description: "All recorded activities",
              icon: <Activity size={21} />,
              color: "#2563eb",
              background: "#eff6ff",
            },
            {
              label: "Visits Created",
              count: auditLogs.filter((log) => String(log.action || "").toUpperCase() === "VISIT_CREATED").length,
              description: "Visit creation events",
              icon: <UserPlus size={21} />,
              color: "#15803d",
              background: "#f0fdf4",
            },
            {
              label: "Visitor Checkouts",
              count: auditLogs.filter((log) => String(log.action || "").toUpperCase() === "VISITOR_CHECKED_OUT").length,
              description: "Successful checkout events",
              icon: <LogOut size={21} />,
              color: "#b45309",
              background: "#fffbeb",
            },
            {
              label: "Assets Cleared",
              count: auditLogs.filter((log) => String(log.action || "").toUpperCase() === "ASSET_CLEARED").length,
              description: "Asset clearance events",
              icon: <ShieldCheck size={21} />,
              color: "#7c3aed",
              background: "#f5f3ff",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#fff",
                border: "1px solid #e4e7ec",
                borderRadius: "12px",
                padding: "18px",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ color: "#475467", fontSize: "14px", fontWeight: 600 }}>{item.label}</span>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "10px", color: item.color, background: item.background }}>
                  {item.icon}
                </span>
              </div>
              <div style={{ color: "#101828", fontSize: "28px", fontWeight: 700, lineHeight: 1.25, marginTop: "12px" }}>
                {item.count}
              </div>
              <div style={{ color: "#667085", fontSize: "12px", marginTop: "5px" }}>{item.description}</div>
            </div>
          ))}
        </div>

        <section className="page-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 5px" }}>Activity History</h3>
              <p style={{ margin: 0, color: "#667085" }}>
                Showing {filteredLogs.length ? `${firstVisibleRecord}–${lastVisibleRecord} of ` : ""}{filteredLogs.length} matching records ({auditLogs.length} total)
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                className="back-button"
                onClick={exportAuditLogsCsv}
                disabled={filteredLogs.length === 0}
                title="Export the currently filtered audit records as CSV"
              >
                Export CSV
              </button>
              <button
                className="back-button"
                onClick={() => window.print()}
                disabled={filteredLogs.length === 0}
                title="Print or save the current audit logs as PDF"
              >
                <Printer size={14} />
                Print / Save PDF
              </button>
              <button
                className="back-button"
                onClick={fetchAuditLogs}
                disabled={auditLogsLoading}
              >
                <RefreshCw size={14} />
                {auditLogsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <input
              type="text"
              value={auditLogsSearch}
              onChange={(event) => { setAuditLogsSearch(event.target.value); setAuditLogsPage(1); }}
              placeholder="Search action, description, visit ID..."
              aria-label="Search audit logs"
              style={{
                flex: "1 1 260px",
                minWidth: 0,
                padding: "11px 12px",
                border: "1px solid #d0d5dd",
                borderRadius: "8px",
                boxSizing: "border-box",
              }}
            />
            <input
              type="date"
              value={auditLogsStartDate}
              max={auditLogsEndDate || undefined}
              onChange={(event) => { setAuditLogsStartDate(event.target.value); setAuditLogsPage(1); }}
              aria-label="Audit logs start date"
              title="Start date"
              style={{ padding: "11px 12px", border: "1px solid #d0d5dd", borderRadius: "8px", background: "#fff" }}
            />
            <input
              type="date"
              value={auditLogsEndDate}
              min={auditLogsStartDate || undefined}
              onChange={(event) => { setAuditLogsEndDate(event.target.value); setAuditLogsPage(1); }}
              aria-label="Audit logs end date"
              title="End date"
              style={{ padding: "11px 12px", border: "1px solid #d0d5dd", borderRadius: "8px", background: "#fff" }}
            />
            <button
              type="button"
              className="back-button"
              onClick={() => { setAuditLogsSearch(""); setAuditLogsAction("ALL"); setAuditLogsStartDate(""); setAuditLogsEndDate(""); setAuditLogsPage(1); }}
            >
              Clear filters
            </button>
            <select
              value={auditLogsAction}
              onChange={(event) => { setAuditLogsAction(event.target.value); setAuditLogsPage(1); }}
              aria-label="Filter audit logs by action"
              style={{
                flex: "0 1 220px",
                minWidth: 0,
                padding: "11px 12px",
                border: "1px solid #d0d5dd",
                borderRadius: "8px",
                background: "#fff",
              }}
            >
              <option value="ALL">All actions</option>
              {actionTypes.map((action) => (
                <option key={action} value={action}>
                  {action.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {auditLogsLoading ? (
            <p>Loading audit logs...</p>
          ) : auditLogsError ? (
            <div>
              <p style={{ color: "#b42318" }}>{auditLogsError}</p>
              <button className="back-button" onClick={fetchAuditLogs}>
                Try again
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <p style={{ color: "#667085" }}>
              No audit records match your search.
            </p>
          ) : (
            <div style={{ overflowX: "auto", width: "100%" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr>
                    {["Date & Time", "Action", "Description", "Performed By", "Visit ID"].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #eaecf0",
                          color: "#667085",
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageLogs.map((log) => (
                    <tr key={log.audit_id}>
                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom: "1px solid #f0f1f3",
                          whiteSpace: "nowrap",
                          fontSize: "13px",
                        }}
                      >
                        {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                      </td>
                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom: "1px solid #f0f1f3",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            background: "#eff8ff",
                            color: "#175cd3",
                            borderRadius: "6px",
                            padding: "5px 8px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {(log.action || "UNKNOWN").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom: "1px solid #f0f1f3",
                          minWidth: "240px",
                          maxWidth: "420px",
                          overflowWrap: "anywhere",
                          fontSize: "13px",
                        }}
                      >
                        {log.description || "—"}
                      </td>
                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom: "1px solid #f0f1f3",
                          whiteSpace: "nowrap",
                          fontSize: "13px",
                        }}
                      >
                        {log.performed_by || "—"}
                      </td>
                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom: "1px solid #f0f1f3",
                          fontSize: "12px",
                          minWidth: "150px",
                        }}
                      >
                        {log.visit_id || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!auditLogsLoading && !auditLogsError && filteredLogs.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "18px",
                paddingTop: "14px",
                borderTop: "1px solid #eaecf0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#667085", fontSize: "13px" }}>
                <span>Rows per page</span>
                <select
                  value={auditLogsPageSize}
                  onChange={(event) => { setAuditLogsPageSize(Number(event.target.value)); setAuditLogsPage(1); }}
                  aria-label="Rows per page"
                  style={{ padding: "7px 9px", border: "1px solid #d0d5dd", borderRadius: "7px", background: "#fff" }}
                >
                  {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
                <span>· Page {safePage} of {totalPages}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  className="back-button"
                  onClick={() => setAuditLogsPage((page) => Math.max(1, page - 1))}
                  disabled={safePage <= 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="back-button"
                  onClick={() => setAuditLogsPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safePage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </>
    );
  };

  const renderHosts = () => {
    const query = hostSearch.trim().toLowerCase();
    const filteredHosts = hostList.filter((host) => {
      const name = `${host.first_name || ""} ${host.last_name || ""}`.trim().toLowerCase();
      return (
        !query ||
        name.includes(query) ||
        String(host.employee_id || "").includes(query) ||
        String(host.email || "").toLowerCase().includes(query) ||
        String(host.department || "").toLowerCase().includes(query)
      );
    });

    return (
      <>
        <div className="topbar">
          <div>
            <h2>Hosts</h2>
            <p>Manage employees who receive visitors</p>
          </div>
          <div className="topbar-actions">
            <button
              className="add-host-button"
              onClick={() => {
                setHostCreateError("");
                setShowAddHost(true);
              }}
            >
              <UserPlus size={14} />
              Add Host
            </button>
            <div className="system-status">
              <span className="status-dot"></span>
              System Online
            </div>
            <button className="back-button" onClick={openDashboard}>
              <ArrowLeft size={14} />
              Back to Dashboard
            </button>
          </div>
        </div>

        {hostError && (
          <div className="error-banner">
            <XCircle size={16} />
            {hostError}
          </div>
        )}

        {hostLoading ? (
          <section className="page-card">
            <div className="empty-state">
              <RefreshCw size={24} className="spin" />
              <strong>Loading hosts...</strong>
              <span>Fetching employees from the VMS database.</span>
            </div>
          </section>
        ) : filteredHosts.length === 0 ? (
          <section className="page-card">
            <div className="empty-state">
              <Users size={28} />
              <strong>No hosts found</strong>
              <span>No employees match your search.</span>
            </div>
          </section>
        ) : (
          <section className="table-card" style={{ marginTop: "24px" }}>
            <div className="table-toolbar">
              <div>
                <h2>Host Directory</h2>
                <p>Employees available to host visitors</p>
              </div>
              <div className="search-box search-field">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search hosts..."
                  value={hostSearch}
                  onChange={(e) => setHostSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Host</th>
                    <th>Employee ID</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHosts.map((host) => (
                    <tr key={host.employee_id}>
                      <td>
                        <div className="visitor-cell">
                          <div className="visitor-avatar">
                            {getInitials(
                              `${host.first_name || ""} ${host.last_name || ""}`
                            )}
                          </div>
                          <div>
                            <strong>
                              {host.first_name} {host.last_name}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td>{host.employee_id}</td>
                      <td>{host.email || "—"}</td>
                      <td>{host.department || "—"}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            host.status === "ACTIVE" ? "active" : ""
                          }`}
                        >
                          {host.status || "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {showAddHost && (
          <div className="host-modal-overlay">
            <div className="host-modal">
              <div className="host-modal-header">
                <div>
                  <h2>Add Host</h2>
                  <p>Add an employee who can receive visitors.</p>
                </div>
                <button
                  type="button"
                  className="host-modal-close"
                  onClick={() => setShowAddHost(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={createHost}>
                <div className="host-form-grid">
                  <div className="host-form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={hostForm.first_name}
                      onChange={(event) =>
                        setHostForm({ ...hostForm, first_name: event.target.value })
                      }
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="host-form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={hostForm.last_name}
                      onChange={(event) =>
                        setHostForm({ ...hostForm, last_name: event.target.value })
                      }
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                  <div className="host-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={hostForm.email}
                      onChange={(event) =>
                        setHostForm({ ...hostForm, email: event.target.value })
                      }
                      placeholder="employee@company.com"
                      required
                    />
                  </div>
                  <div className="host-form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={hostForm.department}
                      onChange={(event) =>
                        setHostForm({ ...hostForm, department: event.target.value })
                      }
                      placeholder="e.g. IT, HR, Finance"
                    />
                  </div>
                </div>

                {hostCreateError && (
                  <div className="host-form-error">{hostCreateError}</div>
                )}

                <div className="host-modal-actions">
                  <button
                    type="button"
                    className="host-cancel-button"
                    onClick={() => setShowAddHost(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="host-submit-button"
                    disabled={hostCreating}
                  >
                    {hostCreating ? "Creating..." : "Create Host"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  };

  /* =========================================================
     APP SHELL RENDER
  ========================================================= */
  if (!authChecked) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo"><ShieldCheck size={34} /></div>
            <h1>Visitor Management System</h1>
            <p>Checking your secure session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || !token) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={19} />
          </div>
          <div>
            <h1>VMS</h1>
            <span>Visitor Management</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">SECURITY</p>
          <button
            className={`sidebar-item ${currentPage === "dashboard" ? "active" : ""}`}
            onClick={openDashboard}
          >
            <ShieldCheck size={14} />
            Dashboard
          </button>
          <button
            className={`sidebar-item ${currentPage === "scanner" ? "active" : ""}`}
            onClick={openScanner}
          >
            <QrCode size={14} />
            Scan Visitor
          </button>
          <button
            className={`sidebar-item ${currentPage === "visitors" ? "active" : ""}`}
            onClick={openVisitors}
          >
            <Users size={14} />
            Visitors
          </button>
          <button
            className={`sidebar-item ${currentPage === "checkout" ? "active" : ""}`}
            onClick={openCheckout}
          >
            <LogOut size={14} />
            Checkout
          </button>
          <button
            className={`sidebar-item ${currentPage === "checkout-history" ? "active" : ""}`}
            onClick={openCheckoutHistory}
          >
            <History size={14} />
            Checkout History
          </button>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">MANAGEMENT</p>
          <button
            className={`sidebar-item ${currentPage === "hosts" ? "active" : ""}`}
            onClick={() => setCurrentPage("hosts")}
          >
            <Building2 size={14} />
            Hosts
          </button>

          <button
            className={`sidebar-item ${currentPage === "pre-approvals" ? "active" : ""}`}
            onClick={() => openPreApprovals(false)}
          >
            <CalendarClock size={14} />
            Pre-Approvals
          </button>

          <button
            className={`sidebar-item ${currentPage === "notifications" ? "active" : ""}`}
            onClick={() => setCurrentPage("notifications")}
          >
            <Bell size={14} />
            Notifications
            {notifications.some((notification) => !notification.read) && (
              <span
                className="notification-count"
                style={{
                  background: "#ef4444",
                  color: "white",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  marginLeft: "auto",
                }}
              >
                {notifications.filter((notification) => !notification.read).length}
              </span>
            )}
          </button>

          <button
            className={`sidebar-item ${currentPage === "audit-logs" ? "active" : ""}`}
            onClick={openAuditLogs}
          >
            <FileText size={14} />
            Audit Logs
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="security-profile">
            <div className="profile-avatar">
              {(currentUser?.email || "SG").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong>{currentUser?.email || "Security User"}</strong>
              <span>{currentUser?.role || "SECURITY"}</span>
            </div>
            <span className="online-dot"></span>
          </div>
          <button
            type="button"
            className="sidebar-item"
            onClick={handleLogout}
            style={{ width: "100%", marginTop: "10px" }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="main-content">
        {currentPage === "dashboard" && renderDashboard()}
        {currentPage === "notifications" && renderNotifications()}
        {currentPage === "scanner" && renderScanner()}
        {currentPage === "hosts" && renderHosts()}
        {currentPage === "audit-logs" && renderAuditLogs()}

        {currentPage === "pre-approvals" && (
          <PreApprovals
            onBack={openDashboard}
            onNotification={addNotification}
            onVisitCheckedIn={() => {
              fetchDashboard();
            }}
            filterToday={preApprovalTodayOnly}
            onShowAll={() => setPreApprovalTodayOnly(false)}
          />
        )}

        {currentPage === "visitors" && renderVisitors()}
        {currentPage === "checkout" && renderCheckout()}

        {currentPage === "checkout-history" && (
          renderCheckoutHistory()
        )}

        {currentPage === "create" && (
          <>
            <div className="topbar">
              <div>
                <h2>Create Visit</h2>
                <p>Register a new visitor visit</p>
              </div>
              <button className="back-button" onClick={openDashboard}>
                <ArrowLeft size={14} />
                Back to Dashboard
              </button>
            </div>
            <CreateVisit
              onBack={openDashboard}
              onCreated={() => {
                fetchDashboard();
              }}
              onNotification={addNotification}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
