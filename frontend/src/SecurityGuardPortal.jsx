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
} from "lucide-react";
import QRCode from "qrcode";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./App.css";
import "./PremiumEnterprise.css";
import "./SecurityGuardPortal.css";
import { authStorage } from "./utils/authStorage";

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

function SecurityGuardPortalInner({ currentUser, onLogout, authToken: propToken }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("vms-theme") || "dark");
  const [activeTab, setActiveTab] = useState("checkin");

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
    QRCode.toDataURL(`${origin}/it-visit`, { width: 340, margin: 2 }).then(setItQR).catch(() => {});
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
          (item) => String(item.status || "").trim().toUpperCase() === "APPROVED"
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

  // Start Camera QR Scanner
  useEffect(() => {
    let scanner = null;
    if (activeTab === "checkin" && scannerActive) {
      try {
        scanner = new Html5QrcodeScanner("security-camera-reader", {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          videoConstraints: {
            facingMode: { ideal: "environment" },
          },
        });

        scanner.render(
          async (decodedText) => {
            try {
              await scanner.clear().catch(() => {});
            } catch {}
            setScannerActive(false);
            setSearchQuery(decodedText);
            verifyVisitorByInput(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera scanner error:", err);
      }
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [activeTab, scannerActive]);

  const rawStatus = String(verifiedVisit?.status || "").trim().toUpperCase();
  const isIT = (verifiedVisit?.purpose || "").includes("[IT_VISIT]");

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
              <div className="sgp-notif-drawer-title-group">
                <Bell size={18} color="#38bdf8" />
                <h3 className="sgp-notif-drawer-title">Live Registration Alerts</h3>
                <span className="sgp-badge-live">
                  <span className="pulse-dot"></span> REALTIME
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = notifications.map((n) => String(n.audit_id));
                      localStorage.setItem("vms_guard_read_ids", JSON.stringify(allIds));
                      setUnreadCount(0);
                    }}
                    style={{
                      background: "rgba(56, 189, 248, 0.15)",
                      border: "1px solid rgba(56, 189, 248, 0.4)",
                      color: "#38bdf8",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    title="Mark all as read"
                  >
                    Mark read
                  </button>
                )}
                <button
                  type="button"
                  onClick={fetchGuardNotifications}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "none",
                    color: "#94a3b8",
                    borderRadius: "6px",
                    padding: "6px",
                    cursor: "pointer",
                  }}
                  title="Refresh alerts"
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setNotifDrawerOpen(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "none",
                    color: "#cbd5e1",
                    borderRadius: "6px",
                    padding: "6px",
                    cursor: "pointer",
                  }}
                  title="Close"
                >
                  <X size={18} />
                </button>
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
            <span className="sgp-kpi-subtext">Reception &amp; IT Registration</span>
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
                      <div className="sgp-camera-container">
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
                Reception Desk QR Code
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
