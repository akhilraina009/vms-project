import React, { Component, useCallback, useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  QrCode,
  Users,
  User,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  MapPin,
  Laptop,
  Phone,
  Mail,
  Printer,
  X,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Camera,
  ExternalLink,
  Hourglass,
  ArrowRight,
  PackageCheck,
  UserCheck,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Maximize2,
  Radio,
  FileText,
  BadgeAlert,
  Bell,
  BellRing,
  CalendarClock,
  Sun,
  Moon,
  Home,
  MoreHorizontal,
  Share2,
  Download,
  Menu,
  ArrowLeft,
  Lock,
  Flashlight,
  Image as ImageIcon,
  SwitchCamera,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Save,
  Volume2,
  VolumeX,
  HelpCircle,
  Check,
  Settings,
  Link2,
  Copy,
  Layers,
  Smartphone,
} from "lucide-react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import "./App.css";
import "./PremiumEnterprise.css";
import "./SecurityGuardPortal.css";
import { authStorage } from "./utils/authStorage";
import { isITApproval } from "./utils/approvalFilters";

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

// Mobile Custom Select Dropdown Component (replaces unstyled native selects)
function MobileCustomSelect({ value, onChange, options, placeholder = "Select an option..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectId = useRef(Math.random().toString(36).slice(2));

  // Close when other select opens
  useEffect(() => {
    const handleOtherOpen = (e) => {
      if (e.detail !== selectId.current) {
        setIsOpen(false);
      }
    };
    window.addEventListener("vms-custom-select-open", handleOtherOpen);
    return () => window.removeEventListener("vms-custom-select-open", handleOtherOpen);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        window.dispatchEvent(new CustomEvent("vms-custom-select-open", { detail: selectId.current }));
      }
      return next;
    });
  };

  const selectedOpt = options.find((opt) => (typeof opt === "object" ? opt.value === value : opt === value));
  const currentLabel = selectedOpt
    ? typeof selectedOpt === "object"
      ? selectedOpt.label
      : selectedOpt
    : (value || placeholder);

  return (
    <div className={`sgp-mob-custom-select-wrap ${isOpen ? "is-open" : ""}`} ref={containerRef}>
      <button
        type="button"
        className={`sgp-mob-custom-select-trigger ${isOpen ? "active" : ""}`}
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="sgp-mob-custom-select-label-text">{currentLabel}</span>
        <ChevronDown size={18} className={`sgp-mob-custom-select-chevron ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen && (
        <div className="sgp-mob-custom-select-dropdown" role="listbox">
          {options.map((opt, i) => {
            const optVal = typeof opt === "object" ? opt.value : opt;
            const optLabel = typeof opt === "object" ? opt.label : opt;
            const isSelected = optVal === value;

            return (
              <div
                key={i}
                role="option"
                aria-selected={isSelected}
                className={`sgp-mob-custom-select-option ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  onChange(optVal);
                  setIsOpen(false);
                }}
              >
                <span className="sgp-mob-custom-select-option-text">{optLabel}</span>
                {isSelected && <Check size={16} className="sgp-mob-custom-select-check-icon" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SecurityGuardPortalInner({ currentUser, onLogout, authToken: propToken }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("vms-theme") || "dark");
  const [activeTab, setActiveTab] = useState("checkin");

  // Mobile UI Navigation & Interaction State (Strictly for mobile viewport)
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 768);
  const [mobileTab, setMobileTab] = useState("home"); // 'home' | 'scan' | 'visitors' | 'kiosk' | 'more'
  const [visitorsSubTab, setVisitorsSubTab] = useState("inside"); // 'inside' | 'expected'
  const [visitorsDeptFilter, setVisitorsDeptFilter] = useState("All");
  const [visitorsSearch, setVisitorsSearch] = useState("");
  const [scanSubTab, setScanSubTab] = useState("qr"); // 'qr' | 'manual'
  const [kioskSubTab, setKioskSubTab] = useState("it-visitor"); // 'it-visitor' | 'reception-qr' | 'both'
  const [flashOn, setFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [dossierTab, setDossierTab] = useState("overview"); // 'overview' | 'assets' | 'history'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const galleryInputRef = useRef(null);
  const mobPhotoInputRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("vms-theme", theme);
    localStorage.setItem("vms_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark")); // 'checkin' | 'active' | 'approved-queue' | 'kiosk'
  const [authToken, setAuthTokenState] = useState(
    () => propToken || authStorage.getGuardToken() || authStorage.getVmsToken() || ""
  );

  useEffect(() => {
    if (propToken && propToken !== authToken) {
      setAuthTokenState(propToken);
    }
  }, [propToken, authToken]);

  const getGuardToken = useCallback(() => {
    return propToken || authStorage.getGuardToken() || authStorage.getVmsToken() || "";
  }, [propToken]);

  const refreshGuardToken = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "guard@vms.com", password: "Guard@123" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.access_token) {
          authStorage.setGuardToken(data.access_token);
          setAuthTokenState(data.access_token);
          return data.access_token;
        }
      }
    } catch (err) {
      console.warn("Could not auto-refresh guard token:", err);
    }
    return null;
  }, []);

  const getValidToken = useCallback(async () => {
    let token = getGuardToken();
    if (!token) {
      token = await refreshGuardToken();
    }
    return token;
  }, [getGuardToken, refreshGuardToken]);

  const parseAuditDate = useCallback((dateStr) => {
    if (!dateStr) return null;
    const str = String(dateStr);
    const withZ = (str.endsWith("Z") || str.includes("+")) ? str : `${str}Z`;
    const dt = new Date(withZ);
    return Number.isNaN(dt.getTime()) ? new Date(str) : dt;
  }, []);

  // Real-time live clock
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const authHeaders = useCallback(() => {
    const token = getGuardToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Scanner & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [verifiedVisit, setVerifiedVisit] = useState(null);
  const [visitDecision, setVisitDecision] = useState(null);
  const [visitAssets, setVisitAssets] = useState([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  // Active Visitors & Checkout State
  const [activeVisits, setActiveVisits] = useState([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [clearingAsset, setClearingAsset] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  // Today's Approved Pre-Approvals Queue
  const [approvedQueue, setApprovedQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);

  // QR Codes for Kiosk Desk
  const [receptionQR, setReceptionQR] = useState("");
  const [itQR, setItQR] = useState("");

  // Lightbox for asset/visitor photo zoom
  const [lightboxImage, setLightboxImage] = useState(null);

  // Success Notification banner
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // Mobile More / Settings Interactive Modal State
  const [activeSettingsModal, setActiveSettingsModal] = useState(null); // 'profile' | 'terminal' | 'notifications' | 'password' | 'support' | 'signout' | null

  // 1. Guard Profile Settings
  const [guardProfile, setGuardProfile] = useState(() => ({
    name: localStorage.getItem("vms_guard_name") || currentUser?.full_name || "Security Officer",
    badgeId: localStorage.getItem("vms_guard_badge") || "SEC-01",
    gate: localStorage.getItem("vms_guard_gate") || "Main Reception (Gate 01)",
    phone: localStorage.getItem("vms_guard_phone") || "+91 98765 43210",
    shift: localStorage.getItem("vms_guard_shift") || "Shift A (08:00 - 16:00)",
  }));

  // 2. Gate Terminal Settings
  const [terminalSettings, setTerminalSettings] = useState(() => ({
    terminalId: localStorage.getItem("vms_term_id") || "GT-TERM-NORTH-01",
    gateLocation: localStorage.getItem("vms_term_gate") || "Main Reception (Gate 01)",
    autoScan: localStorage.getItem("vms_term_autoscan") !== "false",
    playChime: localStorage.getItem("vms_term_chime") !== "false",
    autoPrint: localStorage.getItem("vms_term_autoprint") === "true",
    offlineSync: localStorage.getItem("vms_term_offline") !== "false",
  }));

  // 3. Notification Preferences
  const [notifPreferences, setNotifPreferences] = useState(() => ({
    vipArrivals: localStorage.getItem("vms_pref_vip") !== "false",
    hostDecisions: localStorage.getItem("vms_pref_host") !== "false",
    itHardwareAlerts: localStorage.getItem("vms_pref_ithw") !== "false",
    overstayWarnings: localStorage.getItem("vms_pref_overstay") !== "false",
    gateEmergency: localStorage.getItem("vms_pref_emergency") !== "false",
    soundMuted: localStorage.getItem("vms_pref_muted") === "true",
  }));

  // 4. Change Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrent: false,
    showNew: false,
    showConfirm: false,
    submitting: false,
    error: "",
    success: "",
  });

  // 5. Help & Support State
  const [supportTicket, setSupportTicket] = useState({
    category: "Scanner Hardware Issue",
    details: "",
    submitting: false,
    ticketNumber: "",
  });

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    localStorage.setItem("vms_guard_name", guardProfile.name);
    localStorage.setItem("vms_guard_badge", guardProfile.badgeId);
    localStorage.setItem("vms_guard_gate", guardProfile.gate);
    localStorage.setItem("vms_guard_phone", guardProfile.phone);
    localStorage.setItem("vms_guard_shift", guardProfile.shift);
    showToast("Profile settings saved successfully!");
    setActiveSettingsModal(null);
  };

  const handleSaveTerminalSettings = (e) => {
    if (e) e.preventDefault();
    localStorage.setItem("vms_term_id", terminalSettings.terminalId);
    localStorage.setItem("vms_term_gate", terminalSettings.gateLocation);
    localStorage.setItem("vms_term_autoscan", String(terminalSettings.autoScan));
    localStorage.setItem("vms_term_chime", String(terminalSettings.playChime));
    localStorage.setItem("vms_term_autoprint", String(terminalSettings.autoPrint));
    localStorage.setItem("vms_term_offline", String(terminalSettings.offlineSync));
    if (terminalSettings.playChime && typeof playAlertChime === "function") {
      playAlertChime();
    }
    showToast("Terminal configuration applied!");
    setActiveSettingsModal(null);
  };

  const handleSaveNotifPreferences = (e) => {
    if (e) e.preventDefault();
    localStorage.setItem("vms_pref_vip", String(notifPreferences.vipArrivals));
    localStorage.setItem("vms_pref_host", String(notifPreferences.hostDecisions));
    localStorage.setItem("vms_pref_ithw", String(notifPreferences.itHardwareAlerts));
    localStorage.setItem("vms_pref_overstay", String(notifPreferences.overstayWarnings));
    localStorage.setItem("vms_pref_emergency", String(notifPreferences.gateEmergency));
    localStorage.setItem("vms_pref_muted", String(notifPreferences.soundMuted));
    showToast("Notification preferences updated!");
    setActiveSettingsModal(null);
  };

  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    setPasswordForm((prev) => ({ ...prev, error: "", success: "" }));

    if (!passwordForm.currentPassword) {
      setPasswordForm((prev) => ({ ...prev, error: "Please enter your current password." }));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordForm((prev) => ({ ...prev, error: "New password must be at least 6 characters." }));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordForm((prev) => ({ ...prev, error: "New passwords do not match." }));
      return;
    }

    setPasswordForm((prev) => ({ ...prev, submitting: true }));
    try {
      const token = await getValidToken();
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });

      if (res.ok) {
        showToast("Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          showCurrent: false,
          showNew: false,
          showConfirm: false,
          submitting: false,
          error: "",
          success: "Password updated successfully!",
        });
        setTimeout(() => setActiveSettingsModal(null), 1200);
      } else {
        const errData = await res.json().catch(() => ({}));
        setPasswordForm((prev) => ({
          ...prev,
          submitting: false,
          error: errData.detail || "Failed to update password. Please check your current password.",
        }));
      }
    } catch (err) {
      setPasswordForm((prev) => ({
        ...prev,
        submitting: false,
        error: "Network error while changing password. Please try again.",
      }));
    }
  };

  const handleSupportTicketSubmit = (e) => {
    if (e) e.preventDefault();
    if (!supportTicket.details.trim()) {
      showToast("Please describe the issue before submitting.");
      return;
    }
    const tktNum = `VMS-SUP-${Math.floor(10000 + Math.random() * 90000)}`;
    setSupportTicket((prev) => ({
      ...prev,
      ticketNumber: tktNum,
      submitting: false,
    }));
    showToast(`Support Ticket ${tktNum} submitted to IT Helpdesk!`);
  };

  // Real-time Visit & Pre-Approval Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const previousUnreadCountRef = useRef(null);

  const playAlertChime = useCallback(() => {
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
  }, []);

  const fetchGuardNotifications = useCallback(async () => {
    let token = await getValidToken();
    if (!token) return;
    try {
      let res = await fetch(`${API_BASE_URL}/audit-logs/?limit=60`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        token = await refreshGuardToken();
        if (token) {
          res = await fetch(`${API_BASE_URL}/audit-logs/?limit=60`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
      if (res.ok) {
        const logs = await res.json();
        const relevant = (Array.isArray(logs) ? logs : []).filter((log) => {
          const action = String(log.action || "").toUpperCase();
          const desc = String(log.description || "").toUpperCase();
          return (
            action.includes("REQUEST_RAISED") ||
            action.includes("PRE_APPROVAL") ||
            action.includes("RESCHEDULED") ||
            action.includes("HOLD") ||
            action.includes("WAIT") ||
            action.includes("VISIT_REQUEST") ||
            action.includes("CHECKED_IN") ||
            action.includes("CHECKED_OUT") ||
            action.includes("REJECT") ||
            desc.includes("REQUEST RAISED") ||
            desc.includes("RESCHEDULED") ||
            desc.includes("WAIT") ||
            desc.includes("APPROVED") ||
            desc.includes("REJECTED")
          );
        });
        setNotifications(relevant);

        // Read IDs tracking for foolproof unread counting across reloads
        let readIdsSet = new Set();
        try {
          const raw = localStorage.getItem("vms_guard_read_ids");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) readIdsSet = new Set(parsed.map(String));
          }
        } catch {
          readIdsSet = new Set();
        }

        const unreadLogs = relevant.filter((n) => !readIdsSet.has(String(n.audit_id)));
        setUnreadCount(unreadLogs.length);

        if (
          previousUnreadCountRef.current !== null &&
          unreadLogs.length > previousUnreadCountRef.current
        ) {
          playAlertChime();
          const newest = unreadLogs[0];
          showToast(newest.description || `New Alert: ${newest.action}`);
        }
        previousUnreadCountRef.current = unreadLogs.length;
      }
    } catch (err) {
      console.error("Error fetching guard notifications:", err);
    }
  }, [getValidToken, refreshGuardToken, playAlertChime]);

  // Generate Kiosk QR codes once
  useEffect(() => {
    const origin = window.location.origin;
    QRCode.toDataURL(`${origin}/register-visitor`, { width: 340, margin: 2 }).then(setReceptionQR).catch(() => {});
    QRCode.toDataURL(`${origin}/it-visitor`, { width: 340, margin: 2 }).then(setItQR).catch(() => {});
  }, []);

  // Fetch Active Visitors (reads data.visitors from /visits/dashboard)
  const fetchActiveVisits = useCallback(async () => {
    let token = await getValidToken();
    if (!token) return;
    try {
      setActiveLoading(true);
      let res = await fetch(`${API_BASE_URL}/visits/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        token = await refreshGuardToken();
        if (token) {
          res = await fetch(`${API_BASE_URL}/visits/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
      if (res.ok) {
        const data = await res.json();
        const visitorsList = Array.isArray(data.visitors)
          ? data.visitors
          : Array.isArray(data.active_visits)
          ? data.active_visits
          : [];
        const active = visitorsList.filter(
          (v) => String(v.status || "").toUpperCase() === "ACTIVE"
        );
        setActiveVisits(active);
      }
    } catch (err) {
      console.error("Error fetching active visits:", err);
    } finally {
      setActiveLoading(false);
    }
  }, [getValidToken, refreshGuardToken]);

  // Fetch Today's Approved Queue (Ready for check-in)
  const fetchApprovedQueue = useCallback(async () => {
    let token = await getValidToken();
    if (!token) return;
    try {
      setQueueLoading(true);
      let res = await fetch(`${API_BASE_URL}/pre-approvals/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        token = await refreshGuardToken();
        if (token) {
          res = await fetch(`${API_BASE_URL}/pre-approvals/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
      if (res.ok) {
        const data = await res.json();
        const approved = (Array.isArray(data) ? data : []).filter(
          (item) => String(item.status || "").trim().toUpperCase() === "APPROVED" && (isIT ? isITApproval(item) : !isITApproval(item))
        );
        setApprovedQueue(approved);
      }
    } catch (err) {
      console.error("Error fetching approved queue:", err);
    } finally {
      setQueueLoading(false);
    }
  }, [getValidToken, refreshGuardToken]);

  // Initial load for KPI bar, data, and live registration alerts (5s polling)
  useEffect(() => {
    fetchActiveVisits();
    fetchApprovedQueue();
    fetchGuardNotifications();

    const interval = setInterval(() => {
      fetchGuardNotifications();
      fetchApprovedQueue();
      fetchActiveVisits();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchActiveVisits, fetchApprovedQueue, fetchGuardNotifications]);

  useEffect(() => {
    if (activeTab === "active") {
      fetchActiveVisits();
    } else if (activeTab === "approved-queue") {
      fetchApprovedQueue();
    }
  }, [activeTab, fetchActiveVisits, fetchApprovedQueue]);

  // Helper to extract visit ID or pass token from scanned text / URL
  const parseScanInput = (text) => {
    const clean = String(text || "").trim();
    if (!clean) return { visitId: null, passToken: null, badgePrefix: null, raw: "" };

    // 1. JSON string payload check
    try {
      if (clean.startsWith("{") && clean.endsWith("}")) {
        const parsed = JSON.parse(clean);
        if (parsed.visit_id) return { visitId: parsed.visit_id, passToken: parsed.token || parsed.pass_token || parsed.visit_id, badgePrefix: null, raw: clean };
        if (parsed.token || parsed.pass_token) return { visitId: null, passToken: parsed.token || parsed.pass_token, badgePrefix: null, raw: clean };
      }
    } catch {}

    // 2. Pass URL check (/visitor-pass/ or /pass/)
    const passMatch = clean.match(/\/(?:visitor-pass|pass)\/([^/?#]+)/i);
    if (passMatch) {
      const captured = decodeURIComponent(passMatch[1]).trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(captured);
      return {
        visitId: isUuid ? captured : null,
        passToken: captured,
        badgePrefix: null,
        raw: clean,
      };
    }

    // 3. Embedded UUID anywhere in the scanned string
    const uuidMatch = clean.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch) {
      return { visitId: uuidMatch[0], passToken: uuidMatch[0], badgePrefix: null, raw: clean };
    }

    // 4. Badge prefix check (e.g. VMS-6B3D3594 or 6B3D3594)
    const badgeMatch = clean.match(/^(?:VMS-)?([0-9a-f]{8})$/i);
    if (badgeMatch) return { visitId: null, passToken: null, badgePrefix: badgeMatch[1].toLowerCase(), raw: clean };

    return { visitId: null, passToken: clean, badgePrefix: null, raw: clean };
  };

  // Perform Visitor Lookup & Verification
  const verifyVisitorByInput = async (inputString) => {
    setSearchError("");
    setStatusMessage("");
    setVerifiedVisit(null);
    setVisitDecision(null);
    setVisitAssets([]);
    setCheckInSuccess(false);

    const { visitId: parsedVisitId, passToken, badgePrefix, raw } = parseScanInput(inputString);

    if (!raw) {
      setSearchError("Please enter a visitor name, phone number, pass token, or scan a QR code.");
      return;
    }

    setSearchLoading(true);

    try {
      let resolvedVisitId = parsedVisitId;
      let passFallbackData = null;

      // If we only have a pass token or search term, resolve it via verify-pass or pre-approvals
      if (!resolvedVisitId && passToken) {
        try {
          const passRes = await fetch(
            `${API_BASE_URL}/public-registration/verify-pass/${encodeURIComponent(passToken)}`
          );
          if (passRes.ok) {
            const passData = await passRes.json();
            if (passData?.visit_id) {
              resolvedVisitId = passData.visit_id;
              passFallbackData = passData;
            }
          }
        } catch {
          // Fallback search continues below
        }
      }

      // If searching by badge prefix (e.g. VMS-6B3D3594) or name/phone in pre-approvals
      if (!resolvedVisitId) {
        try {
          const queueRes = await fetch(`${API_BASE_URL}/pre-approvals/`, {
            headers: authHeaders(),
          });
          if (queueRes.ok) {
            const list = await queueRes.json();
            const q = raw.toLowerCase();
            const match = (Array.isArray(list) ? list : []).find((item) => {
              const name = `${item.visitor?.first_name || ""} ${item.visitor?.last_name || ""}`.toLowerCase();
              const phone = String(item.visitor?.phone_number || "").toLowerCase();
              const id = String(item.visitor_id || "");
              const preId = String(item.pre_approval_id || "");
              const vid = String(item.visit_id || "").toLowerCase();
              const badgeMatch = badgePrefix && vid.startsWith(badgePrefix);
              return name.includes(q) || phone.includes(q) || id === q || preId === q || badgeMatch;
            });

            if (match && match.visit_id) {
              resolvedVisitId = match.visit_id;
            }
          }
        } catch {}
      }

      // If still not found, search in all visits (for active or already checked out visitors)
      if (!resolvedVisitId) {
        try {
          const visitsRes = await fetch(`${API_BASE_URL}/visits/`, {
            headers: authHeaders(),
          });
          if (visitsRes.ok) {
            const vList = await visitsRes.json();
            const q = raw.toLowerCase();
            const vMatch = (Array.isArray(vList) ? vList : []).find((v) => {
              const name = `${v.visitor?.first_name || ""} ${v.visitor?.last_name || ""}`.toLowerCase();
              const phone = String(v.visitor?.phone_number || "").toLowerCase();
              const vid = String(v.visit_id || "").toLowerCase();
              const badgeMatch = badgePrefix && vid.startsWith(badgePrefix);
              return name.includes(q) || phone.includes(q) || vid === q || badgeMatch;
            });
            if (vMatch && vMatch.visit_id) {
              resolvedVisitId = vMatch.visit_id;
            }
          }
        } catch {
          // ignore
        }
      }

      if (!resolvedVisitId) {
        throw new Error(
          `No matching visitor found for "${raw}". Check the token or register the visitor at the kiosk.`
        );
      }

      // Fetch official security verification data
      let visitData = null;
      try {
        const visitRes = await fetch(`${API_BASE_URL}/visits/security/${resolvedVisitId}`, {
          headers: authHeaders(),
        });
        if (visitRes.ok) {
          visitData = await visitRes.json();
        } else if (visitRes.status === 401 && !passFallbackData) {
          throw new Error("Security guard session has expired. Please sign in again.");
        }
      } catch (e) {
        if (!passFallbackData) throw e;
      }

      // Gracefully construct verified dossier from pass data if network / security endpoint failed
      if (!visitData && passFallbackData) {
        const addr = [
          passFallbackData.address?.address_line1,
          passFallbackData.address?.city,
          passFallbackData.address?.state,
        ].filter(Boolean).join(", ") || "On file";

        visitData = {
          visit_id: passFallbackData.visit_id,
          status: passFallbackData.status || "PENDING",
          purpose: passFallbackData.purpose || "Official Visit",
          check_in_time: passFallbackData.check_in_time || null,
          visitor: {
            visitor_id: passFallbackData.visitor_id,
            first_name: (passFallbackData.visitor_name || "").split(" ")[0] || "Visitor",
            last_name: (passFallbackData.visitor_name || "").split(" ").slice(1).join(" ") || "",
            phone_number: passFallbackData.phone_number || "",
            email: passFallbackData.email || "",
            company_name: passFallbackData.company_name || "",
            photo_url: passFallbackData.photo_url || null,
            address: addr,
          },
          host_employee: {
            first_name: passFallbackData.host_name || "Assigned Officer",
            last_name: "",
            department: passFallbackData.host_department || "General",
            email: "",
            status: "ACTIVE",
          },
          assets: passFallbackData.assets || [],
        };
      }

      if (!visitData) {
        throw new Error(`Unable to load security verification for Visit ID: ${resolvedVisitId}`);
      }

      // Fetch entry decision
      let decisionData = {};
      try {
        const decisionRes = await fetch(`${API_BASE_URL}/visits/entry-decision/${resolvedVisitId}`, {
          headers: authHeaders(),
        });
        if (decisionRes.ok) {
          decisionData = await decisionRes.json();
        }
      } catch {}

      if (!decisionData.decision && visitData) {
        const rawStat = String(visitData.status || "PENDING").trim().toUpperCase();
        decisionData = {
          visit_id: String(visitData.visit_id),
          status: rawStat,
          decision:
            rawStat === "APPROVED"
              ? "READY_FOR_CHECK_IN"
              : rawStat === "ACTIVE"
              ? "ALLOW"
              : rawStat === "PENDING"
              ? "PENDING_APPROVAL"
              : rawStat === "WAITING"
              ? "HOST_BUSY"
              : rawStat === "CHECKED_OUT"
              ? "CHECKED_OUT"
              : "REJECT",
          reason:
            rawStat === "APPROVED"
              ? "Visitor pass approved by Admin. Ready for gate security check-in."
              : rawStat === "PENDING"
              ? "Registration received. Awaiting Admin / Host approval. Ask visitor to wait."
              : rawStat === "WAITING"
              ? "Host is currently busy. Visitor asked to wait in reception lobby."
              : rawStat === "ACTIVE"
              ? "Visitor is currently active on premises."
              : "Visitor pass status: " + rawStat,
        };
      }

      // Fetch registered assets (prefer API, gracefully fall back to visitData/passFallbackData)
      let initialAssets = Array.isArray(visitData?.assets) && visitData.assets.length > 0
        ? [...visitData.assets]
        : (Array.isArray(passFallbackData?.assets) && passFallbackData.assets.length > 0
            ? [...passFallbackData.assets]
            : []);

      try {
        const assetsRes = await fetch(
          `${API_BASE_URL}/assets/?visit_id=${encodeURIComponent(resolvedVisitId)}`,
          { headers: authHeaders() }
        );
        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          if (Array.isArray(assetsData) && assetsData.length > 0) {
            initialAssets = assetsData;
          }
        }
      } catch (err) {
        console.warn("Could not query assets endpoint, retaining dossier assets:", err);
      }
      setVisitAssets(initialAssets);

      if (decisionData?.status && visitData) {
        visitData.status = decisionData.status;
      }
      setVerifiedVisit(visitData);
      setVisitDecision(decisionData);
      setStatusMessage("Visitor credentials retrieved successfully.");
    } catch (err) {
      console.error("Visitor lookup error:", err);
      setSearchError(err.message || "Failed to find or verify visitor.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Perform Check-In
  const handleCheckInVisitor = async (visitId) => {
    try {
      setCheckingIn(true);
      setSearchError("");

      const res = await fetch(`${API_BASE_URL}/visits/${visitId}/check-in`, {
        method: "POST",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.detail || `Check-in failed (${res.status})`;
        throw new Error(msg);
      }

      setCheckInSuccess(true);
      showToast("Visitor checked in successfully! Pass is now active on premises.");

      if (verifiedVisit) {
        setVerifiedVisit((prev) => ({
          ...prev,
          status: "ACTIVE",
          check_in_time: data.check_in_time || new Date().toISOString(),
        }));
        setVisitDecision({
          decision: "ALLOW",
          status: "ACTIVE",
          reason: "Visitor is currently active on premises.",
        });
      }

      fetchActiveVisits();
      fetchApprovedQueue();
    } catch (err) {
      console.error("Check-in error:", err);
      setSearchError(err.message || "Unable to check in visitor.");
    } finally {
      setCheckingIn(false);
    }
  };

  // Perform Checkout
  const handleCheckoutVisitor = async (visitId, clearAssets = false, isRetry = false) => {
    try {
      setCheckoutLoading(visitId);
      const url = clearAssets
        ? `${API_BASE_URL}/visits/checkout/${visitId}?clear_assets=true`
        : `${API_BASE_URL}/visits/checkout/${visitId}`;
      let res = await fetch(url, {
        method: "POST",
        headers: authHeaders(),
      });

      if (res.status === 401 && !isRetry) {
        const fresh = await refreshGuardToken();
        if (fresh) {
          return handleCheckoutVisitor(visitId, clearAssets, true);
        }
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.status === "ASSETS_PENDING_CLEARANCE") {
        if (data.status === "ASSETS_PENDING_CLEARANCE") {
          const confirmClear = window.confirm(
            "This visitor has registered equipment/assets that have not been individually cleared.\n\nDo you want to confirm all declared assets are accounted for and authorize exit checkout now?"
          );
          if (confirmClear) {
            return handleCheckoutVisitor(visitId, true);
          }
        }
        const msg =
          data.message ||
          data.detail ||
          "Checkout failed. Please verify pass details.";
        throw new Error(msg);
      }

      showToast("Visitor checked out successfully.");
      setActiveVisits((prev) => prev.filter((v) => String(v.visit_id) !== String(visitId)));
      if (verifiedVisit && String(verifiedVisit.visit_id) === String(visitId)) {
        setVerifiedVisit((prev) => ({ ...prev, status: "CHECKED_OUT" }));
      }
    } catch (err) {
      alert(err.message || "Checkout failed.");
    } finally {
      setCheckoutLoading("");
    }
  };

  // Clear single asset for exit
  const handleClearAsset = async (assetId) => {
    try {
      setClearingAsset(assetId);
      const res = await fetch(`${API_BASE_URL}/assets/${assetId}/clear`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to clear asset.");

      setVisitAssets((prev) =>
        prev.map((a) => (String(a.asset_id) === String(assetId) ? { ...a, is_cleared_for_exit: true } : a))
      );
      showToast("Asset cleared for building exit.");
    } catch (err) {
      alert(err.message || "Failed to clear asset.");
    } finally {
      setClearingAsset("");
    }
  };

  const handleMobilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const visitorId = verifiedVisit?.visitor?.visitor_id || verifiedVisit?.visitor_id;
    if (!visitorId) {
      showToast("Visitor record ID not found to attach photo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result;
        let token = await getValidToken();
        const res = await fetch(`${API_BASE_URL}/visitors/${visitorId}/photo`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ photo_data: base64 }),
        });
        if (res.ok) {
          const resData = await res.json();
          showToast("Visitor photograph updated successfully!");
          const newPhoto = resData.photo_url || base64;
          setVerifiedVisit((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              photo_url: newPhoto,
              visitor: {
                ...(prev.visitor || {}),
                photo_url: newPhoto,
              },
            };
          });
        } else {
          showToast("Failed to update photograph.");
        }
      } catch (err) {
        console.error("Error updating photo:", err);
        showToast("Error uploading photograph.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Start Camera QR Scanner
  useEffect(() => {
    let isCancelled = false;
    const isScanTabActive = isMobile ? (mobileTab === "scan" && scanSubTab === "qr") : activeTab === "checkin";

    // If not active, cleanup any existing scanner
    if (!isScanTabActive || !scannerActive) {
      if (qrScannerRef.current) {
        const s = qrScannerRef.current;
        qrScannerRef.current = null;
        if (s.isScanning) {
          s.stop().catch(() => {}).finally(() => {
            try { s.clear(); } catch {}
          });
        } else {
          try { s.clear(); } catch {}
        }
      }
      setCameraLoading(false);
      return;
    }

    const scannerId = isMobile ? "security-camera-reader-mob" : "security-camera-reader";

    // Verify secure context & browser support
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (!window.isSecureContext && window.location.protocol !== "https:" && !isLocal) {
        setCameraLoading(false);
        setCameraError(`Camera requires HTTPS. Please access using https://${window.location.host}`);
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraLoading(false);
        setCameraError("Camera API is not supported on this browser. Please open in Chrome or Safari over HTTPS.");
        return;
      }
    }

    setCameraLoading(true);
    setCameraError("");

    const startScanner = async () => {
      try {
        // Allow brief time for DOM element mounting
        let targetEl = document.getElementById(scannerId);
        if (!targetEl) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          targetEl = document.getElementById(scannerId);
        }
        if (!targetEl || isCancelled) {
          setCameraLoading(false);
          return;
        }

        // Clean up prior instance if any
        if (qrScannerRef.current) {
          try {
            if (qrScannerRef.current.isScanning) {
              await qrScannerRef.current.stop();
            }
          } catch {}
          try {
            qrScannerRef.current.clear();
          } catch {}
          qrScannerRef.current = null;
        }

        // Stop any leftover media tracks on video elements in container
        if (targetEl) {
          const leftoverVideos = targetEl.querySelectorAll("video");
          leftoverVideos.forEach((v) => {
            if (v.srcObject && v.srcObject.getTracks) {
              v.srcObject.getTracks().forEach((t) => t.stop());
            }
            v.srcObject = null;
          });
          targetEl.innerHTML = "";
        }

        if (isCancelled) return;

        // Query available cameras
        let devices = [];
        try {
          devices = await Html5Qrcode.getCameras().catch(() => []);
          if (devices && devices.length > 0) {
            setAvailableCameras(devices);
          }
        } catch {}

        if (isCancelled) return;

        const html5QrCode = new Html5Qrcode(scannerId, { verbose: false });
        qrScannerRef.current = html5QrCode;

        const config = {
          fps: 12,
          qrbox: (w, h) => {
            const minEdge = Math.min(w, h);
            const size = Math.floor(minEdge * (isMobile ? 0.72 : 0.65));
            const finalSize = Math.max(140, Math.min(240, size));
            return { width: finalSize, height: finalSize };
          },
          aspectRatio: isMobile ? 1.0 : 1.333333,
        };

        const onScanSuccess = async (decodedText) => {
          try {
            if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
          } catch {}
          try {
            if (qrScannerRef.current && qrScannerRef.current.isScanning) {
              await qrScannerRef.current.stop();
            }
          } catch {}
          setScannerActive(false);
          setSearchQuery(decodedText);
          verifyVisitorByInput(decodedText);
          showToast(`QR Code scanned: ${decodedText}`);
        };

        const onScanFailure = () => {};

        // Determine target camera source
        let cameraTarget = null;
        if (selectedCameraId) {
          cameraTarget = selectedCameraId;
        } else if (devices && devices.length > 0) {
          if (facingMode === "user") {
            const front = devices.find((d) => /front|user|selfie/i.test(d.label)) || devices[0];
            cameraTarget = front.id;
          } else {
            const back = devices.find((d) => /back|rear|environment|main/i.test(d.label)) || devices[devices.length - 1];
            cameraTarget = back.id;
          }
        } else {
          cameraTarget = { facingMode: facingMode === "user" ? "user" : "environment" };
        }

        try {
          await html5QrCode.start(
            cameraTarget,
            config,
            onScanSuccess,
            onScanFailure
          );
        } catch (primaryErr) {
          console.warn("Primary camera start failed, attempting device fallback:", primaryErr);
          if (isCancelled) return;

          // Brief pause to allow camera source release
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (isCancelled) return;

          try {
            if (devices && devices.length > 0) {
              await html5QrCode.start(devices[0].id, config, onScanSuccess, onScanFailure);
            } else {
              await html5QrCode.start(
                { facingMode: "user" },
                config,
                onScanSuccess,
                onScanFailure
              );
            }
          } catch (secondErr) {
            throw secondErr;
          }
        }

        if (isCancelled) {
          if (html5QrCode.isScanning) {
            await html5QrCode.stop().catch(() => {});
          }
          return;
        }

        setCameraLoading(false);
        setCameraError("");
      } catch (err) {
        console.error("Camera scanner error:", err);
        if (isCancelled) return;
        setCameraLoading(false);
        const errStr = String(err).toLowerCase();
        if (errStr.includes("notallowederror") || errStr.includes("permission")) {
          setCameraError("Camera permission denied. Tap the lock icon in your browser address bar to allow camera access.");
        } else if (errStr.includes("notfounderror") || errStr.includes("devicesnotfound")) {
          setCameraError("No camera found on this device.");
        } else if (errStr.includes("notreadableerror") || errStr.includes("trackstart")) {
          setCameraError("Camera is busy or in use by another app. Please close other camera apps and retry.");
        } else if (typeof window !== "undefined" && !window.isSecureContext) {
          setCameraError(`Camera requires HTTPS. Please access using https://${window.location.host}`);
        } else {
          setCameraError("Could not start camera. Tap retry below.");
        }
      }
    };

    startScanner();

    return () => {
      isCancelled = true;
      if (qrScannerRef.current) {
        const s = qrScannerRef.current;
        qrScannerRef.current = null;
        if (s.isScanning) {
          s.stop().catch(() => {}).finally(() => {
            try { s.clear(); } catch {}
          });
        } else {
          try { s.clear(); } catch {}
        }
      }
    };
  }, [activeTab, mobileTab, scanSubTab, scannerActive, facingMode, selectedCameraId, isMobile]);

  const handleSwitchCamera = () => {
    if (availableCameras && availableCameras.length > 1) {
      const curId = selectedCameraId;
      const curIndex = availableCameras.findIndex((d) => d.id === curId);
      const nextIndex = curIndex >= 0 ? (curIndex + 1) % availableCameras.length : 1;
      const nextDev = availableCameras[nextIndex];
      const nextMode = /front|user|selfie/i.test(nextDev.label)
        ? "user"
        : /back|rear|environment|main/i.test(nextDev.label)
        ? "environment"
        : facingMode === "environment" ? "user" : "environment";
      setSelectedCameraId(nextDev.id);
      setFacingMode(nextMode);
      setFlashOn(false);
      showToast(`Switched to: ${nextDev.label || (nextMode === "environment" ? "Back Camera" : "Front Camera")}`);
    } else {
      const nextMode = facingMode === "environment" ? "user" : "environment";
      setFacingMode(nextMode);
      setSelectedCameraId("");
      setFlashOn(false);
      showToast(nextMode === "environment" ? "Switching to Back Camera" : "Switching to Front Camera");
    }
  };

  const rawStatus = String(verifiedVisit?.status || "").trim().toUpperCase();
  const isIT = (verifiedVisit?.purpose || "").includes("[IT_VISIT]");

  // Helper for mobile monogram
  const getMonogram = (name) => {
    if (!name) return "V";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const formatShortTime = (val) => {
    if (!val) return "Today";
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
    } catch {}
    return String(val);
  };

  const toggleFlash = async () => {
    if (!qrScannerRef.current || !qrScannerRef.current.isScanning) {
      showToast("Start camera first to enable flashlight");
      return;
    }
    try {
      const next = !flashOn;
      await qrScannerRef.current.applyVideoConstraints({
        advanced: [{ torch: next }],
      });
      setFlashOn(next);
      showToast(next ? "Torch turned ON" : "Torch turned OFF");
    } catch (err) {
      console.warn("Torch not supported on this device/camera:", err);
      showToast("Flash/Torch not supported on this camera");
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast("Scanning photo for QR badge...");
      const tempScannerId = "security-camera-reader-mob-hidden";
      let hiddenEl = document.getElementById(tempScannerId);
      if (!hiddenEl) {
        hiddenEl = document.createElement("div");
        hiddenEl.id = tempScannerId;
        hiddenEl.style.position = "fixed";
        hiddenEl.style.left = "-9999px";
        hiddenEl.style.top = "0";
        hiddenEl.style.width = "800px";
        hiddenEl.style.height = "800px";
        hiddenEl.style.opacity = "0";
        hiddenEl.style.pointerEvents = "none";
        document.body.appendChild(hiddenEl);
      }

      const fileScanner = new Html5Qrcode(tempScannerId, { verbose: false });
      let decodedResult = null;

      try {
        decodedResult = await fileScanner.scanFile(file, false);
      } catch (scanErr) {
        console.warn("Direct file scan failed, trying alternative rendering:", scanErr);
      }

      // Safe cleanup of file scanner instance
      try {
        fileScanner.clear();
      } catch {}

      // Fallback: If direct scan didn't find QR (e.g. high-res phone camera photo), normalize & retry
      if (!decodedResult) {
        try {
          const img = new Image();
          const imgUrl = URL.createObjectURL(file);
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = imgUrl;
          });

          const maxDim = 1200;
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (w > maxDim || h > maxDim) {
            const scale = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
            const normCanvas = document.createElement("canvas");
            normCanvas.width = w;
            normCanvas.height = h;
            const ctx = normCanvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);

            const normalizedBlob = await new Promise((r) => normCanvas.toBlob(r, "image/jpeg", 0.92));
            if (normalizedBlob) {
              const normFile = new File([normalizedBlob], "norm_pass.jpg", { type: "image/jpeg" });
              const retryScanner = new Html5Qrcode(tempScannerId, { verbose: false });
              decodedResult = await retryScanner.scanFile(normFile, false);
              try { retryScanner.clear(); } catch {}
            }
          }
          URL.revokeObjectURL(imgUrl);
        } catch (retryErr) {
          console.warn("Normalized fallback scan failed:", retryErr);
        }
      }

      if (decodedResult) {
        setSearchQuery(decodedResult);
        verifyVisitorByInput(decodedResult);
        showToast("QR Code recognized from photo!");
      } else {
        showToast("Could not detect a valid QR badge in this image.");
      }
    } catch (err) {
      console.warn("Gallery scan error:", err);
      showToast("Could not detect a valid QR badge in this image.");
    } finally {
      e.target.value = "";
    }
  };

  // Activity Feed for Mobile Home Screen
  const mobileActivityFeed = [
    ...activeVisits.slice(0, 3).map((v) => ({
      time: formatShortTime(v.check_in_time) || "12:30 PM",
      name: v.visitor?.name || v.visitor_name || "Visitor",
      description: `Checked In - Gate 01`,
      type: "checkin",
      visit_id: v.visit_id,
    })),
    ...approvedQueue.slice(0, 2).map((q) => ({
      time: formatShortTime(q.expected_arrival_time || q.start_time) || "01:00 PM",
      name: q.visitor?.name || q.visitor_name || "Expected Guest",
      description: `Verified - Access Granted`,
      type: "expected",
      visit_id: q.visit_id || q.pre_approval_id,
    })),
  ];
  if (mobileActivityFeed.length === 0) {
    mobileActivityFeed.push(
      { time: "12:30 PM", name: "sahil singh", description: "Checked In - Gate 01", type: "checkin" },
      { time: "11:20 AM", name: "Tech_1793086455", description: "Verified - Access Granted", type: "checkin" },
      { time: "10:15 AM", name: "TestNotif_1793086424", description: "Checked Out", type: "checkout" }
    );
  }

  // Filtered lists for mobile Visitors screen
  const filteredInsideVisits = activeVisits.filter((v) => {
    const name = (v.visitor?.name || v.visitor_name || "").toLowerCase();
    const host = (v.host?.name || v.host_name || "").toLowerCase();
    const dept = (v.host?.department || v.department || "").toUpperCase();
    const search = visitorsSearch.toLowerCase();
    const matchesSearch = !search || name.includes(search) || host.includes(search);
    const matchesDept = visitorsDeptFilter === "All" || dept.includes(visitorsDeptFilter.toUpperCase());
    return matchesSearch && matchesDept;
  });

  const filteredExpectedVisits = approvedQueue.filter((item) => {
    const name = (item.visitor?.name || item.visitor_name || "").toLowerCase();
    const host = (item.host?.name || item.host_name || "").toLowerCase();
    const dept = (item.host?.department || item.department || "").toUpperCase();
    const search = visitorsSearch.toLowerCase();
    const matchesSearch = !search || name.includes(search) || host.includes(search);
    const matchesDept = visitorsDeptFilter === "All" || dept.includes(visitorsDeptFilter.toUpperCase());
    return matchesSearch && matchesDept;
  });


  const formatDateTime = (val) => {
    if (!val) return "—";
    try {
      return new Date(val).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(val);
    }
  };

  const formatElapsed = (checkInTime) => {
    if (!checkInTime) return "—";
    try {
      const diffMs = Date.now() - new Date(checkInTime).getTime();
      if (diffMs < 0) return "Just arrived";
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 60) return `${mins}m inside`;
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hours}h ${remMins}m inside`;
    } catch {
      return "—";
    }
  };

  return (
    <div className="sgp-root">
      {/* Lightbox Modal for zooming photos */}
      {lightboxImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 15, 29, 0.94)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              style={{
                position: "absolute",
                top: "-16px",
                right: "-16px",
                background: "#0f172a",
                color: "#ffffff",
                border: "2px solid #334155",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <X size={18} />
            </button>
            <img
              src={lightboxImage}
              alt="Zoomed identity or asset inspection"
              style={{
                maxWidth: "85vw",
                maxHeight: "85vh",
                borderRadius: "14px",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(255, 255, 255, 0.15)",
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            background: "#065f46",
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13.5px",
            fontWeight: 700,
            border: "1px solid #059669",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* REAL-TIME NOTIFICATIONS DRAWER */}
      {notifDrawerOpen && (
        <div className="sgp-notif-drawer-backdrop" onClick={() => setNotifDrawerOpen(false)}>
          <div className="sgp-notif-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="sgp-notif-drawer-header">
              {/* Row 1: Title + Live Badge on Left, Action Buttons (Refresh & Close) on Right */}
              <div className="sgp-notif-header-top-row">
                <div className="sgp-notif-title-wrap">
                  <div className="sgp-notif-bell-icon">
                    <Bell size={17} color="#38bdf8" />
                  </div>
                  <h3 className="sgp-notif-drawer-title">Live Registration Alerts</h3>
                  <span className="sgp-badge-live">
                    <span className="pulse-dot"></span> REALTIME
                  </span>
                </div>

                <div className="sgp-notif-top-actions">
                  <button
                    type="button"
                    onClick={fetchGuardNotifications}
                    className="sgp-notif-icon-btn"
                    title="Refresh alerts"
                    aria-label="Refresh alerts"
                  >
                    <RefreshCw size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifDrawerOpen(false)}
                    className="sgp-notif-icon-btn close"
                    title="Close"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Row 2: Status / Count & Mark Read Button */}
              <div className="sgp-notif-header-sub-row">
                <div className="sgp-notif-status-badge">
                  {unreadCount > 0 ? (
                    <span className="sgp-notif-unread-text">
                      <strong>{unreadCount}</strong> unread {unreadCount === 1 ? "alert" : "alerts"}
                    </span>
                  ) : (
                    <span className="sgp-notif-all-read-text">
                      <CheckCircle2 size={13} /> All alerts up to date
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = notifications.map((n) => String(n.audit_id));
                      localStorage.setItem("vms_guard_read_ids", JSON.stringify(allIds));
                      setUnreadCount(0);
                    }}
                    className="sgp-notif-mark-read-btn"
                    title="Mark all as read"
                  >
                    <Check size={13} /> Mark read
                  </button>
                )}
              </div>
            </div>

            <div className="sgp-notif-drawer-body">
              {notifications.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                  <Bell size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: "14px" }}>No recent registration alerts.</p>
                </div>
              ) : (
                notifications.map((item) => {
                  const actionUpper = String(item.action || "").toUpperCase();
                  const descUpper = String(item.description || "").toUpperCase();

                  const isIT =
                    actionUpper.includes("IT_") ||
                    descUpper.includes("[IT_VISIT]") ||
                    descUpper.includes("IT VISITOR");

                  const isRequestRaised = actionUpper.includes("REQUEST_RAISED") || descUpper.includes("REQUEST RAISED");
                  const isApproved = actionUpper.includes("APPROVED") || descUpper.includes("APPROVED");
                  const isRescheduled = actionUpper.includes("RESCHEDULED") || descUpper.includes("RESCHEDULED");
                  const isOnHold = !isRequestRaised && (actionUpper.includes("HOLD") || descUpper.includes("ON HOLD") || descUpper.includes("LOBBY") || descUpper.includes("WAIT IN") || descUpper.includes("WAITING IN"));
                  const isRejected = actionUpper.includes("REJECT") || descUpper.includes("REJECTED") || descUpper.includes("DENIED");
                  const isCheckedIn = actionUpper.includes("CHECKED_IN");
                  const isCheckedOut = actionUpper.includes("CHECKED_OUT");

                  let cardClass = isApproved
                    ? "approved-card"
                    : isRescheduled
                    ? "rescheduled-card"
                    : isOnHold
                    ? "on-hold-card"
                    : isRejected
                    ? "rejected-card"
                    : isCheckedIn
                    ? "checkedin-card"
                    : isCheckedOut
                    ? "checkedout-card"
                    : isIT
                    ? "it-card"
                    : "general-card";

                  let pillClass = isApproved
                    ? "approved"
                    : isRescheduled
                    ? "rescheduled"
                    : isOnHold
                    ? "on-hold"
                    : isRejected
                    ? "rejected"
                    : isCheckedIn
                    ? "checkedin"
                    : isCheckedOut
                    ? "checkedout"
                    : isIT
                    ? "it"
                    : "general";

                  let pillLabel = isApproved
                    ? "APPROVED · READY AT GATE"
                    : isRescheduled
                    ? "VISIT RESCHEDULED"
                    : isOnHold
                    ? "ON HOLD · HOST BUSY"
                    : isRejected
                    ? "ENTRY DENIED · REJECTED"
                    : isCheckedIn
                    ? "VISITOR CHECKED IN"
                    : isCheckedOut
                    ? "VISITOR CHECKED OUT"
                    : isIT
                    ? "IT VISITOR REGISTRATION"
                    : "VISITOR REGISTRATION";

                  const itemDate = parseAuditDate(item.created_at);

                  return (
                    <div key={item.audit_id} className={`sgp-notif-card ${cardClass}`}>
                      <div className="sgp-notif-card-header">
                        <span className={`sgp-notif-pill ${pillClass}`}>{pillLabel}</span>
                        <span className="sgp-notif-time">
                          {itemDate ? itemDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <p className="sgp-notif-desc">{item.description}</p>
                      <div className="sgp-notif-action-row">
                        {isApproved ? (
                          <button
                            type="button"
                            className="sgp-notif-action-btn"
                            onClick={() => {
                              setActiveTab("approved-queue");
                              setNotifDrawerOpen(false);
                            }}
                          >
                            <UserCheck size={13} />
                            <span>Go to Approved Queue</span>
                          </button>
                        ) : isRescheduled ? (
                          <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 600 }}>
                            📅 Rescheduled for next date
                          </span>
                        ) : isOnHold ? (
                          <span style={{ fontSize: "11px", color: "#f97316", fontWeight: 600 }}>
                            🛑 Host is busy · Visitor waiting in lobby
                          </span>
                        ) : isRejected ? (
                          <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 600 }}>
                            ❌ Entry denied by Admin/Host
                          </span>
                        ) : isCheckedIn ? (
                          <button
                            type="button"
                            className="sgp-notif-action-btn"
                            style={{ background: "#059669" }}
                            onClick={() => {
                              setActiveTab("active");
                              setNotifDrawerOpen(false);
                            }}
                          >
                            <Users size={13} />
                            <span>View Active Badge</span>
                          </button>
                        ) : isCheckedOut ? (
                          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                            🏁 Visit completed & checked out
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 600 }}>
                            ⏳ Awaiting Pre-Approval Clearance
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {!isMobile && (
        <>
          {/* TOP COMMAND BAR */}
      <header className="sgp-header">
        <div className="sgp-brand-group">
          <div className="sgp-brand-logo">
            <img src="/vms-logo.png" alt="VMS Logo" />
          </div>
          <div>
            <div className="sgp-title-row">
              <h1 className="sgp-title">VMS GATE SECURITY PORTAL</h1>
              <span className="sgp-badge-gate">GATE 01 · ACCESS DESK</span>
              <span className="sgp-badge-live">
                <span className="pulse-dot"></span> LIVE TELEMETRY
              </span>
            </div>
            <div className="sgp-subtitle">
              Security Guard Terminal · Check-In, Verification &amp; Checkout Operations
            </div>
          </div>
        </div>

        {/* Right Officer Status & Actions */}
        <div className="sgp-header-right">
          <button
            type="button"
            className={`sgp-notif-btn ${notifDrawerOpen ? "active" : ""}`}
            onClick={() => {
              setNotifDrawerOpen((prev) => !prev);
              fetchGuardNotifications();
            }}
            title="Live Registration & Pre-Approval Alerts"
          >
            <Bell size={15} />
            <span>Alerts</span>
            {unreadCount > 0 && <span className="sgp-notif-badge">{unreadCount}</span>}
          </button>

          <button
            type="button"
            className="sgp-theme-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#cbd5e1" />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

          <div className="sgp-clock-pill">
            <Clock size={14} color="#38bdf8" />
            <span>
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>

          <div className="sgp-officer-pill">
            <div className="sgp-officer-avatar">
              {currentUser?.email ? currentUser.email[0].toUpperCase() : "SG"}
            </div>
            <div>
              <span style={{ color: "#94a3b8", fontSize: "11px", display: "block" }}>Security Officer</span>
              <strong>{currentUser?.email || "Gate Officer"}</strong>
            </div>
          </div>

          <button
            type="button"
            className="sgp-logout-btn"
            onClick={onLogout}
            title="Sign out of gate terminal"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </header>

      {/* KPI METRIC STRIP BAR */}
      <section className="sgp-kpi-bar">
        <div
          className="sgp-kpi-item accent-emerald"
          onClick={() => setActiveTab("approved-queue")}
          title="Click to view all approved arrivals"
        >
          <div className="sgp-kpi-icon">
            <UserCheck size={22} />
          </div>
          <div className="sgp-kpi-content">
            <span className="sgp-kpi-label">Approved Arrivals Waiting</span>
            <span className="sgp-kpi-value">{approvedQueue.length}</span>
            <span className="sgp-kpi-subtext">Ready for gate clearance</span>
          </div>
        </div>

        <div
          className="sgp-kpi-item accent-blue"
          onClick={() => setActiveTab("active")}
          title="Click to view active visitors on-premises"
        >
          <div className="sgp-kpi-icon">
            <Users size={22} />
          </div>
          <div className="sgp-kpi-content">
            <span className="sgp-kpi-label">Currently Inside Premises</span>
            <span className="sgp-kpi-value">{activeVisits.length}</span>
            <span className="sgp-kpi-subtext">Active building badges</span>
          </div>
        </div>

        <div
          className="sgp-kpi-item accent-indigo"
          onClick={() => setActiveTab("kiosk")}
          title="View walk-in kiosk QR displays"
        >
          <div className="sgp-kpi-icon">
            <Laptop size={22} />
          </div>
          <div className="sgp-kpi-content">
            <span className="sgp-kpi-label">Self-Service Kiosks</span>
            <span className="sgp-kpi-value">2 Active QRs</span>
            <span className="sgp-kpi-subtext">General Visit &amp; IT Registration</span>
          </div>
        </div>

        <div
          className="sgp-kpi-item accent-cyan"
          onClick={() => setActiveTab("checkin")}
          title="Ready to scan passes"
        >
          <div className="sgp-kpi-icon">
            <Radio size={22} />
          </div>
          <div className="sgp-kpi-content">
            <span className="sgp-kpi-label">Gate Scanner Status</span>
            <span className="sgp-kpi-value sgp-kpi-status-live">
              <span className="pulse-dot"></span> Operational
            </span>
            <span className="sgp-kpi-subtext">Camera &amp; Token Ready</span>
          </div>
        </div>
      </section>

      {/* NAVIGATION TABS */}
      <div className="sgp-nav-wrapper">
        <nav className="sgp-segmented-nav">
          <button
            type="button"
            className={`sgp-tab-btn ${activeTab === "checkin" ? "active" : ""}`}
            onClick={() => setActiveTab("checkin")}
          >
            <QrCode size={16} />
            Scan &amp; Check-In Desk
          </button>

          <button
            type="button"
            className={`sgp-tab-btn ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            <Users size={16} />
            Active On-Premises &amp; Checkout
            {activeVisits.length > 0 && (
              <span className="sgp-tab-badge">
                {activeVisits.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`sgp-tab-btn ${activeTab === "approved-queue" ? "active" : ""}`}
            onClick={() => setActiveTab("approved-queue")}
          >
            <UserCheck size={16} />
            Today's Approved Entry Queue
            {approvedQueue.length > 0 && (
              <span className="sgp-tab-badge">
                {approvedQueue.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`sgp-tab-btn ${activeTab === "kiosk" ? "active" : ""}`}
            onClick={() => setActiveTab("kiosk")}
          >
            <Laptop size={16} />
            Visitor Registration Kiosk &amp; QR
          </button>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              background: "#ecfdf5",
              color: "#059669",
              border: "1px solid #a7f3d0",
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span className="pulse-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }}></span>
            Gate 01 Online
          </span>

          <button
            type="button"
            className="sgp-nav-refresh-pill"
            onClick={() => {
              fetchActiveVisits();
              fetchApprovedQueue();
              showToast("Gate telemetry & visitor queues refreshed.");
            }}
            title="Refresh active and pre-approved queues"
          >
            <RefreshCw size={13} className={queueLoading || activeLoading ? "spin" : ""} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="sgp-main">
        {/* ========================================================
            TAB 1: SCAN & CHECK-IN DESK
        ======================================================== */}
        {activeTab === "checkin" && (
          <div className="sgp-checkin-view">
            {verifiedVisit ? (
              <div className="sgp-dossier-wrapper">
                <div className="sgp-station-card">
                  {/* Status Gradient Banner */}
                  <div
                    className={`sgp-dossier-banner ${
                      rawStatus === "APPROVED"
                        ? "approved"
                        : rawStatus === "ACTIVE"
                        ? "active"
                        : rawStatus === "WAITING"
                        ? "waiting"
                        : rawStatus === "REJECTED"
                        ? "rejected"
                        : rawStatus === "CHECKED_OUT"
                        ? "checked_out"
                        : rawStatus === "RESCHEDULED"
                        ? "rescheduled"
                        : "pending"
                    }`}
                  >
                    <div>
                      <div className="sgp-dossier-banner-status">
                        {isIT ? "IT DEPARTMENT ACCESS PASS" : "GENERAL VISITOR PASS"} · GATE VERIFICATION
                      </div>
                      <h2 className="sgp-dossier-banner-headline">
                        {rawStatus === "APPROVED"
                          ? "✓ CLEARANCE APPROVED · AUTHORIZE ENTRY"
                          : rawStatus === "ACTIVE"
                          ? "● VISITOR IS CURRENTLY ON PREMISES"
                          : rawStatus === "WAITING"
                          ? "⏸ HOST IS CURRENTLY BUSY · HOLD AT GATE"
                          : rawStatus === "REJECTED"
                          ? "✕ ACCESS REJECTED · DO NOT ADMIT"
                          : rawStatus === "CHECKED_OUT"
                          ? "✓ VISIT CONCLUDED · VISITOR HAS CHECKED OUT"
                          : rawStatus === "RESCHEDULED"
                          ? "📅 HOST ABSENT · VISIT RESCHEDULED"
                          : "⏳ PENDING ADMIN APPROVAL · HOLD AT GATE"}
                      </h2>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setVerifiedVisit(null);
                          setSearchQuery("");
                          setSearchError("");
                          setStatusMessage("");
                        }}
                        style={{
                          background: "rgba(255, 255, 255, 0.2)",
                          color: "#ffffff",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Scan Next Visitor
                      </button>
                    </div>
                  </div>

                  {/* Dossier Body */}
                  <div className="sgp-dossier-body">
                    {/* Visitor Photo & Primary Identity */}
                    <div className="sgp-id-split">
                      <div
                        className="sgp-photo-box"
                        onClick={() => {
                          const url = resolvePhotoUrl(verifiedVisit.visitor?.photo_url || verifiedVisit.photo_url);
                          if (url) setLightboxImage(url);
                        }}
                        title="Click to zoom visitor photo"
                      >
                        {verifiedVisit.visitor?.photo_url || verifiedVisit.photo_url ? (
                          <>
                            <img
                              src={resolvePhotoUrl(verifiedVisit.visitor?.photo_url || verifiedVisit.photo_url)}
                              alt="Visitor official capture"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fb = e.currentTarget.parentElement?.querySelector(".sgp-photo-failed");
                                if (fb) fb.style.display = "flex";
                              }}
                            />
                            <div
                              className="sgp-photo-failed"
                              style={{
                                display: "none",
                                width: "100%",
                                height: "100%",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                background: "#f1f5f9",
                                color: "#64748b",
                                textAlign: "center",
                              }}
                            >
                              <User size={36} color="#94a3b8" />
                              <span style={{ fontSize: "11px", marginTop: "4px", fontWeight: 600 }}>
                                {verifiedVisit.visitor?.first_name || "Visitor"}
                              </span>
                            </div>
                            <div className="sgp-photo-zoom-hint">
                              <Maximize2 size={11} /> Zoom
                            </div>
                          </>
                        ) : (
                          <div style={{ textAlign: "center", color: "#94a3b8" }}>
                            <Camera size={28} style={{ margin: "0 auto 4px", display: "block" }} />
                            <span style={{ fontSize: "11px" }}>No photo</span>
                          </div>
                        )}
                      </div>

                      <div className="sgp-visitor-meta">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span
                            style={{
                              background: "#e2e8f0",
                              color: "#334155",
                              fontSize: "11px",
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            VISIT ID: #{String(verifiedVisit.visit_id).slice(0, 8)}
                          </span>
                          {isIT && (
                            <span
                              style={{
                                background: "#ede9fe",
                                color: "#6d28d9",
                                fontSize: "11px",
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: "4px",
                              }}
                            >
                              IT DEPARTMENT
                            </span>
                          )}
                        </div>

                        <h3 className="sgp-visitor-name">
                          {verifiedVisit.visitor?.first_name} {verifiedVisit.visitor?.last_name}
                        </h3>

                        <div className="sgp-meta-grid">
                          <div className="sgp-meta-item">
                            <Phone size={14} color="#64748b" />
                            <span>Phone: <strong>{verifiedVisit.visitor?.phone_number || "—"}</strong></span>
                          </div>

                          <div className="sgp-meta-item">
                            <Mail size={14} color="#64748b" />
                            <span>Email: <strong>{verifiedVisit.visitor?.email || "—"}</strong></span>
                          </div>

                          <div className="sgp-meta-item">
                            <Building2 size={14} color="#64748b" />
                            <span>Company: <strong>{verifiedVisit.visitor?.company_name || "Individual / Self"}</strong></span>
                          </div>

                          <div className="sgp-meta-item">
                            <MapPin size={14} color="#64748b" />
                            <span>Address: <strong>{verifiedVisit.visitor?.address || "On file"}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Host & Appointment Clearance */}
                    <div className="sgp-section-title">
                      <Building2 size={14} /> Host Employee &amp; Clearance Details
                    </div>

                    <div className="sgp-host-card">
                      <div>
                        <span style={{ fontSize: "11.5px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                          Host Official
                        </span>
                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                          {verifiedVisit.host_employee?.first_name} {verifiedVisit.host_employee?.last_name}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#2563eb", marginTop: "2px" }}>
                          Department: {verifiedVisit.host_employee?.department || "General"}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "11.5px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                          Stated Visit Purpose
                        </span>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginTop: "2px", maxWidth: "280px" }}>
                          {verifiedVisit.purpose || "Official Business Meeting"}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "11.5px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                          Expected Check-In
                        </span>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>
                          {formatDateTime(verifiedVisit.expected_in_time || verifiedVisit.check_in_time)}
                        </div>
                      </div>
                    </div>

                    {/* Declared Hardware & Assets */}
                    <div className="sgp-section-title">
                      <Laptop size={14} /> Declared Hardware Assets &amp; Laptops ({visitAssets.length})
                    </div>

                    {visitAssets.length === 0 ? (
                      <div
                        style={{
                          padding: "14px",
                          background: "#f8fafc",
                          borderRadius: "10px",
                          border: "1px dashed #cbd5e1",
                          color: "#64748b",
                          fontSize: "12.5px",
                          marginBottom: "24px",
                        }}
                      >
                        No physical assets or laptops declared for this visit.
                      </div>
                    ) : (
                      <div className="sgp-asset-list">
                        {visitAssets.map((asset) => {
                          const assetPhoto = resolvePhotoUrl(asset.photo_url || asset.asset_photo_url);
                          return (
                          <div key={asset.asset_id} className="sgp-asset-item">
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              {assetPhoto ? (
                                <img
                                  src={assetPhoto}
                                  alt="Asset"
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "10px",
                                    objectFit: "cover",
                                    border: "1px solid #cbd5e1",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                                  }}
                                  onClick={() => setLightboxImage(assetPhoto)}
                                  title="Click to zoom hardware photo"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fb = e.currentTarget.parentElement?.querySelector(".sgp-asset-fb");
                                    if (fb) fb.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="sgp-asset-fb"
                                style={{
                                  display: assetPhoto ? "none" : "flex",
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "8px",
                                  background: "#e2e8f0",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#475569",
                                }}
                              >
                                <Laptop size={20} />
                              </div>
                              <div>
                                <strong style={{ fontSize: "13.5px", color: "#0f172a" }}>
                                  {asset.asset_type || "Hardware Asset"} · {asset.brand_model || "Declared Item"}
                                </strong>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                  Serial: <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: "4px" }}>{asset.serial_number || "N/A"}</code>
                                </div>
                              </div>
                            </div>

                            <div>
                              {(() => {
                                const isRetained = (asset.cleared_by && asset.cleared_by.includes("RETAINED")) || asset.disposition === "RETAINED_ON_PREMISES";
                                return (
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {isRetained ? (
                                      <span
                                        style={{
                                          fontSize: "11.5px",
                                          fontWeight: 700,
                                          padding: "4px 10px",
                                          borderRadius: "12px",
                                          background: "#eff6ff",
                                          color: "#1d4ed8",
                                          border: "1px solid #bfdbfe",
                                        }}
                                        title={asset.cleared_by || "Retained in Facility"}
                                      >
                                        📦 Retained in Facility
                                      </span>
                                    ) : asset.is_cleared_for_exit ? (
                                      <span
                                        style={{
                                          fontSize: "11.5px",
                                          fontWeight: 700,
                                          padding: "4px 10px",
                                          borderRadius: "12px",
                                          background: "#ecfdf5",
                                          color: "#059669",
                                          border: "1px solid #a7f3d0",
                                        }}
                                      >
                                        ✓ Cleared for Exit
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: "11.5px",
                                          fontWeight: 700,
                                          padding: "4px 10px",
                                          borderRadius: "12px",
                                          background: "#fef3c7",
                                          color: "#b45309",
                                          border: "1px solid #fde68a",
                                        }}
                                      >
                                        ⚠️ Inspection on Exit
                                      </span>
                                    )}

                                    {rawStatus === "ACTIVE" && (
                                      <div style={{ display: "inline-flex", gap: "4px" }}>
                                        {!asset.is_cleared_for_exit && (
                                          <button
                                            type="button"
                                            onClick={() => handleClearAsset(asset.asset_id)}
                                            disabled={clearingAsset === asset.asset_id}
                                            style={{
                                              background: "#0284c7",
                                              color: "white",
                                              border: "none",
                                              borderRadius: "6px",
                                              padding: "4px 8px",
                                              fontSize: "11px",
                                              fontWeight: 700,
                                              cursor: "pointer",
                                            }}
                                            title="Authorize departure exit clearance"
                                          >
                                            {clearingAsset === asset.asset_id ? "Clearing..." : "Authorize Exit"}
                                          </button>
                                        )}

                                        {!isRetained && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const note = prompt("Enter retention note or location for " + (asset.brand_model || asset.asset_type) + ":", "Installed on campus / kept in use");
                                              if (note !== null) {
                                                handleSetAssetDisposition(asset.asset_id, "RETAINED_ON_PREMISES", note);
                                              }
                                            }}
                                            disabled={clearingAsset === asset.asset_id}
                                            style={{
                                              background: "#f8fafc",
                                              color: "#1d4ed8",
                                              border: "1px solid #bfdbfe",
                                              borderRadius: "6px",
                                              padding: "4px 8px",
                                              fontSize: "11px",
                                              fontWeight: 700,
                                              cursor: "pointer",
                                            }}
                                            title="Mark asset as retained on premises / installed"
                                          >
                                            📦 Retain
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}

                    
                    {/* HIDDEN PRINT-ONLY PASS FOR EXECUTIVE PDF/PRINT EXPORT */}
                    {verifiedVisit && (
                      <div className="sgp-printable-pass no-screen">
                        <div className="pass-print-header">
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: 44, height: 44, background: "#0f172a", color: "#ffffff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, border: "1px solid #e43b24" }}>VMS</div>
                            <div>
                              <h2 className="pass-brand-h1">Gate Security Clearance Pass</h2>
                              <p className="pass-brand-sub">Gate 01 Access Terminal · Official Admission Authorization</p>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ display: "block", fontSize: "9px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Pass Reference</span>
                            <strong style={{ fontSize: "15px", color: "#e43b24", fontFamily: "monospace" }}>#{verifiedVisit.visit_id}</strong>
                          </div>
                        </div>

                        <div className="pass-info-grid">
                          <div className="pass-meta-cell">
                            <small>Visitor Name</small>
                            <strong>{verifiedVisit.visitor?.first_name} {verifiedVisit.visitor?.last_name}</strong>
                          </div>
                          <div className="pass-meta-cell">
                            <small>Organization / Firm</small>
                            <strong>{verifiedVisit.visitor?.company_name || "Independent"}</strong>
                          </div>
                          <div className="pass-meta-cell">
                            <small>Host Official &amp; Dept</small>
                            <strong>{verifiedVisit.host_employee?.name || "Official Host"} ({verifiedVisit.host_employee?.department || "General"})</strong>
                          </div>
                          <div className="pass-meta-cell">
                            <small>Purpose of Visit</small>
                            <strong>{verifiedVisit.purpose || "Official Visit"}</strong>
                          </div>
                          <div className="pass-meta-cell">
                            <small>Gate Clearance Status</small>
                            <strong style={{ color: "#059669" }}>{verifiedVisit.status || "ACTIVE"}</strong>
                          </div>
                          <div className="pass-meta-cell">
                            <small>Issuing Officer</small>
                            <strong>{currentUser?.email || "Security Desk"}</strong>
                          </div>
                        </div>

                        {Array.isArray(visitAssets) && visitAssets.length > 0 && (
                          <table className="pass-assets-table">
                            <thead>
                              <tr>
                                <th>Declared Item / Laptop</th>
                                <th>Brand &amp; Model</th>
                                <th>Serial Number</th>
                                <th>Clearance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visitAssets.map((asset, idx) => (
                                <tr key={asset.asset_id || idx}>
                                  <td><strong>{asset.asset_type || "Hardware"}</strong></td>
                                  <td>{asset.brand_model || "—"}</td>
                                  <td><code>{asset.serial_number || "—"}</code></td>
                                  <td>{asset.is_cleared_for_exit ? "Cleared for Exit" : "In Premises Custody"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

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

                        <p className="pass-print-disclaimer">
                          This security clearance pass confirms physical identity verification, gate authorization, and declared equipment registration.
                          Official document generated by VMS Enterprise Gate Security System.
                        </p>
                      </div>
                    )}

                    {/* Primary Gate Action Center */}
                    <div className="sgp-action-footer">
                      {rawStatus === "APPROVED" ? (
                        <div>
                          <button
                            type="button"
                            className="sgp-btn-checkin-huge"
                            disabled={checkingIn}
                            onClick={() => handleCheckInVisitor(verifiedVisit.visit_id)}
                          >
                            {checkingIn ? (
                              <>
                                <RefreshCw size={20} className="spin" /> AUTHORIZING GATE ENTRY...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={22} /> CONFIRM IDENTITY &amp; AUTHORIZE GATE ENTRY
                              </>
                            )}
                          </button>
                          <p style={{ margin: "10px 0 0", textAlign: "center", fontSize: "12.5px", color: "#059669", fontWeight: 700 }}>
                            ✓ Clearance confirmed by administration. Press to record admission timestamp and activate physical badge.
                          </p>
                        </div>
                      ) : rawStatus === "PENDING" ? (
                        <div className="sgp-notice-box pending" style={{ background: "#fffbeb", border: "1.5px solid #fde68a", color: "#92400e", padding: "18px 24px", borderRadius: "12px", textAlign: "center", width: "100%" }}>
                          <Hourglass size={30} color="#d97706" style={{ margin: "0 auto 10px", display: "block" }} />
                          <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800, color: "#b45309" }}>
                            ENTRY NOT AUTHORIZED · AWAITING ADMIN CLEARANCE
                          </h4>
                          <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#78350f", lineHeight: "1.5" }}>
                            This visitor registration is currently pending review. Gate entry cannot be authorized until Administration or the Host Employee approves the request in the Pre-Approvals desk.
                          </p>
                          <button
                            type="button"
                            onClick={() => verifyVisitorByInput(verifiedVisit.visit_id)}
                            style={{
                              background: "#d97706",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              padding: "9px 20px",
                              fontSize: "12.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              margin: "0 auto",
                            }}
                          >
                            <RefreshCw size={14} />
                            Check Approval Status
                          </button>
                        </div>
                      ) : rawStatus === "RESCHEDULED" ? (
                        <div className="sgp-notice-box waiting" style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", color: "#1e40af", padding: "18px 24px", borderRadius: "12px", textAlign: "center", width: "100%" }}>
                          <CalendarClock size={30} color="#2563eb" style={{ margin: "0 auto 10px", display: "block" }} />
                          <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800, color: "#1d4ed8" }}>
                            HOST ABSENT · VISIT RESCHEDULED
                          </h4>
                          <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#1e3a8a", lineHeight: "1.5" }}>
                            The host is absent today and this visit has been rescheduled. Gate entry is not permitted for today.
                          </p>
                          <button
                            type="button"
                            onClick={() => verifyVisitorByInput(verifiedVisit.visit_id)}
                            style={{
                              background: "#2563eb",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              padding: "9px 20px",
                              fontSize: "12.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              margin: "0 auto",
                            }}
                          >
                            <RefreshCw size={14} />
                            Check Updated Schedule
                          </button>
                        </div>
                      ) : rawStatus === "WAITING" ? (
                        <div className="sgp-notice-box waiting">
                          <Clock size={28} color="#ea580c" style={{ margin: "0 auto 8px" }} />
                          <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 800 }}>
                            CHECK-IN ON HOLD: HOST IS OCCUPIED / BUSY
                          </h4>
                          <p style={{ margin: "0 0 12px", fontSize: "13px" }}>
                            The administrator or host has requested this visitor to wait in the reception area. Do not admit until status is changed to Approved.
                          </p>
                          <button
                            type="button"
                            onClick={() => verifyVisitorByInput(verifiedVisit.visit_id)}
                            style={{
                              background: "#ea580c",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              padding: "8px 16px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <RefreshCw size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
                            Check if Host is Ready
                          </button>
                        </div>
                      ) : rawStatus === "REJECTED" ? (
                        <div className="sgp-notice-box rejected">
                          <XCircle size={28} color="#dc2626" style={{ margin: "0 auto 8px" }} />
                          <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 800 }}>
                            ENTRY DENIED: REQUEST HAS BEEN REJECTED
                          </h4>
                          <p style={{ margin: 0, fontSize: "13px" }}>
                            This visit request was declined by the host or administration. Do not grant entry badge or admit through the security gate.
                          </p>
                        </div>
                      ) : rawStatus === "ACTIVE" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
                          <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", flexShrink: 0 }}>
                              <LogOut size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: "0 0 3px", fontSize: "15px", fontWeight: 800, color: "#991b1b" }}>
                                GATE DEPARTURE SCAN · VISITOR IS CURRENTLY CHECKED IN
                              </h4>
                              <p style={{ margin: 0, fontSize: "12.5px", color: "#b91c1c" }}>
                                The visitor has arrived at the security gate to exit. Inspect any declared hardware assets above, then authorize physical gate departure.
                              </p>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="primary-button"
                              style={{ flex: 2, minWidth: "240px", background: "#dc2626", padding: "15px 22px", fontSize: "14.5px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)" }}
                              disabled={checkoutLoading === verifiedVisit.visit_id}
                              onClick={() => handleCheckoutVisitor(verifiedVisit.visit_id)}
                            >
                              <LogOut size={18} />
                              {checkoutLoading === verifiedVisit.visit_id ? "PROCESSING GATE CHECK-OUT..." : "CONFIRM EXIT & AUTHORIZE GATE CHECK-OUT"}
                            </button>

                            {Array.isArray(visitAssets) && visitAssets.some((a) => a && !a.is_cleared_for_exit) && (
                              <button
                                type="button"
                                style={{ background: "#0284c7", color: "#ffffff", border: "none", borderRadius: "10px", padding: "14px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                disabled={checkoutLoading === verifiedVisit.visit_id}
                                onClick={() => handleCheckoutVisitor(verifiedVisit.visit_id, true)}
                                title="Quickly clear all declared laptops and complete checkout"
                              >
                                <CheckCircle2 size={16} />
                                Clear All Assets &amp; Exit
                              </button>
                            )}

                            <button
                              type="button"
                              className="back-button"
                              onClick={() => window.print()}
                              style={{ padding: "14px 20px" }}
                            >
                              <Printer size={16} /> Print Pass
                            </button>
                          </div>
                        </div>
                      ) : rawStatus === "CHECKED_OUT" ? (
                        <div className="sgp-notice-box checked_out">
                          <CheckCircle2 size={32} color="#059669" style={{ margin: "0 auto 8px" }} />
                          <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>
                            VISIT CONCLUDED · VISITOR HAS CHECKED OUT
                          </h4>
                          <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#64748b", maxWidth: "440px", marginLeft: "auto", marginRight: "auto" }}>
                            This visitor has completed their visit and departed through the gate. All entry passes and declared hardware assets have been finalized.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setVerifiedVisit(null);
                              setSearchQuery("");
                              setSearchError("");
                              setStatusMessage("");
                            }}
                            style={{
                              background: "#2563eb",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "10px",
                              padding: "10px 22px",
                              fontSize: "13px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                            }}
                          >
                            <RefreshCw size={14} />
                            Scan or Lookup Next Visitor
                          </button>
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                          Current Visit Status: <strong>{rawStatus}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="sgp-terminal-wrapper">
                <div className="sgp-terminal-grid">
                  {/* Left Column: Unified Gate Clearance Terminal Card */}
                  <div className="sgp-card sgp-terminal-card">
                    <div className="sgp-card-header">
                      <div>
                        <h3 className="sgp-card-title">
                          <QrCode size={18} color="#2563eb" />
                          Gate Clearance &amp; Pass Lookup
                        </h3>
                        <p className="sgp-card-desc">
                          Scan digital QR pass or search by visitor name, phone number, or pass token.
                        </p>
                      </div>
                      <span
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          padding: "3px 9px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Terminal Ready
                      </span>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        verifyVisitorByInput(searchQuery);
                      }}
                      className="sgp-search-box"
                    >
                      <div className="sgp-input-wrap">
                        <Search size={16} className="sgp-input-icon" />
                        <input
                          type="text"
                          placeholder="Search name, phone, or token..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="sgp-input-field"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="sgp-input-clear"
                            title="Clear input"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="sgp-btn-verify"
                        disabled={searchLoading || !searchQuery.trim()}
                      >
                        {searchLoading ? <RefreshCw size={15} className="spin" /> : "Verify Pass"}
                      </button>
                    </form>

                    {/* Quick Search Helper Chips */}
                    <div className="sgp-quick-chips">
                      <span className="sgp-chip-label">Quick filter:</span>
                      <button
                        type="button"
                        className="sgp-chip"
                        onClick={() => {
                          if (approvedQueue.length > 0 && approvedQueue[0].visitor?.phone_number) {
                            setSearchQuery(approvedQueue[0].visitor.phone_number);
                            verifyVisitorByInput(approvedQueue[0].visitor.phone_number);
                          } else {
                            showToast("Enter a phone number to search.");
                          }
                        }}
                      >
                        <Phone size={11} /> By Phone
                      </button>
                      <button
                        type="button"
                        className="sgp-chip"
                        onClick={() => {
                          if (approvedQueue.length > 0 && approvedQueue[0].visitor?.first_name) {
                            setSearchQuery(approvedQueue[0].visitor.first_name);
                            verifyVisitorByInput(approvedQueue[0].visitor.first_name);
                          } else {
                            showToast("Enter a visitor name to search.");
                          }
                        }}
                      >
                        <User size={11} /> By Name
                      </button>
                      <button
                        type="button"
                        className="sgp-chip"
                        onClick={() => {
                          if (approvedQueue.length > 0 && approvedQueue[0].visit_id) {
                            setSearchQuery(String(approvedQueue[0].visit_id));
                            verifyVisitorByInput(approvedQueue[0].visit_id);
                          } else {
                            showToast("Enter a pass token to search.");
                          }
                        }}
                      >
                        <Radio size={11} /> By Token
                      </button>
                    </div>

                    <button
                      type="button"
                      className={`sgp-btn-camera ${scannerActive ? "active" : ""}`}
                      onClick={() => setScannerActive((v) => !v)}
                    >
                      <Camera size={16} />
                      {scannerActive ? "Close Webcam Scanner" : "Activate Webcam QR Scanner"}
                    </button>

                    {scannerActive && (
                      <div className="sgp-camera-container" style={{ position: "relative", overflow: "hidden", borderRadius: "10px" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 14px",
                          background: "#0f172a",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                          color: "#f8fafc"
                        }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                            {availableCameras.find(d => d.id === selectedCameraId)?.label || (facingMode === "environment" ? "Back / External Camera" : "Front / User Camera")}
                          </span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={handleSwitchCamera}
                              style={{
                                padding: "5px 12px",
                                background: "rgba(255, 255, 255, 0.12)",
                                color: "#fff",
                                border: "1px solid rgba(255, 255, 255, 0.25)",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                              title="Switch camera device / facing mode"
                            >
                              <RefreshCw size={12} /> Switch Camera
                            </button>
                            <button
                              type="button"
                              onClick={toggleFlash}
                              style={{
                                padding: "5px 12px",
                                background: flashOn ? "#2563eb" : "rgba(255, 255, 255, 0.12)",
                                color: "#fff",
                                border: "1px solid rgba(255, 255, 255, 0.25)",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                              title="Toggle Torch / Flashlight"
                            >
                              <Flashlight size={12} /> {flashOn ? "Torch On" : "Torch"}
                            </button>
                          </div>
                        </div>
                        <div id="security-camera-reader" style={{ width: "100%" }}></div>
                      </div>
                    )}

                    {searchError && (
                      <div className="sgp-alert-box error">
                        <XCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{searchError}</span>
                      </div>
                    )}

                    {statusMessage && (
                      <div className="sgp-alert-box success">
                        <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                        <span>{statusMessage}</span>
                      </div>
                    )}

                    {/* Integrated Terminal Security Strip */}
                    <div className="sgp-terminal-info-strip">
                      <div className="sgp-terminal-info-item">
                        <span className="sgp-info-key">Terminal Station</span>
                        <strong className="sgp-info-val">GATE 01 · Access Desk</strong>
                      </div>
                      <div className="sgp-terminal-info-item">
                        <span className="sgp-info-key">System Status</span>
                        <strong className="sgp-info-val text-emerald">● Online &amp; Clear</strong>
                      </div>
                      <div className="sgp-terminal-info-item">
                        <span className="sgp-info-key">Fast Shortcut</span>
                        <strong className="sgp-info-val">Press Enter to Verify</strong>
                      </div>
                    </div>

                    {/* Quick Kiosk Launch Shortcuts */}
                    <div className="sgp-kiosk-shortcuts-row">
                      <button
                        type="button"
                        className="sgp-kiosk-shortcut-btn"
                        onClick={() => window.open("/register-visitor", "_blank")}
                        title="Open Visitor Registration Kiosk in new tab"
                      >
                        <ExternalLink size={13} color="#2563eb" />
                        <span>General Walk-in Kiosk</span>
                      </button>

                      <button
                        type="button"
                        className="sgp-kiosk-shortcut-btn"
                        onClick={() => window.open("/it-visit", "_blank")}
                        title="Open IT Technical Visit Registration in new tab"
                      >
                        <ExternalLink size={13} color="#7c3aed" />
                        <span>IT Technical Pass Kiosk</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Today's Approved Arrivals & Immediate Action Console */}
                  <div className="sgp-card sgp-queue-side-card">
                    <div className="sgp-queue-side-header">
                      <div>
                        <h3 className="sgp-card-title">
                          <UserCheck size={18} color="#059669" />
                          Expected Arrivals Today
                        </h3>
                        <p className="sgp-card-desc">
                          Pre-approved visitors awaiting entry · 1-click clearance
                        </p>
                      </div>
                      <span className="sgp-side-count-badge">
                        {approvedQueue.length} Waiting
                      </span>
                    </div>

                    {approvedQueue.length > 0 ? (
                      <div className="sgp-queue-side-list">
                        {approvedQueue.map((item) => {
                          const isItemIT = (item.purpose || "").includes("[IT_VISIT]");
                          const visitorName = `${item.visitor?.first_name || ""} ${item.visitor?.last_name || ""}`.trim() || "Visitor";
                          const company = item.visitor?.company_name || "Self";
                          const hostName = item.host_employee ? `${item.host_employee.first_name || ""} ${item.host_employee.last_name || ""}`.trim() : "Host Assigned";

                          return (
                            <div key={item.pre_approval_id || item.visit_id} className="sgp-queue-side-item">
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                                <div
                                  style={{
                                    width: "34px",
                                    height: "34px",
                                    borderRadius: "9px",
                                    background: isItemIT ? "#f5f3ff" : "#ecfdf5",
                                    color: isItemIT ? "#7c3aed" : "#059669",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                    fontSize: "12px",
                                    flexShrink: 0,
                                    border: isItemIT ? "1px solid #ddd6fe" : "1px solid #a7f3d0",
                                  }}
                                >
                                  {visitorName[0] ? visitorName[0].toUpperCase() : "V"}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {visitorName}
                                  </strong>
                                  <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                                    {company} · Host: {hostName}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="sgp-btn-quick-admit"
                                onClick={() => {
                                  verifyVisitorByInput(item.visit_id || item.visitor?.phone_number);
                                }}
                                title="Inspect dossier & check-in visitor"
                              >
                                <CheckCircle2 size={13} />
                                Verify
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="sgp-queue-side-empty">
                        <CheckCircle2 size={32} color="#059669" style={{ margin: "0 auto 8px" }} />
                        <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                          Pre-Approval Queue Clear
                        </h4>
                        <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#64748b" }}>
                          No visitors waiting in queue. Scan walk-in QR or search passes above.
                        </p>

                        <div className="sgp-side-stat-grid">
                          <div className="sgp-side-stat-box">
                            <span className="sgp-side-stat-num">{activeVisits.length}</span>
                            <span className="sgp-side-stat-lbl">Currently Inside</span>
                            <button
                              type="button"
                              className="sgp-side-stat-btn"
                              onClick={() => setActiveTab("active")}
                            >
                              <Users size={11} /> View List
                            </button>
                          </div>

                          <div className="sgp-side-stat-box">
                            <span className="sgp-side-stat-num">2</span>
                            <span className="sgp-side-stat-lbl">Active Kiosks</span>
                            <button
                              type="button"
                              className="sgp-side-stat-btn"
                              onClick={() => setActiveTab("kiosk")}
                            >
                              <Laptop size={11} /> View QRs
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* ========================================================
            TAB 2: ACTIVE ON-PREMISES & GATE CHECKOUT
        ======================================================== */}
        {activeTab === "active" && (
          <div className="sgp-table-card">
            <div className="sgp-table-header">
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>
                  Active Visitors Inside Premises
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  {activeVisits.length} visitor{activeVisits.length === 1 ? "" : "s"} currently authorized on site · Conduct asset inspections and record departures.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div className="sgp-input-wrap" style={{ width: "280px" }}>
                  <Search size={15} className="sgp-input-icon" />
                  <input
                    type="text"
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    placeholder="Filter by name, company, host..."
                    className="sgp-input-field"
                    style={{ padding: "8px 30px 8px 34px", fontSize: "13px" }}
                  />
                  {activeFilter && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter("")}
                      className="sgp-input-clear"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="it-refresh-btn"
                  onClick={fetchActiveVisits}
                  disabled={activeLoading}
                  title="Refresh active visitors"
                >
                  <RefreshCw size={14} className={activeLoading ? "spin" : ""} />
                </button>
              </div>
            </div>

            {activeLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                <RefreshCw size={24} className="spin" style={{ margin: "0 auto 8px", display: "block" }} />
                Loading on-site visitors...
              </div>
            ) : activeVisits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                <Users size={36} color="#94a3b8" style={{ margin: "0 auto 10px", display: "block" }} />
                <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "#334155" }}>No Active Visitors On Site</h4>
                <p style={{ margin: 0, fontSize: "13px" }}>No visitors are currently checked in inside the facility.</p>
              </div>
            ) : (
              <div className="sgp-table-wrap">
                <table className="sgp-table">
                  <thead>
                    <tr>
                      <th>Visitor Identity</th>
                      <th>Host / Department</th>
                      <th>Visit Category &amp; Purpose</th>
                      <th>Check-In &amp; Duration</th>
                      <th>Hardware Asset Clearance</th>
                      <th style={{ textAlign: "right" }}>Gate Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeVisits
                      .filter((v) => {
                        if (!activeFilter.trim()) return true;
                        const q = activeFilter.toLowerCase();
                        const name = `${v.visitor?.first_name || ""} ${v.visitor?.last_name || ""}`.toLowerCase();
                        const host = `${v.host_employee?.first_name || ""} ${v.host_employee?.last_name || ""}`.toLowerCase();
                        const purp = (v.purpose || "").toLowerCase();
                        const comp = (v.visitor?.company_name || "").toLowerCase();
                        return name.includes(q) || host.includes(q) || purp.includes(q) || comp.includes(q);
                      })
                      .map((visit) => {
                        const isVisitIT = (visit.purpose || "").includes("[IT_VISIT]");
                        const hasUnclearedAssets =
                          visit.assets && visit.assets.some((a) => !a.is_cleared_for_exit);

                        return (
                          <tr key={visit.visit_id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "10px",
                                    background: "#e0e7ff",
                                    color: "#3730a3",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                    fontSize: "13px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {visit.visitor?.first_name ? visit.visitor.first_name[0].toUpperCase() : "V"}
                                </div>
                                <div>
                                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                                    {visit.visitor?.first_name} {visit.visitor?.last_name}
                                  </strong>
                                  <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                                    {visit.visitor?.company_name || "Individual"} · {visit.visitor?.phone_number}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                                {visit.host_employee?.first_name} {visit.host_employee?.last_name}
                              </strong>
                              <div style={{ fontSize: "11.5px", color: "#2563eb", fontWeight: 600 }}>
                                {visit.host_employee?.department || "General"}
                              </div>
                            </td>
                            <td>
                              <div style={{ maxWidth: "220px", fontSize: "12.5px", color: "#334155" }}>
                                {visit.purpose}
                              </div>
                              {isVisitIT && (
                                <span
                                  style={{
                                    display: "inline-block",
                                    marginTop: "3px",
                                    fontSize: "10.5px",
                                    fontWeight: 700,
                                    background: "#ede9fe",
                                    color: "#6d28d9",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  IT Hardware Visit
                                </span>
                              )}
                            </td>
                            <td>
                              <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a" }}>
                                {visit.check_in_time ? new Date(visit.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#059669", fontWeight: 600 }}>
                                {formatElapsed(visit.check_in_time)}
                              </div>
                            </td>
                            <td>
                              {visit.assets && visit.assets.length > 0 ? (
                                <div>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 800,
                                      padding: "3px 8px",
                                      borderRadius: "10px",
                                      background: hasUnclearedAssets ? "#fef3c7" : "#ecfdf5",
                                      color: hasUnclearedAssets ? "#b45309" : "#059669",
                                      border: `1px solid ${hasUnclearedAssets ? "#fde68a" : "#a7f3d0"}`,
                                    }}
                                  >
                                    {hasUnclearedAssets ? "⚠️ Inspection Required" : "✓ Assets Inspected"}
                                  </span>
                                  {hasUnclearedAssets && (
                                    <div style={{ marginTop: "4px" }}>
                                      {visit.assets
                                        .filter((a) => !a.is_cleared_for_exit)
                                        .map((asset) => (
                                          <button
                                            key={asset.asset_id}
                                            type="button"
                                            onClick={() => handleClearAsset(asset.asset_id)}
                                            disabled={clearingAsset === asset.asset_id}
                                            style={{
                                              display: "block",
                                              marginTop: "3px",
                                              background: "#e0f2fe",
                                              border: "1px solid #bae6fd",
                                              color: "#0369a1",
                                              fontSize: "10.5px",
                                              fontWeight: 600,
                                              padding: "2px 6px",
                                              borderRadius: "4px",
                                              cursor: "pointer",
                                            }}
                                          >
                                            Clear {asset.asset_type} ({asset.brand_model || "Device"})
                                          </button>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: "12px" }}>No assets declared</span>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className="primary-button"
                                style={{
                                  background: "#ef4444",
                                  padding: "7px 14px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                }}
                                disabled={checkoutLoading === visit.visit_id}
                                onClick={() => handleCheckoutVisitor(visit.visit_id)}
                              >
                                {checkoutLoading === visit.visit_id ? "Processing..." : "Check Out"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: TODAY'S APPROVED ENTRY QUEUE
        ======================================================== */}
        {activeTab === "approved-queue" && (
          <div className="sgp-table-card">
            <div className="sgp-table-header">
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>
                  Today's Approved Entry Queue (Awaiting Arrival)
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  {approvedQueue.length} pre-approved visitor{approvedQueue.length === 1 ? "" : "s"} cleared by Admin · Authorize gate check-in upon their arrival.
                </p>
              </div>

              <button
                type="button"
                className="it-refresh-btn"
                onClick={fetchApprovedQueue}
                disabled={queueLoading}
                title="Refresh approved queue"
              >
                <RefreshCw size={14} className={queueLoading ? "spin" : ""} />
              </button>
            </div>

            {queueLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                <RefreshCw size={24} className="spin" style={{ margin: "0 auto 8px", display: "block" }} />
                Loading approved requests...
              </div>
            ) : approvedQueue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                <CheckCircle2 size={36} color="#059669" style={{ margin: "0 auto 10px", display: "block" }} />
                <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "#334155" }}>Queue All Clear</h4>
                <p style={{ margin: 0, fontSize: "13px" }}>No approved visitors are currently waiting in the gate queue.</p>
              </div>
            ) : (
              <div className="sgp-table-wrap">
                <table className="sgp-table">
                  <thead>
                    <tr>
                      <th>Visitor Identity</th>
                      <th>Host / Department</th>
                      <th>Purpose &amp; Declared Assets</th>
                      <th>Expected Arrival</th>
                      <th>Admin Clearance</th>
                      <th style={{ textAlign: "right" }}>Gate Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedQueue.map((item) => (
                      <tr key={item.pre_approval_id || item.visit_id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                background: "#ecfdf5",
                                color: "#059669",
                                display: "flex",
                                alignItems: "center",
                                justifyCenter: "center",
                                fontWeight: 800,
                                fontSize: "13px",
                                flexShrink: 0,
                              }}
                            >
                              {item.visitor?.first_name ? item.visitor.first_name[0].toUpperCase() : "V"}
                            </div>
                            <div>
                              <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                                {item.visitor?.first_name} {item.visitor?.last_name}
                              </strong>
                              <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                                {item.visitor?.company_name || "Individual"} · {item.visitor?.phone_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                            {item.host_employee?.first_name} {item.host_employee?.last_name}
                          </strong>
                          <div style={{ fontSize: "11.5px", color: "#2563eb", fontWeight: 600 }}>
                            {item.host_employee?.department || "General"}
                          </div>
                        </td>
                        <td>
                          <div style={{ maxWidth: "220px", fontSize: "12.5px", color: "#334155" }}>
                            {item.purpose || "Meeting"}
                          </div>
                          {item.assets && item.assets.length > 0 && (
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: "3px",
                                fontSize: "10.5px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontWeight: 700,
                              }}
                            >
                              {item.assets.length} Item(s) Declared
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: "12.5px", color: "#0f172a", fontWeight: 600 }}>
                            {formatDateTime(item.expected_in_time)}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              background: "#ecfdf5",
                              color: "#059669",
                              border: "1px solid #a7f3d0",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "11.5px",
                              fontWeight: 800,
                            }}
                          >
                            ✓ Approved by Admin
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="primary-button"
                              style={{
                                background: "#059669",
                                padding: "7px 14px",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                              disabled={checkingIn}
                              onClick={() => {
                                if (item.visit_id) {
                                  handleCheckInVisitor(item.visit_id);
                                } else {
                                  verifyVisitorByInput(item.visitor?.phone_number || item.visitor_id);
                                  setActiveTab("checkin");
                                }
                              }}
                            >
                              <CheckCircle2 size={14} /> Check In Now
                            </button>

                            <button
                              type="button"
                              className="back-button"
                              style={{ padding: "7px 10px", fontSize: "12px" }}
                              onClick={() => {
                                verifyVisitorByInput(item.visit_id || item.visitor?.phone_number);
                                setActiveTab("checkin");
                              }}
                              title="Inspect full pass dossier"
                            >
                              Inspect Dossier
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: KIOSK REGISTRATION & QR DISPLAY
        ======================================================== */}
        {activeTab === "kiosk" && (
          <div className="sgp-kiosk-grid">
            {/* General Visitor Kiosk */}
            <div className="sgp-kiosk-card">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 800,
                  marginBottom: "14px",
                  letterSpacing: "0.5px",
                }}
              >
                <Users size={14} /> GENERAL VISITOR REGISTRATION
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "19px", color: "#0f172a", fontWeight: 800 }}>
                General Visit QR Code
              </h3>
              <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#64748b", maxWidth: "380px", marginLeft: "auto", marginRight: "auto" }}>
                Instruct walk-in corporate or general visitors to scan this code on their smartphone camera to fill out their identity credentials and request entry clearance.
              </p>

              {receptionQR && (
                <div className="sgp-kiosk-qr-wrap">
                  <img src={receptionQR} alt="General Visitor QR" />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                  type="button"
                  className="primary-button"
                  style={{ padding: "10px 18px", fontSize: "13px", fontWeight: 700 }}
                  onClick={() => window.open("/register-visitor", "_blank")}
                >
                  <ExternalLink size={14} /> Open Form in Separate Window
                </button>
              </div>
            </div>

            {/* IT Visitor Kiosk */}
            <div className="sgp-kiosk-card">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#ede9fe",
                  color: "#6d28d9",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 800,
                  marginBottom: "14px",
                  letterSpacing: "0.5px",
                }}
              >
                <Laptop size={14} /> IT DEPARTMENT VISITOR KIOSK
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "19px", color: "#0f172a", fontWeight: 800 }}>
                IT Contractor &amp; Technician QR
              </h3>
              <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#64748b", maxWidth: "380px", marginLeft: "auto", marginRight: "auto" }}>
                Instruct IT vendors, network engineers, hardware maintenance contractors, and courier technicians to scan this QR to declare serial-tagged laptops &amp; devices.
              </p>

              {itQR && (
                <div className="sgp-kiosk-qr-wrap">
                  <img src={itQR} alt="IT Visitor QR" />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                  type="button"
                  className="primary-button"
                  style={{ background: "#4338ca", padding: "10px 18px", fontSize: "13px", fontWeight: 700 }}
                  onClick={() => window.open("/it-visit", "_blank")}
                >
                  <ExternalLink size={14} /> Open IT Kiosk in Separate Window
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
        </>
      )}

      {/* =========================================================
          DEDICATED NATIVE MOBILE GUARD PORTAL VIEW (MATCHING MOCKUP)
      ========================================================= */}
      {isMobile && (
        <div className="sgp-mobile-app-root">
          {/* TOP APP BAR (EXACT DESIGN MATCH) */}
          <header className="mobile-topbar">
            <div className="mobile-topbar-left">
              <button
                type="button"
                className="mobile-topbar-menu-btn"
                onClick={() => setMobileTab("more")}
                aria-label="Toggle navigation menu"
              >
                <Menu size={20} />
              </button>
              <div className="mobile-topbar-divider" />
              <div
                className="mobile-topbar-brand-text"
                onClick={() => setMobileTab("home")}
                role="button"
                tabIndex={0}
              >
                <span className="mobile-brand-title">VMS</span>
                <span className="mobile-brand-sub">Visitor Management System</span>
              </div>
            </div>
            <div className="mobile-topbar-actions">
              <button
                type="button"
                className="mobile-topbar-action-btn"
                onClick={() => {
                  setNotifDrawerOpen((prev) => !prev);
                  fetchGuardNotifications();
                }}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="mobile-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="mobile-topbar-settings-btn"
                onClick={() => setMobileTab("more")}
                aria-label="Settings"
                title="System Settings"
              >
                <Settings size={20} />
              </button>
              <div
                className="mobile-topbar-logo-btn"
                onClick={() => setMobileTab("more")}
                role="button"
                tabIndex={0}
                title={currentUser?.email || "Security Desk"}
              >
                <img src="/vms-logo.png" alt="VMS User" />
              </div>
            </div>
          </header>

          {/* SCREEN 1: MOBILE HOME / DASHBOARD */}
          {mobileTab === "home" && (
            <div className="sgp-mob-screen sgp-mob-home-screen">
              {/* Gate 01 Dark Command Card */}
              <div className="sgp-mob-command-card">
                <div className="sgp-mob-card-top">
                  <div>
                    <h2 className="sgp-mob-card-title">Gate 01 - Access Desk</h2>
                    <p className="sgp-mob-card-subtitle">
                      Security Guard Terminal<br />
                      Check-In, Verification &amp; Checkout Operations
                    </p>
                  </div>
                  <span className="sgp-mob-live-badge">
                    <span className="pulse-dot"></span> Live Telemetry
                  </span>
                </div>
                <div className="sgp-mob-card-bottom">
                  <div className="sgp-mob-meta-item">
                    <CalendarClock size={13} color="#94a3b8" />
                    <span>
                      {currentTime.toLocaleDateString([], {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="sgp-mob-meta-item">
                    <Clock size={13} color="#38bdf8" />
                    <span>
                      {currentTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <button type="button" className="sgp-mob-theme-toggle" onClick={toggleTheme}>
                    {theme === "dark" ? <Sun size={12} color="#f59e0b" /> : <Moon size={12} color="#cbd5e1" />}
                    <span>{theme === "dark" ? "Light" : "Dark"}</span>
                  </button>
                </div>
              </div>

              {/* 2x2 Metric Cards Grid */}
              <div className="sgp-mob-kpi-grid">
                <div
                  className="sgp-mob-kpi-card accent-emerald"
                  onClick={() => {
                    setMobileTab("visitors");
                    setVisitorsSubTab("expected");
                  }}
                >
                  <div className="sgp-mob-kpi-icon-wrap emerald">
                    <UserCheck size={18} />
                  </div>
                  <div className="sgp-mob-kpi-text">
                    <span className="sgp-mob-kpi-lbl">Approved Arrivals Waiting</span>
                    <span className="sgp-mob-kpi-val">{approvedQueue.length}</span>
                  </div>
                </div>

                <div
                  className="sgp-mob-kpi-card accent-blue"
                  onClick={() => {
                    setMobileTab("visitors");
                    setVisitorsSubTab("inside");
                  }}
                >
                  <div className="sgp-mob-kpi-icon-wrap blue">
                    <Users size={18} />
                  </div>
                  <div className="sgp-mob-kpi-text">
                    <span className="sgp-mob-kpi-lbl">Currently Inside Premises</span>
                    <span className="sgp-mob-kpi-val">{activeVisits.length}</span>
                  </div>
                </div>

                <div
                  className="sgp-mob-kpi-card accent-purple"
                  onClick={() => setMobileTab("kiosk")}
                >
                  <div className="sgp-mob-kpi-icon-wrap purple">
                    <Laptop size={18} />
                  </div>
                  <div className="sgp-mob-kpi-text">
                    <span className="sgp-mob-kpi-lbl">Self-Service Kiosks Active QRs</span>
                    <span className="sgp-mob-kpi-val">2</span>
                  </div>
                </div>

                <div
                  className="sgp-mob-kpi-card accent-teal"
                  onClick={() => setMobileTab("scan")}
                >
                  <div className="sgp-mob-kpi-icon-wrap teal">
                    <Radio size={18} />
                  </div>
                  <div className="sgp-mob-kpi-text">
                    <span className="sgp-mob-kpi-lbl">Gate Scanner Status</span>
                    <span className="sgp-mob-kpi-val status-live">Operational</span>
                  </div>
                </div>
              </div>

              {/* 3 Quick Action Buttons */}
              <div className="sgp-mob-quick-actions-row">
                <button
                  type="button"
                  className="sgp-mob-quick-btn primary"
                  onClick={() => {
                    setMobileTab("scan");
                    setScannerActive(true);
                  }}
                >
                  <QrCode size={18} />
                  <span>Scan &amp; Check-In</span>
                </button>
                <button
                  type="button"
                  className="sgp-mob-quick-btn outline"
                  onClick={() => {
                    setMobileTab("visitors");
                    setVisitorsSubTab("inside");
                  }}
                >
                  <Building2 size={18} />
                  <span>On-Premises &amp; Checkout</span>
                </button>
                <button
                  type="button"
                  className="sgp-mob-quick-btn outline"
                  onClick={() => setMobileTab("kiosk")}
                >
                  <UserCheck size={18} />
                  <span>Visitor Registration</span>
                </button>
              </div>

              {/* Today's Activity Section */}
              <div className="sgp-mob-section-card">
                <div className="sgp-mob-section-header">
                  <h3 className="sgp-mob-section-title">Today's Activity</h3>
                  <button
                    type="button"
                    className="sgp-mob-section-link"
                    onClick={() => setMobileTab("visitors")}
                  >
                    View All &rarr;
                  </button>
                </div>
                <div className="sgp-mob-activity-list">
                  {mobileActivityFeed.map((act, idx) => (
                    <div
                      key={idx}
                      className="sgp-mob-activity-item"
                      onClick={() => {
                        if (act.visit_id) verifyVisitorByInput(act.visit_id);
                      }}
                    >
                      <span className={`sgp-mob-dot ${act.type === "checkout" ? "red" : "green"}`}></span>
                      <span className="sgp-mob-act-time">{act.time}</span>
                      <div className="sgp-mob-act-info">
                        <strong>{act.name}</strong>
                        <small>{act.description}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 2: MOBILE SCAN & CHECK-IN */}
          {mobileTab === "scan" && (
            <div className="sgp-mob-screen sgp-mob-scan-screen">
              <div className="sgp-mob-page-head">
                <div className="sgp-mob-page-head-icon">
                  <QrCode size={22} color="#2563eb" />
                </div>
                <div>
                  <h2 className="sgp-mob-page-title">Scan &amp; Check-In</h2>
                  <p className="sgp-mob-page-desc">Scan QR pass or search by visitor details</p>
                </div>
              </div>

              {/* Segmented Control */}
              <div className="sgp-mob-segmented-control">
                <button
                  type="button"
                  className={scanSubTab === "qr" ? "active" : ""}
                  onClick={() => {
                    setScanSubTab("qr");
                    setScannerActive(true);
                  }}
                >
                  <QrCode size={14} /> Scan QR
                </button>
                <button
                  type="button"
                  className={scanSubTab === "manual" ? "active" : ""}
                  onClick={() => {
                    setScanSubTab("manual");
                    setScannerActive(false);
                  }}
                >
                  <Search size={14} /> Manual Search
                </button>
              </div>

              {/* Camera Viewfinder Box */}
              {scanSubTab === "qr" && (
                <div className="sgp-mob-viewfinder-card">
                  <div
                    className="sgp-mob-viewfinder-lens"
                    onClick={() => {
                      if (!scannerActive) {
                        setCameraError("");
                        setScannerActive(true);
                      }
                    }}
                  >
                    <div id="security-camera-reader-mob" className="sgp-mob-camera-box"></div>

                    {/* Camera Loading Overlay */}
                    {scannerActive && cameraLoading && !cameraError && (
                      <div className="sgp-mob-camera-loading-overlay">
                        <RefreshCw size={26} className="gt-spinner" color="#38bdf8" />
                        <p>Starting Camera...</p>
                      </div>
                    )}

                    {/* Camera Error / Permission Overlay */}
                    {cameraError && (
                      <div className="sgp-mob-camera-error-overlay">
                        <AlertTriangle size={28} color="#ef4444" />
                        <p className="sgp-mob-camera-error-text">{cameraError}</p>
                        {typeof window !== "undefined" && !window.isSecureContext && window.location.protocol === "http:" ? (
                          <button
                            type="button"
                            className="sgp-mob-btn-retry-camera"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = window.location.href.replace("http:", "https:");
                            }}
                          >
                            <ShieldCheck size={14} /> Switch to HTTPS
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="sgp-mob-btn-retry-camera"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCameraError("");
                              setScannerActive(false);
                              setTimeout(() => setScannerActive(true), 150);
                            }}
                          >
                            <RefreshCw size={14} /> Retry Camera
                          </button>
                        )}
                      </div>
                    )}

                    {/* Idle Placeholder */}
                    {!scannerActive && !cameraLoading && !cameraError && (
                      <div className="sgp-mob-viewfinder-placeholder">
                        <div className="sgp-mob-reticle-box">
                          <QrCode size={44} color="#38bdf8" />
                        </div>
                        <p>Position QR code within the frame</p>
                        <button
                          type="button"
                          className="sgp-mob-btn-start-camera"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCameraError("");
                            setScannerActive(true);
                          }}
                        >
                          <Camera size={14} /> Tap to Open Camera
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Camera Action Buttons */}
                  <div className="sgp-mob-camera-actions">
                    <button
                      type="button"
                      className={`sgp-mob-cam-action-btn ${flashOn ? "active" : ""}`}
                      onClick={toggleFlash}
                      title={flashOn ? "Turn torch off" : "Turn torch on"}
                    >
                      <Flashlight size={16} />
                      <span>{flashOn ? "Turn Off" : "Turn Flash"}</span>
                    </button>

                    <button
                      type="button"
                      className="sgp-mob-cam-action-btn"
                      onClick={() => galleryInputRef.current?.click()}
                      title="Upload QR photo from phone gallery"
                    >
                      <ImageIcon size={16} />
                      <span>Gallery</span>
                    </button>
                    <input
                      type="file"
                      ref={galleryInputRef}
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleGalleryUpload}
                    />

                    <button
                      type="button"
                      className="sgp-mob-cam-action-btn"
                      onClick={handleSwitchCamera}
                      title="Switch between front and back camera"
                    >
                      <SwitchCamera size={16} />
                      <span>Switch</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="sgp-mob-or-divider">
                <span>OR</span>
              </div>

              {/* Search Bar */}
              <form
                className="sgp-mob-search-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) verifyVisitorByInput(searchQuery.trim());
                }}
              >
                <div className="sgp-mob-search-input-wrap">
                  <Search size={16} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or token..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="sgp-mob-clear-btn"
                      onClick={() => setSearchQuery("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="sgp-mob-search-submit"
                  disabled={searchLoading}
                >
                  {searchLoading ? <RefreshCw size={14} className="spin" /> : "Verify"}
                </button>
              </form>

              {/* Quick Filters */}
              <div className="sgp-mob-quick-filter-row">
                <span className="sgp-mob-filter-label">Quick Filter:</span>
                <button
                  type="button"
                  className="sgp-mob-quick-chip"
                  onClick={() => setSearchQuery("+91 ")}
                >
                  <Phone size={12} /> By Phone
                </button>
                <button
                  type="button"
                  className="sgp-mob-quick-chip"
                  onClick={() => setSearchQuery("sahil")}
                >
                  <User size={12} /> By Name
                </button>
                <button
                  type="button"
                  className="sgp-mob-quick-chip"
                  onClick={() => setSearchQuery("VIS-")}
                >
                  <FileText size={12} /> By Token
                </button>
              </div>

              {/* Terminal Ready Status Card */}
              <div className="sgp-mob-terminal-card">
                <div className="sgp-mob-terminal-icon">
                  <span className="pulse-dot"></span>
                </div>
                <div>
                  <strong>Terminal Ready</strong>
                  <p>Gate 01 · Access Desk · Camera &amp; Token Scanner Active</p>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4 & 5: MOBILE VISITORS (INSIDE & EXPECTED) */}
          {mobileTab === "visitors" && (
            <div className="sgp-mob-screen sgp-mob-visitors-screen">
              {/* Segmented Subtab Switcher */}
              <div className="sgp-mob-visitors-switcher">
                <button
                  type="button"
                  className={visitorsSubTab === "inside" ? "active" : ""}
                  onClick={() => setVisitorsSubTab("inside")}
                >
                  <Building2 size={15} /> Currently Inside ({activeVisits.length})
                </button>
                <button
                  type="button"
                  className={visitorsSubTab === "expected" ? "active" : ""}
                  onClick={() => setVisitorsSubTab("expected")}
                >
                  <UserCheck size={15} /> Expected Today ({approvedQueue.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="sgp-mob-search-input-wrap">
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search visitor, host, or department..."
                  value={visitorsSearch}
                  onChange={(e) => setVisitorsSearch(e.target.value)}
                />
                {visitorsSearch && (
                  <button
                    type="button"
                    className="sgp-mob-clear-btn"
                    onClick={() => setVisitorsSearch("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Department Filter Chips */}
              <div className="sgp-mob-dept-chips">
                {["All", "IT", "HR", "Admin"].map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    className={`sgp-mob-dept-chip ${visitorsDeptFilter === dept ? "active" : ""}`}
                    onClick={() => setVisitorsDeptFilter(dept)}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              {/* Cards List */}
              <div className="sgp-mob-cards-list">
                {visitorsSubTab === "inside" ? (
                  filteredInsideVisits.length > 0 ? (
                    filteredInsideVisits.map((v) => (
                      <div key={v.visit_id} className="sgp-mob-visitor-card">
                        <div className="sgp-mob-card-main-row">
                          <div className="sgp-mob-avatar-box">
                            {getMonogram(v.visitor?.name || v.visitor_name)}
                          </div>
                          <div className="sgp-mob-card-info">
                            <h4 className="sgp-mob-visitor-name">
                              {v.visitor?.name || v.visitor_name || "Visitor"}
                            </h4>
                            <p className="sgp-mob-visitor-sub">
                              Host: {v.host?.name || v.host_name || "Internal Staff"}
                              {v.visitor?.company ? ` · ${v.visitor.company}` : ""}
                            </p>
                          </div>
                          <div className="sgp-mob-card-badge-right">
                            <span className="sgp-mob-time-pill green">
                              ● {formatShortTime(v.check_in_time)}
                            </span>
                            <small>Check-In</small>
                          </div>
                        </div>
                        <div className="sgp-mob-card-actions-row">
                          <button
                            type="button"
                            className="sgp-mob-btn-action view"
                            onClick={() => verifyVisitorByInput(v.visit_id)}
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            className="sgp-mob-btn-action checkout"
                            onClick={() => handleCheckoutVisitor(v.visit_id)}
                            disabled={checkoutLoading === v.visit_id}
                          >
                            <LogOut size={13} /> Check Out
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="sgp-mob-empty-state">
                      <Users size={32} color="#94a3b8" />
                      <h4>No visitors currently inside</h4>
                      <p>Active visitors on campus will appear here.</p>
                    </div>
                  )
                ) : filteredExpectedVisits.length > 0 ? (
                  filteredExpectedVisits.map((item) => (
                    <div
                      key={item.pre_approval_id || item.visit_id}
                      className="sgp-mob-visitor-card"
                    >
                      <div className="sgp-mob-card-main-row">
                        <div className="sgp-mob-avatar-box purple">
                          {getMonogram(item.visitor?.name || item.visitor_name)}
                        </div>
                        <div className="sgp-mob-card-info">
                          <h4 className="sgp-mob-visitor-name">
                            {item.visitor?.name || item.visitor_name || "Expected Guest"}
                          </h4>
                          <p className="sgp-mob-visitor-sub">
                            Host: {item.host?.name || item.host_name || "Internal Host"}
                            {item.visitor?.company ? ` · ${item.visitor.company}` : ""}
                          </p>
                        </div>
                        <div className="sgp-mob-card-badge-right">
                          <span className="sgp-mob-time-pill purple">
                            {formatShortTime(item.expected_arrival_time || item.start_time) || "Today"}
                          </span>
                          <small>Scheduled</small>
                        </div>
                      </div>
                      <div className="sgp-mob-card-actions-row">
                        <button
                          type="button"
                          className="sgp-mob-btn-action verify-green"
                          onClick={() =>
                            verifyVisitorByInput(item.visit_id || item.visitor?.phone_number)
                          }
                        >
                          <CheckCircle2 size={13} /> Verify
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sgp-mob-empty-state">
                    <UserCheck size={32} color="#94a3b8" />
                    <h4>No expected arrivals</h4>
                    <p>Pre-approved guests for today will show up here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCREEN 6: MOBILE KIOSK & QR */}
          {mobileTab === "kiosk" && (
            <div className="sgp-mob-screen sgp-mob-kiosk-screen">
              <div className="sgp-mob-page-head">
                <div className="sgp-mob-page-head-icon purple">
                  <Laptop size={22} color="#7c3aed" />
                </div>
                <div>
                  <h2 className="sgp-mob-page-title">Visitor Registration Kiosk &amp; QR</h2>
                  <p className="sgp-mob-page-desc">Public walk-in QR badge &amp; registration link</p>
                </div>
              </div>

              {/* Segmented Control */}
              <div className="sgp-mob-segmented-control">
                <button
                  type="button"
                  className={kioskSubTab === "it-visitor" || kioskSubTab === "link" ? "active" : ""}
                  onClick={() => setKioskSubTab("it-visitor")}
                >
                  <FileText size={16} />
                  <span>IT Visitor QR &amp; Form</span>
                </button>
                <button
                  type="button"
                  className={kioskSubTab === "reception-qr" || kioskSubTab === "kiosk-qr" ? "active" : ""}
                  onClick={() => setKioskSubTab("reception-qr")}
                >
                  <QrCode size={16} />
                  <span>General Visit</span>
                </button>
                <button
                  type="button"
                  className={kioskSubTab === "both" ? "active" : ""}
                  onClick={() => setKioskSubTab("both")}
                >
                  <Layers size={16} />
                  <span>Show Both</span>
                </button>
              </div>

              {/* IT Visitor Registration Card */}
              {(kioskSubTab === "it-visitor" || kioskSubTab === "link" || kioskSubTab === "both") && (
                <div className="sgp-mob-kiosk-qr-card">
                  <div className="sgp-mob-qr-preview-box sgp-mob-it-viewfinder-box">
                    <span className="sgp-vf-bracket sgp-vf-tl" />
                    <span className="sgp-vf-bracket sgp-vf-tr" />
                    <span className="sgp-vf-bracket sgp-vf-bl" />
                    <span className="sgp-vf-bracket sgp-vf-br" />
                    {itQR ? (
                      <img src={itQR} alt="IT Visitor Registration QR" />
                    ) : (
                      <QrCode size={140} color="#0f172a" />
                    )}
                  </div>
                  <h3 className="sgp-mob-qr-title">IT Visitor Registration</h3>
                  <p className="sgp-mob-qr-desc">For Technical Contractors &amp; IT Personnel</p>

                  <div className="sgp-mob-it-link-center-wrap">
                    <div className="sgp-mob-it-pill">
                      <Link2 size={13} />
                      <span>Registration Link</span>
                    </div>

                    <div
                      className="sgp-mob-it-copy-box"
                      onClick={() => {
                        const itUrl = `${window.location.origin}/it-visitor`;
                        navigator.clipboard.writeText(itUrl);
                        showToast("IT registration link copied to clipboard");
                      }}
                      title="Click to copy link"
                    >
                      <span className="sgp-mob-it-copy-url">{`${window.location.origin}/it-visitor`}</span>
                      <button
                        type="button"
                        className="sgp-mob-it-copy-btn"
                        aria-label="Copy IT Registration URL"
                        onClick={(e) => {
                          e.stopPropagation();
                          const itUrl = `${window.location.origin}/it-visitor`;
                          navigator.clipboard.writeText(itUrl);
                          showToast("IT registration link copied to clipboard");
                        }}
                      >
                        <Copy size={15} />
                      </button>
                    </div>

                    <p className="sgp-mob-it-instructions">
                      Scan the QR code or open the link to register an IT visitor, declare hardware, and request access.
                    </p>
                  </div>

                  <div className="sgp-mob-qr-btn-row">
                    <button
                      type="button"
                      className="sgp-mob-btn-qr-action"
                      onClick={() => {
                        if (itQR) {
                          const a = document.createElement("a");
                          a.href = itQR;
                          a.download = "VMS-IT-Visitor-Registration-QR.png";
                          a.click();
                          showToast("IT QR code downloaded successfully");
                        }
                      }}
                    >
                      <Download size={15} /> Download QR
                    </button>
                    <button
                      type="button"
                      className="sgp-mob-btn-qr-action"
                      onClick={() => {
                        const itUrl = `${window.location.origin}/it-visitor`;
                        if (navigator.share) {
                          navigator.share({ title: "IT Visitor Registration", url: itUrl }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(itUrl);
                          showToast("IT registration link copied to clipboard");
                        }
                      }}
                    >
                      <Share2 size={15} /> Share Link
                    </button>
                    <button
                      type="button"
                      className="sgp-mob-btn-qr-action primary wide"
                      onClick={() => {
                        window.open(`${window.location.origin}/it-visitor`, "_blank");
                      }}
                    >
                      <ExternalLink size={15} /> Open IT Visitor Form
                    </button>
                  </div>
                </div>
              )}

              {/* Big White Card with QR Code (Reception) */}
              {(kioskSubTab === "reception-qr" || kioskSubTab === "kiosk-qr" || kioskSubTab === "both") && (
                <div className="sgp-mob-kiosk-qr-card">
                  <div className="sgp-mob-qr-preview-box">
                    {receptionQR ? (
                      <img src={receptionQR} alt="General Visit" />
                    ) : (
                      <QrCode size={140} color="#0f172a" />
                    )}
                  </div>
                  <h3 className="sgp-mob-qr-title">General Visit</h3>
                  <p className="sgp-mob-qr-desc">Let visitors scan this QR to register themselves.</p>

                  <div className="sgp-mob-qr-btn-row">
                    <button
                      type="button"
                      className="sgp-mob-btn-qr-action"
                      onClick={() => {
                        if (receptionQR) {
                          const a = document.createElement("a");
                          a.href = receptionQR;
                          a.download = "VMS-General-Visit-QR.png";
                          a.click();
                          showToast("QR code downloaded successfully");
                        }
                      }}
                    >
                      <Download size={15} /> Download QR
                    </button>
                    <button
                      type="button"
                      className="sgp-mob-btn-qr-action"
                      onClick={() => {
                        const regUrl = `${window.location.origin}/register-visitor`;
                        if (navigator.share) {
                          navigator.share({ title: "VMS Visitor Registration", url: regUrl }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(regUrl);
                          showToast("Registration link copied to clipboard");
                        }
                      }}
                    >
                      <Share2 size={15} /> Share QR
                    </button>
                    <button
                      type="button"
                      className="sgp-mob-btn-qr-action primary wide"
                      onClick={() => {
                        window.open(`${window.location.origin}/register-visitor`, "_blank");
                      }}
                    >
                      <ExternalLink size={15} /> Open Walk-In Form
                    </button>
                  </div>
                </div>
              )}

              {/* Kiosk Status Card */}
              <div className="sgp-mob-kiosk-status-card">
                <div className="sgp-mob-kiosk-status-head">
                  <div className="sgp-mob-kiosk-status-head-left">
                    <div className="sgp-mob-kiosk-status-icon-box">
                      <Laptop size={15} color="#7c3aed" />
                    </div>
                    <span className="sgp-mob-kiosk-status-title">Kiosk Status</span>
                  </div>
                  <span className="sgp-mob-pill-online">● Online</span>
                </div>
                <div className="sgp-mob-kiosk-status-rows">
                  <div className="sgp-mob-kiosk-status-row">
                    <span className="sgp-mob-kiosk-label-wrap">
                      <MapPin size={14} color="#64748b" />
                      <span>Location</span>
                    </span>
                    <strong>Main Reception (Gate 01)</strong>
                  </div>
                  <div className="sgp-mob-kiosk-status-row">
                    <span className="sgp-mob-kiosk-label-wrap">
                      <Smartphone size={14} color="#64748b" />
                      <span>Device</span>
                    </span>
                    <strong>Self-Service Kiosk</strong>
                  </div>
                  <div className="sgp-mob-kiosk-status-row">
                    <span className="sgp-mob-kiosk-label-wrap">
                      <Clock size={14} color="#64748b" />
                      <span>Last Updated</span>
                    </span>
                    <strong>
                      {currentTime.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })},{" "}
                      {currentTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 10: MOBILE MORE / SETTINGS */}
          {mobileTab === "more" && (
            <div className="sgp-mob-screen sgp-mob-more-screen">
              {/* Security Officer Profile Card */}
              <div className="sgp-mob-profile-card">
                <div className="sgp-mob-profile-avatar">
                  {guardProfile?.name ? guardProfile.name[0].toUpperCase() : (currentUser?.email ? currentUser.email[0].toUpperCase() : "G")}
                </div>
                <div className="sgp-mob-profile-info">
                  <h3>{guardProfile.name}</h3>
                  <p>{currentUser?.email || "guard@vms.com"}</p>
                  <span className="sgp-mob-pill-online-sm">● Online</span>
                </div>
              </div>

              {/* Settings Menu List */}
              <div className="sgp-mob-menu-card">
                <div className="sgp-mob-menu-item" onClick={() => setActiveSettingsModal("profile")}>
                  <div className="sgp-mob-menu-left">
                    <User size={18} color="#64748b" />
                    <span>Profile Settings</span>
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>

                <div className="sgp-mob-menu-item" onClick={() => setActiveSettingsModal("terminal")}>
                  <div className="sgp-mob-menu-left">
                    <ShieldCheck size={18} color="#64748b" />
                    <span>Gate Terminal Settings</span>
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>

                <div className="sgp-mob-menu-item" onClick={() => setActiveSettingsModal("notifications")}>
                  <div className="sgp-mob-menu-left">
                    <Bell size={18} color="#64748b" />
                    <span>Notification Preferences</span>
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>

                <div className="sgp-mob-menu-item" onClick={() => setActiveSettingsModal("password")}>
                  <div className="sgp-mob-menu-left">
                    <Lock size={18} color="#64748b" />
                    <span>Change Password</span>
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>

                <div className="sgp-mob-menu-item" onClick={() => setActiveSettingsModal("support")}>
                  <div className="sgp-mob-menu-left">
                    <AlertTriangle size={18} color="#64748b" />
                    <span>Help &amp; Support</span>
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>

                <div className="sgp-mob-menu-item" onClick={toggleTheme}>
                  <div className="sgp-mob-menu-left">
                    {theme === "dark" ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#64748b" />}
                    <span>Theme ({theme === "dark" ? "Dark Mode" : "Light Mode"})</span>
                  </div>
                  <button type="button" className="sgp-mob-btn-theme-pill">Toggle</button>
                </div>
              </div>

              {/* Sign Out Button */}
              <button type="button" className="sgp-mob-signout-btn" onClick={() => setActiveSettingsModal("signout")}>
                <LogOut size={16} /> Sign Out
              </button>

              {/* MODAL 1: PROFILE SETTINGS */}
              {activeSettingsModal === "profile" && (
                <div className="sgp-mob-sheet-overlay" onClick={() => setActiveSettingsModal(null)}>
                  <div className="sgp-mob-sheet-container" onClick={(e) => e.stopPropagation()}>
                    <div className="sgp-mob-sheet-drag-handle" />
                    <div className="sgp-mob-sheet-header">
                      <div className="sgp-mob-sheet-title-group">
                        <div className="sgp-mob-sheet-icon">
                          <User size={20} />
                        </div>
                        <div>
                          <h3 className="sgp-mob-sheet-title">Profile Settings</h3>
                          <p className="sgp-mob-sheet-subtitle">Gate officer identity & credentials</p>
                        </div>
                      </div>
                      <button type="button" className="sgp-mob-sheet-close" onClick={() => setActiveSettingsModal(null)}>
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveProfile} className="sgp-mob-sheet-body">
                      <div className="sgp-mob-info-box">
                        <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <strong>Clearance Level: Tier 1 Gate Security</strong>
                          <div style={{ marginTop: 2 }}>Badge ID: <code>{guardProfile.badgeId}</code> · Station Active</div>
                        </div>
                      </div>

                      <div className="sgp-mob-field-group">
                        <label className="sgp-mob-field-label">Officer Full Name</label>
                        <input
                          type="text"
                          className="sgp-mob-field-input"
                          value={guardProfile.name}
                          onChange={(e) => setGuardProfile({ ...guardProfile, name: e.target.value })}
                          placeholder="e.g. Security Officer"
                          required
                        />
                      </div>

                      <div className="sgp-mob-field-group">
                        <label className="sgp-mob-field-label">Email Address (System Account)</label>
                        <input
                          type="email"
                          className="sgp-mob-field-input"
                          value={currentUser?.email || "guard@vms.com"}
                          disabled
                          style={{ opacity: 0.7, cursor: "not-allowed" }}
                        />
                      </div>

                      <div className="sgp-mob-field-group">
                        <label className="sgp-mob-field-label">Contact / Intercom Number</label>
                        <input
                          type="tel"
                          className="sgp-mob-field-input"
                          value={guardProfile.phone}
                          onChange={(e) => setGuardProfile({ ...guardProfile, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                      </div>

                      <div className="sgp-mob-field-group">
                        <label className="sgp-mob-field-label">Assigned Gate Station</label>
                        <MobileCustomSelect
                          value={guardProfile.gate}
                          onChange={(val) => setGuardProfile({ ...guardProfile, gate: val })}
                          options={[
                            "Main Reception (Gate 01)",
                            "Gate 02 - IT & Staff Lane",
                            "Gate 03 - Service & Delivery",
                            "Gate 04 - VIP Entrance"
                          ]}
                        />
                      </div>

                      <div className="sgp-mob-field-group">
                        <label className="sgp-mob-field-label">Duty Shift Schedule</label>
                        <MobileCustomSelect
                          value={guardProfile.shift}
                          onChange={(val) => setGuardProfile({ ...guardProfile, shift: val })}
                          options={[
                            { value: "Shift A (08:00 - 16:00)", label: "Shift A (08:00 - 16:00) · Day Duty" },
                            { value: "Shift B (16:00 - 00:00)", label: "Shift B (16:00 - 00:00) · Evening Duty" },
                            { value: "Shift C (00:00 - 08:00)", label: "Shift C (00:00 - 08:00) · Night Duty" }
                          ]}
                        />
                      </div>

                      <div className="sgp-mob-sheet-footer" style={{ padding: "14px 0 0", margin: 0 }}>
                        <button type="button" className="sgp-mob-sheet-btn-secondary" onClick={() => setActiveSettingsModal(null)}>
                          Cancel
                        </button>
                        <button type="submit" className="sgp-mob-sheet-btn-primary">
                          <Save size={16} /> Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 2: GATE TERMINAL SETTINGS */}
              {activeSettingsModal === "terminal" && (
                <div className="sgp-mob-sheet-overlay" onClick={() => setActiveSettingsModal(null)}>
                  <div className="sgp-mob-sheet-container" onClick={(e) => e.stopPropagation()}>
                    <div className="sgp-mob-sheet-drag-handle" />
                    <div className="sgp-mob-sheet-header">
                      <div className="sgp-mob-sheet-title-group">
                        <div className="sgp-mob-sheet-icon">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h3 className="sgp-mob-sheet-title">Gate Terminal Settings</h3>
                          <p className="sgp-mob-sheet-subtitle">Hardware station & clearance parameters</p>
                        </div>
                      </div>
                      <button type="button" className="sgp-mob-sheet-close" onClick={() => setActiveSettingsModal(null)}>
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveTerminalSettings} className="sgp-mob-sheet-body">
                      <div className="sgp-mob-info-box">
                        <Laptop size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <strong>Terminal ID: {terminalSettings.terminalId}</strong>
                          <div style={{ marginTop: 2 }}>Build: v2.4 Enterprise · Web Camera OCR Engine Active</div>
                        </div>
                      </div>

                      <div className="sgp-mob-field-group">
                        <label className="sgp-mob-field-label">Active Terminal Gate</label>
                        <MobileCustomSelect
                          value={terminalSettings.gateLocation}
                          onChange={(val) => setTerminalSettings({ ...terminalSettings, gateLocation: val })}
                          options={[
                            "Main Reception (Gate 01)",
                            "Gate 02 - IT & Staff Lane",
                            "Gate 03 - Service & Delivery",
                            "Gate 04 - VIP Entrance"
                          ]}
                        />
                      </div>

                      <div className="sgp-mob-switch-row">
                        <div className="sgp-mob-switch-label-group">
                          <span className="sgp-mob-switch-title">Camera Auto-Scan</span>
                          <span className="sgp-mob-switch-desc">Instantly decode QR badges without clicking capture</span>
                        </div>
                        <button
                          type="button"
                          className={`sgp-mob-toggle-switch ${terminalSettings.autoScan ? "active" : ""}`}
                          onClick={() => setTerminalSettings({ ...terminalSettings, autoScan: !terminalSettings.autoScan })}
                        />
                      </div>

                      <div className="sgp-mob-switch-row">
                        <div className="sgp-mob-switch-label-group">
                          <span className="sgp-mob-switch-title">Gate Chime Audio</span>
                          <span className="sgp-mob-switch-desc">Play auditory tone upon badge approval or verification</span>
                        </div>
                        <button
                          type="button"
                          className={`sgp-mob-toggle-switch ${terminalSettings.playChime ? "active" : ""}`}
                          onClick={() => setTerminalSettings({ ...terminalSettings, playChime: !terminalSettings.playChime })}
                        />
                      </div>

                      <div className="sgp-mob-switch-row">
                        <div className="sgp-mob-switch-label-group">
                          <span className="sgp-mob-switch-title">Auto-Print Badge Slip</span>
                          <span className="sgp-mob-switch-desc">Open physical pass print dialogue immediately upon check-in</span>
                        </div>
                        <button
                          type="button"
                          className={`sgp-mob-toggle-switch ${terminalSettings.autoPrint ? "active" : ""}`}
                          onClick={() => setTerminalSettings({ ...terminalSettings, autoPrint: !terminalSettings.autoPrint })}
                        />
                      </div>

                      <div className="sgp-mob-switch-row">
                        <div className="sgp-mob-switch-label-group">
                          <span className="sgp-mob-switch-title">Offline Clearance Cache</span>
                          <span className="sgp-mob-switch-desc">Buffer visitor logs locally if gate Wi-Fi connection drops</span>
                        </div>
                        <button
                          type="button"
                          className={`sgp-mob-toggle-switch ${terminalSettings.offlineSync ? "active" : ""}`}
                          onClick={() => setTerminalSettings({ ...terminalSettings, offlineSync: !terminalSettings.offlineSync })}
                        />
                      </div>

                      <div className="sgp-mob-sheet-footer" style={{ padding: "14px 0 0", margin: 0 }}>
                        <button type="button" className="sgp-mob-sheet-btn-secondary" onClick={() => setActiveSettingsModal(null)}>
                          Cancel
                        </button>
                        <button type="submit" className="sgp-mob-sheet-btn-primary">
                          <Save size={16} /> Save Terminal Settings
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 3: NOTIFICATION PREFERENCES */}
              {activeSettingsModal === "notifications" && (
                <div className="sgp-mob-sheet-overlay" onClick={() => setActiveSettingsModal(null)}>
                  <div className="sgp-mob-sheet-container" onClick={(e) => e.stopPropagation()}>
                    <div className="sgp-mob-sheet-drag-handle" />
                    <div className="sgp-mob-sheet-header">
                      <div className="sgp-mob-sheet-title-group">
                        <div className="sgp-mob-sheet-icon">
                          <Bell size={20} />
                        </div>
                        <div>
                          <h3 className="sgp-mob-sheet-title">Notification Preferences</h3>
                          <p className="sgp-mob-sheet-subtitle">Real-time gate and security triggers</p>
                        </div>
                      </div>
                      <button type="button" className="sgp-mob-sheet-close" onClick={() => setActiveSettingsModal(null)}>
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveNotifPreferences} className="sgp-mob-sheet-body">
                      <div className="sgp-mob-switch-row">
                        <div className="sgp-mob-switch-label-group">
                          <span className="sgp-mob-switch-title">VIP &amp; Executive Arrivals</span>
                          <span className="sgp-mob-switch-desc">Priority alerts when pre-approved VIP visitors arrive at gate</span>
                        </div>
                        <button
                          type="button"
                          className={`sgp-mob-toggle-switch ${notifPreferences.vipArrivals ? "active" : ""}`}
                          onClick={() => setNotifPreferences({ ...notifPreferences, vipArrivals: !notifPreferences.vipArrivals })}
                        />
                      </div>

                      <div className="sgp-mob-switch-row">
                        <div className="sgp-mob-switch-label-group">
                          <span className="sgp-mob-switch-title">Host Approval Updates</span>
                          <span className="sgp-mob-switch-desc">Alert when employee approves or rejects walk-in requests</span>
                        </div>
                        <button
                          type="button"
                          className={`sgp-mob-toggle-switch ${notifPreferences.hostDecisions ? "active" : ""}`}
                          onClick={() => setNotifPreferences({ ...notifPreferences, hostDecisions: !notifPreferences.hostDecisions })}
                        />
                      </div>

                      <div className="sgp-mob-switch-row">
                        <div className="sgp-mob-switch-label-group">
                          <span className="sgp-mob-switch-title">IT Contractor Hardware Alerts</span>
                          <span className="sgp-mob-switch-desc">Notify when technician brings serial-tracked company assets</span>
                        </div>
                        <button
                          type="button"
                          className={`sgp-mob-toggle-switch ${notifPreferences.itHardwareAlerts ? "active" : ""}`}
                          onClick={() => setNotifPreferences({ ...notifPreferences, itHardwareAlerts: !notifPreferences.itHardwareAlerts })}
                        />
                      </div>

                      <div className="sgp-mob-switch-row">
                        <div className="sgp-mob-switch-label-group">
                          <span className="sgp-mob-switch-title">Overstay &amp; Asset Departure Alerts</span>
                          <span className="sgp-mob-switch-desc">Warn if visitor exceeds pass window or leaves unreturned assets</span>
                        </div>
                        <button
                          type="button"
                          className={`sgp-mob-toggle-switch ${notifPreferences.overstayWarnings ? "active" : ""}`}
                          onClick={() => setNotifPreferences({ ...notifPreferences, overstayWarnings: !notifPreferences.overstayWarnings })}
                        />
                      </div>

                      <div className="sgp-mob-switch-row">
                        <div className="sgp-mob-switch-label-group">
                          <span className="sgp-mob-switch-title">Emergency Gate Broadcasts</span>
                          <span className="sgp-mob-switch-desc">Audible alarms for building evacuation & security lockouts</span>
                        </div>
                        <button
                          type="button"
                          className={`sgp-mob-toggle-switch ${notifPreferences.gateEmergency ? "active" : ""}`}
                          onClick={() => setNotifPreferences({ ...notifPreferences, gateEmergency: !notifPreferences.gateEmergency })}
                        />
                      </div>

                      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                        <button
                          type="button"
                          className="sgp-mob-sheet-btn-secondary"
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                          onClick={() => {
                            if (typeof playAlertChime === "function") playAlertChime();
                            showToast("Sound chime test played!");
                          }}
                        >
                          <Volume2 size={16} /> Test Chime Sound
                        </button>
                      </div>

                      <div className="sgp-mob-sheet-footer" style={{ padding: "14px 0 0", margin: 0 }}>
                        <button type="button" className="sgp-mob-sheet-btn-secondary" onClick={() => setActiveSettingsModal(null)}>
                          Cancel
                        </button>
                        <button type="submit" className="sgp-mob-sheet-btn-primary">
                          <Save size={16} /> Save Preferences
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 4: CHANGE PASSWORD */}
              {activeSettingsModal === "password" && (
                <div className="sgp-mob-sheet-overlay" onClick={() => setActiveSettingsModal(null)}>
                  <div className="sgp-mob-sheet-container" onClick={(e) => e.stopPropagation()}>
                    <div className="sgp-mob-sheet-drag-handle" />
                    <div className="sgp-mob-sheet-header">
                      <div className="sgp-mob-sheet-title-group">
                        <div className="sgp-mob-sheet-icon">
                          <Lock size={20} />
                        </div>
                        <div>
                          <h3 className="sgp-mob-sheet-title">Change Password</h3>
                          <p className="sgp-mob-sheet-subtitle">Update gate terminal access password</p>
                        </div>
                      </div>
                      <button type="button" className="sgp-mob-sheet-close" onClick={() => setActiveSettingsModal(null)}>
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleChangePassword} className="sgp-mob-sheet-body">
                      {passwordForm.error && (
                        <div className="sgp-mob-danger-box">
                          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                          <div>{passwordForm.error}</div>
                        </div>
                      )}

                      {passwordForm.success && (
                        <div className="sgp-mob-info-box">
                          <CheckCircle2 size={16} style={{ flexShrink: 0, color: "#16a34a" }} />
                          <div>{passwordForm.success}</div>
                        </div>
                      )}

                      <div className="sgp-mob-field-group">
                        <label className="sgp-mob-field-label">Current Password</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={passwordForm.showCurrent ? "text" : "password"}
                            className="sgp-mob-field-input"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            placeholder="Enter current password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setPasswordForm({ ...passwordForm, showCurrent: !passwordForm.showCurrent })}
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                          >
                            {passwordForm.showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="sgp-mob-field-group">
                        <label className="sgp-mob-field-label">New Password (Min 6 characters)</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={passwordForm.showNew ? "text" : "password"}
                            className="sgp-mob-field-input"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            placeholder="Enter new strong password"
                            minLength={6}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setPasswordForm({ ...passwordForm, showNew: !passwordForm.showNew })}
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                          >
                            {passwordForm.showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="sgp-mob-field-group">
                        <label className="sgp-mob-field-label">Confirm New Password</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={passwordForm.showConfirm ? "text" : "password"}
                            className="sgp-mob-field-input"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            placeholder="Re-type new password"
                            minLength={6}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setPasswordForm({ ...passwordForm, showConfirm: !passwordForm.showConfirm })}
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                          >
                            {passwordForm.showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="sgp-mob-sheet-footer" style={{ padding: "14px 0 0", margin: 0 }}>
                        <button type="button" className="sgp-mob-sheet-btn-secondary" onClick={() => setActiveSettingsModal(null)}>
                          Cancel
                        </button>
                        <button type="submit" className="sgp-mob-sheet-btn-primary" disabled={passwordForm.submitting}>
                          <Lock size={16} /> {passwordForm.submitting ? "Updating..." : "Update Password"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 5: HELP & SUPPORT */}
              {activeSettingsModal === "support" && (
                <div className="sgp-mob-sheet-overlay" onClick={() => setActiveSettingsModal(null)}>
                  <div className="sgp-mob-sheet-container" onClick={(e) => e.stopPropagation()}>
                    <div className="sgp-mob-sheet-drag-handle" />
                    <div className="sgp-mob-sheet-header">
                      <div className="sgp-mob-sheet-title-group">
                        <div className="sgp-mob-sheet-icon">
                          <HelpCircle size={20} />
                        </div>
                        <div>
                          <h3 className="sgp-mob-sheet-title">Help &amp; Support Desk</h3>
                          <p className="sgp-mob-sheet-subtitle">Enterprise emergency contacts & IT assistance</p>
                        </div>
                      </div>
                      <button type="button" className="sgp-mob-sheet-close" onClick={() => setActiveSettingsModal(null)}>
                        <X size={18} />
                      </button>
                    </div>

                    <div className="sgp-mob-sheet-body">
                      <div className="sgp-mob-contact-card">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "13.5px" }}>Emergency Gate Control</div>
                          <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>+91 1800 200 4567 (Toll-Free 24/7)</div>
                        </div>
                        <a href="tel:18002004567" className="sgp-mob-contact-btn">
                          <Phone size={13} /> Call
                        </a>
                      </div>

                      <div className="sgp-mob-contact-card">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "13.5px" }}>IT Security Operations Desk</div>
                          <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>support@coveryou.in</div>
                        </div>
                        <a href="mailto:support@coveryou.in" className="sgp-mob-contact-btn">
                          <Mail size={13} /> Email
                        </a>
                      </div>

                      <form onSubmit={handleSupportTicketSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                        <div style={{ fontWeight: 700, fontSize: "14px" }}>Report Gate / Scanner Incident</div>

                        {supportTicket.ticketNumber && (
                          <div className="sgp-mob-info-box">
                            <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
                            <div>
                              <strong>Ticket Submitted: {supportTicket.ticketNumber}</strong>
                              <div style={{ marginTop: "2px" }}>An IT engineer has been dispatched to assist your station.</div>
                            </div>
                          </div>
                        )}

                        <div className="sgp-mob-field-group">
                          <label className="sgp-mob-field-label">Issue Category</label>
                          <MobileCustomSelect
                            value={supportTicket.category}
                            onChange={(val) => setSupportTicket({ ...supportTicket, category: val })}
                            options={[
                              { value: "Scanner Hardware Issue", label: "Scanner Camera / Hardware Failure" },
                              { value: "Visitor Badge Discrepancy", label: "Visitor QR Badge Verification Issue" },
                              { value: "Hardware Asset Tracking Dispute", label: "IT Contractor Hardware Asset Mismatch" },
                              { value: "Printer & Pass Slip", label: "Gate Printer / Pass Slip Malfunction" },
                              { value: "Network Connectivity", label: "Terminal Network / Sync Lag" }
                            ]}
                          />
                        </div>

                        <div className="sgp-mob-field-group">
                          <label className="sgp-mob-field-label">Describe Incident</label>
                          <textarea
                            className="sgp-mob-field-input"
                            rows={3}
                            value={supportTicket.details}
                            onChange={(e) => setSupportTicket({ ...supportTicket, details: e.target.value })}
                            placeholder="Detail what happened at the gate..."
                            style={{ resize: "none" }}
                          />
                        </div>

                        <button type="submit" className="sgp-mob-sheet-btn-primary" style={{ marginTop: "4px" }}>
                          <Check size={16} /> Submit Incident Ticket
                        </button>
                      </form>
                    </div>

                    <div className="sgp-mob-sheet-footer">
                      <button type="button" className="sgp-mob-sheet-btn-secondary" onClick={() => setActiveSettingsModal(null)} style={{ flex: 1 }}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 6: SIGN OUT CONFIRMATION */}
              {activeSettingsModal === "signout" && (
                <div className="sgp-mob-sheet-overlay" onClick={() => setActiveSettingsModal(null)}>
                  <div className="sgp-mob-sheet-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
                    <div className="sgp-mob-sheet-drag-handle" />
                    <div className="sgp-mob-sheet-header">
                      <div className="sgp-mob-sheet-title-group">
                        <div className="sgp-mob-sheet-icon" style={{ background: "#fef2f2", color: "#ef4444" }}>
                          <LogOut size={20} />
                        </div>
                        <div>
                          <h3 className="sgp-mob-sheet-title">Sign Out of Terminal?</h3>
                          <p className="sgp-mob-sheet-subtitle">Conclude active gate shift session</p>
                        </div>
                      </div>
                      <button type="button" className="sgp-mob-sheet-close" onClick={() => setActiveSettingsModal(null)}>
                        <X size={18} />
                      </button>
                    </div>

                    <div className="sgp-mob-sheet-body">
                      <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b", lineHeight: 1.5 }}>
                        Are you sure you want to log out of <strong>{terminalSettings.gateLocation}</strong>? You will need your security credentials to access the terminal again.
                      </p>
                    </div>

                    <div className="sgp-mob-sheet-footer">
                      <button type="button" className="sgp-mob-sheet-btn-secondary" onClick={() => setActiveSettingsModal(null)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="sgp-mob-sheet-btn-primary sgp-mob-sheet-btn-danger"
                        onClick={() => {
                          setActiveSettingsModal(null);
                          if (onLogout) onLogout();
                        }}
                      >
                        <LogOut size={16} /> Sign Out Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCREEN 3: VISITOR IDENTITY DOSSIER MODAL */}
          {verifiedVisit && (
            <div className="sgp-mob-dossier-overlay">
              <div className="sgp-mob-dossier-sheet">
                {/* Top Navigation */}
                <div className="sgp-mob-dossier-nav">
                  <button
                    type="button"
                    className="sgp-mob-nav-back"
                    onClick={() => {
                      setVerifiedVisit(null);
                      setVisitDecision(null);
                      setVisitAssets([]);
                    }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="sgp-mob-brand-badge">
                    <img src="/vms-logo.png" alt="VMS" className="sgp-mob-brand-logo" />
                    <span className="sgp-mob-brand-name">VMS</span>
                  </div>
                  <button
                    type="button"
                    className="sgp-mob-nav-close"
                    onClick={() => {
                      setVerifiedVisit(null);
                      setVisitDecision(null);
                      setVisitAssets([]);
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="sgp-mob-dossier-scroll">
                  <div className="sgp-mob-dossier-title-row">
                    <h2 className="sgp-mob-dossier-heading">Visitor Identity Dossier &amp; Record</h2>
                    <p className="sgp-mob-dossier-sub">
                      Identity verification, declared assets, live campus presence &amp; gate departure.
                    </p>
                  </div>

                  {/* Profile Card */}
                  {(() => {
                    const visitorFullName = [
                      verifiedVisit.visitor?.first_name,
                      verifiedVisit.visitor?.last_name,
                    ].filter(Boolean).join(" ").trim() ||
                      verifiedVisit.visitor?.name ||
                      verifiedVisit.visitor_name ||
                      "Visitor";

                    const visitorPhotoUrl = resolvePhotoUrl(
                      verifiedVisit.visitor?.photo_url ||
                      verifiedVisit.photo_url ||
                      verifiedVisit.visitor_photo_url
                    );

                    const visitorPhone =
                      verifiedVisit.visitor?.phone_number ||
                      verifiedVisit.phone_number ||
                      "—";

                    const visitorEmail =
                      verifiedVisit.visitor?.email ||
                      verifiedVisit.email ||
                      "—";

                    const visitorAddress = [
                      verifiedVisit.visitor?.address_line1,
                      verifiedVisit.visitor?.address_line2,
                      verifiedVisit.visitor?.city,
                      verifiedVisit.visitor?.state,
                      verifiedVisit.visitor?.country,
                    ].filter(Boolean).join(", ") ||
                      verifiedVisit.visitor?.address ||
                      "Registered Address on file";

                    const visitorIdDisplay =
                      verifiedVisit.visitor?.visitor_id ||
                      verifiedVisit.visitor_id ||
                      (verifiedVisit.visit_id ? String(verifiedVisit.visit_id).slice(0, 8) : "136");

                    const hostDisplayName =
                      verifiedVisit.host_employee
                        ? `${verifiedVisit.host_employee.first_name || ""} ${verifiedVisit.host_employee.last_name || ""}`.trim()
                        : verifiedVisit.host?.name || verifiedVisit.host_name || "Internal Staff";

                    const hostDeptDisplay =
                      verifiedVisit.host_employee?.department ||
                      verifiedVisit.host?.department ||
                      (isIT ? "IT" : "General Operations");

                    return (
                      <div className="sgp-mob-dossier-card">
                        <div className="sgp-mob-dossier-profile-header">
                          <div className="sgp-mob-dossier-avatar-wrap">
                            <div
                              className="sgp-mob-dossier-avatar"
                              onClick={() => visitorPhotoUrl && setLightboxImage(visitorPhotoUrl)}
                              title={visitorPhotoUrl ? "Tap to view visitor photo" : "No photo on file"}
                            >
                              {visitorPhotoUrl ? (
                                <img
                                  src={visitorPhotoUrl}
                                  alt={visitorFullName}
                                  className="sgp-mob-dossier-avatar-img"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fb = e.currentTarget.parentElement?.querySelector(".sgp-mob-dossier-avatar-initials");
                                    if (fb) fb.classList.remove("hidden");
                                  }}
                                />
                              ) : null}
                              <span
                                className={`sgp-mob-dossier-avatar-initials${visitorPhotoUrl ? " hidden" : ""}`}
                              >
                                {getMonogram(visitorFullName)}
                              </span>
                            </div>
                            <input
                              type="file"
                              ref={mobPhotoInputRef}
                              style={{ display: "none" }}
                              accept="image/*"
                              onChange={handleMobilePhotoUpload}
                            />
                            <button
                              type="button"
                              className="sgp-mob-btn-update-photo"
                              onClick={() => mobPhotoInputRef.current?.click()}
                            >
                              <Camera size={12} /> Update Photo
                            </button>
                          </div>

                          <div className="sgp-mob-dossier-names">
                            <h3 className="sgp-mob-visitor-fullname">{visitorFullName}</h3>
                            <div className="sgp-mob-dossier-badge-row">
                              <span className="sgp-mob-badge-pill green">
                                ● Visitor ID #{visitorIdDisplay}
                              </span>
                              <span className="sgp-mob-badge-pill purple">
                                {verifiedVisit.visitor?.category || (isIT ? "IT" : "General")}
                              </span>
                              <span className="sgp-mob-badge-pill light">
                                ● Registered / Off-Campus
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information Cards (Reference Image 9) */}
                        <div className="sgp-mob-contact-cards-stack">
                          {/* 1. Phone Row */}
                          <div className="sgp-mob-contact-card">
                            <div className="sgp-mob-contact-card-icon blue">
                              <Phone size={15} />
                            </div>
                            <div className="sgp-mob-contact-card-content">
                              <span className="sgp-mob-contact-card-label">PHONE NUMBER / MOBILE</span>
                              <strong className="sgp-mob-contact-card-value">{visitorPhone}</strong>
                            </div>
                            <div className="sgp-mob-contact-card-actions">
                              {visitorPhone && visitorPhone !== "—" && (
                                <a
                                  href={`tel:${visitorPhone}`}
                                  className="sgp-mob-card-btn blue"
                                  title="Call visitor"
                                >
                                  <Phone size={12} /> Call
                                </a>
                              )}
                              <button
                                type="button"
                                className="sgp-mob-card-btn gray"
                                onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(visitorPhone);
                                    showToast("Phone number copied to clipboard!");
                                  }
                                }}
                                title="Copy phone number"
                              >
                                <Share2 size={12} /> Copy
                              </button>
                            </div>
                          </div>

                          {/* 2. Email Row */}
                          <div className="sgp-mob-contact-card">
                            <div className="sgp-mob-contact-card-icon purple">
                              <Mail size={15} />
                            </div>
                            <div className="sgp-mob-contact-card-content">
                              <span className="sgp-mob-contact-card-label">CORPORATE EMAIL ADDRESS</span>
                              <strong className="sgp-mob-contact-card-value">{visitorEmail}</strong>
                            </div>
                            <div className="sgp-mob-contact-card-actions">
                              {visitorEmail && visitorEmail !== "—" && (
                                <a
                                  href={`mailto:${visitorEmail}`}
                                  className="sgp-mob-card-btn purple"
                                  title="Send email"
                                >
                                  <Mail size={12} /> Email
                                </a>
                              )}
                              <button
                                type="button"
                                className="sgp-mob-card-btn gray"
                                onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(visitorEmail);
                                    showToast("Email address copied to clipboard!");
                                  }
                                }}
                                title="Copy email address"
                              >
                                <Share2 size={12} /> Copy
                              </button>
                            </div>
                          </div>

                          {/* 3. Address Row */}
                          <div className="sgp-mob-contact-card">
                            <div className="sgp-mob-contact-card-icon amber">
                              <MapPin size={15} />
                            </div>
                            <div className="sgp-mob-contact-card-content">
                              <span className="sgp-mob-contact-card-label">FULL REGISTERED ADDRESS</span>
                              <strong className="sgp-mob-contact-card-value">{visitorAddress}</strong>
                            </div>
                            <div className="sgp-mob-contact-card-actions">
                              <button
                                type="button"
                                className="sgp-mob-card-btn gray"
                                onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(visitorAddress);
                                    showToast("Address copied to clipboard!");
                                  }
                                }}
                                title="Copy address"
                              >
                                <Share2 size={12} /> Copy
                              </button>
                            </div>
                          </div>

                          {/* 4. Host Row */}
                          <div className="sgp-mob-contact-card">
                            <div className="sgp-mob-contact-card-icon green">
                              <UserCheck size={15} />
                            </div>
                            <div className="sgp-mob-contact-card-content">
                              <span className="sgp-mob-contact-card-label">ASSIGNED HOST &amp; DEPARTMENT</span>
                              <strong className="sgp-mob-contact-card-value">
                                {hostDisplayName} &bull; {hostDeptDisplay}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Status Clearance Box */}
                        {(() => {
                          const currentStatus = String(verifiedVisit.status || "").trim().toUpperCase();
                          const isApproved = currentStatus === "APPROVED";
                          const isActive = currentStatus === "ACTIVE";
                          const isPending = currentStatus === "PENDING";
                          const isRejected = currentStatus === "REJECTED";
                          const isWaiting = currentStatus === "WAITING";
                          const isRescheduled = currentStatus === "RESCHEDULED";
                          const isExpired = currentStatus === "EXPIRED";

                          let boxClass = "approved";
                          let boxTitle = "Pre-Approved Visit Scheduled";
                          let boxSubtitle = "Identity clearance verified. Ready for gate check-in admission.";

                          if (isActive) {
                            boxClass = "active";
                            boxTitle = "Active On-Premises Visit";
                            boxSubtitle = "Checked In &bull; Active Building Pass";
                          } else if (isPending) {
                            boxClass = "pending";
                            boxTitle = "Check-in blocked — visitor approval is required.";
                            boxSubtitle = "Approval Status: PENDING. Gate check-in cannot proceed until authorized by Host or Admin.";
                          } else if (isRejected) {
                            boxClass = "rejected";
                            boxTitle = "Check-in denied — visitor approval was rejected.";
                            boxSubtitle = "Approval Status: REJECTED. Visitor entry is strictly forbidden.";
                          } else if (isWaiting) {
                            boxClass = "waiting";
                            boxTitle = "Check-in on hold — host is currently occupied.";
                            boxSubtitle = "Approval Status: WAITING. Visitor must wait in reception lobby.";
                          } else if (isRescheduled) {
                            boxClass = "rescheduled";
                            boxTitle = "Check-in blocked — visit has been rescheduled.";
                            boxSubtitle = "Visit has been rescheduled to a future date. Check-in is not permitted today.";
                          } else if (isExpired) {
                            boxClass = "expired";
                            boxTitle = "Check-in blocked — visitor pass/appointment has expired.";
                            boxSubtitle = "The scheduled arrival time window for this visitor has passed.";
                          }

                          return (
                            <div className={`sgp-mob-clearance-box ${boxClass}`}>
                              <div className="sgp-mob-clearance-icon">
                                <CalendarClock size={20} />
                              </div>
                              <div>
                                <span className="sgp-mob-clearance-title">{boxTitle}</span>
                                <p className="sgp-mob-clearance-status">{boxSubtitle}</p>
                                <p className="sgp-mob-clearance-purpose">
                                  Scheduled Purpose: {verifiedVisit.purpose || "General Corporate Visit"}; Host: {hostDisplayName}
                                </p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Primary Action Buttons (Strictly Approval-Dependent) */}
                        <div className="sgp-mob-dossier-action-buttons">
                          {verifiedVisit.status === "ACTIVE" ? (
                            <button
                              type="button"
                              className="sgp-mob-btn-primary red"
                              onClick={() => {
                                handleCheckoutVisitor(verifiedVisit.visit_id);
                                setVerifiedVisit(null);
                              }}
                              disabled={checkoutLoading === verifiedVisit.visit_id}
                            >
                              <LogOut size={16} /> Check Out Visitor Now
                            </button>
                          ) : verifiedVisit.status === "APPROVED" ? (
                            <>
                              <button
                                type="button"
                                className="sgp-mob-btn-primary green"
                                onClick={() => {
                                  handleCheckInVisitor(verifiedVisit.visit_id);
                                  setVerifiedVisit(null);
                                }}
                                disabled={checkingIn}
                              >
                                {checkingIn ? (
                                  <>
                                    <RefreshCw size={16} className="spin" /> Checking In...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 size={16} /> Check In Visitor Now
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                className="sgp-mob-btn-danger outline"
                                onClick={() => {
                                  setVerifiedVisit(null);
                                  showToast("Visitor entry denied by security officer");
                                }}
                              >
                                <XCircle size={16} /> Deny Entry
                              </button>
                            </>
                          ) : (
                            /* Blocked Action: Display Notice & Prohibit Check-in */
                            <div className="sgp-mob-blocked-action-notice">
                              <AlertTriangle size={18} color="#d97706" />
                              <span>
                                {verifiedVisit.status === "REJECTED"
                                  ? "Check-in denied — visitor approval was rejected."
                                  : verifiedVisit.status === "WAITING"
                                  ? "Check-in on hold — host is currently occupied."
                                  : verifiedVisit.status === "RESCHEDULED"
                                  ? "Check-in blocked — visit has been rescheduled."
                                  : verifiedVisit.status === "EXPIRED"
                                  ? "Check-in blocked — visitor pass/appointment has expired."
                                  : "Check-in blocked — visitor approval is required."}
                              </span>
                            </div>
                          )}
                        </div>

                      {/* Dossier Tabs */}
                      <div className="sgp-mob-dossier-tabs">
                        <button
                          type="button"
                          className={dossierTab === "overview" ? "active" : ""}
                          onClick={() => setDossierTab("overview")}
                        >
                          Overview
                        </button>
                        <button
                          type="button"
                          className={dossierTab === "assets" ? "active" : ""}
                          onClick={() => setDossierTab("assets")}
                        >
                          Assets ({visitAssets.length})
                        </button>
                        <button
                          type="button"
                          className={dossierTab === "history" ? "active" : ""}
                          onClick={() => setDossierTab("history")}
                        >
                          Visit History (1)
                        </button>
                      </div>

                      {/* Tab 1: Overview Metadata Table */}
                      {dossierTab === "overview" && (
                        <div className="sgp-mob-metadata-table">
                          <div className="sgp-mob-meta-row">
                            <span className="sgp-mob-meta-label">Visitor ID</span>
                            <span className="sgp-mob-meta-val">#{visitorIdDisplay}</span>
                          </div>
                          <div className="sgp-mob-meta-row">
                            <span className="sgp-mob-meta-label">Visitor Name</span>
                            <span className="sgp-mob-meta-val">{visitorFullName}</span>
                          </div>
                          <div className="sgp-mob-meta-row">
                            <span className="sgp-mob-meta-label">Category</span>
                            <span className="sgp-mob-meta-val">{verifiedVisit.visitor?.category || (isIT ? "IT" : "General")}</span>
                          </div>
                          <div className="sgp-mob-meta-row">
                            <span className="sgp-mob-meta-label">Visit Type</span>
                            <span className="sgp-mob-meta-val">Off-Campus</span>
                          </div>
                          <div className="sgp-mob-meta-row">
                            <span className="sgp-mob-meta-label">Host</span>
                            <span className="sgp-mob-meta-val">{hostDisplayName}</span>
                          </div>
                          <div className="sgp-mob-meta-row">
                            <span className="sgp-mob-meta-label">Department</span>
                            <span className="sgp-mob-meta-val">{hostDeptDisplay}</span>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Assets List & Photos */}
                      {dossierTab === "assets" && (
                        <div className="sgp-mob-assets-container">
                          {visitAssets.length === 0 ? (
                            <div className="sgp-mob-empty-tab">
                              <PackageCheck size={28} color="#94a3b8" />
                              <p>No declared electronic hardware or assets for this visitor.</p>
                            </div>
                          ) : (
                            <div className="sgp-mob-assets-list">
                              {visitAssets.map((asset, idx) => {
                                const assetPhoto = resolvePhotoUrl(asset.photo_url || asset.asset_photo_url);
                                const isCleared = !!asset.is_cleared_for_exit || !!asset.cleared_by;
                                return (
                                  <div key={asset.asset_id || idx} className="sgp-mob-asset-card">
                                    <div
                                      className="sgp-mob-asset-photo-box"
                                      onClick={() => assetPhoto && setLightboxImage(assetPhoto)}
                                      title={assetPhoto ? "Tap to view asset photo" : "No asset photo"}
                                    >
                                      {assetPhoto ? (
                                        <img
                                          src={assetPhoto}
                                          alt={asset.brand_model || "Hardware Asset"}
                                          className="sgp-mob-asset-img"
                                          onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                            const fb = e.currentTarget.parentElement?.querySelector(".sgp-mob-asset-fb");
                                            if (fb) fb.style.display = "flex";
                                          }}
                                        />
                                      ) : null}
                                      <div
                                        className="sgp-mob-asset-fb"
                                        style={{ display: assetPhoto ? "none" : "flex" }}
                                      >
                                        <Laptop size={22} color="#64748b" />
                                      </div>
                                    </div>
                                    <div className="sgp-mob-asset-info">
                                      <div className="sgp-mob-asset-header-row">
                                        <span className="sgp-mob-asset-title">
                                          {asset.brand_model || asset.asset_type || "Hardware Asset"}
                                        </span>
                                        <span className={`sgp-mob-asset-pill ${isCleared ? "cleared" : "pending"}`}>
                                          {isCleared ? "Cleared Exit" : "Carried In"}
                                        </span>
                                      </div>
                                      <div className="sgp-mob-asset-details">
                                        <span className="sgp-mob-asset-detail-item">
                                          <strong>S/N:</strong> {asset.serial_number || "—"}
                                        </span>
                                        <span className="sgp-mob-asset-detail-item">
                                          <strong>Type:</strong> {asset.asset_type || "Hardware"}
                                        </span>
                                        {asset.cleared_by && (
                                          <span className="sgp-mob-asset-detail-item full">
                                            <strong>Clearance:</strong> {asset.cleared_by}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 3: History */}
                      {dossierTab === "history" && (
                        <div className="sgp-mob-history-container">
                          <div className="sgp-mob-history-card">
                            <div className="sgp-mob-history-header">
                              <span className="sgp-mob-history-title">
                                {verifiedVisit.status === "ACTIVE" ? "Active Check-In" : verifiedVisit.status === "CHECKED_OUT" ? "Completed Visit" : "Scheduled Pre-Approval"}
                              </span>
                              <span className="sgp-mob-history-time">
                                {verifiedVisit.check_in_time ? formatDateTime(verifiedVisit.check_in_time) : "Today"}
                              </span>
                            </div>
                            <p className="sgp-mob-history-line">
                              <strong>Host:</strong> {hostDisplayName}
                            </p>
                            <p className="sgp-mob-history-line">
                              <strong>Purpose:</strong> {verifiedVisit.purpose || "Official Campus Visit"}
                            </p>
                            <p className="sgp-mob-history-line">
                              <strong>Status:</strong> {verifiedVisit.status}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                </div>
              </div>
            </div>
          )}

          {/* FIXED BOTTOM NAVIGATION BAR */}
          <nav className="sgp-mob-bottom-nav">
            <button
              type="button"
              className={`sgp-mob-nav-item ${mobileTab === "home" ? "active" : ""}`}
              onClick={() => setMobileTab("home")}
            >
              <Home size={19} />
              <span>Home</span>
            </button>
            <button
              type="button"
              className={`sgp-mob-nav-item ${mobileTab === "scan" ? "active" : ""}`}
              onClick={() => {
                setMobileTab("scan");
                setScannerActive(true);
              }}
            >
              <QrCode size={19} />
              <span>Scan</span>
            </button>
            <button
              type="button"
              className={`sgp-mob-nav-item ${mobileTab === "visitors" ? "active" : ""}`}
              onClick={() => setMobileTab("visitors")}
            >
              <div className="sgp-mob-tab-icon-wrap">
                <Users size={19} />
                {activeVisits.length > 0 && (
                  <span className="sgp-mob-tab-badge">{activeVisits.length}</span>
                )}
              </div>
              <span>Visitors</span>
            </button>
            <button
              type="button"
              className={`sgp-mob-nav-item ${mobileTab === "kiosk" ? "active" : ""}`}
              onClick={() => setMobileTab("kiosk")}
            >
              <Laptop size={19} />
              <span>Kiosk</span>
            </button>
            <button
              type="button"
              className={`sgp-mob-nav-item ${mobileTab === "more" ? "active" : ""}`}
              onClick={() => setMobileTab("more")}
            >
              <MoreHorizontal size={19} />
              <span>More</span>
            </button>
          </nav>
        </div>
      )}

    </div>
  );
}


class SecurityGuardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Security Guard Terminal Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "24px" }}>
          <div style={{ maxWidth: "520px", width: "100%", background: "#ffffff", padding: "32px", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.08)", border: "1px solid #fee2e2", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <ShieldCheck size={28} />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>Gate Security Terminal</h2>
            <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 20px" }}>
              {this.state.error?.message || "A temporary verification error occurred. Click below to reset the camera and terminal."}
            </p>
            <button
              type="button"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
            >
              Reset &amp; Reload Terminal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SecurityGuardPortal(props) {
  return (
    <SecurityGuardErrorBoundary>
      <SecurityGuardPortalInner {...props} />
    </SecurityGuardErrorBoundary>
  );
}
