import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  LogOut,
  Search,
  QrCode,
  Clock,
  CalendarClock,
  Home,
  CalendarCheck,
  Calendar,
  Plus,
  Building2,
  Bell,
  BellRing,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  UserPlus,
  History,
  Printer,
  X,
  Filter,
  Laptop,
  PackageCheck,
  HardDrive,
  MapPin,
  Truck,
  ExternalLink,
  Cpu,
  Eye,
  EyeOff,
  Check,
  Copy,
  Camera,
  Tag,
  Info,
  FileText,
  Server,
  ArrowUpDown,
  CheckCheck,
  Trash2,
  BellOff,
  AlertTriangle,
  Phone,
  Mail,
  User,
  Menu,
  Settings,
  SlidersHorizontal,
  Sun,
  Moon,
  Package,
  Edit3,
  Ticket,
  Upload,
  Download,
  MoreVertical,
  Lock,
  HelpCircle,
  Shield,
  Smartphone,
  LayoutGrid,
  Image as ImageIcon,
  SwitchCamera,
  VideoOff,
} from "lucide-react";
import QRCode from "qrcode";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import AssetPhotoPicker from "./AssetPhotoPicker";

import CreateVisit from "./CreateVisit";
import PreApprovals from "./PreApprovals";
import Login from "./Login";
import PublicRegistration from "./PublicRegistration";
import { isITApproval } from "./utils/approvalFilters";
import PublicVisitorPass from "./PublicVisitorPass";
import ITVisitPortal from "./ITVisitPortal";
import ITPortalQRPage from "./ITPortalQRPage";
import ITPreApprovals from "./ITPreApprovals";
import ITVisitors from "./ITVisitors";
import SecurityGuardPortal from "./SecurityGuardPortal";
import GuardLogin from "./GuardLogin";
import CheckoutHistory from "./CheckoutHistory";
import "./CheckoutHistory.css";
import "./App.css";
import "./PremiumEnterprise.css";
import { authStorage } from "./utils/authStorage";

/* =========================================================
   BACKEND API
========================================================= */
const API_BASE_URL = "";

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
  return clean;
};

const formatVisitorAddress = (parts) => {
  if (!Array.isArray(parts)) return "No address on file";
  const nonNull = parts.map((p) => (p || "").trim()).filter(Boolean);
  if (nonNull.length === 0) return "No address on file";
  const deduped = [];
  for (const part of nonNull) {
    if (deduped.length === 0 || deduped[deduped.length - 1].toLowerCase() !== part.toLowerCase()) {
      deduped.push(part);
    }
  }
  return deduped.join(", ");
};

function VMSApp() {
  /* =========================================================
     AUTHENTICATION (Tab-Isolated Session via authStorage)
  ========================================================= */
  const [authToken, setAuthToken] = useState(
    () => authStorage.getVmsToken()
  );
  const [currentUser, setCurrentUser] = useState(() => {
    return authStorage.getVmsUser();
  });

  const handleLoginSuccess = (accessToken, user, selectedRole) => {
    const effectiveRole = selectedRole || user?.role || "ADMIN";
    const effectiveUser = {
      ...user,
      role: effectiveRole,
    };
    authStorage.setVmsToken(accessToken);
    authStorage.setVmsUser(effectiveUser);
    setAuthToken(accessToken);
    setCurrentUser(effectiveUser);
    if (effectiveRole === "IT_COVERYOU" || effectiveRole === "IT") {
      setCurrentPage("it-assets");
    } else {
      setCurrentPage("dashboard");
    }
  };

  const handleLogout = () => {
    authStorage.clearVmsAuth();
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentPage("dashboard");
  };

  const authHeaders = () => ({
    Authorization: `Bearer ${authToken}`,
  });

  /* =========================================================
     ROLE-BASED ACCESS CONTROL (RBAC)
     - ADMIN: Full access (Security, Management, IT Department)
     - MANAGEMENT: Access to Security & Management
     - IT_COVERYOU: Access ONLY to IT Department
  ========================================================= */
  const activeRole = String(currentUser?.role || "ADMIN").toUpperCase();
  const hasSecurityAccess = activeRole === "ADMIN" || activeRole === "MANAGEMENT";
  const hasManagementAccess = activeRole === "ADMIN" || activeRole === "MANAGEMENT";
  const hasITAccess = activeRole === "ADMIN" || activeRole === "IT_COVERYOU" || activeRole === "IT";

  /* =========================================================
     NAVIGATION & FILTER STATE
  ========================================================= */
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const u = authStorage.getVmsUser();
      if (u) {
        const r = String(u?.role || "").toUpperCase();
        if (r === "IT_COVERYOU" || r === "IT") {
          return "it-assets";
        }
      }
    } catch {
      // fallback
    }
    return "dashboard";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [preApprovalTodayOnly, setPreApprovalTodayOnly] = useState(false);

  /* Enforce role route protection */
  useEffect(() => {
    if (!currentUser) return;
    const role = String(currentUser.role || "ADMIN").toUpperCase();
    const itPages = ["it-assets", "log-recovery", "it-hosts", "it-pre-approvals", "it-visitors", "it-notifications", "it-checkout-history"];

    if (role === "IT_COVERYOU" || role === "IT") {
      if (!itPages.includes(currentPage)) {
        setCurrentPage("it-assets");
      }
    } else if (role === "MANAGEMENT") {
      if (itPages.includes(currentPage)) {
        setCurrentPage("dashboard");
      }
    }
  }, [currentUser, currentPage]);

  /* Automatically collapse mobile navigation drawer when changing pages */
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentPage]);

  /* Lightbox for inspecting visitor or hardware asset photos */
  const [assetLightbox, setAssetLightbox] = useState(null);

  /* User initials for mobile mockups */
  const userInitials = useMemo(() => {
    if (currentUser?.first_name && currentUser?.last_name) {
      return `${currentUser.first_name[0]}${currentUser.last_name[0]}`.toUpperCase();
    }
    if (currentUser?.first_name && currentUser.first_name.length >= 2) {
      return currentUser.first_name.slice(0, 2).toUpperCase();
    }
    if (currentUser?.email) {
      const clean = currentUser.email.split("@")[0].replace(/[._-]/g, " ").trim();
      const parts = clean.split(" ").filter(Boolean);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    }
    return "AR";
  }, [currentUser]);
  /* Account & System Settings Modal */
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState("main");
  const [passForm, setPassForm] = useState({ current: "", next: "", confirm: "" });
  const [passShow, setPassShow] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: "", text: "" });

  const [mobileNotifPrefs, setMobileNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("vms_notif_prefs");
      return saved ? JSON.parse(saved) : { emailAlerts: true, securityAlarm: true, hardwareClearance: true, soundArrival: true };
    } catch {
      return { emailAlerts: true, securityAlarm: true, hardwareClearance: true, soundArrival: true };
    }
  });

  const handleUpdateNotifPref = (key) => {
    setMobileNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("vms_notif_prefs", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handlePasswordSubmit = async (e) => {
    e?.preventDefault();
    setPassMsg({ type: "", text: "" });
    if (!passForm.current) {
      setPassMsg({ type: "error", text: "Please enter your current password." });
      return;
    }
    if (!passForm.next || passForm.next.length < 6) {
      setPassMsg({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }
    if (passForm.next !== passForm.confirm) {
      setPassMsg({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          current_password: passForm.current,
          new_password: passForm.next,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update password. Verify current password.");
      }

      setPassMsg({ type: "success", text: "Password updated successfully! Please keep it secure." });
      setPassForm({ current: "", next: "", confirm: "" });
      setTimeout(() => {
        setSettingsSubView("main");
        setPassMsg({ type: "", text: "" });
      }, 1600);
    } catch (err) {
      setPassMsg({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setPassLoading(false);
    }
  };

  /* Digital Visitor Pass QR Code Data URL */
  const [passQrCode, setPassQrCode] = useState("");

  /* Light & Dark Theme State */
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("vms_theme") || localStorage.getItem("vms-theme") || "dark";
  });

  useEffect(() => {
    if (!authToken || !currentUser) {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
      return;
    }
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("vms_theme", theme);
    localStorage.setItem("vms-theme", theme);
  }, [theme, authToken, currentUser]);

  /* Synchronous Print Mode Handlers to Guarantee Clean White Executive PDF/Print Output */
  useEffect(() => {
    let activeThemeBeforePrint = null;
    const onBeforePrint = () => {
      activeThemeBeforePrint = document.documentElement.getAttribute("data-theme") || "light";
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
      document.body.classList.add("vms-print-mode");
    };
    const onAfterPrint = () => {
      if (activeThemeBeforePrint) {
        document.documentElement.setAttribute("data-theme", activeThemeBeforePrint);
        document.documentElement.classList.toggle("dark", activeThemeBeforePrint === "dark");
      }
      document.body.classList.remove("vms-print-mode");
    };

    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  /* =========================================================
     NOTIFICATIONS & IT VISIT NOTIFICATIONS
  ========================================================= */
  const [notifications, setNotifications] = useState([]);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [notifSearchQuery, setNotifSearchQuery] = useState("");
  const [itNotifFilter, setItNotifFilter] = useState("all");
  const [itNotifSearchQuery, setItNotifSearchQuery] = useState("");

  const isITNotification = useCallback((n) => {
    if (!n) return false;
    if (n.type === "it-visitor") return true;
    const action = String(n.action || "").toUpperCase();
    const title = String(n.title || "").toUpperCase();
    const desc = String(n.message || n.description || "");
    const performedBy = String(n.performed_by || "").toUpperCase();

    return (
      action.startsWith("IT_") ||
      action.startsWith("ASSET_") ||
      title.includes("IT ") ||
      title.includes("ASSET") ||
      desc.includes("[IT_VISIT]") ||
      desc.includes("IT Visitor") ||
      desc.includes("IT Department") ||
      desc.includes("IT Hardware") ||
      desc.includes("Asset ID:") ||
      performedBy.includes("IT VISITOR")
    );
  }, []);

  const itNotifications = useMemo(
    () => notifications.filter(isITNotification),
    [notifications, isITNotification]
  );
  const generalNotifications = useMemo(
    () => notifications.filter((n) => !isITNotification(n)),
    [notifications, isITNotification]
  );

  const itUnreadCount = itNotifications.filter((n) => !n.read).length;
  const generalUnreadCount = generalNotifications.filter((n) => !n.read).length;

  // Real-time tracking of pending Pre-Approval requests for badge counters
  const [globalPreApprovals, setGlobalPreApprovals] = useState([]);

  const generalPendingApprovals = useMemo(() => {
    return globalPreApprovals.filter((item) => {
      const purpose = String(item.purpose || "").toUpperCase();
      const isIT = isITApproval(item);
      if (isIT) return false;
      const status = String(item.status || "").trim().toUpperCase();
      return status === "PENDING" || status === "WAITING";
    });
  }, [globalPreApprovals]);

  const itPendingApprovals = useMemo(() => {
    return globalPreApprovals.filter((item) => {
      const purpose = String(item.purpose || "").toUpperCase();
      const isIT = isITApproval(item);
      if (!isIT) return false;
      const status = String(item.status || "").trim().toUpperCase();
      return status === "PENDING" || status === "WAITING";
    });
  }, [globalPreApprovals]);

  const generalPreApprovalPendingCount = generalPendingApprovals.length;
  const itPreApprovalPendingCount = itPendingApprovals.length;

  // Keep notification read/cleared state in this browser across refreshes.
  // Audit records remain in the backend; Clear all only hides them in this UI.
  const notificationPreferencesKey = `vms_notification_preferences_${
    currentUser?.email || currentUser?.user_id || "current-user"
  }`;

  const readNotificationPreferences = () => {
    try {
      const saved = localStorage.getItem(notificationPreferencesKey);
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [],
        hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
      };
    } catch (error) {
      console.error("Unable to load notification preferences:", error);
      return { readIds: [], hiddenIds: [] };
    }
  };

  const saveNotificationPreferences = (preferences) => {
    try {
      localStorage.setItem(
        notificationPreferencesKey,
        JSON.stringify({
          readIds: [...new Set(preferences.readIds || [])],
          hiddenIds: [...new Set(preferences.hiddenIds || [])],
        })
      );
    } catch (error) {
      console.error("Unable to save notification preferences:", error);
    }
  };

  const fetchAuditNotifications = useCallback(async () => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/audit-logs/?limit=100`, {
        headers: authHeaders(),
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(`Unable to load audit logs: HTTP ${response.status}`);
      }

      const logs = await response.json();
      const preferences = readNotificationPreferences();
      const hiddenIds = new Set(preferences.hiddenIds.map(String));
      const readIds = new Set(preferences.readIds.map(String));

      const mappedNotifications = logs
        .filter((log) => {
          const act = String(log.action || "").toUpperCase();
          if (act.includes("REQUEST_RAISED") || act.includes("RESCHEDULED")) {
            return true;
          }
          return !hiddenIds.has(String(log.audit_id));
        })
        .map((log) => {
          const action = String(log.action || "").toUpperCase();
          const desc = String(log.description || "");
          const performedBy = String(log.performed_by || "");

          const isITLog =
            action.startsWith("IT_") ||
            action.startsWith("ASSET_") ||
            desc.includes("[IT_VISIT]") ||
            desc.includes("IT Visitor") ||
            desc.includes("IT Department") ||
            desc.includes("IT Hardware") ||
            desc.includes("Asset ID:") ||
            performedBy.toUpperCase().includes("IT VISITOR");

          let title = isITLog ? "IT Technical Visit Activity" : "Visitor Management Activity";
          let type = isITLog ? "it-visitor" : "info";

          if (action.includes("IT_VISITOR_REQUEST_RAISED")) {
            title = "New IT Visitor Request Raised";
            type = "it-visitor";
          } else if (action.includes("VISITOR_REQUEST_RAISED")) {
            title = isITLog ? "New IT Visitor Request Raised" : "New Visitor Request Raised";
            type = isITLog ? "it-visitor" : "visitor";
          } else if (action.includes("VISIT_REQUEST_ON_HOLD") || action.includes("HOLD") || action.includes("WAIT")) {
            title = isITLog ? "IT Visitor Put on Hold (Host Busy)" : "Visitor Put on Hold (Host Busy)";
            type = "warning";
          } else if (action.includes("RESCHEDULED") || action.includes("VISIT_RESCHEDULED")) {
            title = isITLog ? "IT Visit Rescheduled (Host Absent)" : "Visit Rescheduled (Host Absent)";
            type = "warning";
          } else if (action.includes("PRE_APPROVAL_APPROVED") || action.includes("APPROVED")) {
            title = isITLog ? "IT Pre-Approval Approved" : "Pre-Approval Approved";
            type = "success";
          } else if (action.includes("PRE_APPROVAL_REJECTED") || action.includes("REJECT") || action.includes("DENY")) {
            title = isITLog ? "IT Entry Rejected" : "Entry Rejected";
            type = "warning";
          } else if (action.includes("IT_VISITOR_REGISTERED")) {
            title = "IT Visitor Registered";
            type = "it-visitor";
          } else if (action.includes("IT_VISITOR_VERIFIED")) {
            title = "IT Visitor Entry Verified";
            type = "it-visitor";
          } else if (action.includes("IT_VISITOR_CHECKED_IN")) {
            title = "IT Visitor Checked In";
            type = "it-visitor";
          } else if (action.includes("IT_ASSET_RECOVERY_REGISTERED")) {
            title = "IT Asset Recovery Registered";
            type = "it-visitor";
          } else if (action.includes("CHECKED_OUT")) {
            title = isITLog ? "IT Visitor Checked Out" : "Visitor Checked Out";
            type = "success";
          } else if (action.includes("ASSET_CLEARED")) {
            title = "Asset Cleared for Exit";
            type = "it-visitor";
          } else if (action.includes("ASSET_CLEARANCE")) {
            title = "Asset Clearance Verified";
            type = "it-visitor";
          } else if (action.includes("REGISTER")) {
            title = isITLog ? "IT Visitor Registered" : "Visitor Registered";
            type = isITLog ? "it-visitor" : "visitor";
          } else if (action.includes("REJECT") || action.includes("DENY")) {
            title = isITLog ? "IT Entry Rejected" : "Entry Rejected";
            type = "warning";
          } else if (action.includes("VERIF")) {
            title = isITLog ? "IT Visitor Entry Verified" : "Visitor Entry Verified";
            type = isITLog ? "it-visitor" : "visitor";
          } else if (action.includes("CHECKED_IN") || action.includes("CHECK_IN")) {
            title = isITLog ? "IT Visitor Checked In" : "Visitor Checked In";
            type = isITLog ? "it-visitor" : "visitor";
          }

          const timestamp = log.created_at ? new Date(log.created_at) : null;
          const validTimestamp = timestamp && !Number.isNaN(timestamp.getTime());

          return {
            id: log.audit_id,
            title,
            message: log.description || action,
            type,
            action,
            description: log.description,
            performed_by: log.performed_by,
            time: validTimestamp ? timestamp.toLocaleString() : "Time unavailable",
            read: readIds.has(String(log.audit_id)),
            createdAt: validTimestamp ? timestamp.getTime() : 0,
          };
        });

      setNotifications((previous) => {
        const backendIds = new Set(mappedNotifications.map((n) => String(n.id)));
        const prevIds = new Set(previous.map((n) => String(n.id)));
        const localOnly = previous.filter(
          (n) => typeof n.id === "string" && !backendIds.has(String(n.id))
        );

        if (previous.length > 0) {
          const freshUnread = mappedNotifications.filter(
            (n) => !prevIds.has(String(n.id)) && !n.read
          );
          if (freshUnread.length > 0) {
            playNotificationChime();
            const newest = freshUnread[0];
            showLiveToast(newest.title, newest.message, newest.type);
          }
        }
        return [...localOnly, ...mappedNotifications];
      });
    } catch (error) {
      console.error("Unable to load VMS audit notifications:", error);
    }
  }, [authToken, notificationPreferencesKey]);

  const fetchGlobalPreApprovals = useCallback(async () => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/pre-approvals/`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setGlobalPreApprovals(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Unable to load pre-approvals for badge counters:", e);
    }
  }, [authToken]);

  useEffect(() => {
    if (!authToken) {
      setNotifications([]);
      setGlobalPreApprovals([]);
      return;
    }

    fetchAuditNotifications();
    fetchGlobalPreApprovals();
    const interval = setInterval(() => {
      fetchAuditNotifications();
      fetchGlobalPreApprovals();
    }, 4000);

    return () => clearInterval(interval);
  }, [authToken, fetchAuditNotifications, fetchGlobalPreApprovals]);

  const markNotificationAsRead = (id) => {
    const preferences = readNotificationPreferences();
    preferences.readIds = [...new Set([...preferences.readIds, String(id)])];
    saveNotificationPreferences(preferences);

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markGeneralNotificationsAsRead = () => {
    const preferences = readNotificationPreferences();
    preferences.readIds = [
      ...new Set([
        ...preferences.readIds,
        ...generalNotifications.map((notification) => String(notification.id)),
      ]),
    ];
    saveNotificationPreferences(preferences);
    setNotifications((previous) =>
      previous.map((notification) =>
        !isITNotification(notification) ? { ...notification, read: true } : notification
      )
    );
  };

  const clearGeneralNotifications = () => {
    const idsToClear = new Set(generalNotifications.map((n) => String(n.id)));
    const preferences = readNotificationPreferences();
    preferences.hiddenIds = [...new Set([...preferences.hiddenIds, ...idsToClear])];
    preferences.readIds = preferences.readIds.filter((id) => !idsToClear.has(String(id)));
    saveNotificationPreferences(preferences);
    setNotifications((previous) => previous.filter((n) => isITNotification(n)));
  };

  const markITNotificationsAsRead = () => {
    const preferences = readNotificationPreferences();
    preferences.readIds = [
      ...new Set([
        ...preferences.readIds,
        ...itNotifications.map((notification) => String(notification.id)),
      ]),
    ];
    saveNotificationPreferences(preferences);
    setNotifications((previous) =>
      previous.map((notification) =>
        isITNotification(notification) ? { ...notification, read: true } : notification
      )
    );
  };

  const clearITNotifications = () => {
    const idsToClear = new Set(itNotifications.map((n) => String(n.id)));
    const preferences = readNotificationPreferences();
    preferences.hiddenIds = [...new Set([...preferences.hiddenIds, ...idsToClear])];
    preferences.readIds = preferences.readIds.filter((id) => !idsToClear.has(String(id)));
    saveNotificationPreferences(preferences);
    setNotifications((previous) => previous.filter((n) => !isITNotification(n)));
  };

  const markAllNotificationsAsRead = markGeneralNotificationsAsRead;
  const clearNotifications = clearGeneralNotifications;

  const dismissNotification = (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const preferences = readNotificationPreferences();
    preferences.hiddenIds = [...new Set([...preferences.hiddenIds, String(id)])];
    preferences.readIds = preferences.readIds.filter((readId) => readId !== String(id));
    saveNotificationPreferences(preferences);
    setNotifications((previous) => previous.filter((n) => n.id !== id));
  };

  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.1, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.35);
    } catch {
      // Audio suppression fallback
    }
  };

  const [liveToast, setLiveToast] = useState(null);
  const showLiveToast = useCallback((title, message, type = "info") => {
    setLiveToast({ title, message, type, id: Date.now() });
    setTimeout(() => {
      setLiveToast((prev) => (prev?.title === title ? null : prev));
    }, 6000);
  }, []);

  const addNotification = (notification) => {
    fetchGlobalPreApprovals();
    const newNotification = {
      id: `local-${Date.now()}-${Math.random()}`,
      title: notification.title,
      message: notification.message,
      type: notification.type || "info",
      time: notification.time || "Just now",
      read: false,
    };
    playNotificationChime();
    showLiveToast(notification.title, notification.message, notification.type || "info");
    setNotifications((previous) => [newNotification, ...previous]);
  };

  /* =========================================================
     VISIT VERIFICATION
  ========================================================= */
  const [visit, setVisit] = useState(null);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSearch, setCheckoutSearch] = useState("");
  const [error, setError] = useState("");
  const [checkoutReceipt, setCheckoutReceipt] = useState(null);

  // Checkout History
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [checkoutHistoryLoading, setCheckoutHistoryLoading] = useState(false);
  const [checkoutHistoryError, setCheckoutHistoryError] = useState("");
  const [checkoutHistorySearch, setCheckoutHistorySearch] = useState("");
  const [selectedHistoryVisit, setSelectedHistoryVisit] = useState(null);
  const historyDetailsRef = useRef(null);

  // IT Checkout History
  const [itCheckoutHistorySearch, setItCheckoutHistorySearch] = useState("");
  const [selectedITHistoryVisit, setSelectedITHistoryVisit] = useState(null);
  const itHistoryDetailsRef = useRef(null);

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
  const [dashboardVisitorFilter, setDashboardVisitorFilter] = useState("all");

  /* =========================================================
     VISITORS DIRECTORY
  ========================================================= */
  const [visitorList, setVisitorList] = useState([]);
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [visitorError, setVisitorError] = useState("");
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorDirectoryFilter, setVisitorDirectoryFilter] = useState("all");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("");
  const [showAddVisitor, setShowAddVisitor] = useState(false);
  const [showMobileCompanyFilter, setShowMobileCompanyFilter] = useState(false);
  const [showMobileHostFilter, setShowMobileHostFilter] = useState(false);
  const [selectedHostDeptFilter, setSelectedHostDeptFilter] = useState("");

  // Visitor Detail Dossier & Direct Checkout Modal
  const [selectedVisitorDossier, setSelectedVisitorDossier] = useState(null);
  const [dossierData, setDossierData] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierError, setDossierError] = useState("");
  const [directCheckoutLoading, setDirectCheckoutLoading] = useState("");
  const [dossierPhotoUploading, setDossierPhotoUploading] = useState(false);
  const dossierPhotoInputRef = useRef(null);
  const [isAddingDossierAsset, setIsAddingDossierAsset] = useState(false);
  const [editingDossierAsset, setEditingDossierAsset] = useState(null);
  const [dossierAssetOpLoading, setDossierAssetOpLoading] = useState(false);
  const [dossierNewAssetForm, setDossierNewAssetForm] = useState({
    asset_type: "Laptop",
    brand_model: "",
    serial_number: "",
    photo_data: "",
    disposition: "CARRIED_OUT",
    retention_note: "",
  });
  const [visitorCreateLoading, setVisitorCreateLoading] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
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
    phone_number: "",
    department: "",
    designation: "",
    office_location: "",
    notes: "",
    status: "ACTIVE",
  });
  const [selectedHostDetail, setSelectedHostDetail] = useState(null);
  const [copiedHostContact, setCopiedHostContact] = useState("");
  const [itHostScope, setItHostScope] = useState("it"); // "it" | "all"
  const [hostStatusFilter, setHostStatusFilter] = useState("all"); // "all" | "active" | "reception"

  /* =========================================================
     IT DEPARTMENT & ASSET RECOVERY
  ========================================================= */
  const [itAssets, setItAssets] = useState([]);
  const [itStats, setItStats] = useState(null);
  const [itAssetsLoading, setItAssetsLoading] = useState(false);
  const [itAssetsError, setItAssetsError] = useState("");
  const [itSearchQuery, setItSearchQuery] = useState("");
  const [itCategoryFilter, setItCategoryFilter] = useState("all");
  const [itSortOrder, setItSortOrder] = useState("newest");
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);
  const [showAddRecoveryModal, setShowAddRecoveryModal] = useState(false);
  const [printableAssetReceipt, setPrintableAssetReceipt] = useState(null);
  const [copiedSerial, setCopiedSerial] = useState("");
  const [showITPortalModal, setShowITPortalModal] = useState(false);
  const [itPortalQrData, setItPortalQrData] = useState("");
  const [copiedITUrl, setCopiedITUrl] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);

  const toggleSelectAsset = (id) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllAssets = (list) => {
    if (!list || list.length === 0) return;
    if (selectedAssetIds.length === list.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(list.map((a) => a.asset_id));
    }
  };

  const getAvatarColorStyle = (name) => {
    const palette = [
      { bg: "rgba(168, 85, 247, 0.22)", color: "#d8b4fe", border: "1px solid rgba(168, 85, 247, 0.4)" }, // Lavender / Purple
      { bg: "rgba(16, 185, 129, 0.22)", color: "#6ee7b7", border: "1px solid rgba(16, 185, 129, 0.4)" }, // Mint Green
      { bg: "rgba(56, 189, 248, 0.22)", color: "#7dd3fc", border: "1px solid rgba(56, 189, 248, 0.4)" }, // Sky Blue
      { bg: "rgba(245, 158, 11, 0.22)", color: "#fcd34d", border: "1px solid rgba(245, 158, 11, 0.4)" }, // Warm Amber
    ];
    let hash = 0;
    const str = String(name || "Carrier");
    for (let i = 0; i < str.length; i++) {
      hash = (hash + str.charCodeAt(i)) % palette.length;
    }
    return palette[hash];
  };

  const handleExportHardwareCSV = (list) => {
    const dataList = list && list.length > 0 ? list : itAssets;
    if (!dataList || dataList.length === 0) return;
    const headers = ["Asset ID", "Brand & Model", "Type", "Serial Tag", "Company", "Carrier", "Phone", "Host", "Status"];
    const rows = dataList.map((a) => [
      a.asset_id,
      `"${(a.brand_model || "").replace(/"/g, '""')}"`,
      `"${(a.asset_type || "").replace(/"/g, '""')}"`,
      `"${(a.serial_number || "").replace(/"/g, '""')}"`,
      `"${(a.carrier_visitor?.company || "").replace(/"/g, '""')}"`,
      `"${(a.carrier_visitor?.name || "").replace(/"/g, '""')}"`,
      `"${(a.carrier_visitor?.phone || "").replace(/"/g, '""')}"`,
      `"${(a.receiver_host?.name || "").replace(/"/g, '""')}"`,
      `"${a.is_cleared_for_exit ? "EXIT_CLEARED" : (a.custody_status || "IN_CUSTODY")}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hardware_custody_tracker_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [newRecoveryForm, setNewRecoveryForm] = useState({
    carrier_type: "new",
    visitor_id: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    company_name: "",
    address_line1: "",
    city: "",
    state: "",
    host_employee_id: "",
    asset_type: "Laptop",
    brand_model: "",
    serial_number: "",
    recovery_reason: "Employee Offboarding Asset Recovery",
    photo_data: null,
    is_cleared_for_exit: false,
  });
  const [recoverySubmitting, setRecoverySubmitting] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [itCameraActive, setItCameraActive] = useState(false);
  const itCameraVideoRef = useRef(null);

  /* =========================================================
     SCANNER
  ========================================================= */
  const [scannerError, setScannerError] = useState("");
  const [scannerMessage, setScannerMessage] = useState(
    "Scan a visitor QR code to verify entry."
  );
  const [manualTokenInput, setManualTokenInput] = useState("");
  const [manualLookupLoading, setManualLookupLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768
  );
  const [scannerCameraActive, setScannerCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment");
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const html5QrCodeRef = useRef(null);
  const scanProcessingRef = useRef(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleMobileResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleMobileResize);
    return () => window.removeEventListener("resize", handleMobileResize);
  }, []);

  /* =========================================================
     FETCH CALLS
  ========================================================= */
  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError("");
      const response = await fetch(`${API_BASE_URL}/visits/dashboard`, {
        headers: authHeaders(),
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
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

  const fetchCheckoutHistory = async () => {
    try {
      setCheckoutHistoryLoading(true);
      setCheckoutHistoryError("");

      const response = await fetch(
        `${API_BASE_URL}/visits/checkouts/history?limit=1000`,
        {
          headers: authHeaders(),
        }
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

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

  const openVisitorDossier = async (visitor) => {
    const vId = typeof visitor === "object" ? visitor.visitor_id : visitor;
    setSelectedVisitorDossier(visitor);
    setDossierLoading(true);
    setDossierError("");
    setDossierData(null);
    try {
      const res = await fetch(`${API_BASE_URL}/visitors/${vId}`, {
        headers: authHeaders(),
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error(`Failed to load visitor details (${res.status})`);
      const data = await res.json();
      setDossierData(data);
    } catch (err) {
      console.error("Dossier load error:", err);
      setDossierError(err.message || "Failed to load visitor details.");
    } finally {
      setDossierLoading(false);
    }
  };

  const closeVisitorDossier = () => {
    setSelectedVisitorDossier(null);
    setDossierData(null);
    setDossierError("");
    setIsAddingDossierAsset(false);
    setEditingDossierAsset(null);
    setDossierNewAssetForm({
      asset_type: "Laptop",
      brand_model: "",
      serial_number: "",
      photo_data: "",
      disposition: "CARRIED_OUT",
      retention_note: "",
    });
  };

  const handleUpdateDossierAssetDisposition = async (assetId, disposition, retentionNote = "") => {
    if (!assetId) return;
    try {
      setDossierAssetOpLoading(true);
      const res = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          disposition,
          retention_note: retentionNote || (disposition === "RETAINED_ON_PREMISES" ? "Installed in facility / kept in use" : ""),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update asset disposition");
      }
      if (selectedVisitorDossier) {
        const vId = typeof selectedVisitorDossier === "object" ? selectedVisitorDossier.visitor_id : selectedVisitorDossier;
        await openVisitorDossier(vId);
      }
    } catch (err) {
      console.error("Dossier asset disposition error:", err);
      alert(err.message || "Failed to update asset disposition.");
    } finally {
      setDossierAssetOpLoading(false);
    }
  };

  const handleCreateDossierAsset = async (visitId) => {
    if (!visitId) return;
    if (!dossierNewAssetForm.asset_type.trim()) {
      alert("Please enter or select an asset type.");
      return;
    }
    try {
      setDossierAssetOpLoading(true);
      const isCleared = dossierNewAssetForm.disposition === "CARRIED_OUT" || dossierNewAssetForm.disposition === "RETAINED_ON_PREMISES";
      const res = await fetch(`${API_BASE_URL}/assets/`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          visit_id: visitId,
          asset_type: dossierNewAssetForm.asset_type.trim(),
          brand_model: dossierNewAssetForm.brand_model.trim() || null,
          serial_number: dossierNewAssetForm.serial_number.trim() || null,
          photo_data: dossierNewAssetForm.photo_data || null,
          is_cleared_for_exit: isCleared,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to register new asset");
      }
      const created = await res.json();
      if (dossierNewAssetForm.disposition === "RETAINED_ON_PREMISES") {
        await fetch(`${API_BASE_URL}/assets/${created.asset_id}`, {
          method: "PUT",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            disposition: "RETAINED_ON_PREMISES",
            retention_note: dossierNewAssetForm.retention_note.trim() || "Installed in facility / kept in use",
          }),
        });
      }
      setIsAddingDossierAsset(false);
      setDossierNewAssetForm({
        asset_type: "Laptop",
        brand_model: "",
        serial_number: "",
        photo_data: "",
        disposition: "CARRIED_OUT",
        retention_note: "",
      });
      if (selectedVisitorDossier) {
        const vId = typeof selectedVisitorDossier === "object" ? selectedVisitorDossier.visitor_id : selectedVisitorDossier;
        await openVisitorDossier(vId);
      }
    } catch (err) {
      console.error("Create dossier asset error:", err);
      alert(err.message || "Failed to add asset.");
    } finally {
      setDossierAssetOpLoading(false);
    }
  };

  const handleDeleteDossierAsset = async (assetId, assetName) => {
    if (!window.confirm(`Are you sure you want to remove "${assetName || "this asset"}" from the visit registry?`)) return;
    try {
      setDossierAssetOpLoading(true);
      const res = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete asset");
      }
      if (selectedVisitorDossier) {
        const vId = typeof selectedVisitorDossier === "object" ? selectedVisitorDossier.visitor_id : selectedVisitorDossier;
        await openVisitorDossier(vId);
      }
    } catch (err) {
      console.error("Delete dossier asset error:", err);
      alert(err.message || "Failed to delete asset.");
    } finally {
      setDossierAssetOpLoading(false);
    }
  };

  const handleSaveDossierAssetEdit = async (assetId) => {
    if (!editingDossierAsset) return;
    try {
      setDossierAssetOpLoading(true);
      const res = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_type: editingDossierAsset.asset_type,
          brand_model: editingDossierAsset.brand_model,
          serial_number: editingDossierAsset.serial_number,
          photo_data: editingDossierAsset.photo_data || null,
          disposition: editingDossierAsset.disposition,
          retention_note: editingDossierAsset.retention_note,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update asset");
      }
      setEditingDossierAsset(null);
      if (selectedVisitorDossier) {
        const vId = typeof selectedVisitorDossier === "object" ? selectedVisitorDossier.visitor_id : selectedVisitorDossier;
        await openVisitorDossier(vId);
      }
    } catch (err) {
      console.error("Save dossier asset edit error:", err);
      alert(err.message || "Failed to save asset changes.");
    } finally {
      setDossierAssetOpLoading(false);
    }
  };

  const handleDirectVisitorCheckout = async (visitId, visitorName, forceClear = false) => {
    if (!visitId) {
      alert("No active visit ID found for this visitor.");
      return;
    }
    const confirmed = window.confirm(
      forceClear
        ? `Confirm clearance of all registered assets and check out ${visitorName || "this visitor"} now?`
        : `Check out ${visitorName || "this visitor"} from premises now?`
    );
    if (!confirmed) return;

    try {
      setDirectCheckoutLoading(String(visitId));
      const url = forceClear
        ? `${API_BASE_URL}/visits/checkout/${visitId}?clear_assets=true`
        : `${API_BASE_URL}/visits/checkout/${visitId}`;
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.status === "ASSETS_PENDING_CLEARANCE") {
        if (data.status === "ASSETS_PENDING_CLEARANCE") {
          const autoClearConfirm = window.confirm(
            `Notice: ${visitorName || "This visitor"} has registered equipment/assets that require exit clearance.

` +
            `Do you want to verify and clear all declared assets to complete checkout immediately?`
          );
          if (autoClearConfirm) {
            return handleDirectVisitorCheckout(visitId, visitorName, true);
          }
          return;
        }
        throw new Error(data.message || data.detail || `Checkout failed (${res.status})`);
      }

      alert(`Visitor ${visitorName || ""} has been checked out successfully.`);

      await Promise.allSettled([fetchDashboard(), fetchVisitors()]);

      if (selectedVisitorDossier) {
        const vId = typeof selectedVisitorDossier === "object" ? selectedVisitorDossier.visitor_id : selectedVisitorDossier;
        openVisitorDossier(vId);
      }
    } catch (err) {
      console.error("Direct checkout error:", err);
      alert(err.message || "Unable to check out visitor.");
    } finally {
      setDirectCheckoutLoading("");
    }
  };

  const handleDirectVisitorCheckIn = async (visitId, visitorName) => {
    if (!visitId) {
      alert("No visit ID found to check in.");
      return;
    }
    const confirmed = window.confirm(
      `Authorize campus admission and check in ${visitorName || "this visitor"} now?`
    );
    if (!confirmed) return;

    try {
      setDirectCheckoutLoading(String(visitId));
      const res = await fetch(`${API_BASE_URL}/visits/${visitId}/check-in`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.detail || `Check-in failed (${res.status})`);
      }
      alert(`Visitor ${visitorName || ""} has been checked in successfully.`);
      await Promise.allSettled([fetchDashboard(), fetchVisitors()]);
      if (selectedVisitorDossier) {
        const vId = typeof selectedVisitorDossier === "object" ? selectedVisitorDossier.visitor_id : selectedVisitorDossier;
        openVisitorDossier(vId);
      }
    } catch (err) {
      console.error("Direct check-in error:", err);
      alert(err.message || "Unable to check in visitor.");
    } finally {
      setDirectCheckoutLoading("");
    }
  };

  const handleDossierPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !dossierData?.visitor?.visitor_id) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setDossierPhotoUploading(true);
        const res = await fetch(`${API_BASE_URL}/visitors/${dossierData.visitor.visitor_id}/photo`, {
          method: "PATCH",
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ photo_data: reader.result }),
        });
        if (!res.ok) throw new Error("Failed to update photograph.");
        const json = await res.json();
        setDossierData((prev) => ({
          ...prev,
          visitor: {
            ...prev.visitor,
            photo_url: json.photo_url,
          },
        }));
        fetchVisitors();
      } catch (err) {
        alert(err.message || "Photo update failed.");
      } finally {
        setDossierPhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchVisitors = async () => {
    try {
      setVisitorLoading(true);
      setVisitorError("");
      const response = await fetch(`${API_BASE_URL}/visitors/`, {
        headers: authHeaders(),
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
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
      const response = await fetch(`${API_BASE_URL}/employees/`, {
        headers: authHeaders(),
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
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

  const fetchITAssets = async () => {
    try {
      setItAssetsLoading(true);
      setItAssetsError("");
      const response = await fetch(`${API_BASE_URL}/assets/inventory`, {
        headers: authHeaders(),
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) throw new Error(`Unable to fetch IT assets: ${response.status}`);
      const data = await response.json();
      setItAssets(Array.isArray(data.assets) ? data.assets : []);
      setItStats(data.statistics || null);
    } catch (err) {
      console.error("IT assets error:", err);
      setItAssets([]);
      setItAssetsError(err.message || "Unable to fetch IT assets");
    } finally {
      setItAssetsLoading(false);
    }
  };

  const handleClearAssetFromIT = async (assetId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/clear-for-exit`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Failed to authorize exit clearance");
      await fetchITAssets();
      setSelectedAssetDetail((prev) => {
        if (!prev || prev.asset_id !== assetId) return prev;
        return {
          ...prev,
          is_cleared_for_exit: true,
          cleared_by: currentUser?.email || "Security / IT Admin",
          cleared_at: new Date().toISOString(),
          custody_status: "CLEARED_EXIT",
        };
      });
    } catch (err) {
      console.error("IT asset clear error:", err);
      alert(err.message || "Failed to clear asset.");
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSerial(text);
      setTimeout(() => setCopiedSerial(""), 2000);
    }
  };

  const startITCamera = async () => {
    try {
      setItCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (itCameraVideoRef.current) {
        itCameraVideoRef.current.srcObject = stream;
        itCameraVideoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setRecoveryError("Camera access denied or unavailable. You can upload an image file instead.");
      setItCameraActive(false);
    }
  };

  const stopITCamera = () => {
    if (itCameraVideoRef.current && itCameraVideoRef.current.srcObject) {
      itCameraVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      itCameraVideoRef.current.srcObject = null;
    }
    setItCameraActive(false);
  };

  const captureITPhoto = () => {
    if (!itCameraVideoRef.current) return;
    const video = itCameraVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setNewRecoveryForm((prev) => ({ ...prev, photo_data: dataUrl }));
    stopITCamera();
  };

  const handleITFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewRecoveryForm((prev) => ({ ...prev, photo_data: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateRecovery = async (e) => {
    e.preventDefault();
    try {
      setRecoverySubmitting(true);
      setRecoveryError("");

      const payload = {
        host_employee_id: Number(newRecoveryForm.host_employee_id),
        asset_type: newRecoveryForm.asset_type,
        brand_model: newRecoveryForm.brand_model,
        serial_number: newRecoveryForm.serial_number,
        recovery_reason: newRecoveryForm.recovery_reason,
        photo_data: newRecoveryForm.photo_data,
        is_cleared_for_exit: newRecoveryForm.is_cleared_for_exit,
      };

      if (newRecoveryForm.carrier_type === "existing" && newRecoveryForm.visitor_id) {
        payload.visitor_id = Number(newRecoveryForm.visitor_id);
      } else {
        payload.first_name = newRecoveryForm.first_name;
        payload.last_name = newRecoveryForm.last_name;
        payload.phone_number = newRecoveryForm.phone_number;
        payload.email = newRecoveryForm.email;
        payload.company_name = newRecoveryForm.company_name;
        payload.address_line1 = newRecoveryForm.address_line1;
        payload.city = newRecoveryForm.city;
        payload.state = newRecoveryForm.state;
      }

      if (!payload.host_employee_id) {
        throw new Error("Please select an IT Host / Receiving Employee.");
      }
      if (newRecoveryForm.carrier_type === "new" && (!payload.first_name || !payload.phone_number)) {
        throw new Error("Carrier first name and phone number are required.");
      }

      const response = await fetch(`${API_BASE_URL}/assets/recovery`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to register asset recovery.");
      }

      const data = await response.json().catch(() => ({}));

      const carrierName = newRecoveryForm.carrier_type === "existing"
        ? (visitorList.find((v) => String(v.visitor_id) === String(newRecoveryForm.visitor_id))?.first_name || "Registered Visitor")
        : `${newRecoveryForm.first_name} ${newRecoveryForm.last_name}`.trim();

      addNotification({
        title: "IT Asset Recovery Logged",
        message: `${newRecoveryForm.brand_model || newRecoveryForm.asset_type} recovery logged for ${carrierName} (SN: ${newRecoveryForm.serial_number || "N/A"}).`,
        type: "it-visitor",
        time: "Just now",
      });

      const matchedHost = hostList.find((h) => String(h.employee_id) === String(newRecoveryForm.host_employee_id));
      const matchedVisitor = visitorList.find((v) => String(v.visitor_id) === String(newRecoveryForm.visitor_id));

      const receiptData = {
        asset_id: data.asset_id || `REC-${Date.now().toString().slice(-6)}`,
        asset_type: newRecoveryForm.asset_type,
        brand_model: newRecoveryForm.brand_model,
        serial_number: newRecoveryForm.serial_number,
        custody_status: newRecoveryForm.is_cleared_for_exit ? "CLEARED_EXIT" : "IN_IT_CUSTODY",
        cleared_by: newRecoveryForm.is_cleared_for_exit ? (currentUser?.email || "IT Admin") : null,
        created_at: new Date().toISOString(),
        visit: {
          purpose: newRecoveryForm.recovery_reason,
        },
        carrier_visitor: newRecoveryForm.carrier_type === "existing" && matchedVisitor
          ? {
              name: `${matchedVisitor.first_name} ${matchedVisitor.last_name}`.trim(),
              phone: matchedVisitor.phone_number || "—",
              email: matchedVisitor.email || "—",
              company: matchedVisitor.company_name || "Registered Visitor",
              origin_address: matchedVisitor.address_line1 || "On Record",
            }
          : {
              name: `${newRecoveryForm.first_name} ${newRecoveryForm.last_name}`.trim(),
              phone: newRecoveryForm.phone_number || "—",
              email: newRecoveryForm.email || "—",
              company: newRecoveryForm.company_name || "Individual / Remote",
              origin_address: [newRecoveryForm.address_line1, newRecoveryForm.city, newRecoveryForm.state].filter(Boolean).join(", ") || "On Record",
            },
        receiver_host: matchedHost
          ? {
              name: `${matchedHost.first_name} ${matchedHost.last_name}`.trim(),
              department: matchedHost.department || "IT Infrastructure",
            }
          : {
              name: "IT Custodian",
              department: "IT Infrastructure",
            },
      };

      stopITCamera();
      setShowAddRecoveryModal(false);
      setCurrentPage("it-assets");
      setPrintableAssetReceipt(receiptData);
      setNewRecoveryForm({
        carrier_type: "new",
        visitor_id: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        email: "",
        company_name: "",
        address_line1: "",
        city: "",
        state: "",
        host_employee_id: "",
        asset_type: "Laptop",
        brand_model: "",
        serial_number: "",
        recovery_reason: "Employee Offboarding Asset Recovery - Device Collection",
        photo_data: null,
        is_cleared_for_exit: false,
      });

      await fetchITAssets();
      await fetchDashboard();
      await fetchVisitors();
      fetchAuditNotifications();
    } catch (err) {
      console.error("Create recovery error:", err);
      setRecoveryError(err.message || "Failed to register recovery.");
    } finally {
      setRecoverySubmitting(false);
    }
  };

  const createHost = async (event) => {
    event.preventDefault();
    try {
      setHostCreating(true);
      setHostCreateError("");
      const response = await fetch(`${API_BASE_URL}/employees/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(hostForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to create host.");

      setHostForm({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        department: "",
        designation: "",
        office_location: "",
        notes: "",
        status: "ACTIVE",
      });
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

      const visitResponse = await fetch(`${API_BASE_URL}/visits/security/${visitId}`, {
        headers: authHeaders(),
      });
      if (!visitResponse.ok) throw new Error(`Visitor verification failed: ${visitResponse.status}`);
      const visitData = await visitResponse.json();
      console.log("VISIT API RESPONSE:", visitData);
      console.log("NESTED VISITOR:", visitData.visitor);
      console.log("TOP-LEVEL ADDRESS:", {
        address_line1: visitData.address_line1,
        address_line2: visitData.address_line2,
        city: visitData.city,
        state: visitData.state,
        postal_code: visitData.postal_code,
        country: visitData.country,
      });

      const decisionResponse = await fetch(`${API_BASE_URL}/visits/entry-decision/${visitId}`, {
        headers: authHeaders(),
      });
      if (!decisionResponse.ok) throw new Error(`Entry decision failed: ${decisionResponse.status}`);
      const decisionData = await decisionResponse.json();

      setVisit(visitData);
      setDecision(decisionData);

      try {
        const assetsResponse = await fetch(
          `${API_BASE_URL}/assets/?visit_id=${encodeURIComponent(visitId)}`,
          { headers: authHeaders() }
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

      const isITVisit = (visitData?.purpose || "").includes("[IT_VISIT]");
      const visitorName = visitData?.visitor
        ? `${visitData.visitor.first_name} ${visitData.visitor.last_name}`.trim()
        : "Visitor";
      const hostName = visitData?.host_employee
        ? `${visitData.host_employee.first_name} ${visitData.host_employee.last_name}`.trim()
        : "Host";
      const company = visitData?.visitor?.company_name
        ? ` (${visitData.visitor.company_name})`
        : "";

      if (decisionData?.decision === "ALLOW") {
        addNotification({
          title: isITVisit ? "IT Visitor Entry Verified" : "Visitor Entry Verified",
          message: isITVisit
            ? `${visitorName}${company} - IT Department technical visit entry verified at security gate. Host: ${hostName}.`
            : `${visitorName}${company} has been verified at security gate. Host: ${hostName}.`,
          type: isITVisit ? "it-visitor" : "visitor",
          time: "Just now",
        });
      } else if (notifyRejection && decisionData?.decision === "REJECT") {
        addNotification({
          title: isITVisit ? "IT Visitor Entry Rejected" : "Entry Rejected",
          message: `${visitorName}${company}'s entry has been rejected. Reason: ${decisionData.reason || "Unauthorized"}`,
          type: "warning",
          time: "Just now",
        });
      }

      fetchAuditNotifications();
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
        { method: "PATCH", headers: authHeaders() }
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

    const visitorName = `${visit.visitor?.first_name || ""} ${
      visit.visitor?.last_name || ""
    }`.trim() || "this visitor";

    const pendingAssets = visitAssets.filter(
      (asset) => !asset.is_cleared_for_exit
    );

    const assetStatus =
      pendingAssets.length > 0
        ? `${pendingAssets.length} asset(s) still need clearance.`
        : "All registered assets are cleared for exit.";

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
        headers: authHeaders(),
      });

      if (!response.ok) {
        let message = `Checkout failed: ${response.status}`;
        try {
          const data = await response.json();
          if (data?.detail) message = data.detail;
        } catch {
          // ignore parsing error
        }
        throw new Error(message);
      }

      const checkoutTime = new Date().toISOString();
      // The security endpoint may return a visitor object without every address
      // field. Merge it field-by-field with the visitor directory record so the
      // receipt does not lose address data that is already saved in the database.
      const directoryVisitor = visitorList.find(
        (item) => String(item.visitor_id) === String(visit.visitor?.visitor_id || visit.visitor_id)
      ) || {};
      const receiptVisitor = {
        ...directoryVisitor,
        ...(visit.visitor || {}),
        address_line1: visit.visitor?.address_line1 || directoryVisitor.address_line1 || "",
        address_line2: visit.visitor?.address_line2 || directoryVisitor.address_line2 || "",
        city: visit.visitor?.city || directoryVisitor.city || "",
        state: visit.visitor?.state || directoryVisitor.state || "",
        postal_code: visit.visitor?.postal_code || directoryVisitor.postal_code || "",
        country: visit.visitor?.country || directoryVisitor.country || "",
      };

      setCheckoutReceipt({
        receiptNumber: `VMS-${Date.now()}`,
        visitId: visit.visit_id,
        visitorName,
        companyName: receiptVisitor.company_name || "Not specified",
        purpose: visit.purpose || "Not specified",
        hostName: `${visit.host_employee?.first_name || ""} ${
          visit.host_employee?.last_name || ""
        }`.trim() || "Not specified",
        checkInTime: visit.check_in_time || null,
        checkoutTime,
        addressLine1: receiptVisitor.address_line1 || "",
        addressLine2: receiptVisitor.address_line2 || "",
        city: receiptVisitor.city || "",
        state: receiptVisitor.state || "",
        postalCode: receiptVisitor.postal_code || "",
        country: receiptVisitor.country || "",
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
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          first_name: newVisitor.first_name.trim(),
          last_name: newVisitor.last_name.trim(),
          phone_number: newVisitor.phone_number.trim(),
          email: newVisitor.email.trim(),
          company_name: newVisitor.company_name.trim(),
          address_line1: newVisitor.address_line1.trim(),
          address_line2: newVisitor.address_line2.trim(),
          city: newVisitor.city.trim(),
          state: newVisitor.state.trim(),
          postal_code: newVisitor.postal_code.trim(),
          country: newVisitor.country.trim(),
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
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
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
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    if (uuidRegex.test(value)) return value;

    try {
      const url = new URL(value);
      const queryVisitId =
        url.searchParams.get("visit_id") ||
        url.searchParams.get("visitId");

      if (queryVisitId && uuidRegex.test(queryVisitId)) return queryVisitId;

      const parts = url.pathname.split("/").filter(Boolean);
      for (let i = parts.length - 1; i >= 0; i--) {
        if (uuidRegex.test(parts[i])) return parts[i];
      }
    } catch {
      // Not a URL.
    }

    return null;
  };

  const extractVisitorPassToken = (decodedText) => {
    if (!decodedText) return null;

    try {
      const url = new URL(decodedText.trim());
      const parts = url.pathname.split("/").filter(Boolean);
      const passIndex = parts.lastIndexOf("visitor-pass");

      if (passIndex === -1 || !parts[passIndex + 1]) return null;

      return decodeURIComponent(parts[passIndex + 1]);
    } catch {
      return null;
    }
  };

  const openScanner = () => {
    setCurrentPage("scanner");
    setScannerError("");
    setScannerMessage("Scan a visitor QR code to verify entry.");
    setManualTokenInput("");
    setVisit(null);
    setDecision(null);
    setVisitAssets([]);
    setAssetsError("");
    setError("");
  };

  const handleQrDecoded = async (decodedText) => {
    if (scanProcessingRef.current) return;

    const directVisitId = extractVisitId(decodedText);
    const passToken = directVisitId
      ? null
      : extractVisitorPassToken(decodedText);

    if (!directVisitId && !passToken) {
      setScannerError(
        "Invalid QR code. Scan a valid Visit ID QR or Visitor Pass QR."
      );
      return;
    }

    scanProcessingRef.current = true;
    setScannerError("");
    setScannerMessage(
      passToken
        ? "Visitor Pass detected. Validating pass..."
        : "QR detected. Verifying visitor..."
    );

    try {
      let verifiedVisitId = directVisitId;

      if (passToken) {
        const response = await fetch(
          `${API_BASE_URL}/public-registration/verify-pass/${encodeURIComponent(passToken)}`
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const detail = data?.detail;
          const message = Array.isArray(detail)
            ? detail.map((item) => item.msg || "").filter(Boolean).join(", ")
            : detail;
          throw new Error(
            message || `Visitor Pass validation failed (${response.status}).`
          );
        }

        verifiedVisitId = data?.visit_id;
        if (!verifiedVisitId) {
          throw new Error(
            "The Visitor Pass was validated, but the backend did not return a Visit ID."
          );
        }
      }

      // Stop camera feed upon successful scan
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {
          // ignore
        }
      }
      setScannerCameraActive(false);

      await fetchVisit(verifiedVisitId);
      setScannerMessage("Visitor verification completed.");
    } catch (err) {
      console.error("QR visitor verification error:", err);
      setScannerError(err.message || "Unable to verify this QR code.");
      setScannerMessage("Scan a valid visitor QR code to try again.");
      scanProcessingRef.current = false;
    }
  };

  const startCamera = async (facing = cameraFacingMode, camId = selectedCameraId, silent = false) => {
    try {
      if (!silent) setScannerError("");
      setScannerMessage("Initializing camera...");

      const qrEl = document.getElementById("qr-reader");
      if (!qrEl) return;

      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      // Query available camera devices for the user
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
        }
      } catch (e) {
        console.warn("Could not list cameras:", e);
      }

      const cameraSource = camId ? camId : { facingMode: { ideal: facing } };

      await html5QrCode.start(
        cameraSource,
        {
          fps: 12,
          qrbox: (w, h) => {
            const minEdge = Math.min(w, h);
            const size = Math.floor(minEdge * 0.72);
            return { width: Math.max(160, size), height: Math.max(160, size) };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleQrDecoded(decodedText);
        },
        () => {}
      );

      setScannerCameraActive(true);
      setScannerError("");
      setScannerMessage(
        facing === "environment"
          ? "Back camera active. Align visitor pass QR within frame."
          : "Front camera active. Align visitor pass QR within frame."
      );
    } catch (err) {
      console.error("Camera start error:", err);
      setScannerCameraActive(false);
      if (!silent) {
        setScannerError("Camera permission denied or camera unavailable. Please allow camera access in browser settings.");
        setScannerMessage("Tap Start Scanning to retry or upload an image file.");
      } else {
        setScannerMessage("Camera ready. Tap Start Camera to begin scanning.");
      }
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.warn("Error stopping camera:", e);
      }
    }
    setScannerCameraActive(false);
    setScannerMessage("Camera paused. Tap Start Scanning to resume.");
  };

  const toggleCameraFacingMode = async () => {
    const nextMode = cameraFacingMode === "environment" ? "user" : "environment";
    setCameraFacingMode(nextMode);
    setSelectedCameraId("");
    if (scannerCameraActive) {
      await startCamera(nextMode, "");
    } else {
      setScannerMessage(
        nextMode === "environment"
          ? "Back Camera selected. Tap Start Scanning."
          : "Front Camera selected. Tap Start Scanning."
      );
    }
  };

  const handleCameraDeviceChange = async (deviceId) => {
    setSelectedCameraId(deviceId);
    if (scannerCameraActive) {
      await startCamera(cameraFacingMode, deviceId);
    }
  };

  const handleImageFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScannerError("");
    setScannerMessage("Decoding image QR pass...");
    try {
      const html5QrCode = html5QrCodeRef.current || new Html5Qrcode("qr-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleQrDecoded(decodedText);
    } catch (err) {
      console.error("File QR decode error:", err);
      setScannerError("No valid visitor QR code found in selected image. Please try another photo.");
      setScannerMessage("Scan a visitor QR code to verify entry.");
    }
    if (e.target) e.target.value = "";
  };

  useEffect(() => {
    if (currentPage !== "scanner" || visit) return;

    scanProcessingRef.current = false;
    let isMounted = true;

    const timer = setTimeout(() => {
      if (isMounted) {
        startCamera(cameraFacingMode, selectedCameraId, true);
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
      setScannerCameraActive(false);
    };
  }, [currentPage, visit]);

  const handleManualLookup = async (e) => {
    if (e) e.preventDefault();
    const raw = manualTokenInput.trim();
    if (!raw) return;

    const directVisitId = extractVisitId(raw);
    const passToken = directVisitId ? null : extractVisitorPassToken(raw) || raw;

    setScannerError("");
    setScannerMessage("Verifying visitor credentials...");
    setManualLookupLoading(true);

    try {
      let verifiedVisitId = directVisitId;

      if (passToken && !verifiedVisitId) {
        const response = await fetch(
          `${API_BASE_URL}/public-registration/verify-pass/${encodeURIComponent(passToken)}`
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const detail = data?.detail;
          const message = Array.isArray(detail)
            ? detail.map((item) => item.msg || "").filter(Boolean).join(", ")
            : detail;
          throw new Error(
            message || `Visitor pass lookup failed (${response.status}).`
          );
        }

        verifiedVisitId = data?.visit_id;
      }

      if (!verifiedVisitId) {
        throw new Error("Unable to identify a valid Visit ID or Pass Token.");
      }

      await fetchVisit(verifiedVisitId);
      setScannerMessage("Visitor pass verified successfully.");
    } catch (err) {
      console.error("Manual lookup error:", err);
      setScannerError(err.message || "Pass not found or invalid token.");
    } finally {
      setManualLookupLoading(false);
    }
  };

  /* =========================================================
     LIFECYCLE HOOKS
  ========================================================= */
  useEffect(() => {
    if (!authToken || !currentUser) return;

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders(),
    })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
        }
      })
      .catch(() => {});

    fetchDashboard();
    fetchVisitors();
    fetchHosts();
  }, [authToken, currentUser]);

  useEffect(() => {
    if (currentPage === "hosts" || currentPage === "it-hosts") {
      fetchHosts();
    }
  }, [currentPage]);

  useEffect(() => {
    if (currentPage === "checkout-history" || currentPage === "it-checkout-history") {
      fetchCheckoutHistory();
    }
  }, [currentPage]);

  useEffect(() => {
    if (selectedITHistoryVisit && itHistoryDetailsRef.current) {
      itHistoryDetailsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedITHistoryVisit]);

  useEffect(() => {
    if (currentPage === "it-assets") {
      fetchITAssets();
      fetchHosts();
    }
  }, [currentPage]);

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

  const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return `${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, ${date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;
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
  const filteredVisitors = visitors.filter((item) => {
    // Strictly exclude IT visits from general management dashboard
    if (item.purpose && String(item.purpose).toUpperCase().includes("[IT_VISIT]")) return false;

    if (dashboardVisitorFilter === "inside" && item.status !== "ACTIVE") return false;
    if (dashboardVisitorFilter === "checked_out" && item.status !== "CHECKED_OUT") return false;

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

  const activeVisitorIds = useMemo(() => {
    const ids = new Set();
    if (dashboardData && Array.isArray(dashboardData.visitors)) {
      dashboardData.visitors.forEach((v) => {
        if (v.status === "ACTIVE" && v.visitor_id != null) {
          ids.add(Number(v.visitor_id));
        }
      });
    }
    return ids;
  }, [dashboardData]);

  const activeVisitByVisitorId = useMemo(() => {
    const map = new Map();
    if (dashboardData && Array.isArray(dashboardData.visitors)) {
      dashboardData.visitors.forEach((v) => {
        if (v.status === "ACTIVE" && v.visitor_id != null && !map.has(Number(v.visitor_id))) {
          map.set(Number(v.visitor_id), v);
        }
      });
    }
    return map;
  }, [dashboardData]);

  const filteredDirectoryVisitors = useMemo(() => {
    if (!Array.isArray(visitorList)) return [];

    return visitorList.filter((item) => {
      // Never show IT technical visitors in General / Management Visitors directory
      const latestPurpose = String(item.latest_visit?.purpose || item.purpose || "");
      const anyItPurpose = (item.visits || []).some((vt) =>
        String(vt.purpose || "").toUpperCase().includes("[IT_VISIT]")
      );
      if (latestPurpose.toUpperCase().includes("[IT_VISIT]") || anyItPurpose) {
        return false;
      }

      const vId = Number(item.visitor_id);

      // 1. Filter by category
      if (visitorDirectoryFilter === "inside") {
        if (!activeVisitorIds.has(vId)) return false;
      } else if (visitorDirectoryFilter === "companies") {
        const hasCompany = Boolean(
          item.company_name &&
          item.company_name.trim() !== "" &&
          item.company_name.trim().toLowerCase() !== "n/a"
        );
        if (!hasCompany) return false;
        if (selectedCompanyFilter && item.company_name !== selectedCompanyFilter) {
          return false;
        }
      } else if (visitorDirectoryFilter === "active") {
        if (item.status === "INACTIVE" || item.is_active === false) return false;
      }

      // 2. Search query filter
      const search = visitorSearch.trim().toLowerCase();
      if (!search) return true;

      const name = `${item.first_name || ""} ${item.last_name || ""}`.trim().toLowerCase();
      const company = (item.company_name || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      const phone = (item.phone_number || "").toLowerCase();
      const address = [item.address_line1, item.address_line2, item.city, item.state, item.postal_code, item.country]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const idStr = String(item.visitor_id || "");

      return (
        name.includes(search) ||
        company.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        address.includes(search) ||
        idStr.includes(search)
      );
    });
  }, [visitorList, visitorDirectoryFilter, selectedCompanyFilter, activeVisitorIds, visitorSearch]);

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
    fetchDashboard();
  };

  const openCheckout = () => {
    setCurrentPage("checkout");
    // Refresh the dashboard list whenever staff opens checkout.
    fetchDashboard();
  };

  const openCheckoutHistory = () => {
    setCurrentPage("checkout-history");
    fetchCheckoutHistory();
  };

  const generatePassQR = async (visitId) => {
    if (!visitId) return;
    try {
      const passUrl = `${window.location.origin}/security-page/${encodeURIComponent(visitId)}`;
      const qr = await QRCode.toDataURL(passUrl, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setPassQrCode(qr);
    } catch (err) {
      console.error("QR generation error:", err);
    }
  };

  const openVisitorPassDetail = async (visitId) => {
    if (!visitId) return;
    setCurrentPage("visitor-pass-detail");
    setError("");
    setPassQrCode("");
    generatePassQR(visitId);
    await fetchVisit(visitId, false);
  };

  const handleClearAllAssetsForExit = async () => {
    const uncleared = visitAssets.filter((a) => !a.is_cleared_for_exit);
    for (const asset of uncleared) {
      await handleClearAssetForExit(asset.asset_id);
    }
  };

  useEffect(() => {
    if (currentPage === "visitor-pass-detail" && visit?.visit_id && !passQrCode) {
      generatePassQR(visit.visit_id);
    }
  }, [currentPage, visit?.visit_id, passQrCode]);

  const openITAssets = () => {
    setCurrentPage("it-assets");
    setItAssetsError("");
    fetchITAssets();
    fetchHosts();
    fetchVisitors();
  };

  const openLogAssetRecovery = () => {
    setCurrentPage("log-recovery");
    setRecoveryError("");
    fetchHosts();
    fetchVisitors();
  };

  const getAssetDisplayInfo = (asset) => {
    const fullText = (asset.brand_model || asset.asset_type || "Standard Device").trim();
    const serial = asset.serial_number || "NO-TAG";
    let title = fullText;
    let subtitle = asset.asset_type || "Hardware";

    if (fullText.toLowerCase().includes("software") || fullText.toLowerCase().includes("diagnostics") || fullText.toLowerCase().includes("consultation") || (asset.asset_type && asset.asset_type.toLowerCase().includes("no hardware"))) {
      title = "Software";
      subtitle = "Diagnostics / Consultation";
    } else if (fullText.toLowerCase().startsWith("lenovo thinkpad")) {
      title = fullText;
      subtitle = fullText.slice(15).trim() || "Laptop";
    } else if (fullText.toLowerCase().startsWith("dell poweredge")) {
      title = fullText;
      subtitle = fullText.slice(14).trim() || "Server Module";
    } else if (fullText.toLowerCase().startsWith("cisco catalyst")) {
      title = fullText;
      subtitle = fullText.slice(5).trim() || "Switch Module";
    } else if (fullText.toLowerCase().startsWith("dell precision")) {
      title = fullText;
      subtitle = "Laptop";
    } else if (fullText.includes(" - ")) {
      const parts = fullText.split(" - ");
      title = parts[0].trim();
      subtitle = parts[1].trim();
    }

    const lower = (fullText + " " + (asset.asset_type || "")).toLowerCase();
    let iconCategory = "others";
    if (lower.includes("software") || lower.includes("consultation") || lower.includes("diagnostic") || lower.includes("contractor (no hardware)")) {
      iconCategory = "software";
    } else if (lower.includes("laptop") || lower.includes("thinkpad") || lower.includes("precision") || lower.includes("macbook") || lower.includes("notebook")) {
      iconCategory = "laptop";
    } else if (lower.includes("server") || lower.includes("poweredge") || lower.includes("blade")) {
      iconCategory = "server";
    } else if (lower.includes("switch") || lower.includes("catalyst") || lower.includes("router") || lower.includes("cisco")) {
      iconCategory = "switch";
    } else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("tab")) {
      iconCategory = "mobile";
    }

    return { title, subtitle, serial, iconCategory };
  };

  const filteredITAssets = useMemo(() => {
    if (!Array.isArray(itAssets)) return [];

    let list = itAssets.filter((item) => {
      // 1. Category Filter
      if (itCategoryFilter === "on_premises") {
        if (item.custody_status !== "ON_PREMISES") return false;
      } else if (itCategoryFilter === "recoveries") {
        if (!item.is_recovery) return false;
      } else if (itCategoryFilter === "cleared") {
        if (!item.is_cleared_for_exit) return false;
      } else if (itCategoryFilter === "retained") {
        if (item.custody_status !== "RETAINED_BY_IT") return false;
      }

      // 2. Search query filter
      const search = itSearchQuery.trim().toLowerCase();
      if (!search) return true;

      const serial = (item.serial_number || "").toLowerCase();
      const model = (item.brand_model || "").toLowerCase();
      const type = (item.asset_type || "").toLowerCase();
      const carrierName = (item.carrier_visitor?.name || "").toLowerCase();
      const company = (item.carrier_visitor?.company || "").toLowerCase();
      const origin = (item.carrier_visitor?.origin_address || "").toLowerCase();
      const hostName = (item.receiver_host?.name || "").toLowerCase();
      const purpose = (item.visit?.purpose || "").toLowerCase();

      return (
        serial.includes(search) ||
        model.includes(search) ||
        type.includes(search) ||
        carrierName.includes(search) ||
        company.includes(search) ||
        origin.includes(search) ||
        hostName.includes(search) ||
        purpose.includes(search)
      );
    });

    if (itSortOrder === "newest") {
      list.sort((a, b) => new Date(b.created_at || b.check_in_time || 0) - new Date(a.created_at || a.check_in_time || 0));
    } else if (itSortOrder === "oldest") {
      list.sort((a, b) => new Date(a.created_at || a.check_in_time || 0) - new Date(b.created_at || b.check_in_time || 0));
    }

    return list;
  }, [itAssets, itCategoryFilter, itSearchQuery, itSortOrder]);

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
    // Management & General notifications strictly exclude IT notifications
    const targetNotifications = generalNotifications;
    const unreadCount = targetNotifications.filter((n) => !n.read).length;
    const gateCount = targetNotifications.filter(
      (n) =>
        (n.title || "").toLowerCase().includes("gate") ||
        (n.title || "").toLowerCase().includes("entry") ||
        (n.title || "").toLowerCase().includes("verified") ||
        (n.title || "").toLowerCase().includes("clear")
    ).length;
    const requestCount = targetNotifications.filter(
      (n) =>
        (n.title || "").toLowerCase().includes("request") ||
        (n.title || "").toLowerCase().includes("register") ||
        (n.title || "").toLowerCase().includes("pre-approval")
    ).length;
    const rescheduleCount = targetNotifications.filter(
      (n) =>
        (n.action || "").toUpperCase().includes("RESCHEDULED") ||
        (n.title || "").toLowerCase().includes("rescheduled") ||
        (n.message || "").toLowerCase().includes("rescheduled")
    ).length;

    const filtered = targetNotifications.filter((n) => {
      // Tab filter
      if (notificationFilter === "unread" && n.read) return false;
      if (
        notificationFilter === "gate" &&
        !(n.title || "").toLowerCase().includes("gate") &&
        !(n.title || "").toLowerCase().includes("entry") &&
        !(n.title || "").toLowerCase().includes("verified") &&
        !(n.title || "").toLowerCase().includes("clear")
      )
        return false;
      if (
        notificationFilter === "request" &&
        !(n.title || "").toLowerCase().includes("request") &&
        !(n.title || "").toLowerCase().includes("register") &&
        !(n.title || "").toLowerCase().includes("pre-approval")
      )
        return false;
      if (
        notificationFilter === "rescheduled" &&
        !(n.action || "").toUpperCase().includes("RESCHEDULED") &&
        !(n.title || "").toLowerCase().includes("rescheduled") &&
        !(n.message || "").toLowerCase().includes("rescheduled")
      )
        return false;

      // Search query filter
      if (notifSearchQuery.trim()) {
        const q = notifSearchQuery.toLowerCase();
        const inTitle = (n.title || "").toLowerCase().includes(q);
        const inMsg = (n.message || "").toLowerCase().includes(q);
        const inTime = (n.time || "").toLowerCase().includes(q);
        if (!inTitle && !inMsg && !inTime) return false;
      }

      return true;
    });

    return (
      <>
        {/* =========================================================
            DESKTOP VIEW (> 768px): PRESERVED 100% UNTOUCHED
        ========================================================= */}
        <div className="vms-desktop-only">
        {/* Executive Notifications Header */}
        <div className="notif-management-header">
          <div className="notif-header-title-box">
            <div className="notif-header-badge-row">
              <span className="notif-division-pill">VISITOR MANAGEMENT</span>
              <span className="notif-telemetry-pill">
                <span className="status-dot"></span>
                Visitor Telemetry Active
              </span>
            </div>
            <h2 className="notif-page-title">Visitor Notifications</h2>
            <p className="notif-page-desc">
              Audit log of general visitor check-ins, security gate clearances, host arrivals, and visitor requests
            </p>
          </div>

          <div className="notif-header-controls">
            {unreadCount > 0 ? (
              <div className="notif-unread-indicator-badge">
                <span className="unread-pulse-dot"></span>
                <span>
                  <strong>{unreadCount}</strong> Unread Notification{unreadCount > 1 ? "s" : ""}
                </span>
              </div>
            ) : (
              <div className="notif-caught-up-badge">
                <CheckCircle2 size={13} color="#059669" />
                <span>All Caught Up</span>
              </div>
            )}

            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-header-btn"
                onClick={markGeneralNotificationsAsRead}
                title="Mark all visitor notifications as read"
              >
                <CheckCheck size={15} />
                <span>Mark all as read</span>
              </button>
            )}

            {generalNotifications.length > 0 && (
              <button
                type="button"
                className="notif-header-btn clear"
                onClick={clearGeneralNotifications}
                title="Clear general notification history"
              >
                <Trash2 size={14} />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Bell size={20} />
            </div>
            <div className="stat-content">
              <strong>{targetNotifications.length}</strong>
              <span>Total Activity Logs</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon amber">
              <BellRing size={20} />
            </div>
            <div className="stat-content">
              <strong>{unreadCount}</strong>
              <span>Unread Telemetry</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <ShieldCheck size={20} />
            </div>
            <div className="stat-content">
              <strong>{gateCount}</strong>
              <span>Gate Access Clearances</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Users size={20} />
            </div>
            <div className="stat-content">
              <strong>{requestCount}</strong>
              <span>Registration Requests</span>
            </div>
          </div>
        </section>

        {/* Notifications Main Panel */}
        <section className="table-card notif-main-card">
          <div className="notif-toolbar">
            <div className="notif-filter-pills-row">
              <button
                type="button"
                className={`notif-filter-tab ${notificationFilter === "all" ? "active" : ""}`}
                onClick={() => setNotificationFilter("all")}
              >
                All Activities ({targetNotifications.length})
              </button>
              <button
                type="button"
                className={`notif-filter-tab ${notificationFilter === "unread" ? "active" : ""}`}
                onClick={() => setNotificationFilter("unread")}
              >
                <span className="unread-dot-small"></span>
                Unread ({unreadCount})
              </button>
              {gateCount > 0 && (
                <button
                  type="button"
                  className={`notif-filter-tab ${notificationFilter === "gate" ? "active" : ""}`}
                  onClick={() => setNotificationFilter("gate")}
                >
                  <ShieldCheck size={12} />
                  Gate Clearances ({gateCount})
                </button>
              )}
              {requestCount > 0 && (
                <button
                  type="button"
                  className={`notif-filter-tab ${notificationFilter === "request" ? "active" : ""}`}
                  onClick={() => setNotificationFilter("request")}
                >
                  <Users size={12} />
                  Visitor Requests ({requestCount})
                </button>
              )}
              {rescheduleCount > 0 && (
                <button
                  type="button"
                  className={`notif-filter-tab ${notificationFilter === "rescheduled" ? "active" : ""}`}
                  onClick={() => setNotificationFilter("rescheduled")}
                >
                  <CalendarClock size={12} />
                  Rescheduled ({rescheduleCount})
                </button>
              )}
            </div>

            <div className="notif-search-field">
              <Search size={14} />
              <input
                value={notifSearchQuery}
                onChange={(e) => setNotifSearchQuery(e.target.value)}
                placeholder="Search visitor notification text, visitor, host..."
              />
              {notifSearchQuery && (
                <button
                  type="button"
                  className="notif-search-clear"
                  onClick={() => setNotifSearchQuery("")}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state notif-empty-state">
              <div className="notif-empty-icon-wrap">
                <BellOff size={26} />
              </div>
              <strong className="notif-empty-title">
                {notificationFilter === "unread"
                  ? "You're all caught up! No unread notifications"
                  : notifSearchQuery
                  ? `No notifications found matching "${notifSearchQuery}"`
                  : "No notifications available"}
              </strong>
              <p className="notif-empty-desc">
                {notificationFilter === "unread"
                  ? "All general visitor activities have been acknowledged."
                  : notifSearchQuery
                  ? "Try a different search keyword or reset the filter."
                  : "General visitor check-ins, entry approvals, and security passes will appear here in real-time."}
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "10px" }}>
                {(notificationFilter !== "all" || notifSearchQuery) && (
                  <button
                    type="button"
                    className="primary-button notif-reset-btn"
                    onClick={() => {
                      setNotificationFilter("all");
                      setNotifSearchQuery("");
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>Show All Activities</span>
                  </button>
                )}
                {readNotificationPreferences().hiddenIds?.length > 0 && (
                  <button
                    type="button"
                    className="secondary-action-btn"
                    style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "8px", background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534", fontWeight: 700 }}
                    onClick={() => {
                      const prefs = readNotificationPreferences();
                      prefs.hiddenIds = [];
                      saveNotificationPreferences(prefs);
                      fetchAuditNotifications();
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>Restore Cleared Activity History</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="notif-list-wrap">
              {filtered.map((notification) => {
                const isUnread = !notification.read;
                const isSuccess = notification.type === "success";
                const isWarning = notification.type === "warning";

                // Choose badge and icon
                let iconElem = <Bell size={18} />;
                let iconTypeClass = "info";
                let badgeText = "VISITOR EVENT";
                let badgeClass = "badge-info";

                if (isSuccess) {
                  iconElem = <CheckCircle2 size={18} />;
                  iconTypeClass = "success";
                  badgeText = notification.title?.includes("Cleared")
                    ? "EXIT CLEARANCE"
                    : notification.title?.includes("Checked Out")
                    ? "CHECKOUT"
                    : "VERIFIED";
                  badgeClass = "badge-success";
                } else if (isWarning) {
                  iconElem = <AlertTriangle size={18} />;
                  iconTypeClass = "warning";
                  badgeText = "ALERT";
                  badgeClass = "badge-warning";
                } else if (
                  notification.type === "visitor" ||
                  notification.title?.includes("Visitor")
                ) {
                  iconElem = <UserCheck size={18} />;
                  iconTypeClass = "visitor";
                  badgeText = "VISITOR PASS";
                  badgeClass = "badge-visitor";
                }

                return (
                  <div
                    key={notification.id}
                    className={`notif-item-row ${isUnread ? "unread" : "read"}`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className={`notif-item-icon-box ${iconTypeClass}`}>{iconElem}</div>

                    <div className="notif-item-content">
                      <div className="notif-item-topbar">
                        <div className="notif-title-group">
                          <strong className="notif-title">{notification.title}</strong>
                          <span className={`notif-category-badge ${badgeClass}`}>{badgeText}</span>
                          {isUnread && (
                            <span
                              className="notif-unread-glow-dot"
                              title="Unread notification"
                            />
                          )}
                        </div>

                        <div className="notif-timestamp">
                          <Clock size={11} />
                          <span>{notification.time}</span>
                        </div>
                      </div>

                      <p className="notif-message-text">{notification.message}</p>
                      {(notification.action?.includes("REQUEST_RAISED") ||
                        notification.action?.includes("RESCHEDULED") ||
                        (notification.message || "").toLowerCase().includes("awaiting") ||
                        (notification.message || "").toLowerCase().includes("pre-approval")) && (
                        <div style={{ marginTop: "6px" }}>
                          <button
                            type="button"
                            className="secondary-action-btn"
                            style={{
                              padding: "3px 10px",
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#0284c7",
                              borderColor: "#bae6fd",
                              background: "#f0f9ff",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notification.id);
                              openPreApprovals(false);
                            }}
                          >
                            Review in Pre-Approvals →
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="notif-item-actions" onClick={(e) => e.stopPropagation()}>
                      {isUnread && (
                        <button
                          type="button"
                          className="notif-item-btn read-btn"
                          onClick={() => markNotificationAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="notif-item-btn dismiss-btn"
                        onClick={(e) => dismissNotification(e, notification.id)}
                        title="Dismiss notification"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        </div>

        {/* =========================================================
            MOBILE VIEW (<= 768px): VISITOR NOTIFICATIONS
        ========================================================= */}
        <div className="vms-mobile-only mobile-visitor-notif-container">
          {/* 1. Executive Dark Navy Hero Card */}
          <div className="mobile-visitor-notif-hero">
            <div className="mobile-visitor-notif-hero-badge-row">
              <span className="mobile-visitor-notif-division-pill">VISITOR MANAGEMENT</span>
              <span className="mobile-visitor-notif-telemetry-pill">
                <span className="status-dot"></span>
                Visitor Telemetry Active
              </span>
            </div>

            <h2 className="mobile-visitor-notif-hero-title">Visitor Notifications</h2>
            <p className="mobile-visitor-notif-hero-desc">
              Audit log of general visitor check-ins, security gate clearances, host arrivals, and visitor requests.
            </p>

            {/* Actions inside Hero Card */}
            <div className="mobile-visitor-notif-hero-actions">
              <div
                className="mobile-visitor-notif-unread-banner"
                onClick={() => setNotificationFilter((prev) => (prev === "unread" ? "all" : "unread"))}
                role="button"
                tabIndex={0}
              >
                <div className="unread-banner-left">
                  <Bell size={15} />
                  <span>{unreadCount} Unread Notifications</span>
                </div>
                <ChevronRight size={15} />
              </div>

              <button
                type="button"
                className="mobile-visitor-notif-btn-read"
                onClick={markGeneralNotificationsAsRead}
              >
                <Check size={16} />
                <span>Mark all as read</span>
              </button>

              <button
                type="button"
                className="mobile-visitor-notif-btn-clear"
                onClick={clearGeneralNotifications}
              >
                <Trash2 size={15} />
                <span>Clear all</span>
              </button>
            </div>
          </div>

          {/* 2. 2x2 Metric Cards Grid */}
          <section className="mobile-visitor-notif-stats-grid">
            <div className="mobile-visitor-notif-stat-card">
              <div className="mobile-visitor-notif-stat-top">
                <div className="mobile-visitor-notif-stat-icon blue">
                  <Bell size={16} />
                </div>
                <span className="mobile-visitor-notif-stat-label">Total Activity Logs</span>
              </div>
              <div className="mobile-visitor-notif-stat-bottom">
                <strong className="mobile-visitor-notif-stat-value">{targetNotifications.length}</strong>
                <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="mobile-visitor-notif-sparkline">
                  <path d="M2 14 C 10 18, 16 6, 24 12 C 32 18, 38 4, 42 7" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="mobile-visitor-notif-stat-card">
              <div className="mobile-visitor-notif-stat-top">
                <div className="mobile-visitor-notif-stat-icon amber">
                  <BellRing size={16} />
                </div>
                <span className="mobile-visitor-notif-stat-label">Unread Telemetry</span>
              </div>
              <div className="mobile-visitor-notif-stat-bottom">
                <strong className="mobile-visitor-notif-stat-value">{unreadCount}</strong>
                <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="mobile-visitor-notif-sparkline">
                  <path d="M2 14 C 10 18, 16 6, 24 12 C 32 18, 38 4, 42 7" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="mobile-visitor-notif-stat-card">
              <div className="mobile-visitor-notif-stat-top">
                <div className="mobile-visitor-notif-stat-icon green">
                  <ShieldCheck size={16} />
                </div>
                <span className="mobile-visitor-notif-stat-label">Gate Access Clearances</span>
              </div>
              <div className="mobile-visitor-notif-stat-bottom">
                <strong className="mobile-visitor-notif-stat-value">{gateCount}</strong>
                <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="mobile-visitor-notif-sparkline">
                  <path d="M2 14 C 10 18, 16 6, 24 12 C 32 18, 38 4, 42 7" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="mobile-visitor-notif-stat-card">
              <div className="mobile-visitor-notif-stat-top">
                <div className="mobile-visitor-notif-stat-icon purple">
                  <Users size={16} />
                </div>
                <span className="mobile-visitor-notif-stat-label">Registration Requests</span>
              </div>
              <div className="mobile-visitor-notif-stat-bottom">
                <strong className="mobile-visitor-notif-stat-value">{requestCount}</strong>
                <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="mobile-visitor-notif-sparkline">
                  <path d="M2 14 C 10 18, 16 6, 24 12 C 32 18, 38 4, 42 7" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </section>

          {/* 3. Scope Filter Tabs Row */}
          <div className="mobile-visitor-notif-tabs-row">
            <button
              type="button"
              className={`mobile-visitor-notif-tab ${notificationFilter === "all" ? "active" : ""}`}
              onClick={() => setNotificationFilter("all")}
            >
              <Bell size={14} />
              <span>All Activities ({targetNotifications.length})</span>
            </button>
            <button
              type="button"
              className={`mobile-visitor-notif-tab ${notificationFilter === "unread" ? "active" : ""}`}
              onClick={() => setNotificationFilter("unread")}
            >
              <span className="tab-unread-dot"></span>
              <span>Unread ({unreadCount})</span>
            </button>
            {gateCount > 0 && (
              <button
                type="button"
                className={`mobile-visitor-notif-tab ${notificationFilter === "gate" ? "active" : ""}`}
                onClick={() => setNotificationFilter("gate")}
              >
                <ShieldCheck size={14} />
                <span>Gate Clearances ({gateCount})</span>
              </button>
            )}
            {requestCount > 0 && (
              <button
                type="button"
                className={`mobile-visitor-notif-tab ${notificationFilter === "request" ? "active" : ""}`}
                onClick={() => setNotificationFilter("request")}
              >
                <Users size={14} />
                <span>Visitor Requests ({requestCount})</span>
              </button>
            )}
          </div>

          {/* 4. Search and Filter Bar */}
          <div className="mobile-visitor-notif-search-row">
            <div className="mobile-visitor-notif-search-box" style={{ position: "relative", display: "flex", alignItems: "center", flex: 1 }}>
              <Search size={15} className="mobile-visitor-notif-search-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", zIndex: 2 }} />
              <input
                type="text"
                className="mobile-visitor-notif-search-input"
                style={{ width: "100%", height: "42px", paddingLeft: "42px", paddingRight: "38px", borderRadius: "12px", fontSize: "13.5px", boxSizing: "border-box" }}
                value={notifSearchQuery}
                onChange={(e) => setNotifSearchQuery(e.target.value)}
                placeholder="Search visitor notifications, host, gate..."
              />
              {notifSearchQuery && (
                <button
                  type="button"
                  className="mobile-visitor-notif-search-clear"
                  onClick={() => setNotifSearchQuery("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="mobile-visitor-notif-filter-toggle-btn"
              title="Toggle filter view"
              onClick={() => setNotificationFilter((prev) => (prev === "unread" ? "all" : "unread"))}
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>

          {/* 5. Notification Cards List */}
          <div className="mobile-visitor-notif-cards-list">
            {filtered.length === 0 ? (
              <div className="mobile-visitor-notif-empty-state">
                <BellRing size={28} color="#94a3b8" />
                <p>No visitor notifications found.</p>
              </div>
            ) : (
              filtered.map((notification) => {
                const isUnread = !notification.read;
                const isSuccess = notification.type === "success";
                const isWarning = notification.type === "warning";

                let icon = <Bell size={18} />;
                let iconBoxClass = "info";
                let badgeText = "VISITOR EVENT";
                let badgeClass = "info";

                if (isSuccess) {
                  icon = <CheckCircle2 size={18} />;
                  iconBoxClass = "green";
                  badgeText = notification.title?.includes("Cleared")
                    ? "EXIT CLEARANCE"
                    : notification.title?.includes("Checked Out")
                    ? "CHECKOUT"
                    : "VERIFIED";
                  badgeClass = "green";
                } else if (isWarning) {
                  icon = <AlertTriangle size={18} />;
                  iconBoxClass = "amber";
                  badgeText = "ALERT";
                  badgeClass = "amber";
                } else if (
                  notification.type === "visitor" ||
                  notification.title?.includes("Visitor")
                ) {
                  icon = <UserCheck size={18} />;
                  iconBoxClass = "blue";
                  badgeText = "VISITOR PASS";
                  badgeClass = "blue";
                } else if (
                  notification.action?.includes("REQUEST") ||
                  notification.title?.includes("Registration") ||
                  notification.title?.includes("Request")
                ) {
                  icon = <Users size={18} />;
                  iconBoxClass = "purple";
                  badgeText = "REGISTRATION";
                  badgeClass = "purple";
                } else if (
                  notification.action?.includes("GATE") ||
                  notification.title?.includes("Gate") ||
                  notification.title?.includes("Clearance") ||
                  notification.title?.includes("Security")
                ) {
                  icon = <ShieldCheck size={18} />;
                  iconBoxClass = "green";
                  badgeText = "GATE CLEARANCE";
                  badgeClass = "green";
                }

                return (
                  <div
                    key={notification.id}
                    className={`mobile-visitor-notif-card ${isUnread ? "unread" : ""}`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="mobile-visitor-notif-card-inner">
                      <div className={`mobile-visitor-notif-card-icon-box ${iconBoxClass}`}>
                        {icon}
                      </div>

                      <div className="mobile-visitor-notif-card-body">
                        <div className="mobile-visitor-notif-card-header">
                          <h4 className="mobile-visitor-notif-card-title">{notification.title}</h4>
                          <div className="mobile-visitor-notif-card-top-right">
                            {isUnread && <span className="mobile-visitor-notif-blue-dot"></span>}
                            <button
                              type="button"
                              className="mobile-visitor-notif-card-dots"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(e, notification.id);
                              }}
                              title="Dismiss notification"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="mobile-visitor-notif-card-badge-row">
                          <span className={`mobile-visitor-notif-tag-badge ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </div>

                        <div className="mobile-visitor-notif-card-time-row">
                          <Clock size={11} />
                          <span>{notification.time}</span>
                        </div>

                        <p className="mobile-visitor-notif-card-message">
                          {notification.message}
                        </p>

                        {(notification.action?.includes("REQUEST_RAISED") ||
                          notification.action?.includes("RESCHEDULED") ||
                          (notification.message || "").toLowerCase().includes("awaiting") ||
                          (notification.message || "").toLowerCase().includes("pre-approval")) && (
                          <button
                            type="button"
                            className="mobile-visitor-notif-preapproval-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notification.id);
                              openPreApprovals(false);
                            }}
                          >
                            Review in Pre-Approvals →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </>
    );
  };

  const renderITNotifications = () => {
    const unreadCount = itUnreadCount;
    const assetCount = itNotifications.filter(
      (n) =>
        (n.action || "").includes("ASSET") ||
        (n.title || "").toLowerCase().includes("asset") ||
        (n.message || "").toLowerCase().includes("hardware") ||
        (n.message || "").toLowerCase().includes("asset")
    ).length;
    const gateCount = itNotifications.filter(
      (n) =>
        (n.action || "").includes("CHECK") ||
        (n.title || "").toLowerCase().includes("gate") ||
        (n.title || "").toLowerCase().includes("entry") ||
        (n.title || "").toLowerCase().includes("verified") ||
        (n.title || "").toLowerCase().includes("clear")
    ).length;

    const filtered = itNotifications.filter((n) => {
      // Tab filter
      if (itNotifFilter === "unread" && n.read) return false;
      if (
        itNotifFilter === "asset" &&
        !(n.action || "").includes("ASSET") &&
        !(n.title || "").toLowerCase().includes("asset") &&
        !(n.message || "").toLowerCase().includes("hardware") &&
        !(n.message || "").toLowerCase().includes("asset")
      )
        return false;
      if (
        itNotifFilter === "gate" &&
        !(n.action || "").includes("CHECK") &&
        !(n.title || "").toLowerCase().includes("gate") &&
        !(n.title || "").toLowerCase().includes("entry") &&
        !(n.title || "").toLowerCase().includes("verified") &&
        !(n.title || "").toLowerCase().includes("clear")
      )
        return false;

      // Search query filter
      if (itNotifSearchQuery.trim()) {
        const q = itNotifSearchQuery.toLowerCase();
        const inTitle = (n.title || "").toLowerCase().includes(q);
        const inMsg = (n.message || "").toLowerCase().includes(q);
        const inTime = (n.time || "").toLowerCase().includes(q);
        if (!inTitle && !inMsg && !inTime) return false;
      }

      return true;
    });

    return (
      <>
        {/* =========================================================
            DESKTOP VIEW (PRESERVED 100% UNTOUCHED)
        ========================================================= */}
        <div className="vms-desktop-only">
        {/* Executive IT Notifications Header */}
        <div className="notif-management-header">
          <div className="notif-header-title-box">
            <div className="notif-header-badge-row">
              <span className="notif-division-pill">IT Department Division</span>
              <span className="notif-telemetry-pill">
                <span className="status-dot"></span>
                IT Technical Telemetry Active
              </span>
            </div>
            <h2 className="notif-page-title">IT Visit Notifications</h2>
            <p className="notif-page-desc">
              Dedicated real-time telemetry, hardware custody alerts, and security clearances exclusively for IT technical personnel and contractors
            </p>
          </div>

          <div className="notif-header-controls">
            {unreadCount > 0 ? (
              <div className="notif-unread-indicator-badge notif-it-unread-indicator">
                <span className="unread-pulse-dot"></span>
                <span>
                  <strong>{unreadCount}</strong> Unread IT Notification{unreadCount > 1 ? "s" : ""}
                </span>
              </div>
            ) : (
              <div className="notif-caught-up-badge">
                <CheckCircle2 size={13} color="#059669" />
                <span>All Caught Up</span>
              </div>
            )}

            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-header-btn"
                onClick={markITNotificationsAsRead}
                title="Mark all IT notifications as read"
              >
                <CheckCheck size={15} />
                <span>Mark all as read</span>
              </button>
            )}

            {itNotifications.length > 0 && (
              <button
                type="button"
                className="notif-header-btn clear"
                onClick={clearITNotifications}
                title="Clear IT notification history"
              >
                <Trash2 size={14} />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <section className="stats-grid notif-metrics-grid">
          <div className="stat-card notif-metric-card">
            <div className="stat-icon notif-metric-icon purple">
              <Server size={22} />
            </div>
            <div className="stat-content notif-metric-content">
              <strong className="notif-metric-val">{itNotifications.length}</strong>
              <span className="notif-metric-lbl">Total IT Telemetry</span>
            </div>
          </div>

          <div className="stat-card notif-metric-card">
            <div className="stat-icon notif-metric-icon amber">
              <BellRing size={22} />
            </div>
            <div className="stat-content notif-metric-content">
              <strong className="notif-metric-val">{unreadCount}</strong>
              <span className="notif-metric-lbl">Unread Alerts</span>
            </div>
          </div>

          <div className="stat-card notif-metric-card">
            <div className="stat-icon notif-metric-icon blue">
              <Laptop size={22} />
            </div>
            <div className="stat-content notif-metric-content">
              <strong className="notif-metric-val">{assetCount}</strong>
              <span className="notif-metric-lbl">Hardware Custody Events</span>
            </div>
          </div>

          <div className="stat-card notif-metric-card">
            <div className="stat-icon notif-metric-icon green">
              <ShieldCheck size={22} />
            </div>
            <div className="stat-content notif-metric-content">
              <strong className="notif-metric-val">{gateCount}</strong>
              <span className="notif-metric-lbl">Gate &amp; Server Clearances</span>
            </div>
          </div>
        </section>

        {/* IT Notifications Main Panel */}
        <section className="table-card notif-main-card">
          <div className="notif-toolbar">
            <div className="notif-filter-pills-row">
              <button
                type="button"
                className={`notif-filter-tab ${itNotifFilter === "all" ? "active" : ""}`}
                onClick={() => setItNotifFilter("all")}
              >
                All IT Visits ({itNotifications.length})
              </button>
              <button
                type="button"
                className={`notif-filter-tab ${itNotifFilter === "unread" ? "active" : ""}`}
                onClick={() => setItNotifFilter("unread")}
              >
                <span className="unread-dot-small" style={{ background: "#7c3aed" }}></span>
                Unread ({unreadCount})
              </button>
              {assetCount > 0 && (
                <button
                  type="button"
                  className={`notif-filter-tab ${itNotifFilter === "asset" ? "active" : ""}`}
                  onClick={() => setItNotifFilter("asset")}
                >
                  <Laptop size={12} />
                  Hardware Custody ({assetCount})
                </button>
              )}
              {gateCount > 0 && (
                <button
                  type="button"
                  className={`notif-filter-tab ${itNotifFilter === "gate" ? "active" : ""}`}
                  onClick={() => setItNotifFilter("gate")}
                >
                  <ShieldCheck size={12} />
                  Gate Clearances ({gateCount})
                </button>
              )}
            </div>

            <div className="notif-search-field">
              <Search size={14} />
              <input
                value={itNotifSearchQuery}
                onChange={(e) => setItNotifSearchQuery(e.target.value)}
                placeholder="Search IT notifications, asset ID, contractor, serial..."
              />
              {itNotifSearchQuery && (
                <button
                  type="button"
                  className="notif-search-clear"
                  onClick={() => setItNotifSearchQuery("")}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state notif-empty-state">
              <div className="notif-empty-icon-wrap" style={{ background: "#faf5ff", color: "#7c3aed" }}>
                <BellRing size={26} />
              </div>
              <strong className="notif-empty-title">
                {itNotifFilter === "unread"
                  ? "You're all caught up! No unread IT visit notifications"
                  : itNotifSearchQuery
                  ? `No IT notifications found matching "${itNotifSearchQuery}"`
                  : "No IT visit notifications available"}
              </strong>
              <p className="notif-empty-desc">
                {itNotifFilter === "unread"
                  ? "All IT contractor arrivals, gate clearances, and hardware custody updates have been acknowledged."
                  : itNotifSearchQuery
                  ? "Try a different search keyword or reset the filter."
                  : "Real-time alerts for IT visits, contractor entry/exit, and equipment tracking will appear here."}
              </p>
              {(itNotifFilter !== "all" || itNotifSearchQuery) && (
                <button
                  type="button"
                  className="primary-button notif-reset-btn"
                  onClick={() => {
                    setItNotifFilter("all");
                    setItNotifSearchQuery("");
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Show All IT Visits</span>
                </button>
              )}
            </div>
          ) : (
            <div className="notif-list-wrap">
              {filtered.map((notification) => {
                const isUnread = !notification.read;
                const act = String(notification.action || "");
                const tit = String(notification.title || "");

                // Categorize IT item
                let iconElem = <Laptop size={18} />;
                let badgeText = "IT VISIT";

                if (act.includes("ASSET") || tit.includes("Asset")) {
                  iconElem = <Laptop size={18} />;
                  badgeText = tit.includes("Cleared") ? "ASSET EXIT CLEARANCE" : "HARDWARE CUSTODY";
                } else if (act.includes("REQUEST") || tit.includes("Request")) {
                  iconElem = <Server size={18} />;
                  badgeText = "IT VISIT REQUEST";
                } else if (act.includes("CHECKED_IN") || tit.includes("Checked In")) {
                  iconElem = <UserCheck size={18} />;
                  badgeText = "IT CONTRACTOR ARRIVED";
                } else if (act.includes("CHECKED_OUT") || tit.includes("Checked Out")) {
                  iconElem = <CheckCircle2 size={18} />;
                  badgeText = "IT CONTRACTOR CHECKED OUT";
                } else if (act.includes("VERIF") || tit.includes("Verified")) {
                  iconElem = <ShieldCheck size={18} />;
                  badgeText = "IT SECURITY VERIFIED";
                }

                return (
                  <div
                    key={notification.id}
                    className={`notif-item-row ${isUnread ? "unread" : "read"}`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="notif-item-icon-box it">{iconElem}</div>

                    <div className="notif-item-content">
                      <div className="notif-item-topbar">
                        <div className="notif-title-group">
                          <strong className="notif-title">{notification.title}</strong>
                          <span className="notif-category-badge badge-it">{badgeText}</span>
                          {isUnread && (
                            <span
                              className="notif-unread-glow-dot"
                              style={{ background: "#7c3aed", boxShadow: "0 0 6px rgba(124,58,237,0.7)" }}
                              title="Unread notification"
                            />
                          )}
                        </div>

                        <div className="notif-timestamp">
                          <Clock size={11} />
                          <span>{notification.time}</span>
                        </div>
                      </div>

                      <p className="notif-message-text">{notification.message}</p>
                      {(notification.action?.includes("REQUEST_RAISED") ||
                        notification.action?.includes("RESCHEDULED") ||
                        (notification.message || "").toLowerCase().includes("awaiting") ||
                        (notification.message || "").toLowerCase().includes("pre-approval")) && (
                        <div style={{ marginTop: "6px" }}>
                          <button
                            type="button"
                            className="secondary-action-btn"
                            style={{
                              padding: "3px 10px",
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#7c3aed",
                              borderColor: "#ddd6fe",
                              background: "#f5f3ff",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notification.id);
                              setCurrentPage("it-pre-approvals");
                            }}
                          >
                            Review in IT Pre-Approvals →
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="notif-item-actions" onClick={(e) => e.stopPropagation()}>
                      {isUnread && (
                        <button
                          type="button"
                          className="notif-item-btn read-btn"
                          onClick={() => markNotificationAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="notif-item-btn dismiss-btn"
                        onClick={(e) => dismissNotification(e, notification.id)}
                        title="Dismiss notification"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        </div>

        {/* =========================================================
            MOBILE VIEW (EXACT MATCH TO MOCKUP)
        ========================================================= */}
        <div className="vms-mobile-only mobile-it-notif-container">
          {/* 1. Executive Dark Navy Hero Card */}
          <div className="mobile-it-notif-hero">
            <div className="mobile-it-notif-hero-badge-row">
              <span className="mobile-it-notif-division-pill">IT DEPARTMENT DIVISION</span>
              <span className="mobile-it-notif-telemetry-pill">
                <span className="status-dot"></span>
                IT Technical Telemetry Active
              </span>
            </div>

            <div className="mobile-it-notif-hero-title-wrap">
              <div className="mobile-it-notif-hero-text">
                <h2 className="mobile-it-notif-hero-title">IT Visit Notifications</h2>
                <p className="mobile-it-notif-hero-desc">
                  Dedicated real-time telemetry, hardware custody alerts, and security clearances exclusively for IT technical personnel and contractors.
                </p>
              </div>

              <div className="mobile-it-notif-hero-ill">
                <div className="mobile-it-notif-server-icon">
                  <Server size={30} />
                  <Shield size={14} className="server-shield-badge" />
                </div>
              </div>
            </div>

            {/* Actions inside Hero Card */}
            <div className="mobile-it-notif-hero-actions">
              <div
                className="mobile-it-notif-unread-banner"
                onClick={() => setItNotifFilter((prev) => (prev === "unread" ? "all" : "unread"))}
                role="button"
                tabIndex={0}
              >
                <div className="unread-banner-left">
                  <Bell size={15} />
                  <span>{unreadCount} Unread IT Notifications</span>
                </div>
                <ChevronRight size={15} />
              </div>

              <button
                type="button"
                className="mobile-it-notif-btn-read"
                onClick={markITNotificationsAsRead}
              >
                <Check size={16} />
                <span>Mark all as read</span>
              </button>

              <button
                type="button"
                className="mobile-it-notif-btn-clear"
                onClick={clearITNotifications}
              >
                <Trash2 size={15} />
                <span>Clear all</span>
              </button>
            </div>
          </div>

          {/* 2. 2x2 Metric Cards Grid */}
          <section className="mobile-it-notif-stats-grid">
            <div className="mobile-it-notif-stat-card">
              <div className="mobile-it-notif-stat-top">
                <div className="mobile-it-notif-stat-icon purple">
                  <Server size={16} />
                </div>
                <span className="mobile-it-notif-stat-label">Total IT Telemetry</span>
              </div>
              <div className="mobile-it-notif-stat-bottom">
                <strong className="mobile-it-notif-stat-value">{itNotifications.length}</strong>
                <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="mobile-it-notif-sparkline">
                  <path d="M2 14 C 10 18, 16 6, 24 12 C 32 18, 38 4, 42 7" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="mobile-it-notif-stat-card">
              <div className="mobile-it-notif-stat-top">
                <div className="mobile-it-notif-stat-icon amber">
                  <BellRing size={16} />
                </div>
                <span className="mobile-it-notif-stat-label">Unread Alerts</span>
              </div>
              <div className="mobile-it-notif-stat-bottom">
                <strong className="mobile-it-notif-stat-value">{unreadCount}</strong>
                <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="mobile-it-notif-sparkline">
                  <path d="M2 14 C 10 18, 16 6, 24 12 C 32 18, 38 4, 42 7" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="mobile-it-notif-stat-card">
              <div className="mobile-it-notif-stat-top">
                <div className="mobile-it-notif-stat-icon blue">
                  <Laptop size={16} />
                </div>
                <span className="mobile-it-notif-stat-label">Hardware Custody Events</span>
              </div>
              <div className="mobile-it-notif-stat-bottom">
                <strong className="mobile-it-notif-stat-value">{assetCount}</strong>
                <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="mobile-it-notif-sparkline">
                  <path d="M2 14 C 10 18, 16 6, 24 12 C 32 18, 38 4, 42 7" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="mobile-it-notif-stat-card">
              <div className="mobile-it-notif-stat-top">
                <div className="mobile-it-notif-stat-icon green">
                  <ShieldCheck size={16} />
                </div>
                <span className="mobile-it-notif-stat-label">Gate & Server Clearances</span>
              </div>
              <div className="mobile-it-notif-stat-bottom">
                <strong className="mobile-it-notif-stat-value">{gateCount}</strong>
                <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="mobile-it-notif-sparkline">
                  <path d="M2 14 C 10 18, 16 6, 24 12 C 32 18, 38 4, 42 7" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </section>

          {/* 3. Scope Filter Tabs Row */}
          <div className="mobile-it-notif-tabs-row">
            <button
              type="button"
              className={`mobile-it-notif-tab ${itNotifFilter === "all" ? "active" : ""}`}
              onClick={() => setItNotifFilter("all")}
            >
              <FileText size={14} />
              <span>All IT Visits ({itNotifications.length})</span>
            </button>
            <button
              type="button"
              className={`mobile-it-notif-tab ${itNotifFilter === "unread" ? "active" : ""}`}
              onClick={() => setItNotifFilter("unread")}
            >
              <Bell size={14} />
              <span className="tab-unread-dot"></span>
              <span>Unread ({unreadCount})</span>
            </button>
          </div>

          {/* 4. Search and Filter Bar */}
          <div className="mobile-it-notif-search-row">
            <div className="mobile-it-notif-search-box" style={{ position: "relative", display: "flex", alignItems: "center", flex: 1 }}>
              <Search size={15} className="mobile-it-notif-search-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", zIndex: 2 }} />
              <input
                type="text"
                className="mobile-it-notif-search-input"
                style={{ width: "100%", height: "42px", paddingLeft: "42px", paddingRight: "38px", borderRadius: "12px", fontSize: "13.5px", boxSizing: "border-box" }}
                value={itNotifSearchQuery}
                onChange={(e) => setItNotifSearchQuery(e.target.value)}
                placeholder="Search IT notifications, asset ID, contractor, serial..."
              />
              {itNotifSearchQuery && (
                <button
                  type="button"
                  className="mobile-it-notif-search-clear"
                  onClick={() => setItNotifSearchQuery("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="mobile-it-notif-filter-toggle-btn"
              title="Toggle filter view"
              onClick={() => setItNotifFilter((prev) => (prev === "unread" ? "all" : "unread"))}
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>

          {/* 5. Notification Cards List */}
          <div className="mobile-it-notif-cards-list">
            {filtered.length === 0 ? (
              <div className="mobile-it-notif-empty-state">
                <BellRing size={28} color="#94a3b8" />
                <p>No IT notifications found.</p>
              </div>
            ) : (
              filtered.map((notification) => {
                const isUnread = !notification.read;
                const act = String(notification.action || "").toUpperCase();
                const tit = String(notification.title || "").toUpperCase();
                const msg = String(notification.message || "").toLowerCase();

                let icon = <Server size={18} />;
                let iconBoxClass = "purple";
                let badgeText = "IT VISIT REQUEST";
                let badgeClass = "purple";

                if (act.includes("ASSET") || tit.includes("ASSET") || tit.includes("HARDWARE") || msg.includes("hardware") || msg.includes("asset")) {
                  icon = <Bell size={18} />;
                  iconBoxClass = "amber";
                  badgeText = tit.includes("CLEARED") || tit.includes("EXIT") ? "ASSET EXIT CLEARANCE" : "HARDWARE CUSTODY";
                  badgeClass = "amber";
                } else if (act.includes("REQUEST") || tit.includes("REQUEST")) {
                  icon = <Server size={18} />;
                  iconBoxClass = "purple";
                  badgeText = "IT VISIT REQUEST";
                  badgeClass = "purple";
                } else if (act.includes("CHECKED_IN") || tit.includes("CHECKED IN") || tit.includes("ARRIVED")) {
                  icon = <UserCheck size={18} />;
                  iconBoxClass = "blue";
                  badgeText = "IT CONTRACTOR ARRIVED";
                  badgeClass = "blue";
                } else if (act.includes("VERIF") || tit.includes("SECURITY") || tit.includes("CLEARANCE")) {
                  icon = <ShieldCheck size={18} />;
                  iconBoxClass = "green";
                  badgeText = "GATE & SERVER CLEARANCE";
                  badgeClass = "green";
                }

                return (
                  <div
                    key={notification.id}
                    className={`mobile-it-notif-card ${isUnread ? "unread" : ""}`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="mobile-it-notif-card-inner">
                      <div className={`mobile-it-notif-card-icon-box ${iconBoxClass}`}>
                        {icon}
                      </div>

                      <div className="mobile-it-notif-card-body">
                        <div className="mobile-it-notif-card-header">
                          <h4 className="mobile-it-notif-card-title">{notification.title}</h4>
                          <div className="mobile-it-notif-card-top-right">
                            {isUnread && <span className="mobile-it-notif-blue-dot"></span>}
                            <button
                              type="button"
                              className="mobile-it-notif-card-dots"
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notification.id);
                              }}
                              title="Notification options"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="mobile-it-notif-card-badge-row">
                          <span className={`mobile-it-notif-tag-badge ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </div>

                        <div className="mobile-it-notif-card-time-row">
                          <Clock size={11} />
                          <span>{notification.time}</span>
                        </div>

                        <p className="mobile-it-notif-card-message">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </>
    );
  };

    const renderDashboard = () => {
    return (
      <>
        {/* =========================================================
            DESKTOP VIEW (> 768px): PRESERVED 100% UNTOUCHED
        ========================================================= */}
        <div className="vms-desktop-only">
        {/* Executive Dashboard Header */}
        <div className="it-management-header">
          <div className="it-header-title-box">
            <div className="it-header-badge-row">
              <span className="it-division-pill">Access &amp; Gate Control</span>
              <span className="it-telemetry-pill">
                <span className="status-dot"></span>
                Gate Security Active
              </span>
            </div>
            <h2 className="it-page-title">Security Command Dashboard</h2>
            <p className="it-page-desc">
              Monitor real-time gate verifications, visitor admissions, building occupancy, and active departures
            </p>
          </div>

          <div className="it-header-controls">
            <button className="it-qr-portal-btn" onClick={openScanner}>
              <QrCode size={15} />
              <span>Scan Visitor QR</span>
            </button>
            <button
              type="button"
              className="it-qr-portal-btn"
              onClick={() => window.open("/guard", "_blank")}
              title="Open Gate Terminal in a separate window"
            >
              <ExternalLink size={15} />
              <span>Gate Terminal</span>
            </button>
            <button
              type="button"
              className="it-theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              className="it-refresh-btn"
              onClick={fetchDashboard}
              disabled={dashboardLoading}
              title="Refresh dashboard metrics"
            >
              <RefreshCw size={15} className={dashboardLoading ? "spin" : ""} />
            </button>
          </div>
        </div>

        <section className="stats-grid">
          <div
            className={`stat-card clickable ${dashboardVisitorFilter === "all" ? "active-filter filter-blue" : ""}`}
            onClick={() => setDashboardVisitorFilter("all")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setDashboardVisitorFilter("all")}
            title="Click to view all visitors today"
          >
            <div className="stat-icon blue">
              <Users size={18} />
            </div>
            <div className="stat-content">
              <span>Visitors Today</span>
              <strong>{dashboardLoading ? "..." : visitorsToday}</strong>
              <span className="stat-interactive-hint">
                {dashboardVisitorFilter === "all" ? "● Active View" : "View all today"}
              </span>
            </div>
            <ChevronRight size={15} className={`stat-arrow ${dashboardVisitorFilter === "all" ? "arrow-active" : ""}`} />
          </div>

          <div
            className={`stat-card clickable ${dashboardVisitorFilter === "inside" ? "active-filter filter-green" : ""}`}
            onClick={() => setDashboardVisitorFilter(dashboardVisitorFilter === "inside" ? "all" : "inside")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setDashboardVisitorFilter(dashboardVisitorFilter === "inside" ? "all" : "inside")}
            title="Click to filter active visitors inside"
          >
            <div className="stat-icon green">
              <UserCheck size={18} />
            </div>
            <div className="stat-content">
              <span>Currently Inside</span>
              <strong>{dashboardLoading ? "..." : currentlyInside}</strong>
              <span className="stat-interactive-hint">
                {dashboardVisitorFilter === "inside" ? "● Active View" : "On premises"}
              </span>
            </div>
            <ChevronRight size={15} className={`stat-arrow ${dashboardVisitorFilter === "inside" ? "arrow-active" : ""}`} />
          </div>

          <div
            className="stat-card clickable"
            role="button"
            tabIndex={0}
            aria-label="View today's expected visitors"
            title="Click to view expected visitors in Pre-Approvals"
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
              <span className="stat-interactive-hint">Scheduled today</span>
            </div>
            <ChevronRight size={15} className="stat-arrow" />
          </div>

          <div
            className={`stat-card clickable ${dashboardVisitorFilter === "checked_out" ? "active-filter filter-purple" : ""}`}
            onClick={() => setDashboardVisitorFilter(dashboardVisitorFilter === "checked_out" ? "all" : "checked_out")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setDashboardVisitorFilter(dashboardVisitorFilter === "checked_out" ? "all" : "checked_out")}
            title="Click to filter checked-out visitors"
          >
            <div className="stat-icon purple">
              <LogOut size={18} />
            </div>
            <div className="stat-content">
              <span>Checked Out</span>
              <strong>{dashboardLoading ? "..." : checkedOut}</strong>
              <span className="stat-interactive-hint">
                {dashboardVisitorFilter === "checked_out" ? "● Active View" : "Departed"}
              </span>
            </div>
            <ChevronRight size={15} className={`stat-arrow ${dashboardVisitorFilter === "checked_out" ? "arrow-active" : ""}`} />
          </div>
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
                  : `${filteredVisitors.length} of ${visitors.length} visitor record${
                      visitors.length === 1 ? "" : "s"
                    } displayed · Click any row to view full pass & checkout`}
              </p>
            </div>
            <div className="search-field">
              <Search size={14} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search visitor, company, host..."
              />
              {searchTerm && (
                <button
                  type="button"
                  style={{ background: "transparent", border: 0, cursor: "pointer", color: "#94a3b8" }}
                  onClick={() => setSearchTerm("")}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="it-filter-pills-row">
            <button
              type="button"
              className={`it-filter-pill ${dashboardVisitorFilter === "all" ? "active" : ""}`}
              onClick={() => setDashboardVisitorFilter("all")}
            >
              All Visitors ({visitors.length})
            </button>
            <button
              type="button"
              className={`it-filter-pill ${dashboardVisitorFilter === "inside" ? "active" : ""}`}
              onClick={() => setDashboardVisitorFilter("inside")}
            >
              <span className="live-dot"></span>
              Currently Inside ({currentlyInside})
            </button>
            <button
              type="button"
              className={`it-filter-pill ${dashboardVisitorFilter === "checked_out" ? "active" : ""}`}
              onClick={() => setDashboardVisitorFilter("checked_out")}
            >
              Checked Out ({checkedOut})
            </button>
            {(dashboardVisitorFilter !== "all" || searchTerm) && (
              <button
                type="button"
                className="it-filter-pill-reset"
                onClick={() => {
                  setDashboardVisitorFilter("all");
                  setSearchTerm("");
                }}
              >
                Clear Filters
              </button>
            )}
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
              No visitors match your search or active filter.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="today-visitors-interactive-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Purpose</th>
                    <th>Host</th>
                    <th>Company</th>
                    <th>Check In</th>
                    <th>Status</th>
                    <th>Decision</th>
                    <th style={{ textAlign: "right", paddingRight: "16px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map((item) => {
                    const dirVisitor = visitorList.find(
                      (v) => String(v.visitor_id) === String(item.visitor_id)
                    );
                    const photoUrl = resolvePhotoUrl(item.photo_url || dirVisitor?.photo_url);

                    return (
                      <tr
                        key={item.visit_id}
                        className="clickable-visitor-row"
                        onClick={() => openVisitorPassDetail(item.visit_id)}
                        title="Click to view visitor pass, full credentials & checkout directly"
                      >
                        <td>
                          <div className="visitor-cell">
                            <div className="visitor-avatar">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={item.visitor_name}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : null}
                              <span className="avatar-initials">
                                {getInitials(item.visitor_name)}
                              </span>
                            </div>
                            <div>
                              <strong className="visitor-clickable-name">
                                {item.visitor_name || "Unknown Visitor"}
                              </strong>
                              <span className="visitor-id-badge" style={{ marginTop: "2px", display: "inline-block" }}>
                                ID: {item.visitor_id || "—"}
                              </span>
                            </div>
                          </div>
                        </td>
                      <td>
                        <span className="notif-category-badge badge-info">
                          {item.purpose || "Meeting"}
                        </span>
                      </td>
                      <td>
                        <strong className="visitor-host-name">{item.host_name || "—"}</strong>
                      </td>
                      <td>
                        <div className="it-company-tag">
                          <Building2 size={12} />
                          <span>{item.company_name || "Independent"}</span>
                        </div>
                      </td>
                      <td className="visitor-check-in-time">{formatTime(item.check_in_time)}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            item.status === "ACTIVE" ? "active" : "checked"
                          }`}
                        >
                          <span className="status-dot"></span>
                          {item.status === "ACTIVE" ? "Inside" : item.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`decision-pill ${item.decision === "ALLOW" ? "allow" : "deny"}`}
                        >
                          {item.decision}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", paddingRight: "16px" }}>
                        <button
                          type="button"
                          className="pass-row-open-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openVisitorPassDetail(item.visit_id);
                          }}
                          title="Open visitor pass & direct checkout terminal"
                        >
                          <QrCode size={13} />
                          <span>Pass &amp; Checkout</span>
                          <ChevronRight size={13} />
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

        <section className="quick-section">
          <div className="quick-section-header">
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
        </div>

        {/* =========================================================
            MOBILE VIEW (<= 768px): DEDICATED NEW SECURITY DASHBOARD UI
        ========================================================= */}
        <div className="vms-mobile-only mobile-security-dashboard-container">
          {/* 1. Executive Dark Navy Hero Card */}
          <div className="mobile-dashboard-hero">
            <div className="mobile-dashboard-hero-badge-row">
              <span className="mobile-dashboard-badge-pill">ACCESS &amp; GATE CONTROL</span>
              <span className="mobile-dashboard-telemetry-pill">
                <span className="status-dot"></span>
                Gate Security Active
              </span>
            </div>

            <div className="mobile-dashboard-hero-title-wrap">
              <div className="mobile-dashboard-hero-text">
                <h2 className="mobile-dashboard-hero-title">Security Command Dashboard</h2>
                <p className="mobile-dashboard-hero-desc">
                  Monitor real-time gate verifications, visitor admissions, building occupancy, and active departures.
                </p>
              </div>
            </div>

            <div className="mobile-dashboard-hero-controls">
              <button
                type="button"
                className="mobile-dashboard-btn-scan"
                onClick={openScanner}
              >
                <QrCode size={15} />
                <span>Scan Visitor QR</span>
              </button>

              <button
                type="button"
                className="mobile-dashboard-btn-terminal"
                onClick={() => window.open("/guard", "_blank")}
              >
                <ExternalLink size={14} />
                <span>Gate Terminal</span>
              </button>
            </div>
          </div>

          {/* 2. 2x2 KPI Metric Cards Grid */}
          <div className="mobile-dashboard-stats-grid">
            <div
              className={`mobile-dashboard-stat-card ${dashboardVisitorFilter === "all" ? "active" : ""}`}
              onClick={() => setDashboardVisitorFilter("all")}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-dashboard-stat-icon blue">
                <Users size={18} />
              </div>
              <div className="mobile-dashboard-stat-content">
                <span>Visitors Today</span>
                <strong>{dashboardLoading ? "..." : visitorsToday}</strong>
              </div>
              <ChevronRight size={14} className="mobile-dashboard-stat-arrow" />
            </div>

            <div
              className={`mobile-dashboard-stat-card ${dashboardVisitorFilter === "inside" ? "active" : ""}`}
              onClick={() => setDashboardVisitorFilter(dashboardVisitorFilter === "inside" ? "all" : "inside")}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-dashboard-stat-icon green">
                <UserCheck size={18} />
              </div>
              <div className="mobile-dashboard-stat-content">
                <span>Currently Inside</span>
                <strong>{dashboardLoading ? "..." : currentlyInside}</strong>
              </div>
              <ChevronRight size={14} className="mobile-dashboard-stat-arrow" />
            </div>

            <div
              className="mobile-dashboard-stat-card"
              onClick={() => openPreApprovals(true)}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-dashboard-stat-icon amber">
                <Clock size={18} />
              </div>
              <div className="mobile-dashboard-stat-content">
                <span>Expected Visitors</span>
                <strong>{dashboardLoading ? "..." : expectedVisitors}</strong>
              </div>
              <ChevronRight size={14} className="mobile-dashboard-stat-arrow" />
            </div>

            <div
              className={`mobile-dashboard-stat-card ${dashboardVisitorFilter === "checked_out" ? "active" : ""}`}
              onClick={() => setDashboardVisitorFilter(dashboardVisitorFilter === "checked_out" ? "all" : "checked_out")}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-dashboard-stat-icon purple">
                <LogOut size={18} />
              </div>
              <div className="mobile-dashboard-stat-content">
                <span>Checked Out</span>
                <strong>{dashboardLoading ? "..." : checkedOut}</strong>
              </div>
              <ChevronRight size={14} className="mobile-dashboard-stat-arrow" />
            </div>
          </div>

          {/* 3. Section Header */}
          <div className="mobile-dashboard-section-header">
            <div className="mobile-dashboard-section-left">
              <div className="mobile-dashboard-section-icon">
                <Users size={16} />
              </div>
              <div>
                <h3>Today's Visitors</h3>
                <p>Click any row to view full pass &amp; checkout</p>
              </div>
            </div>
            <span className="mobile-dashboard-counter">
              {filteredVisitors.length} of {visitors.length} record{visitors.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* 4. Search Bar */}
          <div className="mobile-dashboard-search-wrap" style={{ position: "relative", display: "flex", alignItems: "center", width: "100%", marginBottom: "12px" }}>
            <Search size={15} className="mobile-dashboard-search-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", zIndex: 2 }} />
            <input
              type="text"
              placeholder="Search visitor, company, host..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mobile-dashboard-search-input"
              style={{ width: "100%", height: "42px", paddingLeft: "42px", paddingRight: "38px", borderRadius: "12px", fontSize: "13.5px", boxSizing: "border-box" }}
            />
            {searchTerm && (
              <button
                type="button"
                className="mobile-dashboard-search-clear"
                onClick={() => setSearchTerm("")}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", zIndex: 3 }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 5. Filter Pills */}
          <div className="mobile-dashboard-pills-row">
            <button
              type="button"
              className={`mobile-dashboard-pill ${dashboardVisitorFilter === "all" ? "active" : ""}`}
              onClick={() => setDashboardVisitorFilter("all")}
            >
              All Visitors ({visitors.length})
            </button>
            <button
              type="button"
              className={`mobile-dashboard-pill ${dashboardVisitorFilter === "inside" ? "active" : ""}`}
              onClick={() => setDashboardVisitorFilter("inside")}
            >
              <span className="status-dot"></span>
              Currently Inside ({currentlyInside})
            </button>
            <button
              type="button"
              className={`mobile-dashboard-pill ${dashboardVisitorFilter === "checked_out" ? "active" : ""}`}
              onClick={() => setDashboardVisitorFilter("checked_out")}
            >
              Checked Out ({checkedOut})
            </button>
          </div>

          {/* 6. Visitor Cards List */}
          <div className="mobile-dashboard-cards-list">
            {dashboardLoading ? (
              <div className="empty-state" style={{ padding: "40px 16px" }}>
                <RefreshCw className="spin" size={20} />
                <span>Loading today's visitors...</span>
              </div>
            ) : filteredVisitors.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 16px" }}>
                <Users size={24} />
                <strong>No visitors found</strong>
                <span>No visitors match your search or filter.</span>
              </div>
            ) : (
              filteredVisitors.map((item, index) => {
                const initials = getInitials(item.visitor_name || "Visitor");
                const isInside = item.status === "ACTIVE";
                const avatarPalette = [
                  { bg: "#0f172a", text: "#ffffff" },
                  { bg: "#0f172a", text: "#ffffff" },
                  { bg: "#2563eb", text: "#ffffff" },
                  { bg: "#7c3aed", text: "#ffffff" },
                  { bg: "#059669", text: "#ffffff" },
                  { bg: "#d97706", text: "#ffffff" },
                ];
                const avatarColor = avatarPalette[index % avatarPalette.length];

                return (
                  <div
                    key={item.visit_id}
                    className="mobile-dashboard-visitor-card"
                    onClick={() => openVisitorPassDetail(item.visit_id)}
                  >
                    {/* Card Top: Avatar, Name + ID, Options */}
                    <div className="mobile-dashboard-card-top">
                      <div className="mobile-dashboard-card-left">
                        <div
                          className="mobile-dashboard-card-avatar"
                          style={{
                            background: avatarColor.bg,
                            color: avatarColor.text,
                          }}
                        >
                          <span className="avatar-initials">{initials}</span>
                        </div>
                        <div className="mobile-dashboard-card-identity">
                          <h4 className="mobile-dashboard-card-name">
                            {item.visitor_name || "Unknown Visitor"}
                          </h4>
                          <span className="mobile-dashboard-id-badge">
                            ID: {item.visitor_id || "—"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="mobile-dashboard-options-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openVisitorPassDetail(item.visit_id);
                        }}
                        title="Options"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {/* Metadata 3-Column / 2-Row Grid */}
                    <div className="mobile-dashboard-meta-grid">
                      {/* Row 1 Col 1: Purpose */}
                      <div className="mobile-dash-meta-item">
                        <div className="mobile-dash-meta-label">
                          <FileText size={12} />
                          <span>Purpose</span>
                        </div>
                        <div className="mobile-dash-meta-value purpose-blue">
                          {item.purpose || "cc"}
                        </div>
                      </div>

                      {/* Row 1 Col 2: Host */}
                      <div className="mobile-dash-meta-item">
                        <div className="mobile-dash-meta-label">
                          <User size={12} />
                          <span>Host</span>
                        </div>
                        <div className="mobile-dash-meta-value">
                          {item.host_name || "—"}
                        </div>
                      </div>

                      {/* Row 1 Col 3: Company */}
                      <div className="mobile-dash-meta-item">
                        <div className="mobile-dash-meta-label">
                          <Building2 size={12} />
                          <span>Company</span>
                        </div>
                        <div className="mobile-dash-meta-value">
                          {item.company_name || "IT"}
                        </div>
                      </div>

                      {/* Row 2 Col 1: Check In */}
                      <div className="mobile-dash-meta-item">
                        <div className="mobile-dash-meta-label">
                          <Clock size={12} />
                          <span>Check In</span>
                        </div>
                        <div className="mobile-dash-meta-value">
                          {formatTime(item.check_in_time)}
                        </div>
                      </div>

                      {/* Row 2 Col 2: Status */}
                      <div className="mobile-dash-meta-item">
                        <div className="mobile-dash-meta-label">
                          <span className="status-dot"></span>
                          <span>Status</span>
                        </div>
                        <div className="mobile-dash-meta-value status-green">
                          {isInside ? "● Inside" : item.status}
                        </div>
                      </div>

                      {/* Row 2 Col 3: Decision */}
                      <div className="mobile-dash-meta-item">
                        <div className="mobile-dash-meta-label">
                          <ShieldCheck size={12} />
                          <span>Decision</span>
                        </div>
                        <div className="mobile-dash-meta-value">
                          <span className={`mobile-dash-decision-badge ${item.decision === "ALLOW" ? "allow" : "deny"}`}>
                            {item.decision}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Button: Pass & Checkout */}
                    <button
                      type="button"
                      className="mobile-dashboard-btn-pass-checkout"
                      onClick={(e) => {
                        e.stopPropagation();
                        openVisitorPassDetail(item.visit_id);
                      }}
                    >
                      <div className="btn-inner-left">
                        <QrCode size={14} />
                        <span>Pass &amp; Checkout</span>
                      </div>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* 7. Quick Actions Section */}
          <div className="mobile-dashboard-quick-actions">
            <div className="mobile-dashboard-quick-header">
              <h4>Quick Actions</h4>
              <p>Common security operations</p>
            </div>
            <div className="mobile-dashboard-quick-list">
              <button
                type="button"
                className="mobile-dashboard-quick-item"
                onClick={openScanner}
              >
                <div className="mobile-quick-icon blue">
                  <QrCode size={18} />
                </div>
                <div className="mobile-quick-text">
                  <strong>Scan QR Code</strong>
                  <span>Verify visitor entry</span>
                </div>
                <ChevronRight size={16} className="mobile-quick-arrow" />
              </button>

              <button
                type="button"
                className="mobile-dashboard-quick-item"
                onClick={openCreateVisit}
              >
                <div className="mobile-quick-icon green">
                  <UserPlus size={18} />
                </div>
                <div className="mobile-quick-text">
                  <strong>Create Visit</strong>
                  <span>Register a new visit</span>
                </div>
                <ChevronRight size={16} className="mobile-quick-arrow" />
              </button>

              <button
                type="button"
                className="mobile-dashboard-quick-item"
                onClick={openCheckout}
              >
                <div className="mobile-quick-icon amber">
                  <LogOut size={18} />
                </div>
                <div className="mobile-quick-text">
                  <strong>Checkout</strong>
                  <span>Process visitor exit</span>
                </div>
                <ChevronRight size={16} className="mobile-quick-arrow" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderScanner = () => {
    return (
      <div className="scanner-view-page">
        {/* Mobile View: Dedicated Gate Security Scanner UI */}
        {isMobile && (
          <div className="scanner-mobile-view">
            {/* 1. Dark Hero Card */}
            <div className="scanner-mobile-hero">
              <div className="scanner-mobile-hero-icon">
                <QrCode size={20} />
              </div>
              <div className="scanner-mobile-hero-text">
                <h3>Gate Security Scanner</h3>
                <p>QR pass verification &amp; physical asset clearance</p>
              </div>
            </div>

            {!visit && (
              <>
                {/* 2. Four Stat Cards Compact Row */}
                <div className="scanner-mobile-stats-row">
                  <div className="scanner-mobile-stat-card">
                    <div className="scanner-mobile-stat-icon green-check">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <div className="scanner-mobile-stat-info">
                      <span className="scanner-mobile-stat-label">Scanner</span>
                      <strong className="scanner-mobile-stat-val text-emerald">Online</strong>
                    </div>
                  </div>

                  <div className="scanner-mobile-stat-card">
                    <div className="scanner-mobile-stat-icon blue">
                      <User size={15} />
                    </div>
                    <div className="scanner-mobile-stat-info">
                      <span className="scanner-mobile-stat-label">Active Visitors</span>
                      <strong className="scanner-mobile-stat-val">{dashboardData?.statistics?.currently_inside || 0}</strong>
                    </div>
                  </div>

                  <div className="scanner-mobile-stat-card">
                    <div className="scanner-mobile-stat-icon purple">
                      <LogOut size={15} />
                    </div>
                    <div className="scanner-mobile-stat-info">
                      <span className="scanner-mobile-stat-label">Cleared Today</span>
                      <strong className="scanner-mobile-stat-val">{dashboardData?.statistics?.checked_out || 0}</strong>
                    </div>
                  </div>

                  <div className="scanner-mobile-stat-card">
                    <div className="scanner-mobile-stat-icon amber">
                      <LayoutGrid size={15} />
                    </div>
                    <div className="scanner-mobile-stat-info">
                      <span className="scanner-mobile-stat-label">Security Gate</span>
                      <strong className="scanner-mobile-stat-val">Lane 01</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Camera QR Scanner Card */}
                <div className="scanner-mobile-card">
                  <div className="scanner-mobile-card-header">
                    <div className="scanner-mobile-header-left">
                      <div className="scanner-mobile-header-icon blue">
                        <Camera size={16} />
                      </div>
                      <div>
                        <h4 className="scanner-mobile-card-title">Camera QR Scanner</h4>
                        <p className="scanner-mobile-card-sub">Point visitor's digital or printed pass QR code at the camera</p>
                      </div>
                    </div>
                    <div className={`scanner-mobile-ready-badge ${scannerCameraActive ? "scanner-badge-active" : ""}`}>
                      <span className={`scanner-ready-dot ${scannerCameraActive ? "scanner-dot-active" : ""}`}></span>
                      <span>
                        {scannerCameraActive
                          ? (cameraFacingMode === "environment" ? "BACK CAMERA ACTIVE" : "FRONT CAMERA ACTIVE")
                          : "GATE SCANNER READY"}
                      </span>
                    </div>
                  </div>

                  {/* Viewfinder Area */}
                  <div className="scanner-mobile-viewfinder">
                    <div className="scanner-reticle-frame">
                      <div className="scanner-bracket top-left"></div>
                      <div className="scanner-bracket top-right"></div>
                      <div className="scanner-bracket bottom-left"></div>
                      <div className="scanner-bracket bottom-right"></div>
                      {scannerCameraActive && <div className="scanner-laser-line"></div>}
                    </div>

                    {/* Live HTML5 QR Reader */}
                    <div id="qr-reader" className="qr-reader-mobile-viewport"></div>

                    {!scannerCameraActive && (
                      <div className="scanner-idle-overlay">
                        <Camera size={34} className="scanner-idle-icon" />
                        <span className="scanner-idle-title">Camera Idle</span>
                        <span className="scanner-idle-sub">
                          {cameraFacingMode === "environment" ? "Back Camera" : "Front Camera"} selected
                        </span>
                        <button
                          type="button"
                          className="scanner-idle-start-btn"
                          onClick={() => startCamera(cameraFacingMode, selectedCameraId)}
                        >
                          <Camera size={15} />
                          <span>Start Camera</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Primary Mobile Scanner Controls */}
                  <div className="scanner-mobile-controls-grid">
                    {scannerCameraActive ? (
                      <button
                        type="button"
                        className="scanner-control-btn btn-danger"
                        onClick={stopCamera}
                      >
                        <VideoOff size={15} />
                        <span>Stop Scanning</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="scanner-control-btn btn-primary"
                        onClick={() => startCamera(cameraFacingMode, selectedCameraId)}
                      >
                        <Camera size={15} />
                        <span>Start Scanning</span>
                      </button>
                    )}

                    {/* Back Camera / Front Camera Flip Option */}
                    <button
                      type="button"
                      className="scanner-control-btn btn-flip-camera"
                      onClick={toggleCameraFacingMode}
                      title={cameraFacingMode === "environment" ? "Switch to Front Camera" : "Switch to Back Camera"}
                    >
                      <SwitchCamera size={16} />
                      <span>{cameraFacingMode === "environment" ? "Back Camera" : "Front Camera"}</span>
                    </button>
                  </div>

                  {/* Camera Lens Selector & File Upload */}
                  <div className="scanner-mobile-secondary-row">
                    {availableCameras.length > 1 && (
                      <div className="scanner-camera-select-wrap">
                        <select
                          className="scanner-camera-select"
                          value={selectedCameraId}
                          onChange={(e) => handleCameraDeviceChange(e.target.value)}
                          aria-label="Select Camera Device"
                        >
                          <option value="">Auto ({cameraFacingMode === "environment" ? "Back Camera" : "Front Camera"})</option>
                          {availableCameras.map((cam, idx) => (
                            <option key={cam.id} value={cam.id}>
                              {cam.label || `Camera ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleImageFileScan}
                    />

                    <button
                      type="button"
                      className="scanner-btn-file-upload"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon size={15} />
                      <span>Scan an Image File</span>
                    </button>
                  </div>

                  {/* Info Pill */}
                  <div className="scanner-mobile-info-pill">
                    <Info size={14} style={{ flexShrink: 0 }} />
                    <span>{scannerMessage || "Point visitor QR code at back camera to verify."}</span>
                  </div>

                  {scannerError && (
                    <div className="error-banner" style={{ marginTop: "10px" }}>
                      <XCircle size={15} />
                      <span>{scannerError}</span>
                    </div>
                  )}
                </div>

                {/* 4. Manual Pass Lookup Card */}
                <div className="scanner-mobile-card">
                  <div className="scanner-mobile-card-header">
                    <div className="scanner-mobile-header-left">
                      <div className="scanner-mobile-header-icon blue">
                        <Search size={16} />
                      </div>
                      <div>
                        <h4 className="scanner-mobile-card-title">Manual Pass Lookup</h4>
                        <p className="scanner-mobile-card-sub">Direct lookup by pass token, badge ID, or UUID</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleManualLookup} className="scanner-mobile-lookup-form">
                    <label className="scanner-mobile-input-label">PASS TOKEN / VISIT REFERENCE</label>
                    <div className="scanner-mobile-input-wrap">
                      <Search size={15} className="scanner-mobile-input-icon" />
                      <input
                        type="text"
                        value={manualTokenInput}
                        onChange={(e) => setManualTokenInput(e.target.value)}
                        placeholder="e.g. V-20261028-387, EMP-12345, or VMS-XXXX"
                        className="scanner-mobile-input"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={manualLookupLoading || !manualTokenInput.trim()}
                      className="scanner-btn-primary"
                    >
                      {manualLookupLoading ? (
                        <>
                          <RefreshCw size={15} className="spin" /> Verifying Credentials...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} /> Verify Visitor Pass
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* 5. Security Guidelines Card */}
                <div className="scanner-mobile-card">
                  <div className="scanner-mobile-card-header" style={{ marginBottom: "10px" }}>
                    <div className="scanner-mobile-header-left">
                      <div className="scanner-mobile-header-icon purple">
                        <Shield size={16} />
                      </div>
                      <h4 className="scanner-mobile-card-title">Security Guidelines</h4>
                    </div>
                  </div>

                  <div className="scanner-mobile-guidelines-box">
                    <div className="scanner-guideline-item">
                      <span className="scanner-step-badge">1</span>
                      <span className="scanner-step-text">Ensure the QR code is centered and clearly lit.</span>
                    </div>
                    <div className="scanner-guideline-item">
                      <span className="scanner-step-badge">2</span>
                      <span className="scanner-step-text">Verify visitor photo identity when required (ID if requested).</span>
                    </div>
                    <div className="scanner-guideline-item">
                      <span className="scanner-step-badge">3</span>
                      <span className="scanner-step-text">Check declared equipment before authorizing building entry or exit.</span>
                    </div>
                  </div>
                </div>

                {/* 6. Bottom Back Button */}
                <button
                  type="button"
                  className="scanner-mobile-bottom-back-btn"
                  onClick={openDashboard}
                >
                  <ArrowLeft size={15} />
                  <span>Back</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Desktop View: Preserved 100% untouched */}
        {!isMobile && (
          <div className="scanner-desktop-view">
        <div className="topbar">
          <div className="scanner-header-title">
            <div className="scanner-title-badge">
              <QrCode size={22} />
            </div>
            <div>
              <h2>Gate Security Scanner</h2>
              <p>Optical QR pass verification &amp; physical asset clearance</p>
            </div>
          </div>
          <div className="scanner-topbar-actions">
            {visit && (
              <button
                type="button"
                className="secondary-action-btn"
                onClick={() => {
                  setVisit(null);
                  setDecision(null);
                  setVisitAssets([]);
                  setManualTokenInput("");
                  setScannerMessage("Scan a visitor QR code to verify entry.");
                }}
              >
                <RefreshCw size={14} /> Scan Next Visitor
              </button>
            )}
            <button className="back-button" onClick={openDashboard}>
              <ArrowLeft size={14} />
              Back
            </button>
          </div>
        </div>

        {!visit && (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon green">
                  <ShieldCheck size={20} />
                </div>
                <div className="stat-content">
                  <strong>Online</strong>
                  <span>Scanner Terminal Status</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">
                  <UserCheck size={20} />
                </div>
                <div className="stat-content">
                  <strong>{dashboardData?.statistics?.currently_inside || 0}</strong>
                  <span>Active Visitors On Premises</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">
                  <LogOut size={20} />
                </div>
                <div className="stat-content">
                  <strong>{dashboardData?.statistics?.checked_out || 0}</strong>
                  <span>Cleared Departures Today</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon amber">
                  <QrCode size={20} />
                </div>
                <div className="stat-content">
                  <strong>Lane 01</strong>
                  <span>Security Optical Gate</span>
                </div>
              </div>
            </section>

          <div className="scanner-hub-grid">
            {/* Primary Optical Scanner Card */}
            <section className="verification-card scanner-main-card">
              <div className="section-header">
                <div>
                  <h2>Camera QR Scanner</h2>
                  <p>Point visitor's digital or printed pass QR code at the camera</p>
                </div>
                <div className="scanner-live-badge">
                  <span className="live-dot"></span>
                  <span>GATE SCANNER READY</span>
                </div>
              </div>

              <div className="scanner-container">
                <div id="qr-reader" className="qr-reader"></div>

                <div className="scanner-status-strip">
                  <div className="scanner-status-dot"></div>
                  <span>{scannerMessage}</span>
                </div>

                {scannerError && (
                  <div className="error-banner">
                    <XCircle size={16} />
                    <span>{scannerError}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Manual Token Entry Sidebar */}
            <section className="verification-card scanner-manual-card">
              <div className="section-header">
                <div>
                  <h2>Manual Pass Lookup</h2>
                  <p>Direct lookup via Pass Token, Badge ID, or UUID</p>
                </div>
              </div>

              <form onSubmit={handleManualLookup} className="manual-lookup-form">
                <label className="manual-lookup-label">
                  Pass Token / Visit Reference
                </label>
                <div className="manual-input-wrap">
                  <Search size={16} className="manual-input-icon" />
                  <input
                    type="text"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="e.g. nuAm3j0h... or VMS-XXXX"
                    className="manual-token-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={manualLookupLoading || !manualTokenInput.trim()}
                  className="manual-submit-button"
                >
                  {manualLookupLoading ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Verifying Credentials...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Verify Visitor Pass
                    </>
                  )}
                </button>
              </form>

              <div className="scanner-help-box">
                <h4>Security Guidelines</h4>
                <ul>
                  <li>Ensure the QR code is centered and clearly lit.</li>
                  <li>Verify visitor photo identity against government ID if requested.</li>
                  <li>Check declared equipment before authorising building entry/exit.</li>
                </ul>
              </div>
            </section>
          </div>
          </>
        )}
          </div>
        )}

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
            <section className="verification-card visitor-security-dossier">
              <div className="section-header">
                <div>
                  <h2>Security Verification Dossier</h2>
                  <p>Gate access credential &amp; visitor authorization record</p>
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
                  style={
                    (visit.purpose || "").includes("[IT_VISIT]") && decision.decision === "ALLOW"
                      ? { borderLeft: "4px solid #7e22ce" }
                      : {}
                  }
                >
                  {decision.decision === "ALLOW" ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <XCircle size={20} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong>
                        {decision.decision === "ALLOW"
                          ? ((visit.purpose || "").includes("[IT_VISIT]")
                              ? "ENTRY ALLOWED · IT TECHNICAL CONTRACTOR"
                              : "ENTRY ALLOWED · ACTIVE VISITOR")
                          : ((visit.purpose || "").includes("[IT_VISIT]")
                              ? "ENTRY REJECTED · IT SECURITY ALERT"
                              : "ENTRY REJECTED · GATE ALERT")}
                      </strong>
                      {(visit.purpose || "").includes("[IT_VISIT]") && (
                        <span
                          style={{
                            background: "#7e22ce",
                            color: "#ffffff",
                            fontSize: "10px",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontWeight: "700",
                          }}
                        >
                          IT VISIT
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "3px" }}>
                      {decision.reason}
                    </div>
                  </div>
                </div>
              )}

              {/* Redesigned Visitor Hero Profile Card */}
              <div className="visitor-dossier-hero">
                <div className="dossier-photo-frame">
                  {visit.visitor?.photo_url ? (
                    <img
                      src={resolvePhotoUrl(visit.visitor.photo_url)}
                      alt={`${visit.visitor?.first_name} ${visit.visitor?.last_name}`}
                      className="dossier-photo-img"
                    />
                  ) : (
                    <div className="dossier-avatar-initials">
                      {getInitials(
                        `${visit.visitor?.first_name || ""} ${
                          visit.visitor?.last_name || ""
                        }`
                      )}
                    </div>
                  )}
                  <div className="dossier-verified-badge" title="Identity Verified">
                    <CheckCircle2 size={13} />
                  </div>
                </div>

                <div className="dossier-info-block">
                  <div className="dossier-name-row">
                    <h3 className="dossier-visitor-name">
                      {visit.visitor?.first_name} {visit.visitor?.last_name}
                    </h3>
                    <span className={`dossier-status-pill ${String(visit.status).toLowerCase()}`}>
                      {visit.status === "ACTIVE" ? "Entry Authorized" : visit.status}
                    </span>
                  </div>

                  <div className="dossier-meta-chips">
                    {visit.visitor?.company_name && (
                      <span className="dossier-meta-chip">
                        <Building2 size={12} /> {visit.visitor.company_name}
                      </span>
                    )}
                    {visit.visitor?.phone_number && (
                      <span className="dossier-meta-chip">
                        {visit.visitor.phone_number}
                      </span>
                    )}
                  </div>
                </div>

                {/* Checkout / Status action button */}
                <div className="dossier-action-wrap">
                  {visit.status === "ACTIVE" ? (
                    <button
                      className="checkout-primary-btn"
                      onClick={handleCheckout}
                      disabled={checkoutLoading || assetsLoading}
                      title={
                        visitAssets.some((asset) => !asset.is_cleared_for_exit)
                          ? "Clear all registered assets before checkout"
                          : undefined
                      }
                    >
                      {checkoutLoading ? (
                        <RefreshCw size={14} className="spin" />
                      ) : (
                        <LogOut size={14} />
                      )}
                      {checkoutLoading ? "Processing Checkout..." : "Checkout Visitor"}
                    </button>
                  ) : (
                    <span className="checked-out-pill">
                      <CheckCircle2 size={14} /> Visitor Checked Out
                    </span>
                  )}
                </div>
              </div>

              {/* Credential Data Grid */}
              <div className="dossier-credential-grid">
                <div className="dossier-cred-card">
                  <span className="cred-card-label">Host Employee</span>
                  <strong className="cred-card-value">
                    {visit.host_employee?.first_name} {visit.host_employee?.last_name}
                  </strong>
                  <span className="cred-card-sub">
                    {visit.host_employee?.department || "General Staff"}
                  </span>
                </div>

                <div className="dossier-cred-card">
                  <span className="cred-card-label">Visit Purpose</span>
                  <strong className="cred-card-value">{visit.purpose || "Official Visit"}</strong>
                </div>

                <div className="dossier-cred-card">
                  <span className="cred-card-label">Check-in Time</span>
                  <strong className="cred-card-value">
                    {visit.check_in_time
                      ? new Date(visit.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : "Pending Gate Entry"}
                  </strong>
                </div>

                <div className="dossier-cred-card">
                  <span className="cred-card-label">Gate Pass ID</span>
                  <strong className="cred-card-value mono-val">
                    {visit.visit_id ? `VMS-${visit.visit_id.slice(0, 8).toUpperCase()}` : "—"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="verification-card asset-clearance-card">
              <div className="section-header">
                <div>
                  <h2>Visitor Asset Clearance</h2>
                  <p>Inspect physical equipment and authorize departure clearance</p>
                </div>
                <div className="assets-header-actions">
                  <span className="assets-count-badge">
                    {visitAssets.length} {visitAssets.length === 1 ? "Item" : "Items"} Registered
                  </span>
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
                  Loading visitor equipment...
                </div>
              ) : visitAssets.length === 0 ? (
                <div className="empty-state">
                  <ShieldCheck size={22} />
                  No external assets or equipment registered for this visitor.
                </div>
              ) : (
                <div className="security-assets-grid">
                  {visitAssets.map((asset) => (
                    <div className="security-asset-item-card" key={asset.asset_id}>
                      <div className="asset-card-media">
                        {asset.photo_url ? (
                          <img
                            src={resolvePhotoUrl(asset.photo_url)}
                            alt={asset.asset_type || "Asset"}
                            className="asset-preview-photo"
                          />
                        ) : (
                          <div className="asset-no-photo-box">
                            <Building2 size={24} />
                            <span>No Photo</span>
                          </div>
                        )}
                      </div>

                      <div className="asset-card-body">
                        <div className="asset-card-top-row">
                          <strong className="asset-type-title">
                            {asset.asset_type || "Equipment"}
                          </strong>
                          <span
                            className={`asset-clearance-status ${
                              asset.is_cleared_for_exit ? "cleared" : "pending"
                            }`}
                          >
                            {asset.is_cleared_for_exit ? "✓ Cleared for Exit" : "Pending Clearance"}
                          </span>
                        </div>

                        <p className="asset-model-name">
                          {asset.brand_model || "Model not specified"}
                        </p>

                        <div className="asset-serial-badge">
                          <span>S/N:</span> {asset.serial_number || "Not provided"}
                        </div>

                        {asset.is_cleared_for_exit ? (
                          <div className="clearance-audit-tag">
                            <CheckCircle2 size={13} />
                            <span>
                              Cleared {asset.cleared_at ? new Date(asset.cleared_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "by Security"}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="clear-exit-btn"
                            onClick={() => handleClearAssetForExit(asset.asset_id)}
                            disabled={clearingAssetId !== null}
                          >
                            {clearingAssetId === asset.asset_id ? (
                              <RefreshCw size={13} className="spin" />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            {clearingAssetId === asset.asset_id ? "Clearing..." : "Authorize Exit Clearance"}
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
      </div>
    );
  };

  const renderVisitors = () => {
    const totalVisitors = Array.isArray(visitorList) ? visitorList.length : 0;
    const filteredVisitorsList = Array.isArray(filteredDirectoryVisitors)
      ? filteredDirectoryVisitors
      : [];
    const distinctCompanies = Array.from(
      new Set(
        visitorList
          .map((item) => item.company_name?.trim())
          .filter((c) => c && c.toLowerCase() !== "n/a")
      )
    ).sort();
    const companyCount = distinctCompanies.length;
    const corporateVisitorsCount = visitorList.filter(
      (item) =>
        item.company_name &&
        item.company_name.trim() &&
        item.company_name.trim().toLowerCase() !== "n/a"
    ).length;
    const insideCount =
      activeVisitorIds.size || dashboardData?.statistics?.currently_inside || 0;
    const activeRecordsCount = visitorList.filter(
      (item) => item.status !== "INACTIVE" && item.is_active !== false
    ).length;

    return (
      <>
        {/* =========================================================
            DESKTOP VIEW (> 768px): PRESERVED 100% UNTOUCHED
        ========================================================= */}
        <div className="vms-desktop-only">
        {/* Executive Visitors Header */}
        <div className="it-management-header">
          <div className="it-header-title-box">
            <div className="it-header-badge-row">
              <span className="it-division-pill">Identity &amp; Directory Registry</span>
              <span className="it-telemetry-pill">
                <span className="status-dot"></span>
                Active Database Directory
              </span>
            </div>
            <h2 className="it-page-title">Visitors Directory &amp; Registry</h2>
            <p className="it-page-desc">
              Search, audit, and manage registered visitors, active campus occupants, and corporate affiliations
            </p>
          </div>

          <div className="it-header-controls">
            <button
              className="it-log-recovery-primary-btn"
              onClick={() => {
                setShowAddVisitor(!showAddVisitor);
                setVisitorError("");
              }}
              type="button"
            >
              <UserPlus size={15} />
              <span>{showAddVisitor ? "Close Form" : "Add Visitor"}</span>
            </button>
            <button className="it-qr-portal-btn" onClick={openScanner} type="button">
              <QrCode size={15} />
              <span>Scan Visitor QR</span>
            </button>
            <button
              type="button"
              className="it-refresh-btn"
              onClick={() => {
                fetchVisitors();
                fetchDashboard();
              }}
              disabled={visitorLoading}
              title="Refresh visitors & live status"
            >
              <RefreshCw size={15} className={visitorLoading ? "spin" : ""} />
            </button>
          </div>
        </div>

        <section className="stats-grid">
          <div
            className={`stat-card clickable ${visitorDirectoryFilter === "all" ? "active-filter filter-blue" : ""}`}
            onClick={() => {
              setVisitorDirectoryFilter("all");
              setSelectedCompanyFilter("");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setVisitorDirectoryFilter("all");
                setSelectedCompanyFilter("");
              }
            }}
            title="Click to view all registered visitors"
          >
            <div className="stat-icon blue">
              <Users size={18} />
            </div>
            <div className="stat-content">
              <span>Total Visitors</span>
              <strong>{totalVisitors}</strong>
              <span className="stat-interactive-hint">
                {visitorDirectoryFilter === "all" ? "● Active View" : "Click to view all"}
              </span>
            </div>
            <ChevronRight size={15} className={`stat-arrow ${visitorDirectoryFilter === "all" ? "arrow-active" : ""}`} />
          </div>

          <div
            className={`stat-card clickable ${visitorDirectoryFilter === "inside" ? "active-filter filter-green" : ""}`}
            onClick={() => {
              setVisitorDirectoryFilter(visitorDirectoryFilter === "inside" ? "all" : "inside");
              setSelectedCompanyFilter("");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setVisitorDirectoryFilter(visitorDirectoryFilter === "inside" ? "all" : "inside");
                setSelectedCompanyFilter("");
              }
            }}
            title="Click to view only visitors currently inside premises"
          >
            <div className="stat-icon green">
              <UserCheck size={18} />
            </div>
            <div className="stat-content">
              <span>Currently Inside</span>
              <strong>{insideCount}</strong>
              <span className="stat-interactive-hint">
                {visitorDirectoryFilter === "inside" ? "● Active View" : "Click to filter"}
              </span>
            </div>
            <ChevronRight size={15} className={`stat-arrow ${visitorDirectoryFilter === "inside" ? "arrow-active" : ""}`} />
          </div>

          <div
            className={`stat-card clickable ${visitorDirectoryFilter === "companies" ? "active-filter filter-purple" : ""}`}
            onClick={() => {
              setVisitorDirectoryFilter(visitorDirectoryFilter === "companies" ? "all" : "companies");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setVisitorDirectoryFilter(visitorDirectoryFilter === "companies" ? "all" : "companies");
              }
            }}
            title="Click to view only corporate visitors with registered companies"
          >
            <div className="stat-icon purple">
              <Building2 size={18} />
            </div>
            <div className="stat-content">
              <span>Companies</span>
              <strong>{companyCount}</strong>
              <span className="stat-interactive-hint">
                {visitorDirectoryFilter === "companies" ? `● ${corporateVisitorsCount} visitors` : `${corporateVisitorsCount} visitors`}
              </span>
            </div>
            <ChevronRight size={15} className={`stat-arrow ${visitorDirectoryFilter === "companies" ? "arrow-active" : ""}`} />
          </div>

          <div
            className={`stat-card clickable ${visitorDirectoryFilter === "active" ? "active-filter filter-amber" : ""}`}
            onClick={() => {
              setVisitorDirectoryFilter(visitorDirectoryFilter === "active" ? "all" : "active");
              setSelectedCompanyFilter("");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setVisitorDirectoryFilter(visitorDirectoryFilter === "active" ? "all" : "active");
                setSelectedCompanyFilter("");
              }
            }}
            title="Click to view active directory members"
          >
            <div className="stat-icon amber">
              <ShieldCheck size={18} />
            </div>
            <div className="stat-content">
              <span>Directory Status</span>
              <strong>ACTIVE</strong>
              <span className="stat-interactive-hint">
                {visitorDirectoryFilter === "active" ? `● ${activeRecordsCount} active` : `${activeRecordsCount} verified`}
              </span>
            </div>
            <ChevronRight size={15} className={`stat-arrow ${visitorDirectoryFilter === "active" ? "arrow-active" : ""}`} />
          </div>
        </section>

        {showAddVisitor && (
          <section className="page-card visitor-create-card">
            <div className="section-header">
              <div>
                <h2>Register New Visitor</h2>
                <p>Add a visitor to the enterprise directory for security verification and badge generation.</p>
              </div>
            </div>
            <form className="visitor-form" onSubmit={createVisitor}>
              <div className="form-grid-two">
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
              </div>

              <div className="form-grid-two">
                <div className="form-field">
                  <label>Phone Number</label>
                  <input
                    name="phone_number"
                    value={newVisitor.phone_number}
                    onChange={handleVisitorInput}
                    placeholder="e.g. +91 98765 43210"
                    type="tel"
                  />
                </div>
                <div className="form-field">
                  <label>Email Address</label>
                  <input
                    name="email"
                    value={newVisitor.email}
                    onChange={handleVisitorInput}
                    placeholder="visitor@company.com"
                    type="email"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Company / Organization Name</label>
                <input
                  name="company_name"
                  value={newVisitor.company_name}
                  onChange={handleVisitorInput}
                  placeholder="e.g. Microsoft, Google, Independent Contractor"
                />
              </div>

              <div className="form-field">
                <label>Address Line 1</label>
                <input name="address_line1" value={newVisitor.address_line1} onChange={handleVisitorInput} placeholder="Office branch, street, building number" autoComplete="address-line1" />
              </div>
              <div className="form-field">
                <label>Address Line 2 (Optional)</label>
                <input name="address_line2" value={newVisitor.address_line2} onChange={handleVisitorInput} placeholder="Suite, floor, landmark" autoComplete="address-line2" />
              </div>

              <div className="form-grid-three">
                <div className="form-field">
                  <label>City</label>
                  <input name="city" value={newVisitor.city} onChange={handleVisitorInput} placeholder="e.g. Bengaluru" autoComplete="address-level2" />
                </div>
                <div className="form-field">
                  <label>State / Province</label>
                  <input name="state" value={newVisitor.state} onChange={handleVisitorInput} placeholder="e.g. Karnataka" autoComplete="address-level1" />
                </div>
                <div className="form-field">
                  <label>Postal / PIN Code</label>
                  <input name="postal_code" value={newVisitor.postal_code} onChange={handleVisitorInput} placeholder="e.g. 560001" autoComplete="postal-code" />
                </div>
              </div>

              <div className="visitor-form-actions" style={{ marginTop: "18px" }}>
                <button
                  type="button"
                  className="it-qr-portal-btn"
                  onClick={() => {
                    setShowAddVisitor(false);
                    setVisitorError("");
                  }}
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="it-log-recovery-primary-btn"
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
                      Save &amp; Register Visitor
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
                  : `${filteredVisitorsList.length} of ${totalVisitors} visitor record${
                      totalVisitors === 1 ? "" : "s"
                    } displayed`}
              </p>
            </div>
            <div className="visitor-toolbar-actions">
              <div className="search-field">
                <Search size={14} />
                <input
                  value={visitorSearch}
                  onChange={(event) => setVisitorSearch(event.target.value)}
                  placeholder="Search visitors by name, company, email..."
                />
                {visitorSearch && (
                  <button
                    type="button"
                    style={{ background: "transparent", border: 0, cursor: "pointer", color: "#94a3b8" }}
                    onClick={() => setVisitorSearch("")}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                className="it-refresh-btn"
                onClick={() => {
                  fetchVisitors();
                  fetchDashboard();
                }}
                disabled={visitorLoading}
                title="Refresh visitors & live status"
                type="button"
              >
                <RefreshCw
                  size={14}
                  className={visitorLoading ? "spin" : ""}
                />
              </button>
            </div>
          </div>

          {/* Segmented Filter Pills Row */}
          <div className="it-filter-pills-row">
            <button
              type="button"
              className={`it-filter-pill ${visitorDirectoryFilter === "all" ? "active" : ""}`}
              onClick={() => {
                setVisitorDirectoryFilter("all");
                setSelectedCompanyFilter("");
              }}
            >
              All Visitors ({totalVisitors})
            </button>
            <button
              type="button"
              className={`it-filter-pill ${visitorDirectoryFilter === "inside" ? "active" : ""}`}
              onClick={() => {
                setVisitorDirectoryFilter("inside");
                setSelectedCompanyFilter("");
              }}
            >
              <span className="live-dot"></span>
              Currently Inside ({insideCount})
            </button>
            <button
              type="button"
              className={`it-filter-pill ${visitorDirectoryFilter === "companies" ? "active" : ""}`}
              onClick={() => setVisitorDirectoryFilter("companies")}
            >
              Corporate ({corporateVisitorsCount})
            </button>
            <button
              type="button"
              className={`it-filter-pill ${visitorDirectoryFilter === "active" ? "active" : ""}`}
              onClick={() => {
                setVisitorDirectoryFilter("active");
                setSelectedCompanyFilter("");
              }}
            >
              Active Records ({activeRecordsCount})
            </button>

            {visitorDirectoryFilter === "companies" && distinctCompanies.length > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Company:</span>
                <select
                  value={selectedCompanyFilter}
                  onChange={(e) => setSelectedCompanyFilter(e.target.value)}
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

            {(visitorDirectoryFilter !== "all" || visitorSearch || selectedCompanyFilter) && (
              <button
                type="button"
                className="it-filter-pill-reset"
                onClick={() => {
                  setVisitorDirectoryFilter("all");
                  setSelectedCompanyFilter("");
                  setVisitorSearch("");
                }}
              >
                Clear Filters
              </button>
            )}
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
                {visitorDirectoryFilter !== "all"
                  ? `No visitors match the "${
                      visitorDirectoryFilter === "inside"
                        ? "Currently Inside"
                        : visitorDirectoryFilter === "companies"
                        ? "Companies"
                        : "Active"
                    }" filter`
                  : "No visitors found"}
              </strong>
              <span style={{ color: "#98a2b3", fontSize: "12px", marginBottom: "12px" }}>
                {visitorDirectoryFilter !== "all"
                  ? "Try resetting the filter or searching with different keywords."
                  : "Try a different search or add a new visitor."}
              </span>
              {visitorDirectoryFilter !== "all" ? (
                <button
                  type="button"
                  className="it-log-recovery-primary-btn"
                  onClick={() => {
                    setVisitorDirectoryFilter("all");
                    setSelectedCompanyFilter("");
                    setVisitorSearch("");
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Show All Visitors</span>
                </button>
              ) : (
                <button
                  className="it-log-recovery-primary-btn"
                  onClick={() => setShowAddVisitor(true)}
                  type="button"
                >
                  <UserPlus size={14} />
                  <span>Add Visitor</span>
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="visitors-table" style={{ width: "100%", minWidth: "1040px", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: "200px" }}>Visitor</th>
                    <th style={{ minWidth: "110px" }}>Status</th>
                    <th style={{ minWidth: "140px" }}>Phone</th>
                    <th style={{ minWidth: "190px" }}>Email Address</th>
                    <th style={{ minWidth: "160px" }}>Company / Org</th>
                    <th style={{ minWidth: "180px" }}>Location</th>
                    <th style={{ minWidth: "90px", textAlign: "center" }}>Visitor ID</th>
                    <th style={{ minWidth: "180px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitorsList.map((item) => {
                    const name = `${item.first_name || ""} ${item.last_name || ""}`.trim();
                    const isInside = activeVisitorIds.has(Number(item.visitor_id));
                    const activeVisit = activeVisitByVisitorId.get(Number(item.visitor_id));
                    const resolvedPhoto = resolvePhotoUrl(item.photo_url);

                    return (
                      <tr
                        key={item.visitor_id}
                        className={`row-visitor-clickable ${isInside ? "row-visitor-inside" : ""}`}
                        onClick={() => openVisitorDossier(item)}
                        title="Click to view full visitor dossier & active status"
                      >
                        <td>
                          <div className="visitor-cell">
                            <div className="visitor-avatar">
                              {resolvedPhoto ? (
                                <img
                                  src={resolvedPhoto}
                                  alt={name}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : null}
                              <span className="avatar-initials">
                                {getInitials(name || "Visitor")}
                              </span>
                            </div>
                            <div>
                              <strong>{name || "Unknown Visitor"}</strong>
                              <span style={{ fontSize: "11.5px", color: isInside ? "#059669" : "#64748b" }}>
                                {isInside && activeVisit?.purpose
                                  ? `Onsite: ${activeVisit.purpose}`
                                  : "Registered visitor"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {isInside ? (
                            <span className="status-pill active live-onsite-pill" title="Visitor is currently checked in on premises">
                              <span className="status-dot"></span>
                              Inside
                            </span>
                          ) : (
                            <span className="status-pill checked" title="Registered active directory record">
                              Active
                            </span>
                          )}
                        </td>
                        <td style={{ color: "#334155", fontWeight: 500 }}>{item.phone_number || "—"}</td>
                        <td style={{ color: "#475569" }}>{item.email || "—"}</td>
                        <td>
                          <div className="it-company-tag">
                            <Building2 size={12} />
                            <span>{item.company_name || "Independent"}</span>
                          </div>
                        </td>
                        <td style={{ color: "#475569", fontSize: "12px" }}>
                          {[item.address_line1, item.city, item.state]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="visitor-id-badge">#{item.visitor_id}</span>
                        </td>
                        <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn-table-action btn-table-view"
                              onClick={() => openVisitorDossier(item)}
                              title="View full profile, active visit, declared assets and history"
                            >
                              <Eye size={13} />
                              <span>Details</span>
                            </button>
                            {isInside && activeVisit && (
                              <button
                                type="button"
                                className="btn-table-action"
                                style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
                                onClick={() => window.open(`/visitor-pass/${encodeURIComponent(activeVisit.visit_id)}`, "_blank")}
                                title="Open official digital visitor pass"
                              >
                                <Ticket size={13} />
                                <span>Pass</span>
                              </button>
                            )}
                            {isInside && (
                              <button
                                type="button"
                                className="btn-table-action btn-table-checkout"
                                disabled={directCheckoutLoading === String(activeVisit?.visit_id)}
                                onClick={() => handleDirectVisitorCheckout(activeVisit?.visit_id, name)}
                                title="Check out visitor who has completed visit"
                              >
                                <LogOut size={13} />
                                <span>{directCheckoutLoading === String(activeVisit?.visit_id) ? "Checking Out..." : "Check Out"}</span>
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
        </div>

        {/* =========================================================
            MOBILE VIEW (<= 768px): VISITORS DIRECTORY & REGISTRY
            (Exact 1:1 match to mobile mockup)
        ========================================================= */}
        <div className="vms-mobile-only mobile-visitors-container">
          {/* 1. Executive Dark Navy Hero Card */}
          <div className="mobile-visitor-hero">
            <div className="mobile-visitor-hero-badge-row">
              <span className="mobile-visitor-badge-pill">IDENTITY &amp; DIRECTORY REGISTRY</span>
              <span className="mobile-visitor-telemetry-pill">
                <span className="status-dot"></span>
                Active Database Directory
              </span>
            </div>

            <div className="mobile-visitor-hero-title-wrap">
              <div className="mobile-visitor-hero-text">
                <h2 className="mobile-visitor-hero-title">Visitors Directory &amp; Registry</h2>
                <p className="mobile-visitor-hero-desc">
                  Search, audit, and manage registered visitors, active campus occupants, and corporate affiliations.
                </p>
              </div>
              <div className="mobile-visitor-hero-watermark">
                <Users size={38} />
              </div>
            </div>

            <div className="mobile-visitor-hero-controls">
              <button
                type="button"
                className="mobile-visitor-btn-add"
                onClick={() => {
                  setShowAddVisitor(!showAddVisitor);
                  setVisitorError("");
                }}
              >
                <UserPlus size={15} />
                <span>{showAddVisitor ? "Close Form" : "Add Visitor"}</span>
              </button>

              <button
                type="button"
                className="mobile-visitor-btn-scan"
                onClick={openScanner}
              >
                <QrCode size={15} />
                <span>Scan Visitor QR</span>
              </button>

              <button
                type="button"
                className="mobile-visitor-btn-refresh"
                onClick={() => {
                  fetchVisitors();
                  fetchDashboard();
                }}
                disabled={visitorLoading}
                title="Refresh visitors & live status"
              >
                <RefreshCw size={15} className={visitorLoading ? "spin" : ""} />
              </button>
            </div>
          </div>

          {/* 2. KPI Metrics Grid (2x2) */}
          <div className="mobile-visitor-stats-grid">
            <div
              className={`mobile-visitor-stat-card ${visitorDirectoryFilter === "all" && !selectedCompanyFilter ? "active" : ""}`}
              onClick={() => {
                setVisitorDirectoryFilter("all");
                setSelectedCompanyFilter("");
              }}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-visitor-stat-icon blue">
                <Users size={18} />
              </div>
              <div className="mobile-visitor-stat-content">
                <strong>{totalVisitors}</strong>
                <span>Total Visitors</span>
              </div>
              <ChevronRight size={14} className="mobile-visitor-stat-arrow" />
            </div>

            <div
              className={`mobile-visitor-stat-card ${visitorDirectoryFilter === "inside" ? "active" : ""}`}
              onClick={() => {
                setVisitorDirectoryFilter(visitorDirectoryFilter === "inside" ? "all" : "inside");
                setSelectedCompanyFilter("");
              }}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-visitor-stat-icon green">
                <UserCheck size={18} />
              </div>
              <div className="mobile-visitor-stat-content">
                <strong>{insideCount}</strong>
                <span>Currently Inside</span>
              </div>
              <ChevronRight size={14} className="mobile-visitor-stat-arrow" />
            </div>

            <div
              className={`mobile-visitor-stat-card ${visitorDirectoryFilter === "companies" ? "active" : ""}`}
              onClick={() => {
                setVisitorDirectoryFilter(visitorDirectoryFilter === "companies" ? "all" : "companies");
              }}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-visitor-stat-icon purple">
                <Building2 size={18} />
              </div>
              <div className="mobile-visitor-stat-content">
                <strong>{companyCount}</strong>
                <span>Companies</span>
              </div>
              <ChevronRight size={14} className="mobile-visitor-stat-arrow" />
            </div>

            <div
              className={`mobile-visitor-stat-card ${visitorDirectoryFilter === "active" ? "active" : ""}`}
              onClick={() => {
                setVisitorDirectoryFilter(visitorDirectoryFilter === "active" ? "all" : "active");
                setSelectedCompanyFilter("");
              }}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-visitor-stat-icon amber">
                <ShieldCheck size={18} />
              </div>
              <div className="mobile-visitor-stat-content">
                <strong className="status-val">ACTIVE</strong>
                <span>Directory Status</span>
              </div>
              <ChevronRight size={14} className="mobile-visitor-stat-arrow" />
            </div>
          </div>

          {/* Add Visitor Form (Mobile Card) */}
          {showAddVisitor && (
            <div className="mobile-visitor-form-card">
              <div className="mobile-visitor-form-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Register New Visitor</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Add to enterprise directory</p>
                </div>
                <button type="button" onClick={() => setShowAddVisitor(false)} className="mobile-visitor-form-close">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={createVisitor} className="mobile-visitor-form">
                <div className="mobile-visitor-form-field">
                  <label>First Name *</label>
                  <input
                    name="first_name"
                    value={newVisitor.first_name}
                    onChange={handleVisitorInput}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="mobile-visitor-form-field">
                  <label>Last Name</label>
                  <input
                    name="last_name"
                    value={newVisitor.last_name}
                    onChange={handleVisitorInput}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="mobile-visitor-form-field">
                  <label>Phone Number</label>
                  <input
                    name="phone_number"
                    value={newVisitor.phone_number}
                    onChange={handleVisitorInput}
                    placeholder="e.g. +91 98765 43210"
                    type="tel"
                  />
                </div>
                <div className="mobile-visitor-form-field">
                  <label>Email Address</label>
                  <input
                    name="email"
                    value={newVisitor.email}
                    onChange={handleVisitorInput}
                    placeholder="visitor@company.com"
                    type="email"
                  />
                </div>
                <div className="mobile-visitor-form-field">
                  <label>Company / Organization Name</label>
                  <input
                    name="company_name"
                    value={newVisitor.company_name}
                    onChange={handleVisitorInput}
                    placeholder="e.g. Independent, Acme Corp"
                  />
                </div>
                <div className="mobile-visitor-form-field">
                  <label>Address / City</label>
                  <input
                    name="address_line1"
                    value={newVisitor.address_line1}
                    onChange={handleVisitorInput}
                    placeholder="City, State, Street"
                  />
                </div>

                <div className="mobile-visitor-form-actions">
                  <button type="button" onClick={() => setShowAddVisitor(false)} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" disabled={visitorCreateLoading} className="btn-submit">
                    {visitorCreateLoading ? "Creating..." : "Save Visitor"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. Section Heading & Records Count */}
          <div className="mobile-visitor-section-header">
            <h3 className="mobile-visitor-section-title">Visitor Directory</h3>
            <span className="mobile-visitor-section-count">
              {filteredVisitorsList.length} of {totalVisitors} visitor records displayed
            </span>
          </div>

          {/* 4. Search Bar & Filter Button */}
          <div className="mobile-visitor-search-row" style={{ marginBottom: "12px" }}>
            <div className="mobile-visitor-search-box" style={{ position: "relative", display: "flex", alignItems: "center", flex: 1 }}>
              <Search size={15} className="mobile-visitor-search-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", zIndex: 2 }} />
              <input
                type="text"
                value={visitorSearch}
                onChange={(e) => setVisitorSearch(e.target.value)}
                placeholder="Search visitors by name, company, email..."
                className="mobile-visitor-search-input"
                style={{ width: "100%", height: "42px", paddingLeft: "42px", paddingRight: "38px", borderRadius: "12px", fontSize: "13.5px", boxSizing: "border-box" }}
              />
              {visitorSearch && (
                <button
                  type="button"
                  className="mobile-visitor-search-clear"
                  onClick={() => setVisitorSearch("")}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", zIndex: 3 }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              type="button"
              className={`mobile-visitor-filter-btn ${showMobileCompanyFilter || selectedCompanyFilter ? "active" : ""}`}
              onClick={() => setShowMobileCompanyFilter(!showMobileCompanyFilter)}
              title="Filter by company"
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>

          {/* Quick Company Filter Dropdown (When Filter Icon is Clicked) */}
          {showMobileCompanyFilter && (
            <div className="mobile-visitor-company-dropdown-card">
              <div className="mobile-visitor-company-header">
                <span>Filter by Company ({distinctCompanies.length})</span>
                <button type="button" onClick={() => setShowMobileCompanyFilter(false)}>
                  <X size={13} />
                </button>
              </div>
              <select
                value={selectedCompanyFilter}
                onChange={(e) => {
                  setSelectedCompanyFilter(e.target.value);
                  if (e.target.value) setVisitorDirectoryFilter("companies");
                }}
                className="mobile-visitor-company-select"
              >
                <option value="">All Companies ({distinctCompanies.length})</option>
                {distinctCompanies.map((comp) => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>
          )}

          {/* 5. Horizontal Filter Pills Row */}
          <div className="mobile-visitor-pills-row">
            <button
              type="button"
              className={`mobile-visitor-pill ${visitorDirectoryFilter === "all" && !selectedCompanyFilter ? "active" : ""}`}
              onClick={() => {
                setVisitorDirectoryFilter("all");
                setSelectedCompanyFilter("");
              }}
            >
              All Visitors ({totalVisitors})
            </button>

            <button
              type="button"
              className={`mobile-visitor-pill ${visitorDirectoryFilter === "inside" ? "active" : ""}`}
              onClick={() => {
                setVisitorDirectoryFilter(visitorDirectoryFilter === "inside" ? "all" : "inside");
                setSelectedCompanyFilter("");
              }}
            >
              <span className="live-dot"></span>
              Currently Inside ({insideCount})
            </button>

            <button
              type="button"
              className={`mobile-visitor-pill ${visitorDirectoryFilter === "companies" ? "active" : ""}`}
              onClick={() => setVisitorDirectoryFilter("companies")}
            >
              Corporate ({corporateVisitorsCount})
            </button>

            <button
              type="button"
              className={`mobile-visitor-pill ${visitorDirectoryFilter === "active" ? "active" : ""}`}
              onClick={() => {
                setVisitorDirectoryFilter("active");
                setSelectedCompanyFilter("");
              }}
            >
              Active Records ({activeRecordsCount})
            </button>

            {(visitorDirectoryFilter !== "all" || visitorSearch || selectedCompanyFilter) && (
              <button
                type="button"
                className="mobile-visitor-pill-reset"
                onClick={() => {
                  setVisitorDirectoryFilter("all");
                  setSelectedCompanyFilter("");
                  setVisitorSearch("");
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* 6. Visitor Cards List */}
          {visitorLoading ? (
            <div className="mobile-visitor-empty">
              <RefreshCw size={24} className="spin" style={{ color: "#2563eb", marginBottom: "8px" }} />
              <p>Loading visitors...</p>
            </div>
          ) : filteredVisitorsList.length === 0 ? (
            <div className="mobile-visitor-empty">
              <Users size={32} style={{ color: "#94a3b8", marginBottom: "8px" }} />
              <strong>No visitors found</strong>
              <p>Try searching with different keywords or resetting filters.</p>
              <button
                type="button"
                className="mobile-visitor-btn-add"
                style={{ marginTop: "12px", width: "auto" }}
                onClick={() => {
                  setVisitorDirectoryFilter("all");
                  setSelectedCompanyFilter("");
                  setVisitorSearch("");
                }}
              >
                Show All Visitors
              </button>
            </div>
          ) : (
            <div className="mobile-visitor-cards-list">
              {filteredVisitorsList.map((item, index) => {
                const name = `${item.first_name || ""} ${item.last_name || ""}`.trim();
                const isInside = activeVisitorIds.has(Number(item.visitor_id));
                const activeVisit = activeVisitByVisitorId.get(Number(item.visitor_id));
                const resolvedPhoto = resolvePhotoUrl(item.photo_url);
                const initials = getInitials(name || "Visitor");
                const avatarPalette = [
                  { bg: "#0f172a", text: "#ffffff" },
                  { bg: "#0f172a", text: "#ffffff" },
                  { bg: "#2563eb", text: "#ffffff" },
                  { bg: "#7c3aed", text: "#ffffff" },
                  { bg: "#059669", text: "#ffffff" },
                  { bg: "#d97706", text: "#ffffff" },
                ];
                const avatarColor = avatarPalette[index % avatarPalette.length];

                return (
                  <div
                    key={item.visitor_id}
                    className={`mobile-visitor-card ${isInside ? "inside" : ""}`}
                    onClick={() => openVisitorDossier(item)}
                  >
                    {/* Top Row: Avatar + Name/Sub + Status + ID + 3-dots */}
                    <div className="mobile-visitor-card-top">
                      <div className="mobile-visitor-card-left">
                        <div
                          className="mobile-visitor-card-avatar"
                          style={{
                            background: avatarColor.bg,
                            color: avatarColor.text,
                          }}
                        >
                          <span className="avatar-initials">{initials}</span>
                        </div>

                        <div className="mobile-visitor-card-identity">
                          <h4 className="mobile-visitor-card-name">{name || "Unknown Visitor"}</h4>
                          <span className={`mobile-visitor-card-sub ${isInside ? "onsite" : ""}`}>
                            {isInside && activeVisit?.purpose
                              ? `Onsite: ${activeVisit.purpose}`
                              : "Registered visitor"}
                          </span>
                        </div>
                      </div>

                      <div className="mobile-visitor-card-right" onClick={(e) => e.stopPropagation()}>
                        {isInside ? (
                          <span className="mobile-visitor-status-pill inside">
                            <span className="status-dot"></span>
                            Inside
                          </span>
                        ) : (
                          <span className="mobile-visitor-status-pill active">
                            Active
                          </span>
                        )}

                        <span className="mobile-visitor-id-pill">#{item.visitor_id}</span>

                        <button
                          type="button"
                          className="mobile-visitor-options-btn"
                          onClick={() => openVisitorDossier(item)}
                          title="Options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Middle Details Grid (2 Columns) */}
                    <div className="mobile-visitor-card-meta">
                      <div className="mobile-visitor-meta-col">
                        <div className="mobile-visitor-meta-item">
                          <Phone size={12} className="meta-icon" />
                          <span className="truncate">{item.phone_number || "—"}</span>
                        </div>
                        <div className="mobile-visitor-meta-item">
                          <Building2 size={12} className="meta-icon" />
                          <span className="truncate">{item.company_name || "Independent"}</span>
                        </div>
                      </div>

                      <div className="mobile-visitor-meta-col">
                        <div className="mobile-visitor-meta-item">
                          <Mail size={12} className="meta-icon" />
                          <span className="truncate">{item.email || "—"}</span>
                        </div>
                        <div className="mobile-visitor-meta-item">
                          <MapPin size={12} className="meta-icon" />
                          <span className="truncate">
                            {[item.city, item.state].filter(Boolean).join(", ") || item.address_line1 || "On record"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Button(s) */}
                    <div className="mobile-visitor-card-actions" onClick={(e) => e.stopPropagation()}>
                      {!isInside ? (
                        <button
                          type="button"
                          className="mobile-visitor-btn-details-full"
                          onClick={() => openVisitorDossier(item)}
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                      ) : (
                        <div className="mobile-visitor-btn-triple-wrap">
                          <button
                            type="button"
                            className="mobile-visitor-btn-details-triple"
                            onClick={() => openVisitorDossier(item)}
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          <button
                            type="button"
                            className="mobile-visitor-btn-pass-triple"
                            onClick={() =>
                              activeVisit &&
                              window.open(`/visitor-pass/${encodeURIComponent(activeVisit.visit_id)}`, "_blank")
                            }
                          >
                            <QrCode size={13} />
                            <span>Pass</span>
                          </button>

                          <button
                            type="button"
                            className="mobile-visitor-btn-checkout-triple"
                            disabled={directCheckoutLoading === String(activeVisit?.visit_id)}
                            onClick={() => handleDirectVisitorCheckout(activeVisit?.visit_id, name)}
                          >
                            <LogOut size={13} />
                            <span>{directCheckoutLoading === String(activeVisit?.visit_id) ? "Checking Out..." : "Check Out"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================
            COMPREHENSIVE VISITOR DOSSIER & CHECKOUT MODAL
        ========================================================= */}
        {selectedVisitorDossier && (
          <div
            className="vms-dossier-overlay"
            onClick={closeVisitorDossier}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="vms-dossier-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="vms-dossier-header">
                <div className="vms-dossier-header-title">
                  <div className="vms-dossier-header-icon">
                    <User size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#ffffff" }}>
                      Visitor Identity Dossier &amp; Record
                    </h3>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      Identity verification, declared assets, live campus presence &amp; gate departure
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="vms-dossier-close-btn"
                  onClick={closeVisitorDossier}
                  title="Close dossier"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="vms-dossier-body">
                {dossierLoading ? (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <RefreshCw size={28} className="spin" style={{ color: "#0284c7", margin: "0 auto 12px" }} />
                    <h4 style={{ margin: "0 0 6px", color: "#1e293b", fontSize: "15px" }}>Loading Complete Visitor Record...</h4>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>Retrieving profile, active visit, declared equipment, and full historical log.</p>
                  </div>
                ) : dossierError ? (
                  <div className="error-banner" style={{ margin: 0 }}>
                    <AlertTriangle size={18} />
                    <span>{dossierError}</span>
                    <button
                      type="button"
                      className="btn-table-action btn-table-view"
                      style={{ marginLeft: "auto" }}
                      onClick={() => openVisitorDossier(selectedVisitorDossier)}
                    >
                      Retry
                    </button>
                  </div>
                ) : dossierData ? (
                  <>
                    {/* Visitor Profile Card */}
                    <div className="vms-dossier-profile-card">
                      {/* Top Row: Avatar & Primary Identity */}
                      <div className="vms-dossier-hero-row">
                        <div className="vms-dossier-avatar-col">
                          <div className="vms-dossier-avatar-box">
                            {dossierData.visitor?.photo_url ? (
                              <img
                                src={resolvePhotoUrl(dossierData.visitor.photo_url)}
                                alt={`${dossierData.visitor.first_name} ${dossierData.visitor.last_name}`}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector(".vms-dossier-avatar-initials");
                                  if (fallback) fallback.style.display = "flex";
                                }}
                                onLoad={(e) => {
                                  const fallback = e.currentTarget.parentElement?.querySelector(".vms-dossier-avatar-initials");
                                  if (fallback) fallback.style.display = "none";
                                }}
                              />
                            ) : null}
                            <span
                              className="vms-dossier-avatar-initials"
                              style={{ display: dossierData.visitor?.photo_url ? "none" : "flex" }}
                            >
                              {getInitials(`${dossierData.visitor?.first_name || ""} ${dossierData.visitor?.last_name || ""}`)}
                            </span>
                          </div>
                          <input
                            type="file"
                            ref={dossierPhotoInputRef}
                            style={{ display: "none" }}
                            accept="image/*"
                            onChange={handleDossierPhotoUpload}
                          />
                          <button
                            type="button"
                            className="vms-dossier-change-photo-btn"
                            disabled={dossierPhotoUploading}
                            onClick={() => dossierPhotoInputRef.current?.click()}
                            title="Upload new image or replace current photo"
                          >
                            <Camera size={12} />
                            <span>{dossierPhotoUploading ? "Updating..." : "Update Photo"}</span>
                          </button>
                        </div>

                        <div className="vms-dossier-identity-col">
                          <div className="vms-dossier-name-row">
                            <div className="vms-dossier-name-left">
                              <h2 className="vms-dossier-name">
                                {dossierData.visitor?.first_name} {dossierData.visitor?.last_name}
                              </h2>
                              <div className="vms-dossier-meta-badges">
                                <span className="visitor-id-badge">Visitor ID #{dossierData.visitor?.visitor_id}</span>
                                <div className="it-company-tag">
                                  <Building2 size={12} />
                                  <span>{dossierData.visitor?.company_name || "Independent"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="vms-dossier-badges">
                              {dossierData.active_visit ? (
                                <span className="vms-live-indicator-pill">
                                  <span className="vms-pulse-dot"></span>
                                  Currently Inside
                                </span>
                              ) : (
                                <span className="status-pill checked">
                                  Registered / Off-Campus
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Full-Width Contact Channels & Location Grid */}
                      <div className="vms-dossier-grid-details">
                        <div className="vms-dossier-field">
                          <span className="vms-dossier-field-label">Phone Number</span>
                          <span className="vms-dossier-field-val">
                            <Phone size={13} style={{ color: "#0284c7", flexShrink: 0 }} />
                            {dossierData.visitor?.phone_number ? (
                              <a href={`tel:${dossierData.visitor.phone_number}`} style={{ color: "inherit", textDecoration: "none" }}>
                                {dossierData.visitor.phone_number}
                              </a>
                            ) : "—"}
                          </span>
                        </div>

                        <div className="vms-dossier-field">
                          <span className="vms-dossier-field-label">Email Address</span>
                          <span className="vms-dossier-field-val">
                            <Mail size={13} style={{ color: "#0284c7", flexShrink: 0 }} />
                            {dossierData.visitor?.email ? (
                              <a href={`mailto:${dossierData.visitor.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                                {dossierData.visitor.email}
                              </a>
                            ) : "—"}
                          </span>
                        </div>

                        <div className="vms-dossier-field vms-dossier-field-address" style={{ gridColumn: "1 / -1" }}>
                          <span className="vms-dossier-field-label">Full Registered Address</span>
                          <span className="vms-dossier-field-val">
                            <MapPin size={13} style={{ color: "#0284c7", flexShrink: 0 }} />
                            <span>
                              {formatVisitorAddress([
                                dossierData.visitor?.address_line1,
                                dossierData.visitor?.address_line2,
                                dossierData.visitor?.city,
                                dossierData.visitor?.state,
                                dossierData.visitor?.postal_code,
                                dossierData.visitor?.country,
                              ])}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Active Onsite Campus Visit Banner (If currently checked in) */}
                    {dossierData.active_visit ? (
                      <div className="vms-active-visit-banner">
                        <div className="vms-active-visit-top">
                          <div>
                            <span className="vms-live-indicator-pill">
                              <span className="vms-pulse-dot"></span>
                              Active Campus Visit in Progress
                            </span>
                            <h4 style={{ margin: "6px 0 0", fontSize: "16px", fontWeight: 800, color: "#14532d" }}>
                              Visitor is currently inside facility
                            </h4>
                          </div>

                          <div className="vms-active-visit-actions">
                            <button
                              type="button"
                              className="vms-btn-it-pass"
                              onClick={() => {
                                const passUrl = `/visitor-pass/${encodeURIComponent(dossierData.active_visit.visit_id)}`;
                                window.open(passUrl, "_blank");
                              }}
                              title="Open official digital visitor pass"
                            >
                              <Ticket size={13} />
                              <span>Visitor Pass</span>
                            </button>

                            <button
                              type="button"
                              className="vms-btn-pass-link"
                              onClick={() => {
                                const scanUrl = `/guard?scan=${encodeURIComponent(dossierData.active_visit.visit_id)}`;
                                window.open(scanUrl, "_blank");
                              }}
                              title="Open Security Gate Scanner / Guard Clearance Portal"
                            >
                              <ShieldCheck size={13} />
                              <span>Gate Pass</span>
                            </button>

                            <button
                              type="button"
                              className="vms-btn-checkout-prominent"
                              disabled={directCheckoutLoading === String(dossierData.active_visit.visit_id)}
                              onClick={() =>
                                handleDirectVisitorCheckout(
                                  dossierData.active_visit.visit_id,
                                  `${dossierData.visitor.first_name} ${dossierData.visitor.last_name}`
                                )
                              }
                              title="Process check out for visitor if not checked out by security"
                            >
                              <LogOut size={15} />
                              <span>
                                {directCheckoutLoading === String(dossierData.active_visit.visit_id)
                                  ? "Checking Out..."
                                  : "Check Out Visitor Now"}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="vms-active-visit-grid">
                          <div className="vms-dossier-field">
                            <span className="vms-dossier-field-label">Purpose of Visit</span>
                            <span className="vms-dossier-field-val" style={{ color: "#047857" }}>
                              {dossierData.active_visit.purpose || "General Visit"}
                            </span>
                          </div>

                          <div className="vms-dossier-field">
                            <span className="vms-dossier-field-label">Host Employee</span>
                            <span className="vms-dossier-field-val">
                              {dossierData.active_visit.host_name}
                              {dossierData.active_visit.host_department && (
                                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 400 }}>
                                  ({dossierData.active_visit.host_department})
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="vms-dossier-field">
                            <span className="vms-dossier-field-label">Check-In Time</span>
                            <span className="vms-dossier-field-val">
                              <Clock size={13} style={{ color: "#059669" }} />
                              {dossierData.active_visit.check_in_time
                                ? new Date(dossierData.active_visit.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : "Active"}
                            </span>
                          </div>

                          <div className="vms-dossier-field">
                            <span className="vms-dossier-field-label">Visit UUID</span>
                            <span className="vms-dossier-field-val" style={{ fontFamily: "monospace", fontSize: "11.5px" }}>
                              {String(dossierData.active_visit.visit_id).slice(0, 13)}...
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (() => {
                      const latestVisit = dossierData.visits?.[0];
                      const isUpcoming = !dossierData.active_visit && latestVisit && (latestVisit.status === "PENDING" || latestVisit.status === "APPROVED" || latestVisit.status === "PRE_APPROVED");
                      const isApproved = isUpcoming && (latestVisit.status === "APPROVED" || latestVisit.status === "PRE_APPROVED");

                      return (
                        <div
                          style={{
                            background: isUpcoming ? (isApproved ? "#eff6ff" : "#fffbeb") : "#f1f5f9",
                            borderRadius: "10px",
                            padding: "14px 18px",
                            border: `1.5px solid ${isUpcoming ? (isApproved ? "#bfdbfe" : "#fde68a") : "#e2e8f0"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            color: "#475569",
                            fontSize: "13px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <ShieldCheck size={18} color={isUpcoming ? (isApproved ? "#2563eb" : "#d97706") : "#64748b"} />
                            <div>
                              <strong style={{ color: isUpcoming ? (isApproved ? "#1d4ed8" : "#92400e") : "#334155", display: "block" }}>
                                {isUpcoming
                                  ? (isApproved ? "Pre-Approved Visit Scheduled · Awaiting Gate Check-In" : "Visit Scheduled / Pending Gate Check-In")
                                  : "Visitor is Currently Off-Campus"}
                              </strong>
                              <span style={{ fontSize: "12px", color: "#64748b" }}>
                                {isUpcoming
                                  ? `Scheduled Purpose: ${latestVisit.purpose || "General Visit"}. Host: ${latestVisit.host_name || "Staff"}`
                                  : "No active visit in progress at this moment."}
                              </span>
                            </div>
                          </div>

                          {isUpcoming && latestVisit?.visit_id && (
                            <button
                              type="button"
                              className="btn-table-action"
                              style={{ background: "#059669", color: "#ffffff", fontWeight: 700, padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                              disabled={directCheckoutLoading === String(latestVisit.visit_id)}
                              onClick={() =>
                                handleDirectVisitorCheckIn(
                                  latestVisit.visit_id,
                                  `${dossierData.visitor?.first_name} ${dossierData.visitor?.last_name}`
                                )
                              }
                            >
                              <CheckCircle2 size={14} />
                              <span>{directCheckoutLoading === String(latestVisit.visit_id) ? "Checking In..." : "Check In Visitor Now"}</span>
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Declared Hardware & Assets */}
                    <div className="vms-dossier-section">
                      <div className="vms-dossier-section-header">
                        <div>
                          <h4 className="vms-dossier-section-title">
                            <Laptop size={16} style={{ color: "#0284c7" }} />
                            <span>Declared Hardware &amp; Assets ({(dossierData.assets || []).length})</span>
                          </h4>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>
                            Physical equipment declared upon admission · In-visit reconciliation &amp; gate clearance
                          </span>
                        </div>

                        {dossierData.active_visit && (
                          <button
                            type="button"
                            onClick={() => setIsAddingDossierAsset((prev) => !prev)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              background: isAddingDossierAsset ? "#fee2e2" : "#f0fdf4",
                              color: isAddingDossierAsset ? "#991b1b" : "#166534",
                              border: `1.5px solid ${isAddingDossierAsset ? "#fca5a5" : "#86efac"}`,
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {isAddingDossierAsset ? <X size={13} /> : <Plus size={13} />}
                            <span>{isAddingDossierAsset ? "Cancel Adding" : "Register Additional Asset"}</span>
                          </button>
                        )}
                      </div>

                      {/* Summary Bar for Hardware Reconciliation */}
                      {(() => {
                        const declaredAssets = dossierData.assets || [];
                        if (declaredAssets.length === 0) return null;
                        const latestVisit = dossierData.visits?.[0];
                        const isUpcoming = !dossierData.active_visit && latestVisit && (latestVisit.status === "PENDING" || latestVisit.status === "APPROVED" || latestVisit.status === "PRE_APPROVED");
                        const carriedCount = declaredAssets.filter((a) => (!a.cleared_by || !a.cleared_by.includes("RETAINED")) && (a.is_cleared_for_exit || a.disposition === "CARRIED_OUT")).length;
                        const retainedCount = declaredAssets.filter((a) => (a.cleared_by && a.cleared_by.includes("RETAINED")) || a.disposition === "RETAINED_ON_PREMISES").length;
                        const isInside = Boolean(dossierData.active_visit);
                        const pendingCount = isInside ? (declaredAssets.length - carriedCount - retainedCount) : 0;

                        return (
                          <div style={{ margin: "0 0 14px", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", fontSize: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700, color: "#0f172a" }}>
                                {isUpcoming ? "Registered for Admission:" : "Registered at Check-In:"} <strong style={{ color: "#2563eb" }}>{declaredAssets.length}</strong>
                              </span>
                              {isUpcoming ? (
                                <span style={{ color: "#2563eb", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  ⏳ Awaiting Gate Arrival & Physical Inspection
                                </span>
                              ) : (
                                <>
                                  <span style={{ color: "#166534", fontWeight: 600 }}>
                                    🚶 Carrying Out: <strong>{carriedCount}</strong>
                                  </span>
                                  <span style={{ color: "#1d4ed8", fontWeight: 600 }}>
                                    📦 Retained on Premises: <strong>{retainedCount}</strong>
                                  </span>
                                  {pendingCount > 0 && (
                                    <span style={{ color: "#b45309", fontWeight: 600 }}>
                                      ⏳ Pending Clearance: <strong>{pendingCount}</strong>
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            {dossierData.active_visit && (
                              <span style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                                Update asset disposition before checkout to ensure exact checkout audit history.
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Add Asset Form Modal / Box */}
                      {isAddingDossierAsset && dossierData.active_visit && (
                        <div style={{ margin: "0 0 16px", padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <strong style={{ fontSize: "13px", color: "#166534", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Plus size={14} /> Register Additional Hardware During Active Visit
                            </strong>
                            <button type="button" onClick={() => setIsAddingDossierAsset(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                              <X size={15} />
                            </button>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Asset Type *</label>
                              <select
                                value={dossierNewAssetForm.asset_type}
                                onChange={(e) => setDossierNewAssetForm({ ...dossierNewAssetForm, asset_type: e.target.value })}
                                style={{ width: "100%", padding: "7px 10px", fontSize: "12.5px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                              >
                                <option value="Laptop">Laptop / Portable Computer</option>
                                <option value="Mobile / Tablet">Mobile Phone / Tablet</option>
                                <option value="Storage Drive">Storage Drive / External Media</option>
                                <option value="Camera / Recording">Camera / Recording Equipment</option>
                                <option value="Tool / Equipment">Tool / Test Equipment</option>
                                <option value="Network Gear">Network Gear / SFP Transceivers</option>
                                <option value="Hardware Device">Other Hardware Device</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Brand &amp; Model</label>
                              <input
                                type="text"
                                placeholder="e.g. MacBook Pro M3, Dell Latitude"
                                value={dossierNewAssetForm.brand_model}
                                onChange={(e) => setDossierNewAssetForm({ ...dossierNewAssetForm, brand_model: e.target.value })}
                                style={{ width: "100%", padding: "7px 10px", fontSize: "12.5px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Serial Number</label>
                              <input
                                type="text"
                                placeholder="e.g. SN-882910"
                                value={dossierNewAssetForm.serial_number}
                                onChange={(e) => setDossierNewAssetForm({ ...dossierNewAssetForm, serial_number: e.target.value })}
                                style={{ width: "100%", padding: "7px 10px", fontSize: "12.5px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Expected Departure</label>
                              <select
                                value={dossierNewAssetForm.disposition}
                                onChange={(e) => setDossierNewAssetForm({ ...dossierNewAssetForm, disposition: e.target.value })}
                                style={{ width: "100%", padding: "7px 10px", fontSize: "12.5px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                              >
                                <option value="CARRIED_OUT">🚶 Carrying Out at Exit (Clearance Approved)</option>
                                <option value="RETAINED_ON_PREMISES">📦 Retaining on Campus / Handed Over</option>
                                <option value="PENDING">⏳ Pending Inspection at Gate</option>
                              </select>
                            </div>
                          </div>

                          {dossierNewAssetForm.disposition === "RETAINED_ON_PREMISES" && (
                            <div style={{ marginTop: "10px" }}>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>
                                Location Retained / Person Receiving Item
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Kept with Host Officer, Left in Conference Room B"
                                value={dossierNewAssetForm.retention_note}
                                onChange={(e) => setDossierNewAssetForm({ ...dossierNewAssetForm, retention_note: e.target.value })}
                                style={{ width: "100%", padding: "7px 10px", fontSize: "12.5px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                              />
                            </div>
                          )}

                          <AssetPhotoPicker
                            photoData={dossierNewAssetForm.photo_data}
                            photoUrl={dossierNewAssetForm.photo_url}
                            onPhotoChange={(dataUrl) => setDossierNewAssetForm((prev) => ({ ...prev, photo_data: dataUrl }))}
                            label="Hardware Asset Photograph (Camera / File Upload)"
                            resolveFn={resolvePhotoUrl}
                          />

                          <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() => setIsAddingDossierAsset(false)}
                              style={{ padding: "6px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={dossierAssetOpLoading}
                              onClick={() => handleCreateDossierAsset(dossierData.active_visit.visit_id)}
                              style={{ padding: "6px 16px", fontSize: "12px", background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
                            >
                              {dossierAssetOpLoading ? "Saving..." : "Add Asset to Visit"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Edit Asset Modal */}
                      {editingDossierAsset && (
                        <div className="vms-lightbox-overlay" onClick={() => setEditingDossierAsset(null)}>
                          <div className="ch-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px", background: "#ffffff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}>
                            <div className="ch-modal-header" style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <h4 style={{ margin: 0, fontSize: "15px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                                <Edit3 size={16} color="#2563eb" /> Edit Declared Hardware Asset
                              </h4>
                              <button type="button" onClick={() => setEditingDossierAsset(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                                <X size={16} />
                              </button>
                            </div>
                            <div style={{ padding: "16px 20px" }}>
                              <div style={{ marginBottom: "12px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Asset Type</label>
                                <input
                                  type="text"
                                  value={editingDossierAsset.asset_type || ""}
                                  onChange={(e) => setEditingDossierAsset({ ...editingDossierAsset, asset_type: e.target.value })}
                                  style={{ width: "100%", padding: "8px 10px", fontSize: "13px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                              </div>
                              <div style={{ marginBottom: "12px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Brand &amp; Model</label>
                                <input
                                  type="text"
                                  value={editingDossierAsset.brand_model || ""}
                                  onChange={(e) => setEditingDossierAsset({ ...editingDossierAsset, brand_model: e.target.value })}
                                  style={{ width: "100%", padding: "8px 10px", fontSize: "13px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                              </div>
                              <div style={{ marginBottom: "12px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Serial Number</label>
                                <input
                                  type="text"
                                  value={editingDossierAsset.serial_number || ""}
                                  onChange={(e) => setEditingDossierAsset({ ...editingDossierAsset, serial_number: e.target.value })}
                                  style={{ width: "100%", padding: "8px 10px", fontSize: "13px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                              </div>
                              <div style={{ marginBottom: "12px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Departure Disposition</label>
                                <select
                                  value={editingDossierAsset.disposition || (editingDossierAsset.cleared_by && editingDossierAsset.cleared_by.includes("RETAINED") ? "RETAINED_ON_PREMISES" : (editingDossierAsset.is_cleared_for_exit ? "CARRIED_OUT" : "PENDING"))}
                                  onChange={(e) => setEditingDossierAsset({ ...editingDossierAsset, disposition: e.target.value })}
                                  style={{ width: "100%", padding: "8px 10px", fontSize: "13px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                >
                                  <option value="CARRIED_OUT">🚶 Carrying Out at Exit (Cleared)</option>
                                  <option value="RETAINED_ON_PREMISES">📦 Retained in Facility / In-Use on Premises</option>
                                  <option value="PENDING">⏳ Pending Exit Inspection</option>
                                </select>
                              </div>
                              {editingDossierAsset.disposition === "RETAINED_ON_PREMISES" && (
                                <div style={{ marginBottom: "12px" }}>
                                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Location / Handover Notes</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Left with host officer, kept in conference room"
                                    value={editingDossierAsset.retention_note || ""}
                                    onChange={(e) => setEditingDossierAsset({ ...editingDossierAsset, retention_note: e.target.value })}
                                    style={{ width: "100%", padding: "8px 10px", fontSize: "13px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                  />
                                </div>
                              )}

                              <AssetPhotoPicker
                                photoData={editingDossierAsset.photo_data}
                                photoUrl={editingDossierAsset.photo_url}
                                onPhotoChange={(dataUrl) => setEditingDossierAsset((prev) => ({ ...prev, photo_data: dataUrl }))}
                                label="Update Hardware Photograph (Camera / File Upload)"
                                resolveFn={resolvePhotoUrl}
                              />

                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                                <button type="button" onClick={() => setEditingDossierAsset(null)} style={{ padding: "7px 14px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                                <button
                                  type="button"
                                  disabled={dossierAssetOpLoading}
                                  onClick={() => handleSaveDossierAssetEdit(editingDossierAsset.asset_id)}
                                  style={{ padding: "7px 18px", fontSize: "12px", background: "#0284c7", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
                                >
                                  {dossierAssetOpLoading ? "Saving..." : "Save Asset Changes"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {dossierData.assets && dossierData.assets.length > 0 ? (
                        <div className="vms-asset-cards-grid">
                          {dossierData.assets.map((asset) => {
                            const assetPhoto = resolvePhotoUrl(asset.photo_url);
                            const latestVisit = dossierData.visits?.[0];
                            const isUpcoming = !dossierData.active_visit && latestVisit && (latestVisit.status === "PENDING" || latestVisit.status === "APPROVED" || latestVisit.status === "PRE_APPROVED");
                            const isRetained = (asset.cleared_by && asset.cleared_by.includes("RETAINED")) || asset.disposition === "RETAINED_ON_PREMISES";
                            const isCarried = (!asset.cleared_by || !asset.cleared_by.includes("RETAINED")) && (asset.is_cleared_for_exit || asset.disposition === "CARRIED_OUT");
                            const currentDisp = isRetained ? "RETAINED_ON_PREMISES" : (isCarried ? "CARRIED_OUT" : "PENDING");
                            const isInside = !!dossierData.active_visit;

                            return (
                              <div key={asset.asset_id} className="vms-asset-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div>
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                    <div
                                      className="vms-asset-img-box"
                                      style={{ cursor: assetPhoto ? "pointer" : "default" }}
                                      onClick={() => {
                                        if (assetPhoto) {
                                          setAssetLightbox({
                                            url: assetPhoto,
                                            title: `${asset.brand_model || asset.asset_type || "Declared Hardware"} (Hardware Photo)`,
                                          });
                                        }
                                      }}
                                      title={assetPhoto ? "Click to enlarge hardware photo" : ""}
                                    >
                                      {assetPhoto ? (
                                        <img
                                          src={assetPhoto}
                                          alt={asset.asset_type}
                                          onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                          }}
                                        />
                                      ) : (
                                        <Laptop size={24} style={{ color: "#94a3b8" }} />
                                      )}
                                    </div>
                                    <div className="vms-asset-meta" style={{ flex: 1 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <span className="vms-asset-type">{asset.asset_type || "Hardware Asset"}</span>
                                        {isInside && (
                                          <div style={{ display: "flex", gap: "4px" }}>
                                            <button
                                              type="button"
                                              title="Edit asset details"
                                              onClick={() => setEditingDossierAsset({
                                                ...asset,
                                                disposition: currentDisp,
                                                retention_note: asset.cleared_by && asset.cleared_by.includes("RETAINED_ON_PREMISES:") ? asset.cleared_by.replace(/^RETAINED_ON_PREMISES:\s*/i, "").replace(/\s*\(.*?\)\s*$/, "") : ""
                                              })}
                                              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "2px" }}
                                            >
                                              <Edit3 size={13} />
                                            </button>
                                            <button
                                              type="button"
                                              title="Remove asset from visit"
                                              onClick={() => handleDeleteDossierAsset(asset.asset_id, asset.brand_model || asset.asset_type)}
                                              style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "2px" }}
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      {asset.brand_model && (
                                        <span style={{ fontSize: "12px", color: "#64748b" }}>{asset.brand_model}</span>
                                      )}
                                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                                        <span className="vms-asset-sn">S/N: {asset.serial_number || "NO-S/N"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* In-Visit Quick Disposition Selector (If Inside) */}
                                  {isInside ? (
                                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                                      <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                                        Exit Departure Status:
                                      </div>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateDossierAssetDisposition(asset.asset_id, "CARRIED_OUT")}
                                          disabled={dossierAssetOpLoading}
                                          style={{
                                            padding: "6px 8px",
                                            borderRadius: "6px",
                                            border: isCarried ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
                                            background: isCarried ? "#f0fdf4" : "#ffffff",
                                            color: isCarried ? "#15803d" : "#475569",
                                            fontSize: "11px",
                                            fontWeight: isCarried ? 700 : 500,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "4px"
                                          }}
                                        >
                                          <CheckCircle2 size={12} color={isCarried ? "#16a34a" : "#94a3b8"} />
                                          Carrying Out
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const note = prompt("Enter retention note or location (e.g. Installed in Room 102, Handed to Host):", "Retained on campus / kept in use");
                                            if (note !== null) {
                                              handleUpdateDossierAssetDisposition(asset.asset_id, "RETAINED_ON_PREMISES", note);
                                            }
                                          }}
                                          disabled={dossierAssetOpLoading}
                                          style={{
                                            padding: "6px 8px",
                                            borderRadius: "6px",
                                            border: isRetained ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                                            background: isRetained ? "#eff6ff" : "#ffffff",
                                            color: isRetained ? "#1d4ed8" : "#475569",
                                            fontSize: "11px",
                                            fontWeight: isRetained ? 700 : 500,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "4px"
                                          }}
                                        >
                                          <Package size={12} color={isRetained ? "#2563eb" : "#94a3b8"} />
                                          Retain in Facility
                                        </button>
                                      </div>

                                      {isRetained && (
                                        <div style={{ marginTop: "6px", fontSize: "11px", color: "#1d4ed8", background: "#eff6ff", padding: "4px 8px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                          <span>📦 {asset.cleared_by ? asset.cleared_by.replace(/^RETAINED_ON_PREMISES:\s*/i, "").replace(/\s*\(.*?\)\s*$/, "") : "Retained on premises"}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    /* Historical / Scheduled View Status */
                                    <div style={{ marginTop: "8px" }}>
                                      {isUpcoming ? (
                                        <span
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            color: "#2563eb",
                                            background: "#eff6ff",
                                            border: "1px solid #bfdbfe",
                                            borderRadius: "4px",
                                            padding: "3px 8px",
                                          }}
                                        >
                                          <Clock size={12} /> Pre-Declared for Admission
                                        </span>
                                      ) : isRetained ? (
                                        <span
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            color: "#1d4ed8",
                                            background: "#eff6ff",
                                            border: "1px solid #bfdbfe",
                                            borderRadius: "4px",
                                            padding: "3px 8px",
                                          }}
                                        >
                                          <Package size={12} />
                                          Retained on Premises {asset.cleared_by ? `(${asset.cleared_by.replace(/^RETAINED_ON_PREMISES:\s*/i, "")})` : ""}
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", display: "inline-flex", alignItems: "center", gap: "4px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px", padding: "3px 8px" }}>
                                          <CheckCircle2 size={12} /> ✓ Cleared at Departure
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                          No electronic hardware or physical assets declared for this visitor.
                        </p>
                      )}
                    </div>

                    {/* Historical Visits Log */}
                    <div className="vms-dossier-section">
                      <div className="vms-dossier-section-header">
                        <h4 className="vms-dossier-section-title">
                          <History size={16} style={{ color: "#0284c7" }} />
                          <span>Visit History Log ({dossierData.history?.length || 0})</span>
                        </h4>
                      </div>

                      {dossierData.history && dossierData.history.length > 0 ? (
                        <div style={{ overflowX: "auto" }}>
                          <table className="vms-history-table">
                            <thead>
                              <tr>
                                <th>Date &amp; Check-In</th>
                                <th>Host Employee</th>
                                <th>Purpose</th>
                                <th>Check-Out</th>
                                <th>Status</th>
                                <th style={{ textAlign: "center" }}>Pass</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dossierData.history.map((h) => (
                                <tr key={h.visit_id}>
                                  <td>
                                    <strong>
                                      {h.check_in_time ? new Date(h.check_in_time).toLocaleDateString() : "Scheduled"}
                                    </strong>
                                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                                      {h.check_in_time ? new Date(h.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                                    </div>
                                  </td>
                                  <td>{h.host_name}</td>
                                  <td>{h.purpose || "—"}</td>
                                  <td>
                                    {h.check_out_time ? (
                                      <span>{new Date(h.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    ) : (
                                      <span style={{ color: h.status === "ACTIVE" ? "#16a34a" : "#94a3b8" }}>
                                        {h.status === "ACTIVE" ? "Onsite Now" : "—"}
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <span className={`status-pill ${h.status === "ACTIVE" ? "active" : "checked"}`}>
                                      {h.status}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <button
                                      type="button"
                                      className="vms-btn-pass-link"
                                      style={{ padding: "4px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                      onClick={() => window.open(`/visitor-pass/${encodeURIComponent(h.visit_id)}`, "_blank")}
                                      title="Open official digital visitor pass"
                                    >
                                      <Ticket size={11} />
                                      <span>Pass</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                          No previous visits recorded for this visitor.
                        </p>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div
                className="vms-dossier-footer"
                style={{
                  padding: "14px 24px",
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Record ID #{dossierData?.visitor?.visitor_id || selectedVisitorDossier?.visitor_id || "—"}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {dossierData?.active_visit && (
                    <button
                      type="button"
                      className="vms-btn-checkout-prominent"
                      disabled={directCheckoutLoading === String(dossierData.active_visit.visit_id)}
                      onClick={() =>
                        handleDirectVisitorCheckout(
                          dossierData.active_visit.visit_id,
                          `${dossierData.visitor.first_name} ${dossierData.visitor.last_name}`
                        )
                      }
                    >
                      <LogOut size={14} />
                      <span>{directCheckoutLoading === String(dossierData.active_visit.visit_id) ? "Checking Out..." : "Check Out Visitor"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="vms-btn-pass-link"
                    onClick={closeVisitorDossier}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  function renderCheckoutReceipt() {
    if (!checkoutReceipt) return null;

    const formatReceiptDate = (value) => {
      if (!value) return "Not recorded";
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? "Not recorded"
        : date.toLocaleString();
    };

    const isIT = (checkoutReceipt.purpose || "").includes("[IT_VISIT]");

    return (
      <section
        className="page-card checkout-receipt-wrapper"
        style={{ marginTop: "20px" }}
      >
        <div
          id="checkout-receipt"
          className="checkout-receipt-card"
          style={{
            background: "#ffffff",
            color: "#0f172a",
            border: "2px solid #0f172a",
            borderRadius: "14px",
            padding: "24px 28px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Executive Certificate Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              flexWrap: "wrap",
              borderBottom: "2.5px solid #2563eb",
              paddingBottom: "16px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "#0f172a",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "18px",
                  letterSpacing: "-0.5px",
                  border: "1.5px solid #2563eb",
                }}
              >
                VMS
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                  Visitor Departure &amp; Hardware Custody Certificate
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Enterprise Physical &amp; Digital Access Clearance · Official Gate Departure Document
                </p>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ display: "block", fontSize: "10.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Receipt Reference
              </span>
              <strong style={{ fontSize: "14px", color: "#2563eb", fontFamily: "monospace" }}>
                {checkoutReceipt.receiptNumber || checkoutReceipt.visitId}
              </strong>
              <div style={{ marginTop: "4px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 800,
                    background: "#f0fdf4",
                    color: "#166534",
                    border: "1px solid #86efac",
                  }}
                >
                  ✓ DEPARTURE RECORDED
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Visitor Credentials & Address */}
          <div style={{ marginBottom: "18px" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
              1. Visitor Credentials &amp; Registered Address
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <small style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Visitor Name</small>
                <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{checkoutReceipt.visitorName}</p>
              </div>
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <small style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Organization / Firm</small>
                <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{checkoutReceipt.companyName || "Independent"}</p>
              </div>
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <small style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Physical Address</small>
                <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                  {[checkoutReceipt.addressLine1, checkoutReceipt.addressLine2, checkoutReceipt.city, checkoutReceipt.state, checkoutReceipt.postalCode, checkoutReceipt.country].filter(Boolean).join(", ") || "Recorded in VMS Registry"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Visit Timeline & Host Context */}
          <div style={{ marginBottom: "18px" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
              2. Host Authorization &amp; Gate Timeline
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <small style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Host Official</small>
                <p style={{ margin: "2px 0 0", fontSize: "12.5px", fontWeight: 700, color: "#0f172a" }}>{checkoutReceipt.hostName}</p>
              </div>
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <small style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Visit Purpose</small>
                <p style={{ margin: "2px 0 0", fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>{checkoutReceipt.purpose}</p>
              </div>
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <small style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Admission (Check-in)</small>
                <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>{formatReceiptDate(checkoutReceipt.checkInTime)}</p>
              </div>
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <small style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Departure (Checkout)</small>
                <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: 700, color: "#166534" }}>{formatReceiptDate(checkoutReceipt.checkoutTime)}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Registered Hardware Clearance Ledger */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
              3. Declared Asset &amp; Equipment Clearance Ledger
            </h4>

            {checkoutReceipt.assets.length === 0 ? (
              <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0", fontStyle: "italic" }}>
                No hardware equipment or electronic assets were declared for this visit.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px" }}>
                  <thead>
                    <tr style={{ background: "#0f172a", color: "#ffffff", textAlign: "left" }}>
                      <th style={{ padding: "8px 10px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase" }}>Asset Category</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase" }}>Brand &amp; Model</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase" }}>Serial Number</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase" }}>Clearance Disposition</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase" }}>Inspecting Officer</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase" }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkoutReceipt.assets.map((asset, index) => {
                      const isRetained = (asset.clearedBy && asset.clearedBy.includes("RETAINED")) || asset.disposition === "RETAINED_ON_PREMISES";
                      return (
                        <tr key={`${asset.serialNumber}-${index}`} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>{asset.assetType}</td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0" }}>{asset.brandModel || "—"}</td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0", fontFamily: "monospace", fontWeight: 700 }}>{asset.serialNumber}</td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0" }}>
                            {isRetained ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                                📦 Retained in Facility
                              </span>
                            ) : asset.cleared ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
                                ✓ Cleared for Exit
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
                                ⚠ Pending Exit Inspection
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>{asset.clearedBy || "Security Desk"}</td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>{formatReceiptDate(asset.clearedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Security Sign-Offs */}
          <div
            className="receipt-signatures-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "16px",
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1.5px dashed #cbd5e1",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Visitor / Carrier Signature
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Host Employee / IT Custodian
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Security Gate Clearance Stamp
              </span>
            </div>
          </div>

          <p style={{ marginTop: "16px", marginBottom: 0, color: "#64748b", fontSize: "10.5px", textAlign: "center" }}>
            This official departure certificate was issued by the Enterprise Visitor Management System. All building exits and equipment handovers are permanently audit-logged.
          </p>
        </div>

        {/* Screen-Only Action Buttons */}
        <div
          className="no-print"
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
            className="primary-button"
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Printer size={15} />
            <span>Print / Save as PDF</span>
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


  const renderCheckout = () => {
    const rawActiveVisitors = (dashboardData?.visitors || []).filter(
      (item) =>
        item.status === "ACTIVE" &&
        !Boolean(item.purpose && String(item.purpose).toUpperCase().includes("[IT_VISIT]"))
    );

    const activeVisitors = rawActiveVisitors.filter((item) => {
      if (!checkoutSearch.trim()) return true;
      const q = checkoutSearch.toLowerCase();
      const name = (item.visitor_name || "").toLowerCase();
      const company = (item.company_name || "").toLowerCase();
      const host = (item.host_name || "").toLowerCase();
      const purpose = (item.purpose || "").toLowerCase();
      const visitId = String(item.visit_id || "").toLowerCase();
      return name.includes(q) || company.includes(q) || host.includes(q) || purpose.includes(q) || visitId.includes(q);
    });

    return (
      <>
        {/* Executive Checkout Header */}
        <div className="it-management-header">
          <div className="it-header-title-box">
            <div className="it-header-badge-row">
              <span className="it-division-pill">Gate Security Operation</span>
              <span className="it-telemetry-pill">
                <span className="status-dot"></span>
                Active Exit Terminal
              </span>
            </div>
            <h2 className="it-page-title">Visitor Checkout &amp; Departure</h2>
            <p className="it-page-desc">
              Verify departure, review asset clearance, generate departure receipts, and process visitor exits
            </p>
          </div>

          <div className="it-header-controls">
            <button className="it-log-recovery-primary-btn" onClick={openScanner} type="button">
              <QrCode size={15} />
              <span>Scan Visitor QR</span>
            </button>
            <button className="it-qr-portal-btn" onClick={openDashboard}>
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {!visit ? (
          <>
            {/* KPI Metric Cards Grid */}
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <UserCheck size={20} />
                </div>
                <div className="stat-content">
                  <strong>{activeVisitors.length}</strong>
                  <span>Active On Premises</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  <Clock size={20} />
                </div>
                <div className="stat-content">
                  <strong>{dashboardData?.statistics?.checked_out || 0}</strong>
                  <span>Checked Out Today</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">
                  <Users size={20} />
                </div>
                <div className="stat-content">
                  <strong>{dashboardData?.statistics?.total_visitors || activeVisitors.length}</strong>
                  <span>Total Today's Visits</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon amber">
                  <Laptop size={20} />
                </div>
                <div className="stat-content">
                  <strong>{rawActiveVisitors.filter((v) => v.has_assets || (v.assets && v.assets.length > 0)).length}</strong>
                  <span>Hardware Pending Exit</span>
                </div>
              </div>
            </section>

            {/* Quick QR Departure Callout */}
            <div className="checkout-quick-bar">
              <div className="checkout-quick-icon">
                <QrCode size={22} />
              </div>
              <div className="checkout-quick-info">
                <h4>Fast Exit via Gate Scanner</h4>
                <p>Present or scan the visitor's digital QR pass at the camera terminal for instant automated clearance.</p>
              </div>
              <button className="primary-button" onClick={openScanner} type="button" style={{ whiteSpace: "nowrap" }}>
                <QrCode size={15} />
                <span>Launch QR Scanner</span>
              </button>
            </div>

            {/* Currently Inside Table Section */}
            <section className="table-card">
              <div className="table-toolbar">
                <div>
                  <h2>Currently Inside Building</h2>
                  <p>
                    {activeVisitors.length} active visitor{activeVisitors.length === 1 ? "" : "s"} on premises
                  </p>
                </div>
                <div className="visitor-toolbar-actions">
                  <div className="search-field">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search name, company, host, visit ID..."
                      value={checkoutSearch}
                      onChange={(e) => setCheckoutSearch(e.target.value)}
                    />
                    {checkoutSearch && (
                      <button
                        type="button"
                        style={{ background: "transparent", border: 0, cursor: "pointer", color: "#94a3b8" }}
                        onClick={() => setCheckoutSearch("")}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="it-refresh-btn"
                    onClick={fetchDashboard}
                    disabled={dashboardLoading}
                    title="Refresh active visitors"
                  >
                    <RefreshCw size={14} className={dashboardLoading ? "spin" : ""} />
                  </button>
                </div>
              </div>

              {dashboardError && (
                <div className="error-banner">{dashboardError}</div>
              )}

              {dashboardLoading ? (
                <div className="empty-state">
                  <RefreshCw size={18} className="spin" />
                  Loading active visitors...
                </div>
              ) : activeVisitors.length === 0 ? (
                <div className="empty-state">
                  <Users size={22} />
                  <span>
                    {checkoutSearch
                      ? `No active visitors found matching "${checkoutSearch}"`
                      : "No active visitors currently recorded inside the facility."}
                  </span>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Visitor</th>
                        <th>Organization / Company</th>
                        <th>Host Employee</th>
                        <th>Purpose of Visit</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeVisitors.map((item) => {
                        const dirVisitor = visitorList.find(
                          (v) => String(v.visitor_id) === String(item.visitor_id)
                        );
                        const photoUrl = resolvePhotoUrl(item.photo_url || dirVisitor?.photo_url);

                        return (
                          <tr key={item.visit_id}>
                            <td>
                              <div className="visitor-cell">
                                <div className="visitor-avatar">
                                  {photoUrl ? (
                                    <img
                                      src={photoUrl}
                                      alt={item.visitor_name}
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : null}
                                  <span className="avatar-initials">
                                    {getInitials(item.visitor_name)}
                                  </span>
                                </div>
                                <div>
                                  <strong>{item.visitor_name || "Unknown"}</strong>
                                  <span className="visitor-id-badge" style={{ marginTop: "2px", display: "inline-block" }}>
                                    ID: {item.visit_id ? String(item.visit_id).slice(0, 8) : "—"}
                                  </span>
                                </div>
                              </div>
                            </td>
                          <td>
                            <div className="it-company-tag">
                              <Building2 size={12} />
                              <span>{item.company_name || "Independent / Guest"}</span>
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: "#0f172a" }}>{item.host_name || "IT Staff / Host"}</strong>
                          </td>
                          <td>
                            <span className="notif-category-badge badge-info">
                              {item.purpose || "Business Meeting"}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="it-action-btn view"
                              onClick={() => fetchVisit(item.visit_id, false)}
                              disabled={loading}
                              title="Inspect visit details & process checkout"
                            >
                              <LogOut size={13} />
                              <span>Process Exit</span>
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
          </>
        ) : (
          <section className="page-card checkout-page-card">
            <div className="checkout-panel checkout-panel-horizontal">
              <div
                className="checkout-visitor-photo-wrap"
                onClick={() => {
                  const rawPhotoUrl =
                    visit.visitor?.photo_url ||
                    visit.visitor?.photo_path ||
                    visit.visitor?.photo ||
                    visit.photo_url ||
                    visit.photo_path ||
                    visit.visitor_photo_url ||
                    visit.visitor_photo ||
                    "";
                  const photoUrl = resolvePhotoUrl(rawPhotoUrl);
                  if (photoUrl) {
                    setAssetLightbox({
                      url: photoUrl,
                      title: `${visit.visitor?.first_name || "Visitor"} ${visit.visitor?.last_name || ""}`.trim(),
                      subtitle: `Visitor Identity Photo · ${visit.visitor?.company_name || "Individual"} · Phone: ${visit.visitor?.phone_number || "On file"}`
                    });
                  }
                }}
                title="Click to zoom visitor photograph"
                style={{ cursor: "pointer" }}
              >
                {(() => {
                  const rawPhotoUrl =
                    visit.visitor?.photo_url ||
                    visit.visitor?.photo_path ||
                    visit.visitor?.photo ||
                    visit.photo_url ||
                    visit.photo_path ||
                    visit.visitor_photo_url ||
                    visit.visitor_photo ||
                    "";
                  const photoUrl = resolvePhotoUrl(rawPhotoUrl);

                  return photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={`${visit.visitor?.first_name || "Visitor"} photo`}
                      className="checkout-visitor-photo"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        const fallback = event.currentTarget.parentElement?.querySelector(".checkout-visitor-photo-fallback");
                        if (fallback) fallback.style.display = "grid";
                      }}
                    />
                  ) : null;
                })()}
                <span className="checkout-visitor-photo-fallback">
                  {getInitials(
                    `${visit.visitor?.first_name || ""} ${visit.visitor?.last_name || ""}`
                  )}
                </span>
                <div className="checkout-visitor-photo-zoom-hint">
                  <Eye size={12} />
                </div>
              </div>
              <div className="checkout-visitor-identity">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                    {visit.visitor?.first_name} {visit.visitor?.last_name}
                  </h3>
                  <span style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "12px", background: "#f1f5f9", color: "#475569" }}>
                    VISITOR #{visit.visitor_id || visit.visitor?.visitor_id || "—"}
                  </span>
                </div>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Building2 size={13} color="#2563eb" />
                  <strong>{visit.visitor?.company_name || "Individual / Independent"}</strong>
                  {visit.visitor?.phone_number && (
                    <span>· 📞 {visit.visitor.phone_number}</span>
                  )}
                </p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b", fontFamily: "monospace", background: "#f8fafc", padding: "2px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span>Visit ID:</span>
                  <strong style={{ color: "#1e293b" }}>{visit.visit_id}</strong>
                </div>
              </div>

              <div className="checkout-details">
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10.5px", fontWeight: 800, color: "#64748b", letterSpacing: "0.5px" }}>
                  <Clock size={11} color="#059669" /> GATE CLEARANCE STATUS
                </span>
                <strong className={`checkout-status-value ${visit.status === "ACTIVE" ? "is-active" : "is-checked-out"}`} style={{ fontSize: "14px", fontWeight: 800 }}>
                  {visit.status === "ACTIVE" ? "● Active Inside Premises" : `✓ ${visit.status || "Concluded"}`}
                </strong>
              </div>

              <div className="checkout-details">
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10.5px", fontWeight: 800, color: "#64748b", letterSpacing: "0.5px" }}>
                  <Tag size={11} color="#2563eb" /> STATED PURPOSE
                </span>
                <strong style={{ fontSize: "13px", color: "#1e293b", fontWeight: 700 }}>
                  {visit.purpose || "General Meeting"}
                </strong>
              </div>

              <div className="checkout-action-row">
                {visit.status === "ACTIVE" ? (
                  <>
                    <button
                      className="checkout-button"
                      onClick={handleCheckout}
                      disabled={
                        checkoutLoading ||
                        assetsLoading ||
                        visitAssets.some((asset) => !asset.is_cleared_for_exit)
                      }
                      title={
                        visitAssets.some((asset) => !asset.is_cleared_for_exit)
                          ? "Clear all registered assets before checkout"
                          : undefined
                      }
                    >
                      {checkoutLoading ? (
                        <RefreshCw size={14} className="spin" />
                      ) : (
                        <LogOut size={15} />
                      )}
                      {checkoutLoading ? "Processing Departure..." : "Authorize Departure & Checkout"}
                    </button>
                    <button
                      type="button"
                      className="refresh-button"
                      onClick={() => fetchVisit(visit.visit_id, false)}
                      disabled={loading || assetsLoading}
                    >
                      <RefreshCw size={14} className={loading || assetsLoading ? "spin" : ""} />
                      Refresh Visit &amp; Assets
                    </button>
                  </>
                ) : (
                  <span className="checked-message">
                    <CheckCircle2 size={16} color="#059669" />
                    Visit Concluded · Checked Out
                  </span>
                )}
                <button
                  type="button"
                  className="refresh-button"
                  onClick={() => {
                    setVisit(null);
                    setDecision(null);
                    setVisitAssets([]);
                    setAssetsError("");
                    setError("");
                    setCheckoutReceipt(null);
                    fetchDashboard();
                  }}
                >
                  <ArrowLeft size={13} />
                  Choose Another Visitor
                </button>
              </div>
            </div>

            <section className="checkout-live-assets" aria-label="Registered assets and security clearance">
                <div className="checkout-live-assets-heading">
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                      <HardDrive size={18} color="#2563eb" />
                      Declared Hardware Assets &amp; Physical Inspection
                    </h3>
                    <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "12.5px" }}>
                      Verify hardware serial tags and photographs before granting building departure clearance.
                    </p>
                  </div>
                  <span className={`checkout-assets-count ${visitAssets.some((asset) => !asset.is_cleared_for_exit) ? "has-pending" : "all-cleared"}`}>
                    {assetsLoading ? "Loading assets…" : `${visitAssets.filter((a) => !((a.cleared_by && a.cleared_by.includes("RETAINED")) || a.disposition === "RETAINED_ON_PREMISES")).length} Returning · ${visitAssets.filter((a) => (a.cleared_by && a.cleared_by.includes("RETAINED")) || a.disposition === "RETAINED_ON_PREMISES").length} Retained`}
                  </span>
                </div>

                {assetsError && <div className="error-banner">{assetsError}</div>}

                {visitAssets.some((asset) => !asset.is_cleared_for_exit) && (
                  <div className="checkout-assets-warning">
                    <AlertTriangle size={16} />
                    <span>
                      <strong>Departure Blocked:</strong> All declared laptops and hardware assets must receive security clearance before visitor checkout.
                    </span>
                  </div>
                )}

                {assetsLoading ? (
                  <div className="checkout-assets-empty"><RefreshCw size={16} className="spin" /> Loading declared assets…</div>
                ) : visitAssets.length === 0 ? (
                  <div className="checkout-assets-empty">
                    <HardDrive size={22} color="#94a3b8" />
                    <span>No physical assets or hardware items declared for this visit.</span>
                  </div>
                ) : (
                  <div className="checkout-live-assets-table-wrap">
                    <table className="checkout-live-assets-table">
                      <thead>
                        <tr>
                          <th style={{ width: "70px", textAlign: "center" }}>Photo</th>
                          <th>Hardware Type</th>
                          <th>Brand &amp; Model</th>
                          <th>Serial Tag</th>
                          <th>Security Clearance</th>
                          <th>Authorized Officer</th>
                          <th>Clearance Time</th>
                          {visit.status === "ACTIVE" && <th style={{ textAlign: "right", whiteSpace: "nowrap" }}>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {visitAssets.map((asset) => {
                          const assetPhoto = resolvePhotoUrl(asset.photo_url || asset.asset_photo_url);
                          return (
                            <tr key={asset.asset_id}>
                              <td style={{ textAlign: "center" }}>
                                {assetPhoto ? (
                                  <div
                                    className="checkout-asset-thumb-wrap"
                                    onClick={() => setAssetLightbox({
                                      url: assetPhoto,
                                      title: `${asset.brand_model || asset.asset_type || "Declared Hardware"} (Hardware Photo)`,
                                      subtitle: `Serial: ${asset.serial_number || "Not specified"} · Type: ${asset.asset_type || "Hardware"}`
                                    })}
                                    title="Click to zoom hardware photograph"
                                  >
                                    <img src={assetPhoto} alt="Hardware" className="checkout-asset-thumb" />
                                    <div className="checkout-asset-thumb-overlay">
                                      <Eye size={12} />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="checkout-asset-no-photo">
                                    <Laptop size={13} />
                                    <span>None</span>
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                  <div className="checkout-asset-type-icon">
                                    <Laptop size={13} />
                                  </div>
                                  <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>
                                    {asset.asset_type || "—"}
                                  </strong>
                                </div>
                              </td>
                              <td>
                                <strong style={{ fontSize: "12.5px", color: "#334155" }}>
                                  {asset.brand_model || "Not specified"}
                                </strong>
                              </td>
                              <td>
                                {asset.serial_number ? (
                                  <span className="checkout-asset-serial-badge">
                                    <Tag size={10} style={{ marginRight: "3px" }} />
                                    {asset.serial_number}
                                  </span>
                                ) : (
                                  <span style={{ color: "#94a3b8", fontSize: "11.5px" }}>Not provided</span>
                                )}
                              </td>
                              <td>
                                {((asset.cleared_by && asset.cleared_by.includes("RETAINED")) || asset.disposition === "RETAINED_ON_PREMISES") ? (
                                  <span className="checkout-clearance-badge is-cleared" style={{ background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}>
                                    📦 Retained in Facility (Stays on Campus)
                                  </span>
                                ) : asset.is_cleared_for_exit ? (
                                  <span className="checkout-clearance-badge is-cleared">
                                    ✓ Return (Cleared for Exit)
                                  </span>
                                ) : (
                                  <span className="checkout-clearance-badge is-pending">
                                    ⚠️ Inspection Required
                                  </span>
                                )}
                              </td>
                              <td>
                                <div style={{ fontSize: "11.5px", color: "#334155", fontWeight: 600 }}>
                                  {asset.is_cleared_for_exit ? (asset.cleared_by || "Security Officer") : "—"}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                                  {asset.is_cleared_for_exit && asset.cleared_at
                                    ? new Date(asset.cleared_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(asset.cleared_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                    : "—"}
                                </div>
                              </td>
                              {visit.status === "ACTIVE" && (
                                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                  {asset.is_cleared_for_exit ? (
                                    <span className="checkout-action-complete">
                                      <CheckCircle2 size={13} /> Cleared
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="checkout-clear-asset-button"
                                      onClick={() => handleClearAssetForExit(asset.asset_id)}
                                      disabled={clearingAssetId === asset.asset_id}
                                    >
                                      {clearingAssetId === asset.asset_id ? "Clearing…" : "Authorize Exit"}
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              {error && <div className="error-banner">{error}</div>}
            </section>
          )}

        {checkoutReceipt && renderCheckoutReceipt()}
      </>
    );
  };

  const renderVisitorPassDetail = () => {
    if (loading) {
      return (
        <>
          <div className="it-management-header no-print">
            <div className="it-header-title-box">
              <div className="it-header-badge-row">
                <span className="it-division-pill">Gate Access &amp; Pass Terminal</span>
                <span className="it-telemetry-pill">
                  <span className="status-dot"></span>
                  Loading Record
                </span>
              </div>
              <h2 className="it-page-title">Visitor Pass &amp; Departure Terminal</h2>
            </div>
            <div className="it-header-controls">
              <button className="it-qr-portal-btn" onClick={openDashboard} type="button">
                <ArrowLeft size={14} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
          <section className="page-card" style={{ padding: "60px 20px", textAlign: "center" }}>
            <RefreshCw size={28} className="spin" style={{ color: "#2563eb", margin: "0 auto 12px", display: "block" }} />
            <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>
              Loading Visitor Pass &amp; Credential Dossier...
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
              Verifying gate clearance, identity credentials, and registered equipment.
            </p>
          </section>
        </>
      );
    }

    if (error && !visit) {
      return (
        <>
          <div className="it-management-header no-print">
            <div className="it-header-title-box">
              <h2 className="it-page-title">Visitor Pass &amp; Departure Terminal</h2>
            </div>
            <div className="it-header-controls">
              <button className="it-qr-portal-btn" onClick={openDashboard} type="button">
                <ArrowLeft size={14} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
          <section className="page-card">
            <div className="error-banner">
              <XCircle size={18} />
              <span>{error}</span>
            </div>
            <div style={{ marginTop: "16px" }}>
              <button className="primary-button" onClick={openDashboard} type="button">
                <ArrowLeft size={14} /> Return to Dashboard
              </button>
            </div>
          </section>
        </>
      );
    }

    if (!visit) {
      return (
        <>
          <div className="it-management-header no-print">
            <div className="it-header-title-box">
              <h2 className="it-page-title">Visitor Pass &amp; Departure Terminal</h2>
            </div>
            <div className="it-header-controls">
              <button className="it-qr-portal-btn" onClick={openDashboard} type="button">
                <ArrowLeft size={14} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
          <section className="page-card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <Users size={32} style={{ color: "#94a3b8", margin: "0 auto 10px", display: "block" }} />
            <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#1e293b" }}>No Visitor Record Selected</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "13px" }}>Please select a visitor from Today's Visitors list.</p>
            <button className="primary-button" onClick={openDashboard} type="button">
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          </section>
        </>
      );
    }

    const directoryVisitor = visitorList.find(
      (item) => String(item.visitor_id) === String(visit.visitor?.visitor_id || visit.visitor_id)
    ) || {};

    const visitorName = `${visit.visitor?.first_name || directoryVisitor.first_name || ""} ${visit.visitor?.last_name || directoryVisitor.last_name || ""}`.trim() || "Visitor";
    const rawPhotoUrl =
      visit.visitor?.photo_url ||
      visit.visitor?.photo_path ||
      visit.visitor?.photo ||
      visit.photo_url ||
      visit.photo_path ||
      directoryVisitor.photo_url ||
      directoryVisitor.photo_path ||
      "";
    const visitorPhoto = resolvePhotoUrl(rawPhotoUrl);

    const mergedVisitor = {
      ...directoryVisitor,
      ...(visit.visitor || {}),
    };

    const fullAddress = [
      mergedVisitor.address_line1,
      mergedVisitor.address_line2,
      mergedVisitor.city,
      mergedVisitor.state,
      mergedVisitor.postal_code,
      mergedVisitor.country,
    ].filter(Boolean).join(", ") || "On file in directory";

    const phone = mergedVisitor.phone_number || mergedVisitor.phone || "Not recorded";
    const email = mergedVisitor.email || "Not recorded";
    const company = mergedVisitor.company_name || "Independent / Guest";
    const isInside = visit.status === "ACTIVE";
    const isIT = (visit.purpose || "").includes("[IT_VISIT]");
    const passRefId = `VMS-${String(visit.visit_id).slice(0, 8).toUpperCase()}`;
    const pendingAssetsCount = visitAssets.filter((a) => !a.is_cleared_for_exit).length;

    return (
      <>
        {/* Executive Header Bar */}
        <div className="it-management-header no-print">
          <div className="it-header-title-box">
            <div className="it-header-badge-row">
              <span className="it-division-pill">
                {isIT ? "IT Security & Custody Pass" : "Gate Access & Visitor Pass"}
              </span>
              <span className={`it-telemetry-pill ${isInside ? "active-live" : "concluded"}`}>
                <span className="status-dot"></span>
                {isInside ? "Active On Premises" : "Visit Concluded"}
              </span>
              <span className="visitor-id-badge" style={{ fontFamily: "monospace" }}>
                {passRefId}
              </span>
            </div>
            <h2 className="it-page-title">Visitor Pass &amp; Departure Terminal</h2>
            <p className="it-page-desc">
              Official digital security credential, visitor identity profile, equipment clearance, and instant gate checkout
            </p>
          </div>

          <div className="it-header-controls">
            <button
              className="it-qr-portal-btn"
              onClick={openDashboard}
              type="button"
              title="Return to Today's Visitors table"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
            <button
              className="it-log-recovery-primary-btn"
              onClick={() => window.print()}
              type="button"
              title="Print official gate pass"
            >
              <Printer size={14} />
              <span>Print Pass</span>
            </button>
            <button
              type="button"
              className="it-refresh-btn"
              onClick={() => fetchVisit(visit.visit_id, false)}
              disabled={loading || assetsLoading}
              title="Refresh pass & status"
            >
              <RefreshCw size={14} className={loading || assetsLoading ? "spin" : ""} />
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Left: Pass Badge | Right: Checkout & Dossier */}
        <div className="vms-pass-terminal-layout">
          {/* LEFT: THE VISITOR PASS BADGE CARD */}
          <div className="vms-pass-badge-column">
            <div className="vms-pass-card">
              <div className="vms-pass-lanyard-notch" aria-hidden="true">
                <div className="vms-pass-lanyard-hole"></div>
              </div>

              {/* Pass Header */}
              <div className="vms-pass-header">
                <div className="vms-pass-header-top">
                  <div className="vms-pass-seal">
                    <ShieldCheck size={15} />
                    <span>{isIT ? "IT SECURITY PASS" : "VMS ACCESS PASS"}</span>
                  </div>
                  <span className={`vms-pass-status-pill ${isInside ? "is-inside" : "is-departed"}`}>
                    <span className="status-dot"></span>
                    {isInside ? "ACTIVE INSIDE" : "CHECKED OUT"}
                  </span>
                </div>
                <h3 className="vms-pass-type-title">
                  {isIT ? "IT CONTRACTOR PASS" : "OFFICIAL VISITOR PASS"}
                </h3>
                <div className="vms-pass-ref-badge">
                  GATE PASS REF: <strong>{passRefId}</strong>
                </div>
              </div>

              {/* Scannable Pass QR Code */}
              <div className="vms-pass-qr-vault">
                <div className="vms-pass-qr-frame">
                  <div className="vms-pass-qr-corner top-left"></div>
                  <div className="vms-pass-qr-corner top-right"></div>
                  <div className="vms-pass-qr-corner bottom-left"></div>
                  <div className="vms-pass-qr-corner bottom-right"></div>
                  {passQrCode ? (
                    <img
                      src={passQrCode}
                      alt={`QR Code Pass for ${visitorName}`}
                      className="vms-pass-qr-img"
                    />
                  ) : (
                    <div className="vms-pass-qr-loading">
                      <RefreshCw size={24} className="spin" />
                      <span>Generating QR Pass...</span>
                    </div>
                  )}
                </div>
                <div className="vms-pass-qr-caption">
                  <QrCode size={13} />
                  <span>Optical Gate Scanner Code</span>
                </div>
                <div className="vms-pass-token-pill">
                  <span>Visit ID:</span>
                  <code>{String(visit.visit_id).slice(0, 18)}...</code>
                </div>
              </div>

              {/* Visitor Identity Profile */}
              <div className="vms-pass-identity-section">
                <div
                  className="vms-pass-photo-box"
                  onClick={() => {
                    if (visitorPhoto) {
                      setAssetLightbox({
                        url: visitorPhoto,
                        title: `${visitorName} (Visitor Photo)`,
                        subtitle: `${company} · ID #${visit.visitor?.visitor_id || visit.visitor_id || "—"}`
                      });
                    }
                  }}
                  title={visitorPhoto ? "Click to enlarge photo" : undefined}
                  style={visitorPhoto ? { cursor: "pointer" } : {}}
                >
                  {visitorPhoto ? (
                    <>
                      <img src={visitorPhoto} alt={visitorName} className="vms-pass-photo-img" />
                      <div className="vms-pass-photo-zoom-hint">
                        <Eye size={11} />
                      </div>
                    </>
                  ) : (
                    <div className="vms-pass-avatar-fallback">
                      {getInitials(visitorName)}
                    </div>
                  )}
                </div>

                <div className="vms-pass-identity-text">
                  <h4 className="vms-pass-name">{visitorName}</h4>
                  <div className="vms-pass-visitor-id-tag">
                    VISITOR #{visit.visitor?.visitor_id || visit.visitor_id || "—"}
                  </div>
                  <div className="vms-pass-company-tag">
                    <Building2 size={12} />
                    <span>{company}</span>
                  </div>
                </div>
              </div>

              {/* Pass Credentials Meta */}
              <div className="vms-pass-meta-grid">
                <div className="vms-pass-meta-cell">
                  <span className="vms-pass-meta-label">HOST EMPLOYEE</span>
                  <strong className="vms-pass-meta-val">
                    {visit.host_employee?.first_name} {visit.host_employee?.last_name}
                  </strong>
                  <span className="vms-pass-meta-sub">{visit.host_employee?.department || "General"}</span>
                </div>
                <div className="vms-pass-meta-cell">
                  <span className="vms-pass-meta-label">PURPOSE OF VISIT</span>
                  <strong className="vms-pass-meta-val" title={visit.purpose}>
                    {visit.purpose || "Official Meeting"}
                  </strong>
                </div>
                <div className="vms-pass-meta-cell">
                  <span className="vms-pass-meta-label">GATE CHECK-IN</span>
                  <strong className="vms-pass-meta-val">
                    {formatTime(visit.check_in_time)}
                  </strong>
                  <span className="vms-pass-meta-sub">
                    {visit.check_in_time ? new Date(visit.check_in_time).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Today"}
                  </span>
                </div>
                <div className="vms-pass-meta-cell">
                  <span className="vms-pass-meta-label">CLEARANCE STATUS</span>
                  <strong className="vms-pass-meta-val" style={{ color: decision?.decision === "ALLOW" ? "#059669" : "#dc2626" }}>
                    {decision?.decision === "ALLOW" ? "✓ ALLOWED" : "FLAGGED"}
                  </strong>
                  <span className="vms-pass-meta-sub">
                    {visitAssets.length} asset{visitAssets.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Official Sign-Off for PDF / Printed Badge */}
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

              {/* Pass Footer */}
              <div className="vms-pass-card-footer">
                <p className="vms-pass-disclaimer">
                  Official Visitor Pass issued by Security Management. Must remain visible at all times while on premises.
                </p>
                <button
                  type="button"
                  className="vms-pass-print-btn no-print"
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Print Visitor Badge</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: OPERATIONAL CLEARANCE & DIRECT CHECKOUT */}
          <div className="vms-pass-operations-column">
            {/* DIRECT CHECKOUT PANEL */}
            <div className={`vms-pass-checkout-card ${isInside ? "active-checkout" : "concluded-checkout"}`}>
              <div className="vms-checkout-card-header">
                <div className="vms-checkout-title-wrap">
                  <div className={`vms-checkout-icon-wrap ${isInside ? "inside" : "concluded"}`}>
                    {isInside ? <LogOut size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div>
                    <h3 className="vms-checkout-card-title">
                      {isInside ? "Direct Departure & Gate Checkout" : "Visit Successfully Concluded"}
                    </h3>
                    <p className="vms-checkout-card-desc">
                      {isInside
                        ? "Process visitor building exit directly from this terminal."
                        : `Visitor departed premises. Checked out on ${formatDateTime(visit.check_out_time)}.`}
                    </p>
                  </div>
                </div>

                <div className="vms-checkout-timing-pill">
                  <Clock size={13} />
                  <span>Check-In: {formatTime(visit.check_in_time)}</span>
                </div>
              </div>

              {/* Asset Warning before checkout */}
              {isInside && pendingAssetsCount > 0 && (
                <div className="vms-checkout-asset-warning">
                  <AlertTriangle size={17} />
                  <div>
                    <strong>Departure Inspection Required:</strong>
                    <span> {pendingAssetsCount} declared hardware item{pendingAssetsCount === 1 ? "" : "s"} must be cleared for building exit before checkout.</span>
                  </div>
                  <button
                    type="button"
                    className="vms-clear-all-assets-btn"
                    onClick={handleClearAllAssetsForExit}
                    disabled={clearingAssetId !== null}
                    title="Authorize clearance for all pending hardware items"
                  >
                    <CheckCircle2 size={13} />
                    <span>Authorize All Items</span>
                  </button>
                </div>
              )}

              {/* Checkout Action Button or Concluded Notice */}
              <div className="vms-checkout-action-container">
                {isInside ? (
                  <>
                    <button
                      type="button"
                      className="vms-checkout-direct-btn"
                      onClick={handleCheckout}
                      disabled={checkoutLoading || assetsLoading || pendingAssetsCount > 0}
                      title={pendingAssetsCount > 0 ? "Inspect and clear declared assets before checkout" : "Authorize visitor checkout"}
                    >
                      {checkoutLoading ? (
                        <RefreshCw size={17} className="spin" />
                      ) : (
                        <LogOut size={17} />
                      )}
                      <span>
                        {checkoutLoading
                          ? "Processing Visitor Departure..."
                          : "Check Out Visitor Directly"}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="vms-checkout-refresh-btn"
                      onClick={() => fetchVisit(visit.visit_id, false)}
                      disabled={loading || assetsLoading}
                      title="Refresh visit and asset inspection status"
                    >
                      <RefreshCw size={14} className={loading || assetsLoading ? "spin" : ""} />
                      <span>Refresh Terminal</span>
                    </button>
                  </>
                ) : (
                  <div className="vms-checkout-concluded-row">
                    <div className="vms-concluded-badge">
                      <CheckCircle2 size={16} />
                      <span>Visitor Checked Out · Clearance Finalized</span>
                    </div>
                    {checkoutReceipt && (
                      <button
                        type="button"
                        className="vms-print-receipt-btn"
                        onClick={() => window.print()}
                      >
                        <Printer size={14} />
                        <span>Print Departure Receipt</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="it-qr-portal-btn"
                      onClick={openDashboard}
                    >
                      <ArrowLeft size={13} />
                      <span>Return to Dashboard</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* FULL VISITOR INFORMATION DOSSIER */}
            <div className="vms-pass-section-card">
              <div className="vms-section-card-header">
                <div className="vms-section-title-wrap">
                  <User size={16} color="#2563eb" />
                  <h4>Visitor Identification &amp; Contact Information</h4>
                </div>
                <span className="vms-section-chip">Verified Profile</span>
              </div>

              <div className="vms-dossier-grid">
                <div className="vms-dossier-item">
                  <span className="vms-dossier-label">Full Legal Name</span>
                  <strong className="vms-dossier-value">{visitorName}</strong>
                </div>

                <div className="vms-dossier-item">
                  <span className="vms-dossier-label">Visitor Record ID</span>
                  <strong className="vms-dossier-value mono-val">
                    ID #{visit.visitor?.visitor_id || visit.visitor_id || "—"}
                  </strong>
                </div>

                <div className="vms-dossier-item">
                  <span className="vms-dossier-label">Company / Affiliation</span>
                  <div className="vms-dossier-company">
                    <Building2 size={13} color="#2563eb" />
                    <strong>{company}</strong>
                  </div>
                </div>

                <div className="vms-dossier-item">
                  <span className="vms-dossier-label">Phone Contact</span>
                  <strong className="vms-dossier-value">
                    {phone !== "Not recorded" ? (
                      <a href={`tel:${phone}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                        📞 {phone}
                      </a>
                    ) : "—"}
                  </strong>
                </div>

                <div className="vms-dossier-item">
                  <span className="vms-dossier-label">Email Address</span>
                  <strong className="vms-dossier-value">
                    {email !== "Not recorded" ? (
                      <a href={`mailto:${email}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                        ✉️ {email}
                      </a>
                    ) : "—"}
                  </strong>
                </div>

                <div className="vms-dossier-item full-span">
                  <span className="vms-dossier-label">Physical Address</span>
                  <strong className="vms-dossier-value" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <MapPin size={13} color="#64748b" />
                    {fullAddress}
                  </strong>
                </div>
              </div>
            </div>

            {/* HOST EMPLOYEE & APPOINTMENT */}
            <div className="vms-pass-section-card">
              <div className="vms-section-card-header">
                <div className="vms-section-title-wrap">
                  <Building2 size={16} color="#059669" />
                  <h4>Host Employee &amp; Authorization Details</h4>
                </div>
                <span className="vms-section-chip host">Host Verified</span>
              </div>

              <div className="vms-dossier-grid">
                <div className="vms-dossier-item">
                  <span className="vms-dossier-label">Host Officer</span>
                  <strong className="vms-dossier-value">
                    {visit.host_employee?.first_name} {visit.host_employee?.last_name}
                  </strong>
                </div>

                <div className="vms-dossier-item">
                  <span className="vms-dossier-label">Department / Unit</span>
                  <strong className="vms-dossier-value">
                    {visit.host_employee?.department || "General Administration"}
                  </strong>
                </div>

                <div className="vms-dossier-item">
                  <span className="vms-dossier-label">Host Email</span>
                  <strong className="vms-dossier-value">
                    {visit.host_employee?.email ? (
                      <a href={`mailto:${visit.host_employee.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                        {visit.host_employee.email}
                      </a>
                    ) : "—"}
                  </strong>
                </div>

                <div className="vms-dossier-item">
                  <span className="vms-dossier-label">Host Availability Status</span>
                  <span className="vms-host-status-badge">
                    <span className="status-dot"></span>
                    {visit.host_employee?.status || "AVAILABLE"}
                  </span>
                </div>

                <div className="vms-dossier-item full-span">
                  <span className="vms-dossier-label">Stated Visit Purpose</span>
                  <div className="vms-purpose-badge">
                    <Tag size={13} />
                    <span>{visit.purpose || "Official Meeting"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DECLARED HARDWARE ASSETS & PHYSICAL CLEARANCE */}
            <div className="vms-pass-section-card">
              <div className="vms-section-card-header">
                <div className="vms-section-title-wrap">
                  <Laptop size={16} color="#7c3aed" />
                  <h4>Declared Hardware Assets &amp; Physical Equipment ({visitAssets.length})</h4>
                </div>
                <span className={`vms-section-chip ${pendingAssetsCount > 0 ? "warning" : "cleared"}`}>
                  {pendingAssetsCount > 0 ? `${pendingAssetsCount} Pending Exit Clearance` : "All Cleared"}
                </span>
              </div>

              {assetsError && <div className="error-banner">{assetsError}</div>}

              {assetsLoading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                  <RefreshCw size={16} className="spin" /> Loading assets...
                </div>
              ) : visitAssets.length === 0 ? (
                <div className="vms-empty-assets-box">
                  <HardDrive size={22} color="#94a3b8" />
                  <div>
                    <strong>No physical hardware assets declared.</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                      Visitor carries no registered laptops or equipment. Cleared for direct building exit.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="vms-pass-assets-table-wrap">
                  <table className="vms-pass-assets-table">
                    <thead>
                      <tr>
                        <th style={{ width: "60px", textAlign: "center" }}>Photo</th>
                        <th>Hardware Type</th>
                        <th>Brand &amp; Model</th>
                        <th>Serial Number</th>
                        <th>Clearance Status</th>
                        {isInside && <th style={{ textAlign: "right" }}>Exit Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {visitAssets.map((asset) => {
                        const assetPhoto = resolvePhotoUrl(asset.photo_url || asset.asset_photo_url);
                        return (
                          <tr key={asset.asset_id}>
                            <td style={{ textAlign: "center" }}>
                              {assetPhoto ? (
                                <div
                                  className="vms-asset-thumb-box"
                                  onClick={() => setAssetLightbox({
                                    url: assetPhoto,
                                    title: `${asset.brand_model || asset.asset_type || "Declared Hardware"}`,
                                    subtitle: `Serial: ${asset.serial_number || "N/A"}`
                                  })}
                                  title="Click to zoom photo"
                                >
                                  <img src={assetPhoto} alt="Hardware" className="vms-asset-thumb" />
                                  <Eye size={10} className="vms-asset-thumb-zoom" />
                                </div>
                              ) : (
                                <div className="vms-asset-thumb-placeholder">
                                  <Laptop size={14} />
                                </div>
                              )}
                            </td>
                            <td>
                              <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>
                                {asset.asset_type || "Equipment"}
                              </strong>
                            </td>
                            <td style={{ color: "#334155", fontSize: "12.5px" }}>
                              {asset.brand_model || "Not specified"}
                            </td>
                            <td>
                              {asset.serial_number ? (
                                <code className="vms-asset-serial-tag">{asset.serial_number}</code>
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: "11px" }}>None</span>
                              )}
                            </td>
                            <td>
                              <span className={`vms-asset-clearance-pill ${asset.is_cleared_for_exit ? "cleared" : "pending"}`}>
                                {asset.is_cleared_for_exit ? "✓ Cleared" : "⚠️ Needs Clearance"}
                              </span>
                            </td>
                            {isInside && (
                              <td style={{ textAlign: "right" }}>
                                {asset.is_cleared_for_exit ? (
                                  <span style={{ fontSize: "11.5px", color: "#059669", fontWeight: 600 }}>
                                    ✓ Authorized
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="vms-clear-single-asset-btn"
                                    onClick={() => handleClearAssetForExit(asset.asset_id)}
                                    disabled={clearingAssetId === asset.asset_id}
                                    title="Authorize exit clearance for this item"
                                  >
                                    {clearingAssetId === asset.asset_id ? "Clearing..." : "Authorize Exit"}
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {checkoutReceipt && renderCheckoutReceipt()}
      </>
    );
  };

  const isITVisitRecord = (item) => {
    if (!item) return false;
    const purpose = String(item.purpose || "").toUpperCase();
    if (purpose.includes("[IT_VISIT]")) return true;

    const hostDept = String(
      item.host_employee?.department || item.host?.department || ""
    ).trim().toUpperCase();
    if (hostDept === "IT" || hostDept.includes("TECH") || hostDept.includes("INFORMATION TECH")) {
      return true;
    }

    const company = String(item.visitor?.company_name || "").trim().toUpperCase();
    if (company === "IT" || company === "IT DEPARTMENT" || company.includes("IT SERVICES") || company.includes("TECH SOLUTIONS")) {
      return true;
    }

    if (
      purpose.includes("DATA CENTER") ||
      purpose.includes("SERVER ROOM") ||
      purpose.includes("HARDWARE DIAGNOSTICS") ||
      purpose.includes("BLADE SERVER") ||
      purpose.includes("NETWORK RACK")
    ) {
      return true;
    }

    return false;
  };

  const renderCheckoutHistory = () => {
    const generalOnlyHistory = (checkoutHistory || []).filter(
      (item) => !isITVisitRecord(item)
    );
    return (
      <CheckoutHistory
        mode="general"
        checkoutHistory={generalOnlyHistory}
        visitorList={visitorList}
        onRefresh={fetchCheckoutHistory}
        loading={checkoutHistoryLoading}
        error={checkoutHistoryError}
        onBack={openDashboard}
        setAssetLightbox={setAssetLightbox}
      />
    );
  };

  /* =========================================================
     IT CHECKOUT HISTORY (DEDICATED TO IT VISITORS ONLY)
  ========================================================= */
  const renderITCheckoutHistory = () => {
    const itOnlyHistory = (checkoutHistory || []).filter(
      (item) => isITVisitRecord(item)
    );
    return (
      <CheckoutHistory
        mode="it"
        checkoutHistory={itOnlyHistory}
        visitorList={visitorList}
        onRefresh={fetchCheckoutHistory}
        loading={checkoutHistoryLoading}
        error={checkoutHistoryError}
        onBack={openDashboard}
        setAssetLightbox={setAssetLightbox}
      />
    );
  };

  const renderHosts = (isIT = false) => {
    const query = hostSearch.trim().toLowerCase();
    const itHostsOnly = hostList.filter(
      (h) => (h.department || "").trim().toUpperCase() === "IT" || (h.department || "").trim().toUpperCase().includes("TECH")
    );
    const baseList = isIT && itHostScope === "it" ? itHostsOnly : hostList;

    const distinctDepartments = Array.from(
      new Set(baseList.map((h) => (h.department || "").trim()).filter(Boolean))
    ).sort();

    const filteredHosts = baseList.filter((host) => {
      const name = `${host.first_name || ""} ${host.last_name || ""}`.trim().toLowerCase();
      const matchesSearch = (
        !query ||
        name.includes(query) ||
        String(host.employee_id || "").includes(query) ||
        String(host.email || "").toLowerCase().includes(query) ||
        String(host.department || "").toLowerCase().includes(query) ||
        String(host.phone_number || "").includes(query) ||
        String(host.designation || "").toLowerCase().includes(query) ||
        String(host.office_location || "").toLowerCase().includes(query)
      );
      const matchesDept = !selectedHostDeptFilter || (host.department || "").trim().toLowerCase() === selectedHostDeptFilter.toLowerCase();
      const matchesStatus = (
        hostStatusFilter === "all"
          ? true
          : (hostStatusFilter === "active" || hostStatusFilter === "reception")
          ? (host.status || "ACTIVE") === "ACTIVE"
          : (host.status || "ACTIVE") !== "ACTIVE"
      );
      return matchesSearch && matchesDept && matchesStatus;
    });

    const activeHostsCount = baseList.filter((h) => (h.status || "ACTIVE") === "ACTIVE").length;
    const departmentCount = new Set(baseList.map((h) => h.department).filter(Boolean)).size;

    return (
      <div className="vms-hosts-container">
        {/* =========================================================
            DESKTOP VIEW (> 768px): PRESERVED 100% UNTOUCHED
        ========================================================= */}
        <div className="vms-desktop-only">
          {/* Executive Hosts Header (Hero Card) */}
          <div className="it-management-header">
            <div className="it-header-title-box">
              <div className="it-header-badge-row">
                <span className="it-division-pill">{isIT ? "IT INFRASTRUCTURE DIVISION" : "ORGANIZATION STAFF DIRECTORY"}</span>
                <span className="it-telemetry-pill">
                  <span className="status-dot"></span>
                  {isIT ? "Active IT Hosts & System Engineers" : "Active Staff Records"}
                </span>
              </div>
              <h2 className="it-page-title">{isIT ? "IT Hosts & Technical Engineers Directory" : "Hosts & Employee Directory"}</h2>
              <p className="it-page-desc">
                {isIT
                  ? "Manage internal IT hosts, system engineers, and technical personnel authorized to host visitor hardware access."
                  : "Manage internal company hosts, department assignments, and contact channels for visitor reception"}
              </p>
            </div>

            <div className="it-header-controls">
              <button
                type="button"
                className="it-log-recovery-primary-btn"
                onClick={() => {
                  setHostCreateError("");
                  setHostForm({
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone_number: "",
                    department: isIT ? "IT" : "IT",
                    designation: "",
                    office_location: "",
                    notes: "",
                    status: "ACTIVE",
                  });
                  setShowAddHost(true);
                }}
              >
                <UserPlus size={15} />
                <span>{isIT ? "Add IT Host" : "Add Host"}</span>
              </button>

              <button
                type="button"
                className="it-refresh-btn"
                onClick={fetchHosts}
                disabled={hostLoading}
                title="Refresh hosts list"
              >
                <RefreshCw size={15} className={hostLoading ? "spin" : ""} />
              </button>

              <button type="button" className="it-qr-portal-btn" onClick={isIT ? openITAssets : openDashboard}>
                <ArrowLeft size={14} />
                <span>{isIT ? "Back to IT Assets" : "Back to Dashboard"}</span>
              </button>
            </div>
          </div>

          {hostError && (
            <div className="error-banner">
              <XCircle size={16} />
              {hostError}
            </div>
          )}

          {/* Scope Tabs (Visible in IT Mode) */}
          {isIT && (
            <div className="mobile-host-tabs-row">
              <button
                type="button"
                className={`mobile-host-tab-pill ${itHostScope === "it" ? "active" : ""}`}
                onClick={() => setItHostScope("it")}
              >
                IT Department Hosts ({itHostsOnly.length})
              </button>
              <button
                type="button"
                className={`mobile-host-tab-pill ${itHostScope === "all" ? "active" : ""}`}
                onClick={() => setItHostScope("all")}
              >
                All Organization Staff ({hostList.length})
              </button>
            </div>
          )}

          {/* Desktop 2x2 Stats Grid */}
          <section className="mobile-host-stats-grid">
            <div
              className={`mobile-host-stat-card clickable ${hostStatusFilter === "all" && !selectedHostDeptFilter && !showMobileHostFilter ? "active active-blue" : ""}`}
              onClick={() => {
                setHostStatusFilter("all");
                setSelectedHostDeptFilter("");
                setHostSearch("");
                setShowMobileHostFilter(false);
              }}
              role="button"
              tabIndex={0}
              title="Click to view all hosts"
            >
              <div className="mobile-host-stat-icon blue">
                <Users size={16} />
              </div>
              <div className="mobile-host-stat-content">
                <strong>{baseList.length}</strong>
                <span>Total Hosts</span>
              </div>
              <ChevronRight size={14} className="mobile-host-stat-arrow" />
            </div>

            <div
              className={`mobile-host-stat-card clickable ${hostStatusFilter === "active" ? "active active-green" : ""}`}
              onClick={() => {
                setHostStatusFilter((prev) => (prev === "active" ? "all" : "active"));
              }}
              role="button"
              tabIndex={0}
              title="Click to filter by active hosts"
            >
              <div className="mobile-host-stat-icon green">
                <UserCheck size={16} />
              </div>
              <div className="mobile-host-stat-content">
                <strong>{activeHostsCount}</strong>
                <span>Active Hosts</span>
              </div>
              <ChevronRight size={14} className="mobile-host-stat-arrow" />
            </div>

            <div
              className={`mobile-host-stat-card clickable ${showMobileHostFilter || selectedHostDeptFilter ? "active active-purple" : ""}`}
              onClick={() => {
                setShowMobileHostFilter((prev) => !prev);
              }}
              role="button"
              tabIndex={0}
              title="Click to toggle department filters"
            >
              <div className="mobile-host-stat-icon purple">
                <Building2 size={16} />
              </div>
              <div className="mobile-host-stat-content">
                <strong>{departmentCount}</strong>
                <span>Departments</span>
              </div>
              <ChevronRight size={14} className="mobile-host-stat-arrow" />
            </div>

            <div
              className={`mobile-host-stat-card clickable ${hostStatusFilter === "reception" ? "active active-amber" : ""}`}
              onClick={() => {
                setHostStatusFilter((prev) => (prev === "reception" ? "all" : "reception"));
              }}
              role="button"
              tabIndex={0}
              title="Click to filter by 100% active reception hosts"
            >
              <div className="mobile-host-stat-icon amber">
                <ShieldCheck size={16} />
              </div>
              <div className="mobile-host-stat-content">
                <strong>100%</strong>
                <span>Active Reception</span>
              </div>
              <ChevronRight size={14} className="mobile-host-stat-arrow" />
            </div>
          </section>

          {/* Active Filter Banner (Desktop) */}
          {(hostStatusFilter !== "all" || selectedHostDeptFilter || hostSearch) && (
            <div className="mobile-host-active-filter-bar">
              <span className="active-filter-label">
                Active Filter:
                <strong>
                  {hostStatusFilter === "active" && " Active Hosts"}
                  {hostStatusFilter === "reception" && " Active Reception Hosts"}
                  {selectedHostDeptFilter && ` Department: ${selectedHostDeptFilter}`}
                  {hostSearch && ` Search: "${hostSearch}"`}
                </strong>
                <span> ({filteredHosts.length} of {baseList.length} shown)</span>
              </span>
              <button
                type="button"
                className="clear-active-filter-btn"
                onClick={() => {
                  setHostStatusFilter("all");
                  setSelectedHostDeptFilter("");
                  setHostSearch("");
                  setShowMobileHostFilter(false);
                }}
              >
                <X size={12} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}

          {/* Desktop Table */}
          {filteredHosts.length === 0 ? (
            <section className="page-card">
              <div className="empty-state">
                <Users size={28} />
                <strong>No hosts found</strong>
                <span>No employees match your search.</span>
              </div>
            </section>
          ) : (
            <section className="table-card">
              <div className="table-toolbar">
                <div>
                  <h2>Host Directory</h2>
                  <p>
                    {filteredHosts.length} employee{filteredHosts.length === 1 ? "" : "s"} available to host visitors
                  </p>
                </div>
                <div className="visitor-toolbar-actions">
                  <div className="search-field">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search name, ID, department..."
                      value={hostSearch}
                      onChange={(e) => setHostSearch(e.target.value)}
                    />
                    {hostSearch && (
                      <button
                        type="button"
                        style={{ background: "transparent", border: 0, cursor: "pointer", color: "#94a3b8" }}
                        onClick={() => setHostSearch("")}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "24%" }}>Host &amp; Designation</th>
                      <th style={{ width: "13%" }}>Employee ID</th>
                      <th style={{ width: "22%" }}>Contact Channels</th>
                      <th style={{ width: "23%" }}>Department &amp; Office</th>
                      <th style={{ width: "10%" }}>Clearance</th>
                      <th style={{ width: "8%", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHosts.map((host) => {
                      const dept = (host.department || "").trim().toUpperCase();
                      let deptBadgeClass = "badge-info";
                      if (dept === "IT" || dept.includes("TECH")) deptBadgeClass = "badge-it";
                      else if (dept === "HR" || dept.includes("HUMAN")) deptBadgeClass = "badge-success";

                      return (
                        <tr
                          key={host.employee_id}
                          className="host-row-clickable"
                          onClick={() => setSelectedHostDetail(host)}
                          style={{ cursor: "pointer" }}
                          title="Click row to inspect full host dossier"
                        >
                          <td>
                            <div className="visitor-cell">
                              <div className="visitor-avatar">
                                {getInitials(
                                  `${host.first_name || ""} ${host.last_name || ""}`
                                )}
                              </div>
                              <div>
                                <strong style={{ color: "#0f172a", fontSize: "13.5px" }}>
                                  {host.first_name} {host.last_name}
                                </strong>
                                {host.designation && (
                                  <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                                    {host.designation}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="visitor-id-badge">EMP-{host.employee_id}</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ color: "#334155", fontSize: "12.5px" }}>{host.email || "—"}</span>
                              {host.phone_number && (
                                <span style={{ color: "#64748b", fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <Phone size={11} style={{ color: "#3b82f6" }} /> {host.phone_number}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="host-dept-cell">
                              <span className={`notif-category-badge ${deptBadgeClass}`}>
                                {host.department || "General"}
                              </span>
                              {host.office_location && (
                                <span className="host-office-location">
                                  <MapPin size={10} style={{ color: "#94a3b8" }} /> {host.office_location}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${
                                host.status === "ACTIVE" ? "active" : ""
                              }`}
                            >
                              {host.status || "ACTIVE"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="host-view-dossier-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHostDetail(host);
                              }}
                            >
                              <Eye size={12} />
                              <span>View Dossier</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* =========================================================
            MOBILE VIEW (<= 768px): MATCHES media_1793421445237_41ec04f6.jpg
        ========================================================= */}
        <div className="vms-mobile-only mobile-hosts-container">
          {/* 1. Executive Dark Navy Hero Card */}
          <div className="mobile-host-hero">
            <div className="mobile-host-hero-badge-row">
              <span className="mobile-host-badge-pill">
                {isIT ? "IT INFRASTRUCTURE DIVISION" : "ORGANIZATION STAFF DIRECTORY"}
              </span>
              <span className="mobile-host-telemetry-pill">
                <span className="status-dot"></span>
                {isIT ? "Active IT Hosts & System Engineers" : "Active Staff Records"}
              </span>
            </div>

            <div className="mobile-host-hero-title-wrap">
              <div className="mobile-host-hero-text">
                <h2 className="mobile-host-hero-title">
                  {isIT ? "IT Hosts & Technical Engineers Directory" : "Hosts & Employee Directory"}
                </h2>
                <p className="mobile-host-hero-desc">
                  {isIT
                    ? "Manage internal IT hosts, system engineers, and technical personnel authorized to host visitor hardware access."
                    : "Manage internal company hosts, department assignments, and contact channels for visitor reception."}
                </p>
              </div>
              <div className="mobile-host-hero-watermark">
                <Users size={38} />
              </div>
            </div>

            <div className="mobile-host-hero-controls">
              <button
                type="button"
                className="mobile-host-btn-add"
                onClick={() => {
                  setHostCreateError("");
                  setHostForm({
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone_number: "",
                    department: isIT ? "IT" : "IT",
                    designation: "",
                    office_location: "",
                    notes: "",
                    status: "ACTIVE",
                  });
                  setShowAddHost(true);
                }}
              >
                <UserPlus size={15} />
                <span>{isIT ? "Add IT Host" : "Add Host"}</span>
              </button>

              <button
                type="button"
                className="mobile-host-btn-refresh"
                onClick={fetchHosts}
                disabled={hostLoading}
                title="Refresh hosts list"
              >
                <RefreshCw size={15} className={hostLoading ? "spin" : ""} />
              </button>

              <button
                type="button"
                className="mobile-host-btn-back"
                onClick={isIT ? openITAssets : openDashboard}
              >
                <ArrowLeft size={14} />
                <span>{isIT ? "Back to IT Assets" : "Back to Dashboard"}</span>
              </button>
            </div>
          </div>

          {hostError && (
            <div className="error-banner">
              <XCircle size={16} />
              {hostError}
            </div>
          )}

          {/* Scope Tabs (Visible in IT Mode) */}
          {isIT && (
            <div className="mobile-host-tabs-row">
              <button
                type="button"
                className={`mobile-host-tab-pill ${itHostScope === "it" ? "active" : ""}`}
                onClick={() => setItHostScope("it")}
              >
                IT Department Hosts ({itHostsOnly.length})
              </button>
              <button
                type="button"
                className={`mobile-host-tab-pill ${itHostScope === "all" ? "active" : ""}`}
                onClick={() => setItHostScope("all")}
              >
                All Organization Staff ({hostList.length})
              </button>
            </div>
          )}

          {/* 2. 2x2 KPI Metrics Grid */}
          <div className="mobile-host-stats-grid">
            {/* Card 1: Total Hosts */}
            <div
              className={`mobile-host-stat-card clickable ${hostStatusFilter === "all" && !selectedHostDeptFilter && !showMobileHostFilter ? "active active-blue" : ""}`}
              onClick={() => {
                setHostStatusFilter("all");
                setSelectedHostDeptFilter("");
                setHostSearch("");
                setShowMobileHostFilter(false);
              }}
              role="button"
              tabIndex={0}
              title="Click to view all hosts"
            >
              <div className="mobile-host-stat-icon blue">
                <Users size={18} />
              </div>
              <div className="mobile-host-stat-content">
                <strong>{baseList.length}</strong>
                <span>Total Hosts</span>
              </div>
              <ChevronRight size={14} className="mobile-host-stat-arrow" />
            </div>

            {/* Card 2: Active Hosts */}
            <div
              className={`mobile-host-stat-card clickable ${hostStatusFilter === "active" ? "active active-green" : ""}`}
              onClick={() => {
                setHostStatusFilter((prev) => (prev === "active" ? "all" : "active"));
              }}
              role="button"
              tabIndex={0}
              title="Click to filter by active hosts"
            >
              <div className="mobile-host-stat-icon green">
                <UserCheck size={18} />
              </div>
              <div className="mobile-host-stat-content">
                <strong>{activeHostsCount}</strong>
                <span>Active Hosts</span>
              </div>
              <ChevronRight size={14} className="mobile-host-stat-arrow" />
            </div>

            {/* Card 3: Departments */}
            <div
              className={`mobile-host-stat-card clickable ${showMobileHostFilter || selectedHostDeptFilter ? "active active-purple" : ""}`}
              onClick={() => {
                setShowMobileHostFilter((prev) => !prev);
              }}
              role="button"
              tabIndex={0}
              title="Click to toggle department filters"
            >
              <div className="mobile-host-stat-icon purple">
                <Building2 size={18} />
              </div>
              <div className="mobile-host-stat-content">
                <strong>{departmentCount}</strong>
                <span>Departments</span>
              </div>
              <ChevronRight size={14} className="mobile-host-stat-arrow" />
            </div>

            {/* Card 4: Active Reception */}
            <div
              className={`mobile-host-stat-card clickable ${hostStatusFilter === "reception" ? "active active-amber" : ""}`}
              onClick={() => {
                setHostStatusFilter((prev) => (prev === "reception" ? "all" : "reception"));
              }}
              role="button"
              tabIndex={0}
              title="Click to filter by 100% active reception hosts"
            >
              <div className="mobile-host-stat-icon amber">
                <ShieldCheck size={18} />
              </div>
              <div className="mobile-host-stat-content">
                <strong>100%</strong>
                <span>Active Reception</span>
              </div>
              <ChevronRight size={14} className="mobile-host-stat-arrow" />
            </div>
          </div>

          {/* Active Filter Banner (Mobile) */}
          {(hostStatusFilter !== "all" || selectedHostDeptFilter || hostSearch) && (
            <div className="mobile-host-active-filter-bar">
              <span className="active-filter-label">
                Active Filter:
                <strong>
                  {hostStatusFilter === "active" && " Active Hosts"}
                  {hostStatusFilter === "reception" && " Active Reception Hosts"}
                  {selectedHostDeptFilter && ` Dept: ${selectedHostDeptFilter}`}
                  {hostSearch && ` "${hostSearch}"`}
                </strong>
                <span> ({filteredHosts.length} found)</span>
              </span>
              <button
                type="button"
                className="clear-active-filter-btn"
                onClick={() => {
                  setHostStatusFilter("all");
                  setSelectedHostDeptFilter("");
                  setHostSearch("");
                  setShowMobileHostFilter(false);
                }}
              >
                <X size={12} />
                <span>Reset</span>
              </button>
            </div>
          )}

          {/* 3. Section Header */}
          <div className="mobile-host-section-header">
            <div>
              <h3 className="mobile-host-section-title">Host Directory</h3>
              <p className="mobile-host-section-sub">
                {filteredHosts.length} employee{filteredHosts.length === 1 ? "" : "s"} available to host visitors
              </p>
            </div>
          </div>

          {/* 4. Search Bar with Filter Button */}
          <div className="mobile-host-search-row" style={{ marginBottom: "14px" }}>
            <div className="mobile-host-input-wrap" style={{ position: "relative", display: "flex", alignItems: "center", flex: 1 }}>
              <Search size={15} className="mobile-host-input-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", zIndex: 2 }} />
              <input
                type="text"
                placeholder="Search name, ID, department..."
                value={hostSearch}
                onChange={(e) => setHostSearch(e.target.value)}
                className="mobile-host-input"
                style={{ width: "100%", height: "42px", paddingLeft: "42px", paddingRight: "38px", borderRadius: "12px", fontSize: "13.5px", boxSizing: "border-box" }}
              />
              {hostSearch && (
                <button
                  type="button"
                  className="mobile-host-input-clear"
                  onClick={() => setHostSearch("")}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", zIndex: 3 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              className={`mobile-host-filter-toggle-btn ${showMobileHostFilter || selectedHostDeptFilter ? "active" : ""}`}
              onClick={() => setShowMobileHostFilter(!showMobileHostFilter)}
              title="Filter by department"
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>

          {/* Optional Department Filter Dropdown */}
          {showMobileHostFilter && (
            <div className="mobile-host-dept-dropdown-card">
              <div className="mobile-host-dept-dropdown-header">
                <span>Filter by Department ({distinctDepartments.length})</span>
                <button type="button" onClick={() => setShowMobileHostFilter(false)}>
                  <X size={13} />
                </button>
              </div>
              <div className="mobile-host-dept-pills-row">
                <button
                  type="button"
                  className={`mobile-host-dept-filter-pill ${!selectedHostDeptFilter ? "active" : ""}`}
                  onClick={() => setSelectedHostDeptFilter("")}
                >
                  All Departments
                </button>
                {distinctDepartments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    className={`mobile-host-dept-filter-pill ${selectedHostDeptFilter === dept ? "active" : ""}`}
                    onClick={() => setSelectedHostDeptFilter(dept === selectedHostDeptFilter ? "" : dept)}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Host Cards List */}
          {hostLoading ? (
            <div className="page-card" style={{ padding: "24px", textAlign: "center" }}>
              <RefreshCw size={24} className="spin" style={{ margin: "0 auto 8px", color: "#3b82f6" }} />
              <strong style={{ display: "block", color: "#0f172a", fontSize: "14px" }}>Loading hosts...</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Fetching employees from the database.</span>
            </div>
          ) : filteredHosts.length === 0 ? (
            <div className="page-card" style={{ padding: "24px", textAlign: "center" }}>
              <Users size={28} style={{ margin: "0 auto 8px", color: "#94a3b8" }} />
              <strong style={{ display: "block", color: "#0f172a", fontSize: "14px" }}>No hosts found</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>No employees match your search.</span>
            </div>
          ) : (
            <div className="mobile-host-cards-list">
              {filteredHosts.map((host, index) => {
                const fullName = `${host.first_name || ""} ${host.last_name || ""}`.trim();
                const initials = getInitials(fullName);
                const empId = host.employee_id ? `EMP-${host.employee_id}` : "EMP-—";
                const dept = (host.department || "").trim().toUpperCase();
                const isDeptIT = dept === "IT" || dept.includes("TECH");
                const isDeptHR = dept === "HR" || dept.includes("HUMAN");

                const avatarPalette = [
                  { bg: "#2563eb", text: "#ffffff" },
                  { bg: "#93c5fd", text: "#1e3a8a" },
                  { bg: "#7c3aed", text: "#ffffff" },
                  { bg: "#3b82f6", text: "#ffffff" },
                  { bg: "#059669", text: "#ffffff" },
                  { bg: "#d97706", text: "#ffffff" },
                ];
                const avatarColor = avatarPalette[index % avatarPalette.length];

                return (
                  <div
                    key={host.employee_id}
                    className="mobile-host-card mobile-host-card-interactive"
                    onClick={() => setSelectedHostDetail(host)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Top Info Row */}
                    <div className="mobile-host-card-top">
                      <div className="mobile-host-card-left">
                        <div
                          className="mobile-host-avatar-box"
                          style={{
                            background: avatarColor.bg,
                            color: avatarColor.text,
                          }}
                        >
                          <span>{initials}</span>
                        </div>
                        <div className="mobile-host-info">
                          <h4 className="mobile-host-name">{fullName}</h4>
                          {host.designation && (
                            <div className="mobile-host-designation-line">
                              {host.designation}
                            </div>
                          )}
                          <div className="mobile-host-badge-line">
                            <span className="mobile-host-id-badge">
                              <FileText size={11} />
                              <span>{empId}</span>
                            </span>
                          </div>
                          <div className="mobile-host-email-line">
                            <Mail size={12} />
                            <span>{host.email || "No email recorded"}</span>
                          </div>
                          {host.phone_number && (
                            <div className="mobile-host-phone-line">
                              <Phone size={12} style={{ color: "#3b82f6" }} />
                              <span>{host.phone_number}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mobile-host-options-btn"
                        title="View Host Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHostDetail(host);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {/* Bottom Meta & Status Row */}
                    <div className="mobile-host-card-bottom">
                      <div className="mobile-host-dept-wrap">
                        <Building2 size={13} className="meta-icon" />
                        <span className={`mobile-host-dept-pill ${isDeptIT ? "it" : isDeptHR ? "hr" : "general"}`}>
                          {host.department || "General"}
                        </span>
                        {host.office_location && (
                          <span className="mobile-host-loc-pill">
                            <MapPin size={11} />
                            <span>{host.office_location}</span>
                          </span>
                        )}
                      </div>
                      <span className={`mobile-host-status-pill ${host.status === "ACTIVE" ? "active" : ""}`}>
                        <span className="status-dot"></span>
                        {host.status || "ACTIVE"}
                      </span>
                    </div>

                    {/* Quick Profile View Action */}
                    <div className="mobile-host-card-action-bar">
                      <button
                        type="button"
                        className="mobile-host-view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHostDetail(host);
                        }}
                      >
                        <Eye size={13} />
                        <span>View Host Profile &amp; Dossier</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Host Modal */}
        {showAddHost && (
          <div className="modal-overlay" onClick={() => setShowAddHost(false)}>
            <div className="modal-content host-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>{isIT ? "Add IT Host / System Engineer" : "Add New Organization Host"}</h3>
                  <p>{isIT ? "Register internal IT personnel authorized to clear visitors" : "Register company employee authorized to host campus visitors"}</p>
                </div>
                <button type="button" className="host-modal-close-btn" onClick={() => setShowAddHost(false)}>
                  <X size={18} />
                </button>
              </div>

              {hostCreateError && (
                <div className="error-banner" style={{ margin: "14px 16px 0" }}>
                  <XCircle size={16} />
                  <span>{hostCreateError}</span>
                </div>
              )}

              <form onSubmit={createHost} className="host-create-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul"
                      value={hostForm.first_name}
                      onChange={(e) => setHostForm({ ...hostForm, first_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Verma"
                      value={hostForm.last_name}
                      onChange={(e) => setHostForm({ ...hostForm, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={hostForm.email}
                      onChange={(e) => setHostForm({ ...hostForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={hostForm.phone_number}
                      onChange={(e) => setHostForm({ ...hostForm, phone_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Department *</label>
                    <input
                      type="text"
                      required
                      placeholder={isIT ? "IT / Infrastructure" : "HR, IT, Engineering, Sales..."}
                      value={hostForm.department}
                      onChange={(e) => setHostForm({ ...hostForm, department: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Designation / Role Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Lead Systems Architect"
                      value={hostForm.designation}
                      onChange={(e) => setHostForm({ ...hostForm, designation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Office / Desk Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Building A, Floor 4 - Room 402"
                      value={hostForm.office_location}
                      onChange={(e) => setHostForm({ ...hostForm, office_location: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Clearance Status</label>
                    <select
                      value={hostForm.status || "ACTIVE"}
                      onChange={(e) => setHostForm({ ...hostForm, status: e.target.value })}
                      style={{ height: "42px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", width: "100%", background: "#fff" }}
                    >
                      <option value="ACTIVE">ACTIVE (Authorized to Receive Visitors)</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Visitor Handling Notes &amp; Guidance</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Notify host via Slack/Teams prior to escorting visitor. Escort required in server room."
                    value={hostForm.notes}
                    onChange={(e) => setHostForm({ ...hostForm, notes: e.target.value })}
                    style={{ width: "100%", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "10px", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>

                <div className="host-modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddHost(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="it-log-recovery-primary-btn" disabled={hostCreating}>
                    {hostCreating ? "Creating..." : "Create Host"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Host Identity Dossier & Full Details Modal (Desktop & Mobile) */}
        {selectedHostDetail && (
          <div className="modal-overlay host-dossier-overlay" onClick={() => setSelectedHostDetail(null)}>
            <div className="modal-content host-dossier-modal" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="modal-header host-dossier-modal-header">
                <div className="host-dossier-header-left">
                  <div className="host-dossier-header-icon">
                    <User size={18} />
                  </div>
                  <div className="host-dossier-header-text">
                    <h3 className="host-dossier-modal-title">Host Identity Dossier &amp; Record</h3>
                    <p className="host-dossier-modal-sub">
                      Authorized internal staff member profile, contact channels &amp; reception guidance
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="host-modal-close-btn"
                  onClick={() => setSelectedHostDetail(null)}
                  title="Close dossier"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="host-dossier-modal-body">
                {/* Profile Hero Card */}
                <div className="host-dossier-profile-card">
                  {/* Top Badges Row */}
                  <div className="host-dossier-profile-badges">
                    <span className="visitor-id-badge">EMP-{selectedHostDetail.employee_id}</span>
                    <span className={`notif-category-badge ${(selectedHostDetail.department || "").toUpperCase() === "IT" ? "badge-it" : "badge-info"}`}>
                      {selectedHostDetail.department || "General"}
                    </span>
                    <span className={`status-pill ${selectedHostDetail.status === "ACTIVE" ? "active" : ""}`}>
                      <span className="status-dot"></span> {selectedHostDetail.status || "ACTIVE"}
                    </span>
                  </div>

                  {/* Main Profile Info */}
                  <div className="host-dossier-profile-main">
                    <div className="host-dossier-avatar-large">
                      {getInitials(`${selectedHostDetail.first_name || ""} ${selectedHostDetail.last_name || ""}`)}
                    </div>
                    <div className="host-dossier-profile-info">
                      <h3 className="host-dossier-name">
                        {selectedHostDetail.first_name} {selectedHostDetail.last_name}
                      </h3>
                      <p className="host-dossier-designation">
                        {selectedHostDetail.designation || "Authorized Organization Staff Host"}
                      </p>
                      <div className="host-dossier-dept-line">
                        <Building2 size={12} />
                        <span>{selectedHostDetail.department || "General"}</span>
                      </div>
                      {selectedHostDetail.office_location && (
                        <div className="host-dossier-loc-box">
                          <MapPin size={12} />
                          <span>{selectedHostDetail.office_location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="host-dossier-grid">
                  {/* Phone */}
                  <div className="host-dossier-field-card">
                    <div className="host-dossier-field-icon blue">
                      <Phone size={16} />
                    </div>
                    <div className="host-dossier-field-content">
                      <span className="host-dossier-label">Phone Number / Mobile</span>
                      <strong className="host-dossier-val">
                        {selectedHostDetail.phone_number || "Not registered"}
                      </strong>
                    </div>
                    {selectedHostDetail.phone_number && (
                      <div className="host-dossier-field-actions">
                        <a
                          href={`tel:${selectedHostDetail.phone_number}`}
                          className="host-dossier-action-pill call"
                          title="Call host"
                        >
                          <Phone size={12} />
                          <span>Call</span>
                        </a>
                        <button
                          type="button"
                          className="host-dossier-action-pill copy"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedHostDetail.phone_number);
                            setCopiedHostContact("phone");
                            setTimeout(() => setCopiedHostContact(""), 2000);
                          }}
                          title="Copy phone number"
                        >
                          {copiedHostContact === "phone" ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedHostContact === "phone" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="host-dossier-field-card">
                    <div className="host-dossier-field-icon purple">
                      <Mail size={16} />
                    </div>
                    <div className="host-dossier-field-content">
                      <span className="host-dossier-label">Corporate Email Address</span>
                      <strong className="host-dossier-val">
                        {selectedHostDetail.email || "Not registered"}
                      </strong>
                    </div>
                    {selectedHostDetail.email && (
                      <div className="host-dossier-field-actions">
                        <a
                          href={`mailto:${selectedHostDetail.email}`}
                          className="host-dossier-action-pill mail"
                          title="Email host"
                        >
                          <Mail size={12} />
                          <span>Email</span>
                        </a>
                        <button
                          type="button"
                          className="host-dossier-action-pill copy"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedHostDetail.email);
                            setCopiedHostContact("email");
                            setTimeout(() => setCopiedHostContact(""), 2000);
                          }}
                          title="Copy email address"
                        >
                          {copiedHostContact === "email" ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedHostContact === "email" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Office / Desk Location */}
                  <div className="host-dossier-field-card">
                    <div className="host-dossier-field-icon amber">
                      <MapPin size={16} />
                    </div>
                    <div className="host-dossier-field-content">
                      <span className="host-dossier-label">Assigned Office / Desk Location</span>
                      <strong className="host-dossier-val">
                        {selectedHostDetail.office_location || "HQ Main Campus / Unassigned"}
                      </strong>
                    </div>
                  </div>

                  {/* Host Authorization Status */}
                  <div className="host-dossier-field-card">
                    <div className="host-dossier-field-icon green">
                      <ShieldCheck size={16} />
                    </div>
                    <div className="host-dossier-field-content">
                      <span className="host-dossier-label">Gate Reception Status</span>
                      <strong className="host-dossier-val" style={{ color: selectedHostDetail.status === "ACTIVE" ? "#059669" : "#dc2626" }}>
                        {selectedHostDetail.status === "ACTIVE" ? "Authorized to Receive Visitors" : "Inactive / On Leave"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Visitor Handling Instructions / Notes Card */}
                <div className="host-dossier-notes-card">
                  <div className="host-dossier-notes-icon">
                    <Info size={16} />
                  </div>
                  <div className="host-dossier-notes-body">
                    <h4 className="host-dossier-notes-title">Visitor Handling &amp; Security Guidance</h4>
                    <p className="host-dossier-notes-text">
                      {selectedHostDetail.notes
                        ? selectedHostDetail.notes
                        : "Standard security protocol applies. Verify visitor identification and confirm badge issuance at the security desk before escorting to host work area."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="modal-footer host-dossier-modal-footer">
                <button
                  type="button"
                  className="host-dossier-primary-btn"
                  onClick={() => {
                    setSelectedHostDetail(null);
                    setCurrentPage(isIT ? "it-pre-approvals" : "pre-approvals");
                  }}
                >
                  <UserPlus size={16} />
                  <span>Schedule Pre-Approval With Host</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderITAssets = () => {
    const assetsList = filteredITAssets;
    const totalCount = itStats?.total_assets || itAssets.length;
    const onPremisesCount = itStats?.on_premises || 0;
    const recoveriesCount = itStats?.recoveries_count || 0;
    const clearedCount = itStats?.cleared_exit || 0;
    const retainedCount = itStats?.retained_it || 0;

    return (
      <>
        {/* Management Header */}
        <div className="it-management-header">
          <div className="it-header-title-box">
            <div className="it-header-badge-row">
              <span className="it-division-pill">IT Asset Division</span>
              <span className="it-telemetry-pill">
                <span className="status-dot"></span>
                Hardware Custody Active
              </span>
            </div>
            <h2 className="it-page-title">Asset Recovery &amp; Hardware Tracking</h2>
            <p className="it-page-desc">
              Trace hardware origin, carrier custody, warranty repairs, and employee offboarding recoveries
            </p>
          </div>

          <div className="it-header-controls">
            <button
              type="button"
              className="it-qr-portal-btn"
              onClick={async () => {
                const itUrl = `${window.location.origin}/it-visit`;
                try {
                  const qr = await QRCode.toDataURL(itUrl, {
                    width: 320,
                    margin: 4,
                    errorCorrectionLevel: "M",
                    color: {
                      dark: "#000000",
                      light: "#ffffff",
                    },
                  });
                  setItPortalQrData(qr);
                } catch (e) {
                  console.error(e);
                }
                setShowITPortalModal(true);
              }}
              title="Show IT Visit Registration Portal QR Code and Link"
            >
              <QrCode size={15} />
              <span>IT Visit Portal QR</span>
            </button>

            <div className="it-header-action-row">
              <button
                type="button"
                className="it-log-recovery-primary-btn"
                onClick={openLogAssetRecovery}
              >
                <PackageCheck size={16} />
                <span>Log Asset Recovery</span>
              </button>

              <button
                type="button"
                className="it-refresh-btn"
                onClick={fetchITAssets}
                disabled={itAssetsLoading}
                title="Refresh IT hardware inventory"
              >
                <RefreshCw size={15} className={itAssetsLoading ? "spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {itAssetsError && (
          <div className="error-banner">
            <XCircle size={16} />
            <div>
              <strong>Failed to fetch IT Assets</strong>
              <div style={{ marginTop: "3px", fontSize: "11px" }}>{itAssetsError}</div>
            </div>
          </div>
        )}

        {/* 4 Interactive Stat Cards */}
        <section className="stats-grid">
          <div
            className={`stat-card clickable ${itCategoryFilter === "all" ? "active-filter filter-blue" : ""}`}
            onClick={() => setItCategoryFilter("all")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setItCategoryFilter("all")}
            title="Click to view all registered IT assets"
          >
            <div className="stat-icon blue">
              <Laptop size={18} />
            </div>
            <div className="stat-content">
              <span>Total Hardware</span>
              <strong>{totalCount}</strong>
              <span className="stat-interactive-hint">
                {itCategoryFilter === "all" ? "● Active View" : "Click to view all"}
              </span>
            </div>
            <ChevronRight size={15} className={`stat-arrow ${itCategoryFilter === "all" ? "arrow-active" : ""}`} />
          </div>

          <div
            className={`stat-card clickable ${itCategoryFilter === "on_premises" ? "active-filter filter-green" : ""}`}
            onClick={() => setItCategoryFilter(itCategoryFilter === "on_premises" ? "all" : "on_premises")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setItCategoryFilter(itCategoryFilter === "on_premises" ? "all" : "on_premises")}
            title="Click to filter devices currently inside premises"
          >
            <div className="stat-icon green">
              <HardDrive size={18} />
            </div>
            <div className="stat-content">
              <span>In Building Custody</span>
              <strong>{onPremisesCount}</strong>
              <span className="stat-interactive-hint">
                {itCategoryFilter === "on_premises" ? "● Active View" : "Active inside"}
              </span>
            </div>
            <ChevronRight size={15} className={`stat-arrow ${itCategoryFilter === "on_premises" ? "arrow-active" : ""}`} />
          </div>

          <div
            className={`stat-card clickable ${itCategoryFilter === "recoveries" ? "active-filter filter-purple" : ""}`}
            onClick={() => setItCategoryFilter(itCategoryFilter === "recoveries" ? "all" : "recoveries")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setItCategoryFilter(itCategoryFilter === "recoveries" ? "all" : "recoveries")}
            title="Click to filter device recoveries, offboarding returns and courier collections"
          >
            <div className="stat-icon purple">
              <Truck size={18} />
            </div>
            <div className="stat-content">
              <span>Device Recoveries</span>
              <strong>{recoveriesCount}</strong>
              <span className="stat-interactive-hint">
                {itCategoryFilter === "recoveries" ? "● Active View" : "Offboarding & returns"}
              </span>
            </div>
            <ChevronRight size={15} className={`stat-arrow ${itCategoryFilter === "recoveries" ? "arrow-active" : ""}`} />
          </div>

          <div
            className={`stat-card clickable ${itCategoryFilter === "cleared" ? "active-filter filter-amber" : ""}`}
            onClick={() => setItCategoryFilter(itCategoryFilter === "cleared" ? "all" : "cleared")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setItCategoryFilter(itCategoryFilter === "cleared" ? "all" : "cleared")}
            title="Click to filter hardware cleared for exit"
          >
            <div className="stat-icon amber">
              <ShieldCheck size={18} />
            </div>
            <div className="stat-content">
              <span>Exit Cleared</span>
              <strong>{clearedCount}</strong>
              <span className="stat-interactive-hint">
                {itCategoryFilter === "cleared" ? "● Active View" : "Authorized to leave"}
              </span>
            </div>
            <ChevronRight size={15} className={`stat-arrow ${itCategoryFilter === "cleared" ? "arrow-active" : ""}`} />
          </div>
        </section>

        {/* Table & Inventory Section */}
        <section className="table-card it-table-card">
          {/* Mobile Search & Action Controls Row (Exact Mockup Match) */}
          {isMobile && (
            <div className="it-mobile-controls-row vms-mobile-only">
            <div className="it-mobile-search-box" style={{ position: "relative", display: "flex", alignItems: "center", flex: 1 }}>
              <Search size={15} className="it-search-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", zIndex: 2 }} />
              <input
                value={itSearchQuery}
                onChange={(e) => setItSearchQuery(e.target.value)}
                placeholder="Search serial, model, carrier, company..."
                className="it-mobile-search-input"
                style={{ width: "100%", height: "42px", paddingLeft: "42px", paddingRight: "38px", borderRadius: "12px", fontSize: "13.5px", boxSizing: "border-box" }}
              />
              {itSearchQuery && (
                <button
                  type="button"
                  className="it-search-clear-btn"
                  onClick={() => setItSearchQuery("")}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="it-mobile-btn-filter"
              onClick={() => setItCategoryFilter(itCategoryFilter === "all" ? "on_premises" : "all")}
              title="Filter by custody status"
            >
              <Filter size={14} />
              <span>Filter</span>
            </button>
            <button
              type="button"
              className="it-mobile-btn-export"
              onClick={() => handleExportHardwareCSV(assetsList)}
              title="Export hardware inventory list"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
          )}

          {!isMobile && (
            <div className="table-toolbar it-table-toolbar-executive vms-desktop-only">
            <div>
              <h2>Hardware Inventory & Custody Tracker</h2>
              <p>
                {itAssetsLoading
                  ? "Loading hardware records..."
                  : `${assetsList.length} hardware item${assetsList.length === 1 ? "" : "s"} found`}
              </p>
            </div>
            <div className="visitor-toolbar-actions it-toolbar-right-actions">
              <div className="search-field it-search-field-executive">
                <Search size={15} />
                <input
                  value={itSearchQuery}
                  onChange={(e) => setItSearchQuery(e.target.value)}
                  placeholder="Search serial, model, carrier, company..."
                />
                {itSearchQuery && (
                  <button
                    type="button"
                    style={{ background: "transparent", border: 0, cursor: "pointer", color: "#94a3b8" }}
                    onClick={() => setItSearchQuery("")}
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="it-toolbar-btn it-filter-btn"
                onClick={() => setItCategoryFilter(itCategoryFilter === "all" ? "on_premises" : "all")}
                title="Filter by custody status"
              >
                <Filter size={14} />
                <span>Filter</span>
              </button>
              <button
                type="button"
                className="it-toolbar-btn it-export-btn"
                onClick={() => handleExportHardwareCSV(assetsList)}
                title="Export hardware inventory list"
              >
                <Download size={14} />
                <span>Export</span>
              </button>
              <button
                type="button"
                className="it-toolbar-btn it-refresh-btn-secondary vms-mobile-only"
                onClick={fetchITAssets}
                disabled={itAssetsLoading}
                title="Refresh hardware inventory"
              >
                <RefreshCw size={14} className={itAssetsLoading ? "spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          )}

          {/* Quick Category Filter Pills */}
          <div className="it-filter-pills-row">
            <button
              type="button"
              className={`it-filter-tab ${itCategoryFilter === "all" ? "active" : ""}`}
              onClick={() => setItCategoryFilter("all")}
            >
              <Package size={12} />
              <span>Assets ({totalCount})</span>
            </button>
            <button
              type="button"
              className={`it-filter-tab ${itCategoryFilter === "on_premises" ? "active" : ""}`}
              onClick={() => setItCategoryFilter("on_premises")}
            >
              <span className="live-dot" style={{ width: 6, height: 6 }}></span>
              <span>On Premises ({onPremisesCount})</span>
            </button>
            <button
              type="button"
              className={`it-filter-tab ${itCategoryFilter === "recoveries" ? "active" : ""}`}
              onClick={() => setItCategoryFilter("recoveries")}
            >
              <Truck size={12} />
              <span>Recoveries &amp; Returns ({recoveriesCount})</span>
            </button>
            <button
              type="button"
              className={`it-filter-tab ${itCategoryFilter === "cleared" ? "active" : ""}`}
              onClick={() => setItCategoryFilter("cleared")}
            >
              <CheckCircle2 size={12} />
              <span>Exit Cleared ({clearedCount})</span>
            </button>
            <button
              type="button"
              className={`it-filter-tab ${itCategoryFilter === "retained" ? "active" : ""}`}
              onClick={() => setItCategoryFilter("retained")}
            >
              <Building2 size={12} />
              <span>In IT Custody ({retainedCount || 1})</span>
            </button>

            {itCategoryFilter !== "all" && (
              <button
                type="button"
                className="clear-filter-btn"
                onClick={() => setItCategoryFilter("all")}
                style={{ marginLeft: "auto" }}
              >
                <X size={12} />
                Reset Filter
              </button>
            )}
          </div>

          {/* Mobile Section Title & Sort Header (Exact Mockup Match) */}
          {isMobile && (
            <div className="it-mobile-section-header vms-mobile-only">
            <div className="it-mobile-section-title-box">
              <h3>Hardware Inventory &amp; Custody Tracker</h3>
              <p>
                {itAssetsLoading
                  ? "Loading hardware records..."
                  : `${assetsList.length} hardware item${assetsList.length === 1 ? "" : "s"} found`}
              </p>
            </div>
            <div className="it-mobile-sort-wrap">
              <button
                type="button"
                className="it-mobile-sort-btn"
                onClick={() => setItSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
                title="Toggle sorting order"
              >
                <ArrowUpDown size={12} />
                <span>{itSortOrder === "oldest" ? "Oldest First" : "Newest First"}</span>
                <ChevronRight size={12} style={{ transform: "rotate(90deg)" }} />
              </button>
            </div>
          </div>
          )}

          {itAssetsLoading ? (
            <div className="empty-state">
              <RefreshCw size={22} className="spin" />
              Loading IT hardware records...
            </div>
          ) : assetsList.length === 0 ? (
            <div className="empty-state" style={{ flexDirection: "column", minHeight: "240px" }}>
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
                  marginBottom: "8px",
                }}
              >
                <Laptop size={26} />
              </div>
              <strong style={{ color: "#344054", fontSize: "14px" }}>
                {itCategoryFilter !== "all"
                  ? `No hardware found matching the selected filter`
                  : "No IT hardware items found"}
              </strong>
              <span style={{ color: "#98a2b3", fontSize: "12px", marginBottom: "14px" }}>
                {itCategoryFilter !== "all"
                  ? "Try resetting the filter or searching for another serial number or person."
                  : "Register an asset recovery or check in a visitor with assets."}
              </span>
              {itCategoryFilter !== "all" ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setItCategoryFilter("all");
                    setItSearchQuery("");
                  }}
                >
                  <RefreshCw size={13} />
                  Show All Assets
                </button>
              ) : (
                <button
                  className="primary-button"
                  onClick={openLogAssetRecovery}
                >
                  <PackageCheck size={14} />
                  Log Asset Recovery
                </button>
              )}
            </div>
          ) : (
            <>
            {!isMobile && (
              <div className="table-wrap vms-desktop-only">
              <table className="it-asset-table it-table-exact-mockup">
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={assetsList.length > 0 && selectedAssetIds.length === assetsList.length}
                        onChange={() => toggleSelectAllAssets(assetsList)}
                        className="vms-checkbox"
                        title="Select all hardware items"
                      />
                    </th>
                    <th>HARDWARE ASSET</th>
                    <th>SERIAL NUMBER / TAG</th>
                    <th>ORIGIN / ORGANIZATION</th>
                    <th>CARRIER / CUSTODIAN</th>
                    <th>RECEIVING IT HOST</th>
                    <th>CUSTODY STATUS</th>
                    <th style={{ textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {assetsList.map((asset) => {
                    const resolvedPhoto = resolvePhotoUrl(asset.photo_url);
                    const carrier = asset.carrier_visitor || {};
                    const host = asset.receiver_host || {};
                    const isInside = asset.custody_status === "ON_PREMISES";
                    const isCleared = asset.is_cleared_for_exit;
                    const isSelected = selectedAssetIds.includes(asset.asset_id);
                    const avatarStyle = getAvatarColorStyle(carrier.name || "Technician");

                    // Clean separation of brand and model:
                    const fullText = (asset.brand_model || asset.asset_type || "Standard Device").trim();
                    let brandTitle = fullText;
                    let modelSub = asset.asset_type || "Hardware";
                    if (fullText.toLowerCase().startsWith("dell poweredge")) {
                      brandTitle = "Dell PowerEdge";
                      modelSub = fullText.slice(14).trim() || "Server Module";
                    } else if (fullText.toLowerCase().startsWith("lenovo thinkpad")) {
                      brandTitle = "Lenovo ThinkPad";
                      modelSub = fullText.slice(15).trim() || "Laptop";
                    } else if (fullText.includes(" ")) {
                      const firstSpace = fullText.indexOf(" ");
                      brandTitle = fullText.slice(0, firstSpace);
                      modelSub = fullText.slice(firstSpace + 1);
                    }

                    return (
                      <tr key={asset.asset_id} className={`${isInside ? "row-asset-inside" : ""} ${isSelected ? "row-selected" : ""}`}>
                        {/* Checkbox Column */}
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectAsset(asset.asset_id)}
                            className="vms-checkbox"
                          />
                        </td>

                        {/* Column 1: Hardware Asset */}
                        <td>
                          <div className="it-asset-cell it-cell-brand-block">
                            <div
                              className="it-asset-thumb it-asset-square-thumb"
                              onClick={() => setSelectedAssetDetail(asset)}
                              title={resolvedPhoto ? "Click to view asset photo" : "No photo registered"}
                            >
                              {resolvedPhoto ? (
                                <img
                                  src={resolvedPhoto}
                                  alt={brandTitle}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : null}
                              <Laptop size={18} className="it-asset-icon-fallback" />
                            </div>
                            <div className="it-asset-name-col">
                              <strong className="it-asset-brand-title">{brandTitle}</strong>
                              <span className="it-asset-model-subtitle">{modelSub}</span>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Serial Number / Tag */}
                        <td>
                          <div className="it-serial-pill-badge" title={`Serial Tag: ${asset.serial_number || "None"}`}>
                            <span className="it-serial-code">{asset.serial_number || "DELHI"}</span>
                          </div>
                        </td>

                        {/* Column 3: Origin / Organization */}
                        <td>
                          <div className="it-origin-cell">
                            <div className="it-company-tag">
                              <Building2 size={13} className="it-org-icon" />
                              <strong className="it-org-name">{carrier.company || "IT"}</strong>
                            </div>
                            <span className="it-location-line" title={carrier.origin_address}>
                              <MapPin size={11} className="it-pin-icon" />
                              {carrier.city || carrier.state
                                ? `${carrier.city || ""}, ${carrier.state || ""}`.replace(/^, |, $/g, "")
                                : carrier.origin_address || "DELHI, DELHI"}
                            </span>
                          </div>
                        </td>

                        {/* Column 4: Carrier / Custodian */}
                        <td>
                          <div className="it-carrier-cell">
                            <div
                              className="it-carrier-avatar it-avatar-initials-circle"
                              style={{
                                background: avatarStyle.bg,
                                color: avatarStyle.color,
                                border: avatarStyle.border,
                              }}
                            >
                              <span>{getInitials(carrier.name || "Sahil Singh")}</span>
                            </div>
                            <div className="it-carrier-info">
                              <strong className="it-carrier-name">{carrier.name || "Sahil Singh"}</strong>
                              <span className="it-carrier-contact">
                                {carrier.phone || carrier.email || "2345678987654"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Column 5: Receiving IT Host */}
                        <td>
                          <div className="it-host-cell-badge">
                            <span className="it-host-square-tag">IT</span>
                            <strong className="it-host-name">{host.name || "Akhil Raina"}</strong>
                          </div>
                        </td>

                        {/* Column 6: Custody Status */}
                        <td>
                          {isCleared ? (
                            <span className="it-status-badge cleared" title={`Cleared by ${asset.cleared_by || "Security"}`}>
                              <CheckCircle2 size={12} />
                              <span>Exit Cleared</span>
                            </span>
                          ) : isInside ? (
                            <span className="it-status-badge onsite" title="Hardware is on premises">
                              <span className="live-dot" style={{ width: 6, height: 6 }}></span>
                              <span>In Premises</span>
                            </span>
                          ) : (
                            <span className="it-status-badge custody" title="Hardware in IT custody">
                              <ShieldCheck size={12} />
                              <span>In IT Custody</span>
                            </span>
                          )}
                        </td>

                        {/* Column 7: Actions */}
                        <td style={{ textAlign: "right" }}>
                          <div className="it-table-actions it-actions-exact-row" style={{ justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="it-btn-dossier"
                              onClick={() => setSelectedAssetDetail(asset)}
                              title="View full chain-of-custody dossier"
                            >
                              <Eye size={13} />
                              <span>Dossier</span>
                            </button>

                            {!isCleared && (
                              <button
                                type="button"
                                className="it-btn-clear-exit"
                                onClick={() => handleClearAssetFromIT(asset.asset_id)}
                                title="Authorize exit clearance"
                              >
                                <ShieldCheck size={13} />
                                <span>Clear Exit</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="it-btn-more-options"
                              onClick={() => setPrintableAssetReceipt(asset)}
                              title="More actions / Print gate clearance slip"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            )}

            {/* MOBILE HARDWARE ASSET CARDS (Exact Match to Uploaded Mockup) */}
            {isMobile && (
              <div className="vms-mobile-asset-cards vms-mobile-only">
              {assetsList.map((asset) => {
                const { title, subtitle, serial, iconCategory } = getAssetDisplayInfo(asset);
                const carrier = asset.carrier_visitor || {};
                const host = asset.receiver_host || {};
                const isCleared = asset.is_cleared_for_exit;
                const isInside = asset.custody_status === "ON_PREMISES";
                const isRetained = asset.custody_status === "RETAINED_BY_IT" || (!isCleared && !isInside);

                const orgName = carrier.company || asset.declared_organization || "IT";
                const orgLoc = carrier.city || carrier.state
                  ? `${carrier.city || ""}, ${carrier.state || ""}`.replace(/^, |, $/g, "")
                  : (carrier.origin_address || "New Delhi, Delhi");
                const carrierName = carrier.name || "sahil singh";
                const carrierPhone = carrier.phone || carrier.email || "2345678987654";
                const hostName = host.name || "Akhil Raina";
                const carrierInitials = getInitials(carrierName);

                return (
                  <div key={asset.asset_id} className="vms-m-asset-card">
                    {/* 1. Top Row: Icon + Title/Sub + Status Pill + Menu */}
                    <div className="vms-m-asset-card-top">
                      <div className={`vms-m-asset-icon-box ${iconCategory}`}>
                        {iconCategory === "laptop" ? (
                          <Laptop size={18} />
                        ) : iconCategory === "software" ? (
                          <FileText size={18} />
                        ) : iconCategory === "server" ? (
                          <Server size={18} />
                        ) : iconCategory === "switch" ? (
                          <HardDrive size={18} />
                        ) : iconCategory === "mobile" ? (
                          <Smartphone size={18} />
                        ) : (
                          <Package size={18} />
                        )}
                      </div>

                      <div className="vms-m-asset-info">
                        <h4 className="vms-m-asset-title">{title}</h4>
                        <div className="vms-m-asset-sub-line">
                          <span className="vms-m-asset-sub">{subtitle}</span>
                          <span className="vms-m-asset-badge-tag">{serial}</span>
                        </div>
                      </div>

                      <div className="vms-m-asset-top-right">
                        {isCleared ? (
                          <span className="vms-m-asset-status-pill cleared">
                            <CheckCircle2 size={12} />
                            <span>Exit Cleared</span>
                          </span>
                        ) : isInside ? (
                          <span className="vms-m-asset-status-pill onsite">
                            <span className="live-dot" style={{ width: 6, height: 6 }}></span>
                            <span>On Premises</span>
                          </span>
                        ) : (
                          <span className="vms-m-asset-status-pill custody">
                            <Building2 size={12} />
                            <span>In IT Custody</span>
                          </span>
                        )}

                        <button
                          type="button"
                          className="vms-m-asset-options-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintableAssetReceipt(asset);
                          }}
                          title="More options / Print gate slip"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    {/* 2. Middle 3-Column Metadata Row */}
                    <div className="vms-m-asset-meta-row">
                      <div className="vms-m-asset-meta-col">
                        <div className="vms-m-asset-meta-header">
                          <Building2 size={11} className="vms-m-meta-icon" />
                          <span>Organization</span>
                        </div>
                        <strong className="vms-m-asset-meta-val">{orgName}</strong>
                        <span className="vms-m-asset-meta-sub">{orgLoc}</span>
                      </div>

                      <div className="vms-m-asset-meta-col">
                        <div className="vms-m-asset-meta-header">
                          <User size={11} className="vms-m-meta-icon" />
                          <span>Carrier / Custodian</span>
                        </div>
                        <div className="vms-m-asset-carrier-val">
                          {carrierInitials && carrierInitials !== "SS" && (
                            <span className="vms-m-asset-avatar-circle">{carrierInitials}</span>
                          )}
                          <strong className="vms-m-asset-meta-val">{carrierName}</strong>
                        </div>
                        <span className="vms-m-asset-meta-sub">{carrierPhone}</span>
                      </div>

                      <div className="vms-m-asset-meta-col">
                        <div className="vms-m-asset-meta-header">
                          <UserCheck size={11} className="vms-m-meta-icon" />
                          <span>Receiving IT Host</span>
                        </div>
                        <div className="vms-m-asset-host-val">
                          <span className="vms-m-asset-host-tag">IT</span>
                          <strong className="vms-m-asset-meta-val">{hostName}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 3. Bottom Actions Row */}
                    <div className="vms-m-asset-actions-row">
                      <button
                        type="button"
                        className="vms-m-asset-btn-dossier"
                        onClick={() => setSelectedAssetDetail(asset)}
                      >
                        <Eye size={13} />
                        <span>Dossier</span>
                      </button>

                      {!isCleared ? (
                        <button
                          type="button"
                          className="vms-m-asset-btn-clear"
                          onClick={() => handleClearAssetFromIT(asset.asset_id)}
                        >
                          <CheckCircle2 size={13} />
                          <span>Clear Exit</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="vms-m-asset-btn-more-options"
                          onClick={() => setPrintableAssetReceipt(asset)}
                          title="More actions / Print gate slip"
                        >
                          <MoreVertical size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </>
          )}
        </section>

        {/* MODAL 1: EXECUTIVE IT ASSET DOSSIER */}
        {selectedAssetDetail && (
          <div className="modal-overlay" onClick={() => setSelectedAssetDetail(null)}>
            <div className="it-dossier-modal" onClick={(e) => e.stopPropagation()}>
              <div className="it-dossier-header">
                <div className="it-dossier-header-title">
                  <div className="it-dossier-icon">
                    <Laptop size={22} />
                  </div>
                  <div className="it-dossier-title-col">
                    <h3>{selectedAssetDetail.brand_model || "Hardware Asset"}</h3>
                    <div className="it-dossier-meta">
                      <span className="it-badge-blue">{selectedAssetDetail.asset_type}</span>
                      <span className="it-serial-chip">SN: {selectedAssetDetail.serial_number || "N/A"}</span>
                      {selectedAssetDetail.is_recovery && (
                        <span className="it-recovery-badge">Hardware Recovery</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedAssetDetail(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="it-dossier-body">
                {/* Left Column: Photo & Hardware Specs */}
                <div className="it-dossier-left">
                  <div className="it-photo-frame">
                    {resolvePhotoUrl(selectedAssetDetail.photo_url) ? (
                      <img
                        src={resolvePhotoUrl(selectedAssetDetail.photo_url)}
                        alt={selectedAssetDetail.brand_model}
                      />
                    ) : (
                      <div className="it-photo-placeholder">
                        <Laptop size={48} color="#94a3b8" />
                        <span>No Hardware Photo Uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="it-info-card">
                    <h4>HARDWARE SPECIFICATIONS</h4>
                    <div className="it-info-row">
                      <span>Asset Type:</span>
                      <strong>{selectedAssetDetail.asset_type}</strong>
                    </div>
                    <div className="it-info-row">
                      <span>Brand / Model:</span>
                      <strong>{selectedAssetDetail.brand_model || "Standard"}</strong>
                    </div>
                    <div className="it-info-row">
                      <span>Serial Number:</span>
                      <strong className="it-mono">{selectedAssetDetail.serial_number || "N/A"}</strong>
                    </div>
                    <div className="it-info-row">
                      <span>Asset ID:</span>
                      <span className="it-id-small">{selectedAssetDetail.asset_id}</span>
                    </div>
                  </div>

                  <div className={`it-clearance-card ${selectedAssetDetail.is_cleared_for_exit ? "cleared" : "pending"}`}>
                    <div className="it-clearance-status-row">
                      {selectedAssetDetail.is_cleared_for_exit ? (
                        <>
                          <CheckCircle2 size={18} color="#059669" />
                          <div>
                            <strong>EXIT AUTHORIZED</strong>
                            <span>Cleared by {selectedAssetDetail.cleared_by || "Security"}</span>
                            {selectedAssetDetail.cleared_at && (
                              <small>{new Date(selectedAssetDetail.cleared_at).toLocaleString()}</small>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={18} color="#d97706" />
                          <div>
                            <strong>PENDING EXIT CLEARANCE</strong>
                            <span>Asset currently held in organization custody</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Origin Trace & Custody Chain */}
                <div className="it-dossier-right">
                  {/* Origin: Where are they coming from */}
                  <div className="it-dossier-section-box">
                    <div className="it-box-title">
                      <MapPin size={16} color="#2563eb" />
                      <h4>WHERE IS THE ASSET COMING FROM? (ORIGIN TRACE)</h4>
                    </div>
                    <div className="it-box-content">
                      <div className="it-origin-field">
                        <span>Source Organization / Company:</span>
                        <div className="it-origin-val company">
                          <Building2 size={14} />
                          <strong>{selectedAssetDetail.carrier_visitor?.company || "Individual / Remote Employee"}</strong>
                        </div>
                      </div>
                      <div className="it-origin-field">
                        <span>Origin Address / Location:</span>
                        <div className="it-origin-val address">
                          {selectedAssetDetail.carrier_visitor?.origin_address || "No origin address recorded on visitor dossier."}
                        </div>
                      </div>
                      <div className="it-origin-tags">
                        {selectedAssetDetail.carrier_visitor?.city && (
                          <span className="it-tag-pill">City: {selectedAssetDetail.carrier_visitor.city}</span>
                        )}
                        {selectedAssetDetail.carrier_visitor?.state && (
                          <span className="it-tag-pill">State: {selectedAssetDetail.carrier_visitor.state}</span>
                        )}
                        {selectedAssetDetail.carrier_visitor?.country && (
                          <span className="it-tag-pill">Country: {selectedAssetDetail.carrier_visitor.country}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Person Collecting / Delivering */}
                  <div className="it-dossier-section-box">
                    <div className="it-box-title">
                      <Users size={16} color="#7c3aed" />
                      <h4>WHICH PERSON IS COMING TO COLLECT / DELIVER?</h4>
                    </div>
                    <div className="it-box-content">
                      <div className="it-carrier-profile-card">
                        <div className="it-carrier-modal-avatar">
                          {selectedAssetDetail.carrier_visitor?.photo_url ? (
                            <img
                              src={resolvePhotoUrl(selectedAssetDetail.carrier_visitor.photo_url)}
                              alt="Carrier"
                            />
                          ) : (
                            getInitials(selectedAssetDetail.carrier_visitor?.name || "Carrier")
                          )}
                        </div>
                        <div>
                          <strong>{selectedAssetDetail.carrier_visitor?.name || "Carrier Person"}</strong>
                          <span className="it-carrier-sub">
                            Visitor ID: #{selectedAssetDetail.carrier_visitor?.visitor_id || "N/A"}
                          </span>
                          <div className="it-carrier-links">
                            <span>Phone: <strong>{selectedAssetDetail.carrier_visitor?.phone || "—"}</strong></span>
                            <span>Email: <strong>{selectedAssetDetail.carrier_visitor?.email || "—"}</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="it-purpose-callout">
                        <span>Handover / Visit Purpose:</span>
                        <p>{selectedAssetDetail.visit?.purpose || "Hardware handover / visit"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Receiving IT Staff / Host */}
                  <div className="it-dossier-section-box">
                    <div className="it-box-title">
                      <Laptop size={16} color="#059669" />
                      <h4>RECEIVING IT CUSTODIAN & HOST</h4>
                    </div>
                    <div className="it-box-content it-grid-two">
                      <div>
                        <span>IT Custodian:</span>
                        <strong>{selectedAssetDetail.receiver_host?.name || "IT Staff"}</strong>
                      </div>
                      <div>
                        <span>Department:</span>
                        <strong className="it-dept-badge">{selectedAssetDetail.receiver_host?.department || "IT Department"}</strong>
                      </div>
                      <div>
                        <span>Host Email:</span>
                        <span>{selectedAssetDetail.receiver_host?.email || "—"}</span>
                      </div>
                      <div>
                        <span>Check-In Time:</span>
                        <span>
                          {selectedAssetDetail.visit?.check_in_time
                            ? new Date(selectedAssetDetail.visit.check_in_time).toLocaleString()
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dossier Footer Actions */}
              <div className="it-dossier-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPrintableAssetReceipt(selectedAssetDetail)}
                >
                  <Printer size={14} />
                  Print Recovery Gatepass
                </button>

                {!selectedAssetDetail.is_cleared_for_exit && (
                  <button
                    type="button"
                    className="primary-button it-clear-btn"
                    onClick={() => handleClearAssetFromIT(selectedAssetDetail.asset_id)}
                  >
                    <ShieldCheck size={14} />
                    Authorize Exit Clearance
                  </button>
                )}

                <button
                  type="button"
                  className="back-button"
                  onClick={() => setSelectedAssetDetail(null)}
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: LOG NEW ASSET RECOVERY */}
        {showAddRecoveryModal && (
          <div className="modal-overlay" onClick={() => setShowAddRecoveryModal(false)}>
            <div className="it-recovery-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>Log IT Asset Recovery & Handover</h3>
                  <p>Register incoming/outgoing hardware recovery, employee offboarding, or repair custody</p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => {
                    stopITCamera();
                    setShowAddRecoveryModal(false);
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateRecovery}>
                <div className="modal-body it-form-body">
                  {recoveryError && (
                    <div className="error-banner" style={{ marginBottom: "16px" }}>
                      <XCircle size={15} />
                      {recoveryError}
                    </div>
                  )}

                  {/* Carrier Mode Toggle */}
                  <div className="form-field form-field-full">
                    <label>Carrier / Person Delivering or Collecting</label>
                    <div className="it-carrier-toggle">
                      <button
                        type="button"
                        className={`it-toggle-btn ${newRecoveryForm.carrier_type === "new" ? "active" : ""}`}
                        onClick={() => setNewRecoveryForm({ ...newRecoveryForm, carrier_type: "new" })}
                      >
                        Enter New Person / Carrier Details
                      </button>
                      <button
                        type="button"
                        className={`it-toggle-btn ${newRecoveryForm.carrier_type === "existing" ? "active" : ""}`}
                        onClick={() => setNewRecoveryForm({ ...newRecoveryForm, carrier_type: "existing" })}
                      >
                        Select Registered Visitor ({visitorList.length})
                      </button>
                    </div>
                  </div>

                  {newRecoveryForm.carrier_type === "existing" ? (
                    <div className="form-field form-field-full">
                      <label>Select Registered Visitor <span>*</span></label>
                      <select
                        value={newRecoveryForm.visitor_id}
                        onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, visitor_id: e.target.value })}
                        required
                      >
                        <option value="">-- Choose a registered visitor --</option>
                        {visitorList.map((v) => (
                          <option key={v.visitor_id} value={v.visitor_id}>
                            #{v.visitor_id} {v.first_name} {v.last_name} ({v.company_name || "Individual"}) - {v.phone_number}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="form-grid-two">
                        <div className="form-field">
                          <label>First Name <span>*</span></label>
                          <input
                            type="text"
                            placeholder="Enter carrier first name"
                            value={newRecoveryForm.first_name}
                            onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, first_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label>Last Name</label>
                          <input
                            type="text"
                            placeholder="Enter carrier last name"
                            value={newRecoveryForm.last_name}
                            onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, last_name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-grid-two">
                        <div className="form-field">
                          <label>Phone Number <span>*</span></label>
                          <input
                            type="tel"
                            placeholder="e.g. +91 9876543210"
                            value={newRecoveryForm.phone_number}
                            onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, phone_number: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label>Email Address</label>
                          <input
                            type="email"
                            placeholder="carrier@company.com"
                            value={newRecoveryForm.email}
                            onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-field form-field-full">
                        <label>Source Organization / Company (Where is it coming from?)</label>
                        <input
                          type="text"
                          placeholder="e.g. BlueDart Logistics, Remote Employee, Tech Services Inc."
                          value={newRecoveryForm.company_name}
                          onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, company_name: e.target.value })}
                        />
                      </div>

                      <div className="form-grid-three">
                        <div className="form-field">
                          <label>Origin Address</label>
                          <input
                            type="text"
                            placeholder="Street / Office branch"
                            value={newRecoveryForm.address_line1}
                            onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, address_line1: e.target.value })}
                          />
                        </div>
                        <div className="form-field">
                          <label>City</label>
                          <input
                            type="text"
                            placeholder="e.g. Delhi, Mumbai"
                            value={newRecoveryForm.city}
                            onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, city: e.target.value })}
                          />
                        </div>
                        <div className="form-field">
                          <label>State</label>
                          <input
                            type="text"
                            placeholder="e.g. Delhi, Haryana"
                            value={newRecoveryForm.state}
                            onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, state: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <hr className="it-divider" />

                  {/* Hardware Details */}
                  <div className="form-grid-three">
                    <div className="form-field">
                      <label>Asset Type <span>*</span></label>
                      <select
                        value={newRecoveryForm.asset_type}
                        onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, asset_type: e.target.value })}
                        required
                      >
                        <option value="Laptop">Laptop</option>
                        <option value="Desktop">Desktop Workstation</option>
                        <option value="Mobile Phone">Mobile Phone / Smartphone</option>
                        <option value="Tablet">Tablet / iPad</option>
                        <option value="Monitor">External Monitor / Display</option>
                        <option value="Hard Drive">Storage Drive / External SSD</option>
                        <option value="Network Device">Router / Switch / Firewall</option>
                        <option value="Other">Other IT Equipment</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Brand & Model <span>*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Dell Latitude 5420, Apple MacBook M3"
                        value={newRecoveryForm.brand_model}
                        onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, brand_model: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Serial Number / Asset Tag</label>
                      <input
                        type="text"
                        placeholder="e.g. SN-8839-DL"
                        value={newRecoveryForm.serial_number}
                        onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, serial_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid-two">
                    <div className="form-field">
                      <label>Receiving IT Staff / Host Employee <span>*</span></label>
                      <select
                        value={newRecoveryForm.host_employee_id}
                        onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, host_employee_id: e.target.value })}
                        required
                      >
                        <option value="">-- Select IT Staff / Host --</option>
                        {hostList.map((h) => (
                          <option key={h.employee_id} value={h.employee_id}>
                            {h.first_name} {h.last_name} ({h.department || "IT"}) - {h.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Recovery Reason / Handover Purpose <span>*</span></label>
                      <select
                        value={newRecoveryForm.recovery_reason}
                        onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, recovery_reason: e.target.value })}
                      >
                        <option value="Employee Offboarding Asset Recovery - Device Collection">
                          Employee Offboarding - Device Recovery
                        </option>
                        <option value="Hardware Warranty Repair & Service Return">
                          Hardware Warranty Repair & Service Return
                        </option>
                        <option value="IT Asset Refresh & Upgrade Swap">
                          IT Asset Refresh & Upgrade Swap
                        </option>
                        <option value="Temporary Secure Custody & Safe Deposit">
                          Temporary Secure Custody / Safe Deposit
                        </option>
                        <option value="Courier / Logistics Recovery Handover">
                          Courier / Logistics Recovery Handover
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Asset Photo Capture / Upload */}
                  <div className="form-field form-field-full">
                    <label>Hardware Photo (Verification Proof)</label>
                    <div className="it-photo-uploader">
                      {newRecoveryForm.photo_data ? (
                        <div className="it-photo-preview-wrap">
                          <img src={newRecoveryForm.photo_data} alt="Asset Preview" />
                          <button
                            type="button"
                            className="it-retake-btn"
                            onClick={() => setNewRecoveryForm({ ...newRecoveryForm, photo_data: null })}
                          >
                            <X size={13} />
                            Remove Photo
                          </button>
                        </div>
                      ) : itCameraActive ? (
                        <div className="it-camera-active-box">
                          <video ref={itCameraVideoRef} autoPlay playsInline muted />
                          <div className="it-camera-actions">
                            <button type="button" className="primary-button" onClick={captureITPhoto}>
                              <Camera size={14} />
                              Snap Photo
                            </button>
                            <button type="button" className="back-button" onClick={stopITCamera}>
                              Cancel Camera
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="it-camera-options-row">
                          <button type="button" className="secondary-button" onClick={startITCamera}>
                            <Camera size={14} />
                            Open Camera
                          </button>
                          <label className="secondary-button it-file-btn">
                            <FileText size={14} />
                            Upload Image File
                            <input type="file" accept="image/*" onChange={handleITFileUpload} style={{ display: "none" }} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clearance Option */}
                  <div className="form-field form-field-full">
                    <label className="it-checkbox-label">
                      <input
                        type="checkbox"
                        checked={newRecoveryForm.is_cleared_for_exit}
                        onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, is_cleared_for_exit: e.target.checked })}
                      />
                      <span>Pre-authorize Exit Clearance immediately (carrier is taking asset out)</span>
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="back-button"
                    onClick={() => {
                      stopITCamera();
                      setShowAddRecoveryModal(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={recoverySubmitting}
                  >
                    {recoverySubmitting ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <PackageCheck size={14} />
                        Log Asset Recovery
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: PRINTABLE IT ASSET RECOVERY & CUSTODY PASS */}
        {printableAssetReceipt && (
          <div className="modal-overlay" onClick={() => setPrintableAssetReceipt(null)}>
            <div className="it-print-modal" onClick={(e) => e.stopPropagation()}>
              <div className="printable-pass-sheet">
                <div className="pass-print-header">
                  <div className="pass-print-logo">
                    <ShieldCheck size={28} color="#2563eb" />
                    <div>
                      <h2>ENTERPRISE IT ASSET RECOVERY & CUSTODY PASS</h2>
                      <span>Official Security & Hardware Custody Authorization</span>
                    </div>
                  </div>
                  <div className="pass-print-badge">
                    <span>STATUS</span>
                    <strong>{printableAssetReceipt.is_cleared_for_exit ? "EXIT AUTHORIZED" : "IN CUSTODY"}</strong>
                  </div>
                </div>

                <div className="pass-print-grid">
                  <div className="pass-print-col">
                    <h3>HARDWARE IDENTIFICATION</h3>
                    <div className="pass-meta-row">
                      <span>Asset Type:</span>
                      <strong>{printableAssetReceipt.asset_type}</strong>
                    </div>
                    <div className="pass-meta-row">
                      <span>Brand / Model:</span>
                      <strong>{printableAssetReceipt.brand_model || "Standard"}</strong>
                    </div>
                    <div className="pass-meta-row">
                      <span>Serial Number:</span>
                      <strong className="it-mono-large">{printableAssetReceipt.serial_number || "N/A"}</strong>
                    </div>
                    <div className="pass-meta-row">
                      <span>Pass Token ID:</span>
                      <small>{printableAssetReceipt.asset_id}</small>
                    </div>
                  </div>

                  <div className="pass-print-col">
                    <h3>ORIGIN & RECOVERY CONTEXT</h3>
                    <div className="pass-meta-row">
                      <span>Where Coming From:</span>
                      <strong>{printableAssetReceipt.carrier_visitor?.company || "Individual / Remote"}</strong>
                    </div>
                    <div className="pass-meta-row">
                      <span>Origin Location:</span>
                      <strong>{printableAssetReceipt.carrier_visitor?.origin_address || "On Record"}</strong>
                    </div>
                    <div className="pass-meta-row">
                      <span>Recovery Reason:</span>
                      <strong>{printableAssetReceipt.visit?.purpose || "Hardware Recovery"}</strong>
                    </div>
                  </div>
                </div>

                <div className="pass-print-grid" style={{ marginTop: "14px" }}>
                  <div className="pass-print-col">
                    <h3>CARRIER / PERSON HANDLING</h3>
                    <div className="pass-meta-row">
                      <span>Carrier Name:</span>
                      <strong>{printableAssetReceipt.carrier_visitor?.name || "Carrier"}</strong>
                    </div>
                    <div className="pass-meta-row">
                      <span>Contact Phone:</span>
                      <strong>{printableAssetReceipt.carrier_visitor?.phone || "—"}</strong>
                    </div>
                    <div className="pass-meta-row">
                      <span>Email:</span>
                      <span>{printableAssetReceipt.carrier_visitor?.email || "—"}</span>
                    </div>
                  </div>

                  <div className="pass-print-col">
                    <h3>IT CUSTODIAN & CLEARANCE</h3>
                    <div className="pass-meta-row">
                      <span>Receiving IT Staff:</span>
                      <strong>{printableAssetReceipt.receiver_host?.name || "IT Support"}</strong>
                    </div>
                    <div className="pass-meta-row">
                      <span>Department:</span>
                      <strong>{printableAssetReceipt.receiver_host?.department || "IT"}</strong>
                    </div>
                    <div className="pass-meta-row">
                      <span>Clearance Authority:</span>
                      <strong>{printableAssetReceipt.cleared_by || "Pending Exit Authorization"}</strong>
                    </div>
                  </div>
                </div>

                <div className="pass-print-footer">
                  <div className="pass-signature-box">
                    <div className="sig-line"></div>
                    <span>Carrier / Collector Signature</span>
                  </div>
                  <div className="pass-signature-box">
                    <div className="sig-line"></div>
                    <span>IT Department Receiver Signature</span>
                  </div>
                  <div className="pass-signature-box">
                    <div className="sig-line"></div>
                    <span>Security Gate Clearance Stamp</span>
                  </div>
                </div>
              </div>

              <div className="it-print-modal-actions no-print">
                <button type="button" className="primary-button" onClick={() => window.print()}>
                  <Printer size={15} />
                  Print Custody Pass
                </button>
                <button type="button" className="back-button" onClick={() => setPrintableAssetReceipt(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: IT VISIT PORTAL QR & DIRECT LINK */}
        {showITPortalModal && (
          <div className="modal-overlay" onClick={() => setShowITPortalModal(false)}>
            <div
              className="it-dossier-modal"
              style={{ maxWidth: 480, textAlign: "center" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="it-dossier-header">
                <div className="it-dossier-header-title">
                  <div className="it-dossier-icon">
                    <Server size={22} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <h3>IT Visit Registration Portal</h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                      Scan or share this link for technical contractors &amp; IT visits
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowITPortalModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: "24px 20px" }}>
                {itPortalQrData ? (
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "16px",
                      borderRadius: "14px",
                      display: "inline-block",
                      border: "2px solid #e2e8f0",
                      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
                    }}
                  >
                    <img
                      src={itPortalQrData}
                      alt="IT Portal QR"
                      style={{ width: 220, height: 220, display: "block" }}
                    />
                  </div>
                ) : null}

                <div style={{ marginTop: "18px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "650",
                      color: "#475569",
                      display: "block",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Dedicated IT Portal Address:
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      readOnly
                      value={`${window.location.origin}/it-visit`}
                      style={{
                        padding: "9px 12px",
                        fontSize: "12.5px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        width: "250px",
                        background: "#f8fafc",
                        color: "#0f172a",
                        fontWeight: "500",
                      }}
                    />
                    <button
                      type="button"
                      className="primary-button"
                      style={{ padding: "9px 14px", fontSize: "12.5px" }}
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/it-visit`);
                        setCopiedITUrl(true);
                        setTimeout(() => setCopiedITUrl(false), 2000);
                      }}
                    >
                      {copiedITUrl ? (
                        <>
                          <Check size={13} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copy Link
                        </>
                      )}
                    </button>
                    <a
                      href="/it-visit"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-button"
                      style={{
                        padding: "9px 14px",
                        fontSize: "12.5px",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      Open Portal ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  /* =========================================================
     PAGE: LOG ASSET RECOVERY (DEDICATED FULL VIEW)
  ========================================================= */
  const renderLogAssetRecovery = () => {
    return (
      <div className="it-log-recovery-view">
        <div className="it-management-header">
          <div className="it-header-title-box">
            <div className="it-header-badge-row">
              <span className="it-division-pill">IT Hardware Custody</span>
              <span className="it-telemetry-pill">
                <span className="status-dot"></span>
                IT Chain of Custody Active
              </span>
            </div>
            <h2 className="it-page-title">Log Asset Recovery &amp; Custody Handover</h2>
            <p className="it-page-desc">
              Enterprise IT Infrastructure · Secure Hardware Handover, Offboarding Recovery &amp; Diagnostic Custody
            </p>
          </div>
          <div className="it-header-controls">
            <button type="button" className="it-qr-portal-btn" onClick={openITAssets}>
              <ArrowLeft size={15} />
              <span>Back to IT Assets</span>
            </button>
          </div>
        </div>

        <div className="it-recovery-page-body">
          {recoveryError && (
            <div className="error-banner" style={{ marginBottom: "20px" }}>
              <XCircle size={16} />
              <span>{recoveryError}</span>
            </div>
          )}

          <form onSubmit={handleCreateRecovery} className="it-recovery-main-form">
            {/* STEP 1: CARRIER IDENTIFICATION */}
            <div className="it-form-section-card">
              <div className="it-section-card-header">
                <div className="it-step-number">1</div>
                <div>
                  <h3 className="it-section-title">Carrier &amp; Custody Handover Identification</h3>
                  <p className="it-section-subtitle">
                    Identify the carrier, logistics agent, or employee delivering or collecting company hardware
                  </p>
                </div>
              </div>

              <div className="it-section-card-body">
                <div className="form-field form-field-full">
                  <label className="it-field-label">Carrier Source Mode</label>
                  <div className="it-carrier-toggle">
                    <button
                      type="button"
                      className={`it-toggle-btn ${newRecoveryForm.carrier_type === "new" ? "active" : ""}`}
                      onClick={() => setNewRecoveryForm({ ...newRecoveryForm, carrier_type: "new" })}
                    >
                      <UserPlus size={14} style={{ marginRight: "6px" }} />
                      Register New Person / Carrier Details
                    </button>
                    <button
                      type="button"
                      className={`it-toggle-btn ${newRecoveryForm.carrier_type === "existing" ? "active" : ""}`}
                      onClick={() => setNewRecoveryForm({ ...newRecoveryForm, carrier_type: "existing" })}
                    >
                      <Users size={14} style={{ marginRight: "6px" }} />
                      Select Registered Visitor ({visitorList.length})
                    </button>
                  </div>
                </div>

                {newRecoveryForm.carrier_type === "existing" ? (
                  <div className="form-field form-field-full" style={{ marginTop: "14px" }}>
                    <label className="it-field-label">
                      Select Registered Visitor <span className="req-star">*</span>
                    </label>
                    <select
                      className="it-select-input"
                      value={newRecoveryForm.visitor_id}
                      onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, visitor_id: e.target.value })}
                      required
                    >
                      <option value="">-- Choose a registered visitor from database --</option>
                      {visitorList.map((v) => (
                        <option key={v.visitor_id} value={v.visitor_id}>
                          #{v.visitor_id} {v.first_name} {v.last_name} ({v.company_name || "Individual"}) — {v.phone_number}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ marginTop: "14px" }}>
                    <div className="form-grid-two">
                      <div className="form-field">
                        <label className="it-field-label">
                          First Name <span className="req-star">*</span>
                        </label>
                        <input
                          type="text"
                          className="it-text-input"
                          placeholder="e.g. Rahul"
                          value={newRecoveryForm.first_name}
                          onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label className="it-field-label">Last Name</label>
                        <input
                          type="text"
                          className="it-text-input"
                          placeholder="e.g. Sharma"
                          value={newRecoveryForm.last_name}
                          onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-grid-two">
                      <div className="form-field">
                        <label className="it-field-label">
                          Mobile Phone Number <span className="req-star">*</span>
                        </label>
                        <input
                          type="tel"
                          className="it-text-input"
                          placeholder="e.g. +91 98765 43210"
                          value={newRecoveryForm.phone_number}
                          onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, phone_number: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label className="it-field-label">Corporate / Work Email</label>
                        <input
                          type="email"
                          className="it-text-input"
                          placeholder="carrier@company.com"
                          value={newRecoveryForm.email}
                          onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-field form-field-full">
                      <label className="it-field-label">
                        Source Organization / Vendor / Branch (Origin)
                      </label>
                      <input
                        type="text"
                        className="it-text-input"
                        placeholder="e.g. BlueDart Logistics, Remote Employee Branch, Dell Service Hub"
                        value={newRecoveryForm.company_name}
                        onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, company_name: e.target.value })}
                      />
                    </div>

                    <div className="form-field form-field-full">
                      <label className="it-field-label">Origin Address</label>
                      <input
                        type="text"
                        className="it-text-input"
                        placeholder="Street, Office Branch or Wing"
                        value={newRecoveryForm.address_line1}
                        onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, address_line1: e.target.value })}
                      />
                    </div>

                    <div className="form-grid-two">
                      <div className="form-field">
                        <label className="it-field-label">City</label>
                        <input
                          type="text"
                          className="it-text-input"
                          placeholder="e.g. Bengaluru, Delhi"
                          value={newRecoveryForm.city}
                          onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, city: e.target.value })}
                        />
                      </div>
                      <div className="form-field">
                        <label className="it-field-label">State / Province</label>
                        <input
                          type="text"
                          className="it-text-input"
                          placeholder="e.g. Karnataka, Delhi"
                          value={newRecoveryForm.state}
                          onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, state: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: HARDWARE DETAILS */}
            <div className="it-form-section-card">
              <div className="it-section-card-header">
                <div className="it-step-number">2</div>
                <div>
                  <h3 className="it-section-title">Hardware Specifications &amp; Serial Tagging</h3>
                  <p className="it-section-subtitle">
                    Register hardware asset category, model designation, and equipment serial tracking ID
                  </p>
                </div>
              </div>

              <div className="it-section-card-body">
                <div className="form-grid-two">
                  <div className="form-field">
                    <label className="it-field-label">
                      Asset Type <span className="req-star">*</span>
                    </label>
                    <select
                      className="it-select-input"
                      value={newRecoveryForm.asset_type}
                      onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, asset_type: e.target.value })}
                      required
                    >
                      <option value="Laptop">Laptop Workstation</option>
                      <option value="Desktop">Desktop PC / Workstation</option>
                      <option value="Mobile Phone">Mobile Phone / Smartphone</option>
                      <option value="Tablet">Tablet / iPad</option>
                      <option value="Monitor">External Monitor / Display</option>
                      <option value="Hard Drive">Storage Drive / External SSD</option>
                      <option value="Network Device">Router / Switch / Firewall</option>
                      <option value="Diagnostic Tool">Diagnostic Tool / Test Set</option>
                      <option value="Other">Other IT Hardware</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="it-field-label">
                      Manufacturer &amp; Model <span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="it-text-input"
                      placeholder="e.g. Dell Latitude 5430, Apple MacBook Pro M3"
                      value={newRecoveryForm.brand_model}
                      onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, brand_model: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-field form-field-full">
                  <label className="it-field-label">
                    Serial Number / Asset Tag Code
                  </label>
                  <input
                    type="text"
                    className="it-text-input it-code-font"
                    placeholder="e.g. SN-8839-DL, TAG-IT-004"
                    value={newRecoveryForm.serial_number}
                    onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, serial_number: e.target.value })}
                  />
                  <small className="it-field-hint">Crucial for security gate scan and automated clearance</small>
                </div>
              </div>
            </div>

            {/* STEP 3: IT CUSTODIAN & RECOVERY REASON */}
            <div className="it-form-section-card">
              <div className="it-section-card-header">
                <div className="it-step-number">3</div>
                <div>
                  <h3 className="it-section-title">IT Custodian &amp; Clearance Scope</h3>
                  <p className="it-section-subtitle">
                    Assign the internal IT employee supervising custody and specify handover workflow
                  </p>
                </div>
              </div>

              <div className="it-section-card-body">
                <div className="form-grid-two">
                  <div className="form-field">
                    <label className="it-field-label">
                      Receiving IT Custodian / Host Employee <span className="req-star">*</span>
                    </label>
                    <select
                      className="it-select-input"
                      value={newRecoveryForm.host_employee_id}
                      onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, host_employee_id: e.target.value })}
                      required
                    >
                      <option value="">-- Select IT Staff Member / Host --</option>
                      {hostList.map((h) => (
                        <option key={h.employee_id} value={h.employee_id}>
                          {h.first_name} {h.last_name} ({h.department || "IT"}) — {h.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="it-field-label">
                      Recovery Reason / Handover Classification <span className="req-star">*</span>
                    </label>
                    <select
                      className="it-select-input"
                      value={newRecoveryForm.recovery_reason}
                      onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, recovery_reason: e.target.value })}
                    >
                      <option value="Employee Offboarding Asset Recovery - Device Collection">
                        Employee Offboarding - Device Recovery
                      </option>
                      <option value="Hardware Warranty Repair &amp; Service Return">
                        Hardware Warranty Repair &amp; Service Return
                      </option>
                      <option value="IT Asset Refresh &amp; Upgrade Swap">
                        IT Asset Refresh &amp; Upgrade Swap
                      </option>
                      <option value="Temporary Secure Custody &amp; Safe Deposit">
                        Temporary Secure Custody / Safe Deposit
                      </option>
                      <option value="Courier / Logistics Recovery Handover">
                        Courier / Logistics Recovery Handover
                      </option>
                      <option value="Diagnostic Equipment / Vendor Return">
                        Diagnostic Equipment / Vendor Return
                      </option>
                    </select>
                  </div>
                </div>

                <div className="it-clearance-box" style={{ marginTop: "18px" }}>
                  <label className="it-clearance-checkbox-label">
                    <input
                      type="checkbox"
                      checked={newRecoveryForm.is_cleared_for_exit}
                      onChange={(e) => setNewRecoveryForm({ ...newRecoveryForm, is_cleared_for_exit: e.target.checked })}
                    />
                    <div>
                      <div className="it-clearance-title">
                        Pre-Authorize Security Gate Exit Clearance Immediately
                      </div>
                      <div className="it-clearance-desc">
                        Mark this hardware as cleared for transport off corporate premises. Gate security will verify against this registration without secondary manual clearance tickets.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* STEP 4: HARDWARE PHOTO VERIFICATION PROOF */}
            <div className="it-form-section-card">
              <div className="it-section-card-header">
                <div className="it-step-number">4</div>
                <div>
                  <h3 className="it-section-title">Physical Hardware Verification Proof (Photo)</h3>
                  <p className="it-section-subtitle">
                    Attach or capture a high-clarity photo of the equipment or asset serial barcode tag
                  </p>
                </div>
              </div>

              <div className="it-section-card-body">
                <div className="it-photo-uploader">
                  {newRecoveryForm.photo_data ? (
                    <div className="it-photo-preview-card">
                      <img src={newRecoveryForm.photo_data} alt="Asset Hardware Preview" />
                      <div className="it-photo-preview-details">
                        <span className="it-photo-status">
                          <CheckCircle2 size={14} color="#10b981" /> Photo captured &amp; attached to custody record
                        </span>
                        <button
                          type="button"
                          className="it-retake-btn"
                          onClick={() => setNewRecoveryForm({ ...newRecoveryForm, photo_data: null })}
                        >
                          <X size={13} />
                          Remove / Retake Photo
                        </button>
                      </div>
                    </div>
                  ) : itCameraActive ? (
                    <div className="it-camera-active-box">
                      <video ref={itCameraVideoRef} autoPlay playsInline muted />
                      <div className="it-camera-actions">
                        <button type="button" className="primary-button" onClick={captureITPhoto}>
                          <Camera size={14} />
                          Capture Frame
                        </button>
                        <button type="button" className="back-button" onClick={stopITCamera}>
                          Cancel Camera
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="it-camera-options-row">
                      <button type="button" className="secondary-button it-action-btn" onClick={startITCamera}>
                        <Camera size={16} />
                        Open Web Camera
                      </button>
                      <label className="secondary-button it-file-btn it-action-btn">
                        <FileText size={16} />
                        Upload Image File
                        <input type="file" accept="image/*" onChange={handleITFileUpload} style={{ display: "none" }} />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMIT ACTIONS BAR */}
            <div className="it-form-actions-bar">
              <div className="it-compliance-note">
                <ShieldCheck size={16} color="#0284c7" />
                <span>ISO 27001 IT Physical Asset Custody Protocol · An instant digital custody pass will be generated</span>
              </div>
              <div className="it-actions-buttons">
                <button
                  type="button"
                  className="back-button"
                  onClick={() => {
                    stopITCamera();
                    openITAssets();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button it-submit-btn"
                  disabled={recoverySubmitting}
                >
                  {recoverySubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      Registering Asset Recovery...
                    </>
                  ) : (
                    <>
                      <PackageCheck size={16} />
                      Register Asset Recovery &amp; Issue Pass
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  /* =========================================================
     APP SHELL RENDER
  ========================================================= */
  if (!authToken || !currentUser) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  // Security guards must not have full access to VMS - redirect immediately to their standalone Gate Terminal
  if (currentUser?.role === "SECURITY") {
    window.location.replace("/guard");
    return null;
  }

  return (
    <div className="app-shell">
      {/* Floating Enterprise Real-Time Alert */}
      {liveToast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 99999,
            background: "#0f172a",
            color: "#ffffff",
            padding: "16px 20px",
            borderRadius: "12px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            maxWidth: "420px",
            animation: "slideInRight 0.3s ease",
          }}
        >
          <Bell size={20} color="#38bdf8" style={{ marginTop: "2px", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#f8fafc", marginBottom: "4px" }}>
              {liveToast.title}
            </div>
            <div style={{ fontSize: "12.5px", color: "#cbd5e1", lineHeight: "1.4" }}>
              {liveToast.message}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLiveToast(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "2px",
              marginLeft: "4px",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* MOBILE / TABLET TOP APP BAR */}
      <header className="mobile-topbar">
        <div className="mobile-topbar-left">
          <button
            type="button"
            className="mobile-topbar-menu-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
          <div className="mobile-topbar-divider" />
          <div className="mobile-topbar-brand-text" onClick={openDashboard} role="button" tabIndex={0}>
            <span className="mobile-brand-title">VMS</span>
            <span className="mobile-brand-sub">Visitor Management</span>
          </div>
        </div>
        <div className="mobile-topbar-actions">
          <button
            type="button"
            className="mobile-topbar-action-btn"
            onClick={() => setCurrentPage("notifications")}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {(generalUnreadCount + itUnreadCount) > 0 && (
              <span className="mobile-badge">
                {(generalUnreadCount + itUnreadCount) > 99 ? "99+" : (generalUnreadCount + itUnreadCount)}
              </span>
            )}
          </button>
          <button
            type="button"
            className="mobile-topbar-settings-btn"
            onClick={() => setSettingsModalOpen(true)}
            aria-label="Settings"
            title="System Settings"
          >
            <Settings size={20} />
          </button>
          <div
            className="mobile-topbar-logo-btn"
            onClick={() => setSettingsModalOpen(true)}
            role="button"
            tabIndex={0}
            title={currentUser?.email || "Account Settings"}
          >
            <img src="/vms-logo.png" alt="VMS User" />
          </div>
        </div>
      </header>

      

      {/* MOBILE BACKDROP OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR NAVIGATION DRAWER */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-header-left">
            <div className="brand-icon">
              <img src="/vms-logo.png" alt="VMS Logo" />
            </div>
            <div className="brand-text">
              <h1>VMS</h1>
              <span>Visitor Management</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* ACTIVE ROLE BANNER PILL */}
        <div className="sidebar-role-indicator">
          {activeRole === "ADMIN" && (
            <div className="sidebar-role-pill role-pill-admin" title="Admin">
              <ShieldCheck size={14} />
              <span>Admin</span>
            </div>
          )}
          {activeRole === "MANAGEMENT" && (
            <div className="sidebar-role-pill role-pill-management" title="Management">
              <Building2 size={14} />
              <span>Management</span>
            </div>
          )}
          {(activeRole === "IT_COVERYOU" || activeRole === "IT") && (
            <div className="sidebar-role-pill role-pill-it" title="IT coveryou">
              <Laptop size={14} />
              <span>IT coveryou</span>
            </div>
          )}
        </div>

        <div className="sidebar-nav-scroll">
          {hasSecurityAccess && (
            <div className="sidebar-section">
              <p className="sidebar-label">SECURITY</p>
              <button
                className={`sidebar-item ${currentPage === "dashboard" || currentPage === "visitor-pass-detail" ? "active" : ""}`}
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
          )}

          {hasManagementAccess && (
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
                General Pre-Approvals
                {generalPreApprovalPendingCount > 0 && (
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
                    {generalPreApprovalPendingCount}
                  </span>
                )}
              </button>

              <button
                className={`sidebar-item ${currentPage === "notifications" ? "active" : ""}`}
                onClick={() => setCurrentPage("notifications")}
              >
                <Bell size={14} />
                Notifications
                {generalUnreadCount > 0 && (
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
                    {generalUnreadCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {hasITAccess && (
            <div className="sidebar-section">
              <p className="sidebar-label">IT DEPARTMENT</p>
              <button
                className={`sidebar-item ${currentPage === "it-assets" ? "active" : ""}`}
                onClick={openITAssets}
              >
                <Laptop size={14} />
                Asset Recovery &amp; Tracking
              </button>
              <button
                className={`sidebar-item ${currentPage === "log-recovery" ? "active" : ""}`}
                onClick={openLogAssetRecovery}
              >
                <PackageCheck size={14} />
                Log Asset Recovery
              </button>
              <button
                className={`sidebar-item ${currentPage === "it-hosts" ? "active" : ""}`}
                onClick={() => {
                  setCurrentPage("it-hosts");
                  fetchHosts();
                }}
              >
                <UserCheck size={14} />
                IT Host
              </button>
              <button
                className={`sidebar-item ${currentPage === "it-pre-approvals" ? "active" : ""}`}
                onClick={() => setCurrentPage("it-pre-approvals")}
              >
                <Laptop size={14} />
                IT Pre-Approvals
                {itPreApprovalPendingCount > 0 && (
                  <span
                    className="notification-count"
                    style={{
                      background: "#7c3aed",
                      color: "white",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      marginLeft: "auto",
                    }}
                  >
                    {itPreApprovalPendingCount}
                  </span>
                )}
              </button>
              <button
                className={`sidebar-item ${currentPage === "it-visitors" ? "active" : ""}`}
                onClick={() => setCurrentPage("it-visitors")}
              >
                <Users size={14} />
                IT Visitors
              </button>
              <button
                className={`sidebar-item ${currentPage === "it-notifications" ? "active" : ""}`}
                onClick={() => setCurrentPage("it-notifications")}
              >
                <BellRing size={14} />
                IT Notifications
                {itUnreadCount > 0 && (
                  <span
                    className="notification-count"
                    style={{
                      background: "#7c3aed",
                      color: "white",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      marginLeft: "auto",
                    }}
                  >
                    {itUnreadCount}
                  </span>
                )}
              </button>
              <button
                className={`sidebar-item ${currentPage === "it-checkout-history" ? "active" : ""}`}
                onClick={() => {
                  setCurrentPage("it-checkout-history");
                  fetchCheckoutHistory();
                }}
              >
                <History size={14} />
                IT Checkout History
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-bottom">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
            <button
              type="button"
              className="sidebar-settings-btn"
              onClick={() => setSettingsModalOpen(true)}
              title="Account & System Settings"
              style={{ flex: 1 }}
            >
              <div className="sidebar-settings-left">
                <div className="profile-avatar-small">
                  {currentUser?.first_name ? currentUser.first_name[0].toUpperCase() : "AD"}
                </div>
                <div className="sidebar-settings-info">
                  <span className="sidebar-settings-name">
                    {currentUser?.first_name
                      ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
                      : currentUser?.email?.split("@")[0] || "Administrator"}
                  </span>
                  <span className="sidebar-settings-role">
                    <span className="online-dot-mini"></span> {currentUser?.role || "ADMIN"}
                  </span>
                </div>
              </div>
              <div className="sidebar-settings-icon-wrap">
                <Settings size={16} />
              </div>
            </button>

            <button
              type="button"
              className="sidebar-theme-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <div className="main-content">
        {currentPage === "dashboard" && renderDashboard()}
        {currentPage === "notifications" && renderNotifications()}
        {currentPage === "it-notifications" && renderITNotifications()}
        {currentPage === "scanner" && renderScanner()}
        {currentPage === "hosts" && renderHosts(false)}
        {currentPage === "it-hosts" && renderHosts(true)}

        {currentPage === "pre-approvals" && (
          <PreApprovals
            onBack={openDashboard}
            onNotification={addNotification}
            onVisitCheckedIn={() => {
              fetchDashboard();
              fetchGlobalPreApprovals();
            }}
            onPreApprovalChange={fetchGlobalPreApprovals}
            filterToday={preApprovalTodayOnly}
            onShowAll={() => setPreApprovalTodayOnly(false)}
          />
        )}

        {currentPage === "it-pre-approvals" && (
          <ITPreApprovals
            onBack={openDashboard}
            onNotification={addNotification}
            onPreApprovalChange={fetchGlobalPreApprovals}
          />
        )}

        {currentPage === "it-visitors" && (
          <ITVisitors
            onBack={openDashboard}
            onNotification={addNotification}
            onOpenScanner={openScanner}
          />
        )}

        {currentPage === "visitors" && renderVisitors()}
        {currentPage === "checkout" && renderCheckout()}
        {currentPage === "visitor-pass-detail" && renderVisitorPassDetail()}

        {currentPage === "checkout-history" && (
          renderCheckoutHistory()
        )}
        {currentPage === "it-checkout-history" && (
          renderITCheckoutHistory()
        )}

        {currentPage === "it-assets" && renderITAssets()}
        {currentPage === "log-recovery" && renderLogAssetRecovery()}

        {currentPage === "create" && (
          <CreateVisit
            onBack={openDashboard}
            onCreated={() => {
              fetchDashboard();
            }}
            onNotification={addNotification}
          />
        )}

        {/* High-Resolution Inspection Lightbox Modal */}
        {assetLightbox && (
          <div
            className="vms-lightbox-overlay"
            onClick={() => setAssetLightbox(null)}
          >
            <div className="vms-lightbox-card" onClick={(e) => e.stopPropagation()}>
              <div className="vms-lightbox-header">
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#ffffff", fontWeight: 700 }}>
                    {assetLightbox.title || "Hardware Asset Inspection"}
                  </h4>
                  {assetLightbox.subtitle && (
                    <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#94a3b8" }}>
                      {assetLightbox.subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAssetLightbox(null)}
                  className="vms-lightbox-close"
                  title="Close viewer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="vms-lightbox-image-wrap">
                <img
                  src={assetLightbox.url}
                  alt="Enlarged inspection preview"
                  className="vms-lightbox-img"
                />
              </div>
              <div className="vms-lightbox-footer">
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Press Esc or click outside to dismiss
                </span>
                <button
                  type="button"
                  className="primary-button"
                  style={{ padding: "6px 14px", fontSize: "12px" }}
                  onClick={() => window.open(assetLightbox.url, "_blank")}
                >
                  <ExternalLink size={13} /> Open Original in New Tab
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account & System Settings Modal */}
        {settingsModalOpen && (
          <div
            className="vms-settings-backdrop"
            onClick={() => setSettingsModalOpen(false)}
          >
            {/* DESKTOP SETTINGS MODAL */}
            <div
              className="vms-settings-modal vms-desktop-only"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="vms-settings-header">
                <div className="vms-settings-header-left">
                  <div className="vms-settings-header-icon">
                    <Settings size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
                      Account &amp; System Settings
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                      Security credentials, gate station telemetry, and session management
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="vms-settings-close-btn"
                  onClick={() => setSettingsModalOpen(false)}
                  title="Close settings"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="vms-settings-body">
                {/* SECTION 1: USER PROFILE & IDENTITY */}
                <div className="vms-settings-section">
                  <div className="vms-settings-section-title">
                    <User size={14} color="#2563eb" /> Security Officer Identity
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #e2e8f0" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        color: "#ffffff",
                        fontWeight: 800,
                        fontSize: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                        flexShrink: 0,
                      }}
                    >
                      {currentUser?.first_name ? currentUser.first_name[0].toUpperCase() : "AD"}
                    </div>
                    <div>
                      <strong style={{ fontSize: "15px", color: "#0f172a", display: "block" }}>
                        {currentUser?.first_name
                          ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
                          : currentUser?.email?.split("@")[0] || "Administrator"}
                      </strong>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {currentUser?.email || "admin@vms.local"}
                      </span>
                    </div>
                    <span
                      style={{
                        marginLeft: "auto",
                        background: "#ecfdf5",
                        color: "#059669",
                        border: "1px solid #a7f3d0",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span className="online-dot-mini"></span> Active Session
                    </span>
                  </div>

                  <div className="vms-settings-field-row">
                    <span className="vms-settings-field-label">Assigned Role</span>
                    <span className="vms-settings-field-val">
                      <span
                        style={{
                          background: "#eef2ff",
                          color: "#4338ca",
                          border: "1px solid #c7d2fe",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 800,
                        }}
                      >
                        {currentUser?.role || "ADMIN"}
                      </span>
                    </span>
                  </div>

                  <div className="vms-settings-field-row">
                    <span className="vms-settings-field-label">Access Clearance</span>
                    <span className="vms-settings-field-val" style={{ color: "#059669" }}>
                      <CheckCircle2 size={14} /> Full Gate &amp; Administration Clearance
                    </span>
                  </div>
                </div>

                {/* SECTION 2: STATION & GATE TELEMETRY */}
                <div className="vms-settings-section">
                  <div className="vms-settings-section-title">
                    <ShieldCheck size={14} color="#059669" /> Station &amp; System Configuration
                  </div>

                  <div className="vms-settings-field-row">
                    <span className="vms-settings-field-label">Gate Access Terminal</span>
                    <span className="vms-settings-field-val">MAIN GATE 01 · Primary Desk</span>
                  </div>

                  <div className="vms-settings-field-row">
                    <span className="vms-settings-field-label">Telemetry Status</span>
                    <span className="vms-settings-field-val" style={{ color: "#059669" }}>
                      <span className="online-dot-mini"></span> Live Polling Connected
                    </span>
                  </div>

                  <div className="vms-settings-field-row">
                    <span className="vms-settings-field-label">Hardware Barcode Scanner</span>
                    <span className="vms-settings-field-val">Webcam &amp; Optical QR Active</span>
                  </div>

                  <div className="vms-settings-field-row">
                    <span className="vms-settings-field-label">System Version</span>
                    <span className="vms-settings-field-val">VMS Enterprise 2.4.0 (Build 2026.10)</span>
                  </div>
                </div>

                {/* SECTION: THEME & DISPLAY PREFERENCES */}
                <div className="vms-settings-section">
                  <div className="vms-settings-section-title">
                    {theme === "dark" ? <Moon size={14} color="#818cf8" /> : <Sun size={14} color="#f59e0b" />} Portal Appearance &amp; Theme
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                    <button
                      type="button"
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: theme === "light" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                        background: theme === "light" ? "#eff6ff" : "transparent",
                        color: theme === "light" ? "#1d4ed8" : "#64748b",
                        fontWeight: 750,
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => setTheme("light")}
                    >
                      <Sun size={16} color="#d97706" />
                      <span>Light Mode</span>
                      {theme === "light" && <Check size={14} color="#2563eb" />}
                    </button>

                    <button
                      type="button"
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: theme === "dark" ? "2px solid #6366f1" : "1px solid #334155",
                        background: theme === "dark" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                        color: theme === "dark" ? "#a5b4fc" : "#64748b",
                        fontWeight: 750,
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => setTheme("dark")}
                    >
                      <Moon size={16} color="#818cf8" />
                      <span>Dark Mode</span>
                      {theme === "dark" && <Check size={14} color="#6366f1" />}
                    </button>
                  </div>
                </div>

                {/* SECTION: SYSTEM PREFERENCES & QUICK LINKS */}
                <div className="vms-settings-section">
                  <div className="vms-settings-section-title">
                    <Building2 size={14} color="#7c3aed" /> Portal Shortcuts &amp; Kiosks
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                    <button
                      type="button"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#334155",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => window.open("/register-visitor", "_blank")}
                      title="Open Public Visitor Registration Kiosk in new tab"
                    >
                      <ExternalLink size={13} color="#2563eb" />
                      <span>Visitor Kiosk</span>
                    </button>

                    <button
                      type="button"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#334155",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => window.open("/it-visit", "_blank")}
                      title="Open IT Technical Visit Registration in new tab"
                    >
                      <ExternalLink size={13} color="#7c3aed" />
                      <span>IT Visit Kiosk</span>
                    </button>

                    <button
                      type="button"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#334155",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => window.open("/guard", "_blank")}
                      title="Open Security Guard Gate Terminal in new tab"
                    >
                      <ExternalLink size={13} color="#059669" />
                      <span>Guard Terminal</span>
                    </button>

                    <button
                      type="button"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#334155",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => {
                        fetchDashboard();
                        showToast?.("Dashboard telemetry refreshed.");
                        setSettingsModalOpen(false);
                      }}
                      title="Force refresh all portal data"
                    >
                      <RefreshCw size={13} color="#0284c7" />
                      <span>Sync Telemetry</span>
                    </button>
                  </div>
                </div>

                {/* SECTION 4: SESSION CONTROLS & LOGOUT */}
                <div className="vms-settings-section" style={{ borderColor: "#fecaca", background: "#fff5f5" }}>
                  <div className="vms-settings-section-title" style={{ color: "#b91c1c" }}>
                    <LogOut size={14} color="#dc2626" /> Session Security
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#7f1d1d" }}>
                    Signed in as <strong>{currentUser?.email || "rainaakhil15"}</strong>. Ending this session will revoke current access tokens and redirect to the login screen.
                  </p>
                  <button
                    type="button"
                    className="vms-settings-btn-logout"
                    onClick={() => {
                      setSettingsModalOpen(false);
                      handleLogout();
                    }}
                    title="Sign out of VMS System"
                  >
                    <LogOut size={16} />
                    <span>Sign Out of VMS Session</span>
                  </button>
                </div>
              </div>
            </div>

            {/* MOBILE MOCKUP 12: PROFILE / SETTINGS SCREEN */}
            <div
              className="vms-mockup-profile-modal vms-mobile-only"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mockup-profile-header">
                <button
                  type="button"
                  className="mockup-profile-back-btn"
                  onClick={() => {
                    if (settingsSubView !== "main") {
                      setSettingsSubView("main");
                      setPassMsg({ type: "", text: "" });
                    } else {
                      setSettingsModalOpen(false);
                    }
                  }}
                  aria-label={settingsSubView !== "main" ? "Back to Settings" : "Close"}
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="mockup-profile-brand">
                  <div className="brand-icon mobile-brand-icon" style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <img src="/vms-logo.png" alt="VMS Logo" style={{ width: 22, height: 22, objectFit: "contain" }} />
                  </div>
                  <span>VMS</span>
                </div>
                <button
                  type="button"
                  className="mockup-profile-close-btn"
                  onClick={() => {
                    setSettingsModalOpen(false);
                    setSettingsSubView("main");
                    setPassMsg({ type: "", text: "" });
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mockup-profile-scroll-body">
                {settingsSubView === "main" && (
                  <>
                    {/* Large Profile Card */}
                    <div className="mockup-profile-hero-card">
                      <div className="mockup-profile-hero-avatar">
                        {userInitials}
                      </div>
                      <h3 className="mockup-profile-hero-name">
                        {currentUser?.first_name
                          ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
                          : currentUser?.email?.split("@")[0] || "Akhil Raina"}
                      </h3>
                      <p className="mockup-profile-hero-dept">
                        {currentUser?.department || currentUser?.role || "IT Department"}
                      </p>
                      <p className="mockup-profile-hero-email">
                        {currentUser?.email || "akhil.raina@mistjammu.in"}
                      </p>
                    </div>

                    {/* Settings Options List */}
                    <div className="mockup-profile-menu-card">
                      <div
                        className="mockup-menu-row"
                        onClick={() => setSettingsSubView("profile")}
                      >
                        <div className="mockup-menu-row-left">
                          <User size={18} className="mockup-menu-icon" />
                          <span>My Profile</span>
                        </div>
                        <ChevronRight size={16} className="mockup-menu-chevron" />
                      </div>

                      <div
                        className="mockup-menu-row"
                        onClick={() => {
                          setPassForm({ current: "", next: "", confirm: "" });
                          setPassMsg({ type: "", text: "" });
                          setSettingsSubView("password");
                        }}
                      >
                        <div className="mockup-menu-row-left">
                          <Lock size={18} className="mockup-menu-icon" />
                          <span>Change Password</span>
                        </div>
                        <ChevronRight size={16} className="mockup-menu-chevron" />
                      </div>

                      <div
                        className="mockup-menu-row"
                        onClick={() => setSettingsSubView("notifications")}
                      >
                        <div className="mockup-menu-row-left">
                          <Bell size={18} className="mockup-menu-icon" />
                          <span>Notification Settings</span>
                        </div>
                        <ChevronRight size={16} className="mockup-menu-chevron" />
                      </div>

                      <div className="mockup-menu-row" onClick={toggleTheme}>
                        <div className="mockup-menu-row-left">
                          {theme === "dark" ? (
                            <Sun size={18} className="mockup-menu-icon" />
                          ) : (
                            <Moon size={18} className="mockup-menu-icon" />
                          )}
                          <span>Theme</span>
                        </div>
                        <div className="mockup-menu-row-right">
                          <span className="mockup-theme-indicator">
                            {theme === "dark" ? "Dark" : "Light"}
                          </span>
                          <ChevronRight size={16} className="mockup-menu-chevron" />
                        </div>
                      </div>

                      <div
                        className="mockup-menu-row"
                        onClick={() => setSettingsSubView("help")}
                      >
                        <div className="mockup-menu-row-left">
                          <HelpCircle size={18} className="mockup-menu-icon" />
                          <span>Help &amp; Support</span>
                        </div>
                        <ChevronRight size={16} className="mockup-menu-chevron" />
                      </div>
                    </div>

                    {/* Soft Red Logout Button */}
                    <button
                      type="button"
                      className="mockup-profile-logout-btn"
                      onClick={() => {
                        setSettingsModalOpen(false);
                        setSettingsSubView("main");
                        handleLogout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </>
                )}

                {/* SUBVIEW 1: MY PROFILE */}
                {settingsSubView === "profile" && (
                  <div className="mockup-subview-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "14px" }}>
                      <div className="mockup-profile-hero-avatar" style={{ width: 52, height: 52, fontSize: 18, margin: 0 }}>
                        {userInitials}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                          {currentUser?.first_name
                            ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
                            : currentUser?.email?.split("@")[0] || "Akhil Raina"}
                        </h4>
                        <span style={{ display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8" }}>
                          {activeRole}
                        </span>
                      </div>
                    </div>

                    <div className="mockup-profile-kv-row">
                      <span className="mockup-profile-kv-label">Email Address</span>
                      <span className="mockup-profile-kv-value">
                        <Mail size={14} color="#64748b" />
                        {currentUser?.email || "it.coveryou@vms.com"}
                      </span>
                    </div>

                    <div className="mockup-profile-kv-row">
                      <span className="mockup-profile-kv-label">Department</span>
                      <span className="mockup-profile-kv-value">
                        <Building2 size={14} color="#64748b" />
                        {currentUser?.department || currentUser?.role || "IT Department"}
                      </span>
                    </div>

                    <div className="mockup-profile-kv-row">
                      <span className="mockup-profile-kv-label">Security Identifier</span>
                      <span className="mockup-profile-kv-value">
                        <Shield size={14} color="#64748b" />
                        UID: #{currentUser?.user_id || 7}
                      </span>
                    </div>

                    <div className="mockup-profile-kv-row">
                      <span className="mockup-profile-kv-label">Account Clearance Status</span>
                      <span className="mockup-profile-kv-value" style={{ color: "#16a34a" }}>
                        <CheckCircle2 size={15} color="#16a34a" />
                        Active &amp; Authenticated
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                      <button
                        type="button"
                        className="mockup-btn-primary"
                        onClick={() => {
                          setPassForm({ current: "", next: "", confirm: "" });
                          setPassMsg({ type: "", text: "" });
                          setSettingsSubView("password");
                        }}
                      >
                        <Lock size={15} />
                        <span>Change Password</span>
                      </button>
                      <button
                        type="button"
                        className="mockup-btn-secondary"
                        onClick={() => setSettingsSubView("main")}
                      >
                        <ArrowLeft size={15} />
                        <span>Back to Settings</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBVIEW 2: CHANGE PASSWORD */}
                {settingsSubView === "password" && (
                  <form className="mockup-subview-card" onSubmit={handlePasswordSubmit}>
                    <h4 className="mockup-subview-title">
                      <Lock size={18} color="#2563eb" />
                      <span>Change Password</span>
                    </h4>
                    <p className="mockup-subview-desc">
                      Enter your current password and set a secure new password for your VMS account.
                    </p>

                    {passMsg.text && (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: passMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                          color: passMsg.type === "success" ? "#166534" : "#991b1b",
                          border: `1px solid ${passMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                        }}
                      >
                        {passMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        <span>{passMsg.text}</span>
                      </div>
                    )}

                    <div className="mockup-form-group">
                      <label className="mockup-form-label">Current Password</label>
                      <div className="mockup-input-wrapper">
                        <input
                          type={passShow ? "text" : "password"}
                          className="mockup-input"
                          placeholder="Enter current password"
                          value={passForm.current}
                          onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="mockup-input-icon-btn"
                          onClick={() => setPassShow(!passShow)}
                          aria-label="Toggle password visibility"
                        >
                          {passShow ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="mockup-form-group">
                      <label className="mockup-form-label">New Password (min 6 chars)</label>
                      <div className="mockup-input-wrapper">
                        <input
                          type={passShow ? "text" : "password"}
                          className="mockup-input"
                          placeholder="Enter new password"
                          value={passForm.next}
                          onChange={(e) => setPassForm({ ...passForm, next: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="mockup-form-group">
                      <label className="mockup-form-label">Confirm New Password</label>
                      <div className="mockup-input-wrapper">
                        <input
                          type={passShow ? "text" : "password"}
                          className="mockup-input"
                          placeholder="Re-enter new password"
                          value={passForm.confirm}
                          onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                      <button
                        type="submit"
                        className="mockup-btn-primary"
                        disabled={passLoading}
                      >
                        {passLoading ? <RefreshCw size={15} className="spin" /> : <CheckCircle2 size={15} />}
                        <span>{passLoading ? "Updating Password..." : "Save New Password"}</span>
                      </button>
                      <button
                        type="button"
                        className="mockup-btn-secondary"
                        onClick={() => {
                          setSettingsSubView("main");
                          setPassMsg({ type: "", text: "" });
                        }}
                      >
                        <ArrowLeft size={15} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* SUBVIEW 3: NOTIFICATION SETTINGS */}
                {settingsSubView === "notifications" && (
                  <div className="mockup-subview-card">
                    <h4 className="mockup-subview-title">
                      <Bell size={18} color="#2563eb" />
                      <span>Notification Settings</span>
                    </h4>
                    <p className="mockup-subview-desc">
                      Configure your real-time mobile security alerts and visitor notifications.
                    </p>

                    <div className="mockup-toggle-row">
                      <div className="mockup-toggle-info">
                        <span className="mockup-toggle-title">Visitor Arrival Alerts</span>
                        <span className="mockup-toggle-desc">Instant alerts when expected guests check in at the reception desk.</span>
                      </div>
                      <label className="mockup-switch">
                        <input
                          type="checkbox"
                          checked={mobileNotifPrefs.emailAlerts}
                          onChange={() => handleUpdateNotifPref("emailAlerts")}
                        />
                        <span className="mockup-slider" />
                      </label>
                    </div>

                    <div className="mockup-toggle-row">
                      <div className="mockup-toggle-info">
                        <span className="mockup-toggle-title">Emergency Gate Alarms</span>
                        <span className="mockup-toggle-desc">High-priority broadcasts for gate alerts and unauthorized entries.</span>
                      </div>
                      <label className="mockup-switch">
                        <input
                          type="checkbox"
                          checked={mobileNotifPrefs.securityAlarm}
                          onChange={() => handleUpdateNotifPref("securityAlarm")}
                        />
                        <span className="mockup-slider" />
                      </label>
                    </div>

                    <div className="mockup-toggle-row">
                      <div className="mockup-toggle-info">
                        <span className="mockup-toggle-title">Hardware Clearance Notices</span>
                        <span className="mockup-toggle-desc">Notify when technical contractor assets and equipment exit custody.</span>
                      </div>
                      <label className="mockup-switch">
                        <input
                          type="checkbox"
                          checked={mobileNotifPrefs.hardwareClearance}
                          onChange={() => handleUpdateNotifPref("hardwareClearance")}
                        />
                        <span className="mockup-slider" />
                      </label>
                    </div>

                    <div className="mockup-toggle-row">
                      <div className="mockup-toggle-info">
                        <span className="mockup-toggle-title">Audio Chime on Gate Arrival</span>
                        <span className="mockup-toggle-desc">Play chime sound when badge or QR pass is scanned at the entrance.</span>
                      </div>
                      <label className="mockup-switch">
                        <input
                          type="checkbox"
                          checked={mobileNotifPrefs.soundArrival}
                          onChange={() => handleUpdateNotifPref("soundArrival")}
                        />
                        <span className="mockup-slider" />
                      </label>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                      <button
                        type="button"
                        className="mockup-btn-primary"
                        onClick={() => {
                          setSettingsModalOpen(false);
                          setSettingsSubView("main");
                          setCurrentPage("notifications");
                        }}
                      >
                        <BellRing size={15} />
                        <span>Open Notifications Center</span>
                      </button>
                      <button
                        type="button"
                        className="mockup-btn-secondary"
                        onClick={() => setSettingsSubView("main")}
                      >
                        <ArrowLeft size={15} />
                        <span>Back to Settings</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBVIEW 4: HELP & SUPPORT */}
                {settingsSubView === "help" && (
                  <div className="mockup-subview-card">
                    <h4 className="mockup-subview-title">
                      <HelpCircle size={18} color="#2563eb" />
                      <span>Help &amp; Enterprise Support</span>
                    </h4>
                    <p className="mockup-subview-desc">
                      Contact IT support, security desk hotlines, and access enterprise portal links.
                    </p>

                    <div style={{ background: "var(--bg-secondary, #f8fafc)", padding: "12px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Mail size={14} color="#2563eb" /> IT Enterprise Support
                      </span>
                      <span style={{ fontSize: 13, color: "#64748b" }}>it.coveryou@vms.com</span>
                      <button
                        type="button"
                        style={{ marginTop: "4px", padding: "6px 10px", borderRadius: "6px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: "12px", fontWeight: 700, cursor: "pointer", width: "fit-content" }}
                        onClick={() => window.open("mailto:it.coveryou@vms.com")}
                      >
                        Send Email →
                      </button>
                    </div>

                    <div style={{ background: "var(--bg-secondary, #f8fafc)", padding: "12px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Phone size={14} color="#16a34a" /> Security Gate Hotline
                      </span>
                      <span style={{ fontSize: 13, color: "#64748b" }}>Ext 101 (Main Gate) / Ext 102 (IT Wing)</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>Emergency Line: +91 98765 43210</span>
                    </div>

                    <div style={{ background: "var(--bg-secondary, #f8fafc)", padding: "12px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Quick Portals</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        <button
                          type="button"
                          style={{ padding: "6px 10px", borderRadius: "6px", background: "#ffffff", border: "1px solid #cbd5e1", fontSize: "11.5px", fontWeight: 600, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                          onClick={() => window.open("/guard", "_blank")}
                        >
                          <ExternalLink size={12} color="#059669" /> Guard Terminal
                        </button>
                        <button
                          type="button"
                          style={{ padding: "6px 10px", borderRadius: "6px", background: "#ffffff", border: "1px solid #cbd5e1", fontSize: "11.5px", fontWeight: 600, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                          onClick={() => window.open("/register", "_blank")}
                        >
                          <ExternalLink size={12} color="#2563eb" /> Visitor Self-Reg
                        </button>
                        <button
                          type="button"
                          style={{ padding: "6px 10px", borderRadius: "6px", background: "#ffffff", border: "1px solid #cbd5e1", fontSize: "11.5px", fontWeight: 600, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                          onClick={() => window.open("/it-visit", "_blank")}
                        >
                          <ExternalLink size={12} color="#7c3aed" /> IT Kiosk
                        </button>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border-color, #e2e8f0)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11.5px", color: "#64748b" }}>VMS Enterprise v2.4.0</span>
                      <span style={{ fontSize: "11.5px", color: "#16a34a", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} /> Systems Operational
                      </span>
                    </div>

                    <button
                      type="button"
                      className="mockup-btn-secondary"
                      onClick={() => setSettingsSubView("main")}
                    >
                      <ArrowLeft size={15} />
                      <span>Back to Settings</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GuardStandalonePortal() {
  const [authToken, setAuthToken] = useState(
    () => authStorage.getGuardToken()
  );
  const [currentUser, setCurrentUser] = useState(() => {
    return authStorage.getGuardUser();
  });

  const handleLoginSuccess = (accessToken, user) => {
    authStorage.setGuardToken(accessToken);
    authStorage.setGuardUser(user);
    setAuthToken(accessToken);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authStorage.clearGuardAuth();
    setAuthToken(null);
    setCurrentUser(null);
  };

  if (!authToken || !currentUser) {
    return <GuardLogin onLogin={handleLoginSuccess} />;
  }

  return (
    <SecurityGuardPortal
      currentUser={currentUser}
      onLogout={handleLogout}
      authToken={authToken}
    />
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "24px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
            padding: "36px",
            maxWidth: "520px",
            width: "100%",
            textAlign: "center"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <XCircle size={30} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px" }}>
              {this.state.error?.message || "An unexpected error occurred in this view."}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Reload Application
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                style={{
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

  if (
    currentPath === "/demo" ||
    currentPath === "/demo-video" ||
    currentPath === "/promo" ||
    currentPath === "/showcase" ||
    currentPath === "/coming-soon" ||
    currentPath === "/soon" ||
    currentPath === "/comingsoon" ||
    currentPath === "/profile/vms-os" ||
    currentPath === "/vms-os" ||
    currentPath === "/tour" ||
    currentPath === "/video" ||
    currentPath === "/launch"
  ) {
    window.location.replace("/profile/vms-os/index.html");
    return null;
  }

  if (currentPath === "/register-visitor") {
    return <PublicRegistration />;
  }

  if (
    currentPath === "/it-visit" ||
    currentPath === "/it-visitor" ||
    currentPath === "/register-it-visit" ||
    currentPath === "/it-portal"
  ) {
    return <ITVisitPortal />;
  }

  if (currentPath === "/it-qr" || currentPath === "/qr-it") {
    return <ITPortalQRPage />;
  }

  if (
    currentPath === "/guard" ||
    currentPath === "/security-portal" ||
    currentPath === "/gate" ||
    currentPath === "/gate-terminal"
  ) {
    return <GuardStandalonePortal />;
  }

  const visitorPassMatch = currentPath.match(/^\/(?:visitor-pass|pass)\/([^/]+)$/);
  if (visitorPassMatch) {
    let token = visitorPassMatch[1];
    try {
      token = decodeURIComponent(token);
    } catch {
      // Leave malformed encoding to be rejected by pass verification.
    }
    return <PublicVisitorPass token={token} />;
  }

  return <VMSApp />;
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;