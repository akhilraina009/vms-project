import { useState, useMemo, useEffect } from "react";
import {
  History,
  Search,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ArrowRightCircle,
  Columns,
  Smartphone,
  CheckCheck,
  Briefcase,
  Server,
  QrCode,
  X,
  Eye,
  Printer,
  ShieldCheck,
  Building2,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Copy,
  Check,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Layers,
  ArrowUpDown,
  Laptop,
  LogIn,
  LogOut,
  Package,
  Award,
  FileText,
  BadgeCheck,
  Camera,
  MoreVertical,
} from "lucide-react";
import "./CheckoutHistory.css";
import "./ITVisit.css";

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

const getInitials = (name) => {
  if (!name) return "V";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatVisitorAddress = (parts) => {
  if (!Array.isArray(parts)) return "On record";
  const nonNull = parts.map((p) => (p || "").trim()).filter(Boolean);
  if (nonNull.length === 0) return "On record";
  const deduped = [];
  for (const part of nonNull) {
    if (deduped.length === 0 || deduped[deduped.length - 1].toLowerCase() !== part.toLowerCase()) {
      deduped.push(part);
    }
  }
  return deduped.join(", ");
};

const formatDateTime = (val) => {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(val);
  }
};

const getLocalDateString = (d = new Date()) => {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const calculateDwellTime = (inTime, outTime) => {
  if (!inTime || !outTime) return { label: "—", minutes: 0 };
  const dIn = new Date(inTime).getTime();
  const dOut = new Date(outTime).getTime();
  if (Number.isNaN(dIn) || Number.isNaN(dOut) || dOut < dIn) {
    return { label: "—", minutes: 0 };
  }
  const diffMs = dOut - dIn;
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return { label: `${days}d ${hours}h`, minutes: totalMinutes };
  }
  if (hours > 0) {
    return { label: `${hours}h ${minutes}m`, minutes: totalMinutes };
  }
  return { label: `${minutes}m`, minutes: totalMinutes };
};

// IT Asset helpers & 3D icons
function categorizeAsset(asset) {
  const text = `${asset?.asset_type || ""} ${asset?.brand_model || ""}`.toLowerCase();
  if (
    text.includes("laptop") ||
    text.includes("notebook") ||
    text.includes("macbook") ||
    text.includes("thinkpad") ||
    text.includes("computer") ||
    text.includes("pc")
  ) {
    return "Laptop";
  }
  if (
    text.includes("mobile") ||
    text.includes("phone") ||
    text.includes("iphone") ||
    text.includes("android") ||
    text.includes("tablet") ||
    text.includes("ipad") ||
    text.includes("smartphone")
  ) {
    return "Mobile";
  }
  return "Others";
}

function getFormattedVisitId(visit, visitorId) {
  if (visit?.pass_number) return visit.pass_number;
  const vid = String(visit?.visit_id || visitorId || "001");
  if (vid.startsWith("V-")) return vid;
  const clean = vid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const dateStr = visit?.check_in_time
    ? new Date(visit.check_in_time).toISOString().slice(0, 10).replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `V-${dateStr}-${clean.slice(-3) || "001"}`;
}

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

function Laptop3DIcon() {
  return (
    <svg width="68" height="56" viewBox="0 0 68 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="34" cy="48" rx="28" ry="6" fill="#bfdbfe" fillOpacity="0.45" />
      <path d="M12 36L22 10C22.5 8.5 24 7.5 25.5 7.5H48.5C50 7.5 51.5 8.5 52 10L60 36H12Z" fill="#3b82f6" />
      <path d="M14 34L23 12C23.3 11 24.2 10 25.5 10H47C48.2 10 49.2 11 49.5 12L56 34H14Z" fill="#1e40af" />
      <rect x="25" y="14" width="20" height="15" rx="2" fill="#60a5fa" fillOpacity="0.8" />
      <path d="M28 18H40M28 22H36" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 38C6 36.5 7.2 35.5 8.7 35.5H59.3C60.8 35.5 62 36.5 62 38L64 43C64 44.5 62.8 45.5 61.3 45.5H6.7C5.2 45.5 4 44.5 4 43L6 38Z" fill="#93c5fd" />
      <path d="M8 38H60L58 42H10L8 38Z" fill="#dbeafe" />
      <rect x="29" y="39" width="10" height="2" rx="1" fill="#60a5fa" />
    </svg>
  );
}

function PackageCheck3DIcon() {
  return (
    <svg width="68" height="56" viewBox="0 0 68 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="48" rx="26" ry="6" fill="#bbf7d0" fillOpacity="0.5" />
      <path d="M12 24L32 12L52 24L32 36L12 24Z" fill="#4ade80" />
      <path d="M12 24L32 36V48L12 36V24Z" fill="#22c55e" />
      <path d="M52 24L32 36V48L52 36V24Z" fill="#16a34a" />
      <path d="M32 12L24 8L16 16L24 20L32 12Z" fill="#86efac" />
      <path d="M32 12L40 8L48 16L40 20L32 12Z" fill="#86efac" />
      <circle cx="46" cy="40" r="11" fill="#15803d" stroke="#ffffff" strokeWidth="2.5" />
      <path d="M42 40L45 43L50 37" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssetFallbackIcon({ category }) {
  if (category === "Laptop") {
    return (
      <svg width="26" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="2" fill="#eff6ff" />
        <path d="M2 18h20v2H2z" fill="#93c5fd" />
      </svg>
    );
  }
  if (category === "Mobile") {
    return (
      <svg width="22" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="3" fill="#f0fdf4" />
        <circle cx="12" cy="18" r="1" fill="#16a34a" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" fill="#fffbeb" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

export default function CheckoutHistory({
  checkoutHistory = [],
  visitorList = [],
  onRefresh,
  loading = false,
  error = "",
  mode = "general", // "general" | "it"
  onBack,
  setAssetLightbox,
}) {
  const isITMode = mode === "it";

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState("all"); // "all" | "today" | "yesterday" | "week" | "month" | "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateBasis, setDateBasis] = useState("checkout"); // "checkout" | "checkin"
  const [companyFilter, setCompanyFilter] = useState("all");
  const [hostFilter, setHostFilter] = useState("all");
  const [assetFilter, setAssetFilter] = useState("all"); // "all" | "has_assets" | "no_assets" | "cleared"
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "longest" | "shortest"
  const [copiedId, setCopiedId] = useState("");
  const [selectedVisitIds, setSelectedVisitIds] = useState([]);

  const toggleSelectVisit = (id, e) => {
    e.stopPropagation();
    setSelectedVisitIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisits = (list) => {
    if (!list || list.length === 0) return;
    if (selectedVisitIds.length === list.length) {
      setSelectedVisitIds([]);
    } else {
      setSelectedVisitIds(list.map((item) => item.visit_id));
    }
  };
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [dossierTab, setDossierTab] = useState("all"); // "all" | "checkin" | "checkout" | "summary"
  const [itDossierViewMode, setItDossierViewMode] = useState("overview"); // "checkin" | "checkout" | "dual" | "overview"

  const [scopeFilter, setScopeFilter] = useState(isITMode ? "it" : "general");

  useEffect(() => {
    setScopeFilter(isITMode ? "it" : "general");
  }, [isITMode]);

  // Filter history by scope:
  // In General Mode (Management portal): STRICTLY show only normal visitors, NEVER show IT visits now or in future.
  // In IT Mode: STRICTLY show IT Technical Specialist visits.
  const baseHistory = useMemo(() => {
    return checkoutHistory.filter((item) => {
      const isIT = Boolean(
        item.purpose && String(item.purpose).toUpperCase().includes("[IT_VISIT]")
      );
      if (isITMode) {
        return isIT;
      }
      // General / Management Portal: strictly show only normal visitors, never show IT visits
      return !isIT;
    });
  }, [checkoutHistory, isITMode]);

  // Unique companies and hosts for filter dropdowns
  const uniqueCompanies = useMemo(() => {
    const set = new Set();
    baseHistory.forEach((item) => {
      const comp = item.visitor?.company_name;
      if (comp && comp.trim()) set.add(comp.trim());
    });
    return Array.from(set).sort();
  }, [baseHistory]);

  const uniqueHosts = useMemo(() => {
    const set = new Set();
    baseHistory.forEach((item) => {
      const h = item.host_employee;
      if (h) {
        const name = `${h.first_name || ""} ${h.last_name || ""}`.trim();
        if (name) set.add(name);
      }
    });
    return Array.from(set).sort();
  }, [baseHistory]);

  // Handle Preset Clicks
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = getLocalDateString(today);

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = getLocalDateString(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === "week") {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 6);
      const lYStr = getLocalDateString(last7);
      setStartDate(lYStr);
      setEndDate(todayStr);
    } else if (preset === "month") {
      const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      setStartDate(firstDay);
      setEndDate(todayStr);
    }
  };

  // Filtered and sorted dataset
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();

    return baseHistory
      .filter((item) => {
        // 1. Text Search Filter
        if (q) {
          const v = item.visitor || {};
          const h = item.host_employee || {};
          const vName = `${v.first_name || ""} ${v.last_name || ""}`.toLowerCase();
          const hName = `${h.first_name || ""} ${h.last_name || ""}`.toLowerCase();
          const phone = String(v.phone_number || "").toLowerCase();
          const email = String(v.email || "").toLowerCase();
          const comp = String(v.company_name || "").toLowerCase();
          const dept = String(h.department || "").toLowerCase();
          const purpose = String(item.purpose || "").toLowerCase();
          const visitId = String(item.visit_id || "").toLowerCase();
          const assetSerials = (item.assets || [])
            .map((a) => `${a.serial_number || ""} ${a.brand_model || ""} ${a.asset_type || ""}`.toLowerCase())
            .join(" ");

          const matchesSearch =
            vName.includes(q) ||
            hName.includes(q) ||
            phone.includes(q) ||
            email.includes(q) ||
            comp.includes(q) ||
            dept.includes(q) ||
            purpose.includes(q) ||
            visitId.includes(q) ||
            assetSerials.includes(q);

          if (!matchesSearch) return false;
        }

        // 2. Company Filter
        if (companyFilter !== "all") {
          const c = (item.visitor?.company_name || "").trim();
          if (c !== companyFilter) return false;
        }

        // 3. Host Filter
        if (hostFilter !== "all") {
          const h = item.host_employee;
          const hName = h ? `${h.first_name || ""} ${h.last_name || ""}`.trim() : "";
          if (hName !== hostFilter) return false;
        }

        // 4. Asset Filter
        const assetCount = (item.assets || []).length;
        if (assetFilter === "has_assets" && assetCount === 0) return false;
        if (assetFilter === "no_assets" && assetCount > 0) return false;
        if (assetFilter === "cleared") {
          if (assetCount === 0) return false;
          const allCleared = (item.assets || []).every((a) => a.is_cleared_for_exit);
          if (!allCleared) return false;
        }
        if (assetFilter === "has_retained") {
          const hasRetained = (item.assets || []).some(
            (a) => (a.cleared_by && a.cleared_by.includes("RETAINED")) || a.disposition === "RETAINED_ON_PREMISES"
          );
          if (!hasRetained) return false;
        }
        if (assetFilter === "has_carried") {
          const hasCarried = (item.assets || []).some(
            (a) => (!a.cleared_by || !a.cleared_by.includes("RETAINED")) && (a.is_cleared_for_exit || a.disposition === "CARRIED_OUT")
          );
          if (!hasCarried) return false;
        }

        // 5. Calendar Date Range Filter
        const targetDateVal = dateBasis === "checkout" ? item.check_out_time : item.check_in_time;
        if ((startDate || endDate) && targetDateVal) {
          const itemDateStr = getLocalDateString(targetDateVal);
          if (itemDateStr) {
            if (startDate && itemDateStr < startDate) return false;
            if (endDate && itemDateStr > endDate) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.check_out_time || 0) - new Date(a.check_out_time || 0);
        }
        if (sortBy === "oldest") {
          return new Date(a.check_out_time || 0) - new Date(b.check_out_time || 0);
        }
        if (sortBy === "longest") {
          const dwellA = calculateDwellTime(a.check_in_time, a.check_out_time).minutes;
          const dwellB = calculateDwellTime(b.check_in_time, b.check_out_time).minutes;
          return dwellB - dwellA;
        }
        if (sortBy === "shortest") {
          const dwellA = calculateDwellTime(a.check_in_time, a.check_out_time).minutes;
          const dwellB = calculateDwellTime(b.check_in_time, b.check_out_time).minutes;
          return dwellA - dwellB;
        }
        return 0;
      });
  }, [baseHistory, search, companyFilter, hostFilter, assetFilter, startDate, endDate, dateBasis, sortBy]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const total = filteredList.length;
    const todayStr = getLocalDateString(new Date());
    let todayCount = 0;
    let standardDwellMinutes = 0;
    let standardDwellCount = 0;
    let extendedDwellCount = 0;
    let totalDwellMinutes = 0;
    let validDwellCount = 0;
    let totalClearedAssets = 0;
    let totalDeclaredAssets = 0;
    let totalRetainedAssets = 0;
    let totalCarriedOutAssets = 0;

    filteredList.forEach((item) => {
      const outDateStr = getLocalDateString(item.check_out_time);
      if (outDateStr && outDateStr === todayStr) {
        todayCount++;
      }
      const dwell = calculateDwellTime(item.check_in_time, item.check_out_time);
      if (dwell.minutes > 0) {
        totalDwellMinutes += dwell.minutes;
        validDwellCount++;
        // Standard operational visits: <= 24 hours (1440 mins)
        // Multi-day test stays or multi-week visits are counted as extended
        if (dwell.minutes <= 24 * 60) {
          standardDwellMinutes += dwell.minutes;
          standardDwellCount++;
        } else {
          extendedDwellCount++;
        }
      }
      (item.assets || []).forEach((a) => {
        totalDeclaredAssets++;
        const isRet = (a.cleared_by && a.cleared_by.includes("RETAINED")) || a.disposition === "RETAINED_ON_PREMISES";
        if (isRet) {
          totalRetainedAssets++;
        } else if (a.is_cleared_for_exit || a.disposition === "CARRIED_OUT") {
          totalCarriedOutAssets++;
          totalClearedAssets++;
        }
      });
    });

    // Realistic operational dwell time: prioritize standard visits (<=24h)
    // to avoid skew from forgotten checkouts or multi-week test badges
    const targetMinutes =
      standardDwellCount > 0
        ? Math.round(standardDwellMinutes / standardDwellCount)
        : validDwellCount > 0
        ? Math.round(totalDwellMinutes / validDwellCount)
        : 0;

    const avgHours = Math.floor(targetMinutes / 60);
    const avgRemMins = targetMinutes % 60;
    const avgDays = Math.floor(avgHours / 24);
    const remHours = avgHours % 24;

    let avgDwellLabel = "—";
    if (targetMinutes > 0) {
      if (avgDays > 0) {
        avgDwellLabel = `${avgDays}d ${remHours}h`;
      } else if (avgHours > 0) {
        avgDwellLabel = `${avgHours}h ${avgRemMins}m`;
      } else {
        avgDwellLabel = `${avgRemMins}m`;
      }
    }

    return {
      total,
      todayCount,
      avgDwellLabel,
      standardDwellCount,
      extendedDwellCount,
      totalClearedAssets,
      totalDeclaredAssets,
      totalRetainedAssets,
      totalCarriedOutAssets,
    };
  }, [filteredList]);

  // Copy Badge Reference
  const handleCopyBadge = (visitId, e) => {
    if (e) e.stopPropagation();
    const badgeText = `VMS-${String(visitId).slice(0, 8).toUpperCase()}`;
    navigator.clipboard?.writeText(badgeText);
    setCopiedId(visitId);
    setTimeout(() => setCopiedId(""), 2000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      alert("No records to export.");
      return;
    }

    const headers = [
      "Badge ID",
      "Visitor Name",
      "Company",
      "Phone",
      "Email",
      "Host Employee",
      "Host Department",
      "Stated Purpose",
      "Check-in Time",
      "Checkout Time",
      "Duration",
      "Assets Count",
      "Status",
    ];

    const rows = filteredList.map((item) => {
      const v = item.visitor || {};
      const h = item.host_employee || {};
      const dwell = calculateDwellTime(item.check_in_time, item.check_out_time).label;
      const badgeId = `VMS-${String(item.visit_id).slice(0, 8).toUpperCase()}`;

      return [
        badgeId,
        `"${(v.first_name || "") + " " + (v.last_name || "")}"`,
        `"${v.company_name || ""}"`,
        `"${v.phone_number || ""}"`,
        `"${v.email || ""}"`,
        `"${(h.first_name || "") + " " + (h.last_name || "")}"`,
        `"${h.department || ""}"`,
        `"${(item.purpose || "").replace(/"/g, '""')}"`,
        `"${formatDateTime(item.check_in_time)}"`,
        `"${formatDateTime(item.check_out_time)}"`,
        `"${dwell}"`,
        (item.assets || []).length,
        item.status || "CHECKED_OUT",
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${isITMode ? "IT" : "General"}_Checkout_History_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ch-container">
      <div className={`ch-main-content ${selectedVisit ? "no-print" : ""}`}>
      {/* Executive Header */}
      <header className="ch-header">
        <div className="ch-header-titles">
          <h2>
            <History size={24} color="#60a5fa" />
            {isITMode ? "IT Department Technician Checkout Archive" : "Visitor Checkout History & Audit Archive"}
          </h2>
          <p>
            {isITMode
              ? "Comprehensive audit trail for technical contractors, datacenter engineers, and hardware exit clearances."
              : "Complete ledger of verified visitor admissions, gate departure timestamps, dwell durations, and asset inspections."}
          </p>
        </div>

        <div className="ch-header-actions">
          <button
            type="button"
            className="ch-btn-export"
            onClick={handleExportCSV}
            title="Export filtered records to CSV spreadsheet"
          >
            <Download size={15} /> Export CSV
          </button>

          <button
            type="button"
            className="ch-btn-refresh no-print"
            onClick={() => window.print()}
            title="Print official departure audit report"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Printer size={14} /> Print Report
          </button>

          <button
            type="button"
            className="ch-btn-refresh"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh checkout records"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            {loading ? "Refreshing..." : "Refresh Records"}
          </button>

          {onBack && (
            <button
              type="button"
              className="ch-btn-back"
              onClick={onBack}
              title="Return to dashboard"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
        </div>
      </header>

      {/* Printable Official Report Header (Screen Hidden) */}
      <div className="ch-print-report-header no-screen">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2.5px solid #2563eb", paddingBottom: "10px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "38px", height: "38px", background: "#0f172a", color: "#ffffff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "16px" }}>VMS</div>
            <div>
              <h2 style={{ margin: 0, fontSize: "15pt", fontWeight: 800, color: "#0f172a" }}>
                Official Checkout History &amp; Departure Audit Report
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "7.5pt", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Enterprise Physical &amp; Digital Access Control · Certified Gate Departure Ledger
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "7.5pt", color: "#475569" }}>
            <div><strong>Generated:</strong> {new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
            <div><strong>Archive Scope:</strong> {isITMode ? "IT TECHNICAL SPECIALISTS" : "NORMAL VISITORS"} · <strong>Total Records:</strong> {filteredList.length}</div>
          </div>
        </div>
      </div>

      {/* Metric KPI Summary Cards */}
      <section className="ch-metrics-grid">
        <div className="ch-metric-card">
          <div className="ch-metric-icon blue">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="ch-metric-val">{metrics.total}</div>
            <div className="ch-metric-lbl">Total Departures in Scope</div>
          </div>
        </div>

        <div className="ch-metric-card">
          <div className="ch-metric-icon emerald">
            <Clock size={24} />
          </div>
          <div>
            <div className="ch-metric-val">{metrics.todayCount}</div>
            <div className="ch-metric-lbl">Checked Out Today</div>
          </div>
        </div>

        <div
          className="ch-metric-card"
          title={
            metrics.extendedDwellCount > 0
              ? `Average dwell time for standard visits (≤24h). Excludes ${metrics.extendedDwellCount} multi-day stays.`
              : "Average duration on-site across visits"
          }
        >
          <div className="ch-metric-icon purple">
            <History size={24} />
          </div>
          <div>
            <div className="ch-metric-val">{metrics.avgDwellLabel}</div>
            <div className="ch-metric-lbl">Average Dwell Time</div>
            {metrics.extendedDwellCount > 0 ? (
              <div className="ch-metric-sublbl">
                Standard (≤24h) · {metrics.extendedDwellCount} multi-day
              </div>
            ) : metrics.standardDwellCount > 0 ? (
              <div className="ch-metric-sublbl">
                Standard visits ({metrics.standardDwellCount})
              </div>
            ) : null}
          </div>
        </div>

        <div className="ch-metric-card">
          <div className="ch-metric-icon amber">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="ch-metric-val">{metrics.totalDeclaredAssets}</div>
            <div className="ch-metric-lbl">
              Check-In Hardware ({metrics.totalCarriedOutAssets || 0} Carried Out · {metrics.totalRetainedAssets || 0} Retained)
            </div>
          </div>
        </div>
      </section>

      {/* Calendar & Multi-Dimensional Filter Control Card */}
      <section className="ch-control-card">
        {/* Scope Selector: General vs IT */}
        <div className="ch-scope-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="ch-scope-label">
              Archive Scope:
            </span>
            <div className="ch-scope-segmented">
              {isITMode ? (
                <button
                  type="button"
                  className="ch-scope-btn active"
                >
                  IT Technical Specialists ({baseHistory.length})
                </button>
              ) : (
                <button
                  type="button"
                  className="ch-scope-btn active"
                >
                  Normal Visitors ({baseHistory.length})
                </button>
              )}
            </div>
          </div>
          
          <div className="ch-records-counter">
            Showing <strong>{filteredList.length}</strong> of <strong>{baseHistory.length}</strong> loaded departure records
          </div>
        </div>

        {/* Date Presets Row */}
        <div className="ch-date-presets">
          <span className="ch-preset-label">
            <Calendar size={14} /> Date Presets:
          </span>
          <button
            type="button"
            className={`ch-preset-btn ${datePreset === "all" ? "active" : ""}`}
            onClick={() => handlePresetChange("all")}
          >
            All Dates
          </button>
          <button
            type="button"
            className={`ch-preset-btn ${datePreset === "today" ? "active" : ""}`}
            onClick={() => handlePresetChange("today")}
          >
            Today
          </button>
          <button
            type="button"
            className={`ch-preset-btn ${datePreset === "yesterday" ? "active" : ""}`}
            onClick={() => handlePresetChange("yesterday")}
          >
            Yesterday
          </button>
          <button
            type="button"
            className={`ch-preset-btn ${datePreset === "week" ? "active" : ""}`}
            onClick={() => handlePresetChange("week")}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`ch-preset-btn ${datePreset === "month" ? "active" : ""}`}
            onClick={() => handlePresetChange("month")}
          >
            This Month
          </button>
          <button
            type="button"
            className={`ch-preset-btn ${datePreset === "custom" ? "active" : ""}`}
            onClick={() => setDatePreset("custom")}
          >
            Custom Range
          </button>
        </div>

        {/* Interactive Calendar Date Picker Row */}
        <div className="ch-date-row">
          <div className="ch-date-input-group">
            <span className="ch-date-input-label">From:</span>
            <input
              type="date"
              className="ch-date-field"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
              title="Filter records beginning on this date"
            />
          </div>

          <div className="ch-date-input-group">
            <span className="ch-date-input-label">To:</span>
            <input
              type="date"
              className="ch-date-field"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
              title="Filter records ending on this date"
            />
          </div>

          {/* Basis Toggle: Check-in Date vs Checkout Date */}
          <div className="ch-date-basis-toggle" title="Select which timestamp to evaluate against the calendar range">
            <button
              type="button"
              className={`ch-basis-btn ${dateBasis === "checkout" ? "active" : ""}`}
              onClick={() => setDateBasis("checkout")}
            >
              Checkout Date
            </button>
            <button
              type="button"
              className={`ch-basis-btn ${dateBasis === "checkin" ? "active" : ""}`}
              onClick={() => setDateBasis("checkin")}
            >
              Check-in Date
            </button>
          </div>

          {(startDate || endDate || datePreset !== "all") && (
            <button
              type="button"
              className="ch-btn-clear-date"
              onClick={() => handlePresetChange("all")}
            >
              <X size={13} /> Reset Dates
            </button>
          )}
        </div>

        {/* Search & Secondary Filter Dropdowns */}
        <div className="ch-filter-bar">
          <div className="ch-search-box">
            <Search size={16} className="ch-search-icon" />
            <input
              type="text"
              className="ch-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visitor name, company, host, phone, email, purpose, or asset serial..."
            />
            {search && (
              <button
                type="button"
                className="ch-search-clear"
                onClick={() => setSearch("")}
                title="Clear search query"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Company Dropdown */}
          <select
            className="ch-dropdown"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            title="Filter by visitor organization"
          >
            <option value="all">All Companies ({uniqueCompanies.length})</option>
            {uniqueCompanies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Host Dropdown */}
          <select
            className="ch-dropdown"
            value={hostFilter}
            onChange={(e) => setHostFilter(e.target.value)}
            title="Filter by host employee"
          >
            <option value="all">All Hosts ({uniqueHosts.length})</option>
            {uniqueHosts.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          {/* Asset Presence Dropdown */}
          <select
            className="ch-dropdown"
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            title="Filter by hardware equipment status"
          >
            <option value="all">All Asset Clearances</option>
            <option value="has_assets">With Declared Assets</option>
            <option value="cleared">All Assets Cleared</option>
            <option value="no_assets">No Assets Carried</option>
          </select>

          {/* Sorting */}
          <select
            className="ch-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title="Sort checkout records"
          >
            <option value="newest">Sort: Newest Checkout</option>
            <option value="oldest">Sort: Oldest Checkout</option>
            <option value="longest">Sort: Longest Dwell Time</option>
            <option value="shortest">Sort: Shortest Dwell Time</option>
          </select>
        </div>
      </section>

      {/* Main Table Card */}
      <section className="ch-table-card">
        <div className="ch-table-meta-bar">
          <div>
            Showing <strong>{filteredList.length}</strong> of <strong>{baseHistory.length}</strong> archived departure
            records
          </div>
          {(search || datePreset !== "all" || companyFilter !== "all" || hostFilter !== "all" || assetFilter !== "all") && (
            <div className="ch-clear-filters-link"
              onClick={() => {
                setSearch("");
                handlePresetChange("all");
                setCompanyFilter("all");
                setHostFilter("all");
                setAssetFilter("all");
              }}
            >
              Clear all active filters
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ margin: "0 auto 10px" }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Loading checkout history records...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "36px", textAlign: "center", color: "#dc2626" }}>
            <AlertTriangle size={24} style={{ margin: "0 auto 8px" }} />
            <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            <Search size={32} color="#cbd5e1" style={{ margin: "0 auto 10px" }} />
            <h4 className="ch-empty-title">No matching records found</h4>
            <p style={{ margin: 0, fontSize: "13px" }}>
              Try adjusting your date range calendar or clearing search filters.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="ch-table">
              <thead>
                <tr>
                  <th className="ch-col-checkbox" style={{ width: 44, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={filteredList.length > 0 && selectedVisitIds.length === filteredList.length}
                      onChange={() => toggleSelectAllVisits(filteredList)}
                      className="vms-checkbox"
                      title="Select all archived visits"
                    />
                  </th>
                  <th className="ch-col-visitor">VISITOR PROFILE</th>
                  <th className="ch-col-company">COMPANY &amp; AFFILIATION</th>
                  <th className="ch-col-host">HOST OFFICIAL</th>
                  <th className="ch-col-purpose">STATED PURPOSE</th>
                  <th className="ch-col-timeline">TIMELINE &amp; DURATION</th>
                  <th className="ch-col-hardware">DECLARED HARDWARE</th>
                  <th className="ch-col-actions" style={{ textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => {
                  const historyVisitor = item.visitor || {};
                  const directoryVisitor =
                    visitorList.find(
                      (v) => String(v.visitor_id) === String(historyVisitor.visitor_id || item.visitor_id)
                    ) || {};
                  const visitor = {
                    ...directoryVisitor,
                    ...historyVisitor,
                    photo_url:
                      historyVisitor.photo_url ||
                      directoryVisitor.photo_url ||
                      item.photo_url ||
                      item.visitor_photo_url ||
                      "",
                  };

                  const host = item.host_employee || {};
                  const visitorFullName =
                    `${visitor.first_name || ""} ${visitor.last_name || ""}`.trim() || "Visitor";
                  const visitorPhoto = resolvePhotoUrl(visitor.photo_url);
                  const dwell = calculateDwellTime(item.check_in_time, item.check_out_time);
                  const badgeId = `VMS-${String(item.visit_id).slice(0, 8).toUpperCase()}`;
                  const assets = item.assets || [];
                  const allAssetsCleared = assets.length > 0 && assets.every((a) => a.is_cleared_for_exit);

                  return (
                    <tr
                      key={item.visit_id}
                      className={`ch-row-clickable ${selectedVisitIds.includes(item.visit_id) ? "row-selected" : ""}`}
                      onClick={() => setSelectedVisit({ ...item, visitor, host })}
                    >
                      {/* Checkbox Column */}
                      <td className="ch-col-checkbox" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedVisitIds.includes(item.visit_id)}
                          onChange={(e) => toggleSelectVisit(item.visit_id, e)}
                          className="vms-checkbox"
                        />
                      </td>

                      {/* Visitor Profile Cell */}
                      <td className="ch-col-visitor">
                        <div className="ch-visitor-cell">
                          <div
                            className="ch-avatar-wrap"
                            onClick={(e) => {
                              if (visitorPhoto && setAssetLightbox) {
                                e.stopPropagation();
                                setAssetLightbox({
                                  url: visitorPhoto,
                                  title: `${visitorFullName} (Visitor Photo)`,
                                  subtitle: `Badge ${badgeId} · ${visitor.company_name || "Visitor"}`,
                                });
                              }
                            }}
                            title={visitorPhoto ? "Click to zoom visitor photo" : "No photo registered"}
                          >
                            {visitorPhoto ? (
                              <>
                                <img src={visitorPhoto} alt={visitorFullName} className="ch-avatar-img" />
                                <div className="ch-avatar-zoom-icon">
                                  <Eye size={10} />
                                </div>
                              </>
                            ) : (
                              <span className="ch-avatar-initials">{getInitials(visitorFullName)}</span>
                            )}
                          </div>

                          <div className="ch-visitor-info">
                            <span className="ch-visitor-name">{visitorFullName}</span>
                            <div className="ch-visitor-sub">
                              <span>{visitor.phone_number || "No phone"}</span>
                              <span
                                className="ch-badge-tag"
                                onClick={(e) => handleCopyBadge(item.visit_id, e)}
                                title="Click to copy badge ID"
                              >
                                {copiedId === item.visit_id ? (
                                  <>
                                    <Check size={10} color="#059669" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy size={9} /> {badgeId}
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="ch-col-company">
                        <div className="ch-company-cell">
                          <Building2 size={14} className="ch-cell-icon" />
                          <span>{visitor.company_name || "Individual / Self"}</span>
                        </div>
                      </td>

                      {/* Host */}
                      <td className="ch-col-host">
                        <div>
                          <strong className="ch-host-name">
                            {`${host.first_name || ""} ${host.last_name || ""}`.trim() || "Unassigned"}
                          </strong>
                          <div className="ch-host-dept">
                            {host.department || "General"}
                          </div>
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="ch-col-purpose">
                        <div style={{ maxWidth: "220px" }}>
                          <span
                            className="ch-purpose-text"
                            title={item.purpose}
                          >
                            {item.purpose || "Official Meeting"}
                          </span>
                        </div>
                      </td>

                      {/* Timeline & Dwell */}
                      <td className="ch-col-timeline">
                        <div className="ch-timeline-cell">
                          <div className="ch-time-row">
                            <span className="ch-time-dot in" title="Check-in timestamp"></span>
                            <span>In: {formatDateTime(item.check_in_time)}</span>
                          </div>
                          <div className="ch-time-row">
                            <span className="ch-time-dot out" title="Checkout timestamp"></span>
                            <span>Out: {formatDateTime(item.check_out_time)}</span>
                          </div>
                          <span
                            className={`ch-dwell-pill ${dwell.minutes > 24 * 60 ? "extended" : ""}`}
                            title={
                              dwell.minutes > 24 * 60
                                ? `Extended multi-day stay (${dwell.label})`
                                : "Total duration inside premises"
                            }
                          >
                            <Clock size={11} /> {dwell.label} on-site
                          </span>
                        </div>
                      </td>

                      {/* Declared Hardware Assets */}
                      <td className="ch-col-hardware">
                        {assets.length === 0 ? (
                          <div className="ch-asset-empty-state">
                            <span className="ch-asset-tag none">
                              <ShieldCheck size={11} /> No Assets
                            </span>
                          </div>
                        ) : (() => {
                          const carriedOut = assets.filter((a) => (!a.cleared_by || !a.cleared_by.includes("RETAINED")) && (a.is_cleared_for_exit || a.disposition === "CARRIED_OUT")).length;
                          const retained = assets.filter((a) => (a.cleared_by && a.cleared_by.includes("RETAINED")) || a.disposition === "RETAINED_ON_PREMISES").length;
                          return (
                          <div
                            className="ch-asset-details-card"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVisit({ ...item, visitor, host });
                            }}
                            title="Click to view complete asset clearance dossier"
                          >
                            <div className="ch-asset-summary-row">
                              <span className="ch-asset-summary-head">{assets.length} at Check-In:</span>
                              <span className="ch-asset-stat-pill">
                                {carriedOut} Return · {retained} Retained
                              </span>
                            </div>
                            {assets.slice(0, 2).map((a, aIdx) => {
                              const photo = resolvePhotoUrl(a.photo_url || a.asset_photo_url);
                              return (
                                <div key={a.asset_id || aIdx} className="ch-asset-item-row">
                                  <div className="ch-asset-item-main">
                                    {photo ? (
                                      <div
                                        className="ch-asset-item-photo-thumb"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (setAssetLightbox) {
                                            setAssetLightbox({
                                              url: photo,
                                              title: `${a.brand_model || a.asset_type || "Declared Hardware"} (Hardware Photo)`,
                                              subtitle: `Serial Tag: ${a.serial_number || "Not specified"} · Type: ${a.asset_type || "Hardware"}`
                                            });
                                          }
                                        }}
                                        title="Click to enlarge hardware photo"
                                      >
                                        <img src={photo} alt="Hardware" className="ch-asset-mini-img" />
                                      </div>
                                    ) : (
                                      <div className="ch-asset-item-icon">
                                        <Laptop size={12} color="#2563eb" />
                                      </div>
                                    )}
                                    <div className="ch-asset-item-info">
                                      <span className="ch-asset-item-name">
                                        {a.brand_model || a.asset_type || "Hardware Asset"}
                                      </span>
                                      <div className="ch-asset-item-meta">
                                        <span className="ch-asset-type-badge">{a.asset_type || "Item"}</span>
                                        {a.serial_number && (
                                          <span className="ch-asset-serial-pill" title={`Serial Tag: ${a.serial_number}`}>
                                            SN: {a.serial_number}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="ch-asset-clearance-status">
                                    {((a.cleared_by && a.cleared_by.includes("RETAINED")) || a.disposition === "RETAINED_ON_PREMISES") ? (
                                      <span className="ch-asset-tag ch-asset-tag-retained" title={`Retained in facility / installed on premises (${a.cleared_by || ""})`}>
                                        📦 Retained
                                      </span>
                                    ) : a.is_cleared_for_exit ? (
                                      <span className="ch-asset-tag cleared" title={`Exit departure cleared by ${a.cleared_by || "Security Officer"}`}>
                                        <Check size={11} /> Return
                                      </span>
                                    ) : (
                                      <span className="ch-asset-tag pending" title="Pending exit clearance">
                                        <AlertTriangle size={11} /> Inspect
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {assets.length > 2 && (
                              <div className="ch-asset-more-count">
                                + {assets.length - 2} more item{assets.length - 2 > 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                          );
                        })()}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div className="ch-action-group" style={{ justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="ch-btn-dossier"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVisit({ ...item, visitor, host });
                            }}
                          >
                            <Eye size={13} /> Dossier
                          </button>
                          <button
                            type="button"
                            className="it-btn-more-options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVisit({ ...item, visitor, host });
                            }}
                            title="More departure audit actions"
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

        {/* Printable Official Report Audit Signatures (Screen Hidden) */}
        <div className="ch-print-report-footer no-screen">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginTop: "24px", paddingTop: "14px", borderTop: "1.5px dashed #cbd5e1", pageBreakInside: "avoid" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
              <span style={{ fontSize: "7.5pt", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Audit Compiler / Security Supervisor</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
              <span style={{ fontSize: "7.5pt", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Host Department Custodian</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
              <span style={{ fontSize: "7.5pt", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Gate Security Officer Clearance Stamp</span>
            </div>
          </div>
          <p style={{ margin: "10px 0 0", textAlign: "center", fontSize: "7pt", color: "#64748b" }}>
            Official Enterprise Security Departure Audit Document · Generated from Immutable VMS System Records
          </p>
        </div>
      </section>
      </div>

      {/* Interactive Dossier & Exit Certificate Modal */}
      {selectedVisit && (() => {
        const mAssets = selectedVisit.assets || [];
        const carriedAssets = mAssets.filter((a) => (!a.cleared_by || !a.cleared_by.includes("RETAINED")) && (a.is_cleared_for_exit || a.disposition === "CARRIED_OUT"));
        const retainedAssets = mAssets.filter((a) => (a.cleared_by && a.cleared_by.includes("RETAINED")) || a.disposition === "RETAINED_ON_PREMISES");
        const pendingAssets = mAssets.filter((a) => !carriedAssets.includes(a) && !retainedAssets.includes(a));
        const dwellInfo = calculateDwellTime(selectedVisit.check_in_time, selectedVisit.check_out_time);
        const badgeId = `VMS-${String(selectedVisit.visit_id).slice(0, 8).toUpperCase()}`;
        const isITVisit = isITMode || Boolean(selectedVisit.purpose && selectedVisit.purpose.includes("[IT_VISIT]"));

        const vProfile = selectedVisit.visitor || {};
        const fullName = `${vProfile.first_name || ""} ${vProfile.last_name || ""}`.trim() || (isITVisit ? "Technical Contractor" : "Official Visitor");
        const resolvedPhoto = resolvePhotoUrl(vProfile.photo_url);
        const areaBadge = isITVisit ? getAreaBadge(selectedVisit.purpose) : null;
        const ticketBadge = isITVisit ? getTicketBadge(selectedVisit.purpose) : null;
        const cleanPurpose = isITVisit ? getCleanPurpose(selectedVisit.purpose) : (selectedVisit.purpose || "Official Campus Visit");
        const formattedVisitId = getFormattedVisitId(selectedVisit, vProfile.visitor_id);
        const hostEmp = selectedVisit.host_employee || selectedVisit.host;
        const hostDept = hostEmp?.department ? ` (${hostEmp.department})` : "";
        const hostName = hostEmp ? `${hostEmp.first_name || ""} ${hostEmp.last_name || ""}`.trim() + hostDept : (isITVisit ? "IT Department" : "General Administration");
        const defaultCompany = isITVisit ? "Apex Technical Solutions" : "Individual / Self";

          const laptopAssets = mAssets.filter((a) => categorizeAsset(a) === "Laptop");
          const mobileAssets = mAssets.filter((a) => categorizeAsset(a) === "Mobile");
          const otherAssets = mAssets.filter((a) => categorizeAsset(a) === "Others");
          const laptopCount = laptopAssets.length;
          const mobileCount = mobileAssets.length;
          const otherCount = otherAssets.length;

          // Render Check-In Card
          const renderCheckInCard = () => (
            <div className="it-asset-tracker-card checkin">
              {/* Header */}
              <div className="it-asset-tracker-header checkin">
                <div className="it-asset-header-left">
                  <div className="it-asset-header-icon-box checkin">
                    <ArrowRightCircle size={22} color="#ffffff" />
                  </div>
                  <div>
                    <h3 className="it-asset-header-title">Check-In</h3>
                    <p className="it-asset-header-subtitle">Register visitor assets at entry</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="it-asset-close-btn no-print"
                  onClick={() => setSelectedVisit(null)}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Contractor Summary Bar */}
              <div className="it-asset-contractor-bar">
                <div className="it-asset-contractor-left">
                  <div className="it-asset-avatar-circle checkin">
                    {resolvedPhoto ? (
                      <img src={resolvedPhoto} alt={fullName} />
                    ) : (
                      <span>{getInitials(fullName)}</span>
                    )}
                  </div>
                  <div>
                    <div className="it-asset-contractor-name">{fullName}</div>
                    <div className="it-asset-contractor-company">{vProfile.company_name || defaultCompany}</div>
                  </div>
                </div>
                <div className="it-asset-contractor-right">
                  <div className="it-asset-meta-item">
                    <Calendar size={13} className="it-asset-meta-icon" />
                    <div>
                      <span className="it-asset-meta-label">Visit ID:</span>
                      <span className="it-asset-meta-val">{formattedVisitId}</span>
                    </div>
                  </div>
                  <div className="it-asset-meta-item">
                    <Clock size={13} className="it-asset-meta-icon" />
                    <span className="it-asset-meta-val">{formatDateTime(selectedVisit.check_in_time)}</span>
                  </div>
                </div>
              </div>

              {/* Hero Asset Counter Card */}
              <div className="it-asset-hero-box checkin">
                <div className="it-asset-hero-illustration">
                  <Laptop3DIcon />
                </div>
                <div className="it-asset-hero-content">
                  <span className="it-asset-hero-label">Total Assets at Check-In</span>
                  <div className="it-asset-hero-number checkin">{mAssets.length}</div>
                  <span className="it-asset-hero-desc">All items registered &amp; tracked at admission</span>
                </div>
              </div>

              {/* Category Breakdown 3-Box */}
              <div className="it-asset-cat-grid">
                <div className="it-asset-cat-pill laptop">
                  <div className="it-asset-cat-header">
                    <Laptop size={15} color="#2563eb" />
                    <span>Laptops</span>
                  </div>
                  <div className="it-asset-cat-count">{laptopCount}</div>
                </div>
                <div className="it-asset-cat-pill mobile">
                  <div className="it-asset-cat-header">
                    <Smartphone size={15} color="#16a34a" />
                    <span>Mobiles</span>
                  </div>
                  <div className="it-asset-cat-count">{mobileCount}</div>
                </div>
                <div className="it-asset-cat-pill other">
                  <div className="it-asset-cat-header">
                    <Briefcase size={15} color="#d97706" />
                    <span>Others</span>
                  </div>
                  <div className="it-asset-cat-count">{otherCount}</div>
                </div>
              </div>

              {/* Assets List Section */}
              <div className="it-asset-list-section">
                <div className="it-asset-list-header">
                  <span className="it-asset-list-title">Assets ({mAssets.length})</span>
                  <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 700, background: "#eff6ff", padding: "3px 8px", borderRadius: "6px", border: "1px solid #bfdbfe" }}>
                    Admitted at Gate
                  </span>
                </div>

                {/* Items List */}
                <div className="it-asset-items-container">
                  {mAssets.length === 0 ? (
                    <div style={{ padding: "20px 10px", textAlign: "center", color: "#64748b", fontSize: "12.5px" }}>
                      No hardware assets registered at check-in admission.
                    </div>
                  ) : (
                    mAssets.map((asset, aIdx) => {
                      const cat = categorizeAsset(asset);
                      const assetPhoto = resolvePhotoUrl(asset.photo_url || asset.asset_photo_url);
                      return (
                        <div key={asset.asset_id || aIdx} className="it-asset-item-card">
                          <div className="it-asset-item-left">
                            <div
                              className="it-asset-thumb-box"
                              onClick={() => {
                                if (assetPhoto && setAssetLightbox) {
                                  setAssetLightbox({
                                    url: assetPhoto,
                                    title: `${asset.brand_model || asset.asset_type || "Declared Hardware"} (Admission Check-in Photo)`,
                                    subtitle: `Serial Tag: ${asset.serial_number || "NO-S/N"} · Type: ${asset.asset_type || "Equipment"}`
                                  });
                                }
                              }}
                              style={{ cursor: assetPhoto ? "pointer" : "default" }}
                              title={assetPhoto ? "Click to view photo" : ""}
                            >
                              {assetPhoto ? (
                                <img src={assetPhoto} alt={asset.brand_model || asset.asset_type} />
                              ) : (
                                <AssetFallbackIcon category={cat} />
                              )}
                            </div>
                            <div className="it-asset-meta">
                              <div className="it-asset-name">{asset.brand_model || asset.asset_type || "Diagnostic Hardware"}</div>
                              <div className="it-asset-sn">SN: {asset.serial_number || "NOT SPECIFIED"}</div>
                            </div>
                          </div>
                          <div className="it-asset-item-right">
                            <span className={`it-asset-tag ${cat.toLowerCase()}`}>{cat}</span>
                            <span style={{ fontSize: "11px", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <LogIn size={11} /> Admitted
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="it-asset-card-footer no-print">
                <button
                  type="button"
                  className="it-asset-btn-cancel"
                  onClick={() => setSelectedVisit(null)}
                >
                  <X size={14} />
                  <span>Close</span>
                </button>
                <button
                  type="button"
                  className="it-asset-btn-action checkin"
                  onClick={() => setItDossierViewMode("checkout")}
                >
                  <span>View Check-Out Clearance ({mAssets.length} Assets)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );

          // Render Check-Out Card
          const renderCheckOutCard = () => (
            <div className="it-asset-tracker-card checkout">
              {/* Header */}
              <div className="it-asset-tracker-header checkout">
                <div className="it-asset-header-left">
                  <div className="it-asset-header-icon-box checkout">
                    <LogOut size={22} color="#ffffff" />
                  </div>
                  <div>
                    <h3 className="it-asset-header-title">Check-Out Clearance</h3>
                    <p className="it-asset-header-subtitle">Campus exit &amp; hardware clearance verified</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="it-asset-close-btn no-print"
                  onClick={() => setSelectedVisit(null)}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Contractor Summary Bar */}
              <div className="it-asset-contractor-bar">
                <div className="it-asset-contractor-left">
                  <div className="it-asset-avatar-circle checkout">
                    {resolvedPhoto ? (
                      <img src={resolvedPhoto} alt={fullName} />
                    ) : (
                      <span>{getInitials(fullName)}</span>
                    )}
                  </div>
                  <div>
                    <div className="it-asset-contractor-name">{fullName}</div>
                    <div className="it-asset-contractor-company">{vProfile.company_name || defaultCompany}</div>
                  </div>
                </div>
                <div className="it-asset-contractor-right">
                  <div className="it-asset-meta-item">
                    <Calendar size={13} className="it-asset-meta-icon" />
                    <div>
                      <span className="it-asset-meta-label">Visit ID:</span>
                      <span className="it-asset-meta-val">{formattedVisitId}</span>
                    </div>
                  </div>
                  <div className="it-asset-meta-item">
                    <Clock size={13} className="it-asset-meta-icon" />
                    <span className="it-asset-meta-val">{formatDateTime(selectedVisit.check_out_time)}</span>
                  </div>
                </div>
              </div>

              {/* Hero Asset Counter Card */}
              <div className="it-asset-hero-box checkout">
                <div className="it-asset-hero-illustration">
                  <PackageCheck3DIcon />
                </div>
                <div className="it-asset-hero-content">
                  <span className="it-asset-hero-label">Assets to Return at Check-Out</span>
                  <div className="it-asset-hero-number checkout">{carriedAssets.length}</div>
                  <span className="it-asset-hero-desc">
                    Exit departure: {carriedAssets.length} Returned · {retainedAssets.length} Retained ({formatDateTime(selectedVisit.check_out_time)})
                  </span>
                </div>
              </div>

              {/* Category Breakdown 3-Box */}
              <div className="it-asset-cat-grid">
                <div className="it-asset-cat-pill laptop">
                  <div className="it-asset-cat-header">
                    <Laptop size={15} color="#2563eb" />
                    <span>Laptops</span>
                  </div>
                  <div className="it-asset-cat-count">{laptopCount}</div>
                </div>
                <div className="it-asset-cat-pill mobile">
                  <div className="it-asset-cat-header">
                    <Smartphone size={15} color="#16a34a" />
                    <span>Mobiles</span>
                  </div>
                  <div className="it-asset-cat-count">{mobileCount}</div>
                </div>
                <div className="it-asset-cat-pill other">
                  <div className="it-asset-cat-header">
                    <Briefcase size={15} color="#d97706" />
                    <span>Others</span>
                  </div>
                  <div className="it-asset-cat-count">{otherCount}</div>
                </div>
              </div>

              {/* Assets List Section */}
              <div className="it-asset-list-section">
                <div className="it-asset-list-header">
                  <span className="it-asset-list-title">Assets ({mAssets.length})</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#166534", fontWeight: 700, background: "#f0fdf4", padding: "3px 8px", borderRadius: "6px", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CheckCheck size={12} color="#16a34a" /> All Cleared
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="it-asset-items-container">
                  {mAssets.length === 0 ? (
                    <div style={{ padding: "20px 10px", textAlign: "center", color: "#64748b", fontSize: "12.5px" }}>
                      No hardware assets requiring exit clearance.
                    </div>
                  ) : (
                    mAssets.map((asset, aIdx) => {
                      const cat = categorizeAsset(asset);
                      const isRetained = (asset.cleared_by && asset.cleared_by.includes("RETAINED")) || asset.disposition === "RETAINED_ON_PREMISES";
                      const assetPhoto = resolvePhotoUrl(asset.photo_url || asset.asset_photo_url);

                      return (
                        <div key={asset.asset_id || aIdx} className="it-asset-item-card">
                          <div className="it-asset-item-left">
                            <div
                              className="it-asset-thumb-box"
                              onClick={() => {
                                if (assetPhoto && setAssetLightbox) {
                                  setAssetLightbox({
                                    url: assetPhoto,
                                    title: `${asset.brand_model || asset.asset_type || "Declared Hardware"} (Exit Departure Photo)`,
                                    subtitle: `Serial Tag: ${asset.serial_number || "NO-S/N"} · Disposition: ${isRetained ? "Retained" : "Carried Out"}`
                                  });
                                }
                              }}
                              style={{ cursor: assetPhoto ? "pointer" : "default" }}
                              title={assetPhoto ? "Click to view photo" : ""}
                            >
                              {assetPhoto ? (
                                <img src={assetPhoto} alt={asset.brand_model || asset.asset_type} />
                              ) : (
                                <AssetFallbackIcon category={cat} />
                              )}
                            </div>
                            <div className="it-asset-meta">
                              <div className="it-asset-name">{asset.brand_model || asset.asset_type || "Diagnostic Hardware"}</div>
                              <div className="it-asset-sn">SN: {asset.serial_number || "NOT SPECIFIED"}</div>
                            </div>
                          </div>
                          <div className="it-asset-item-right">
                            <span className={`it-asset-tag ${cat.toLowerCase()}`}>{cat}</span>
                            {isRetained ? (
                              <span
                                className="it-asset-badge-retained"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: "#eff6ff",
                                  border: "1.5px solid #2563eb",
                                  color: "#1d4ed8",
                                  fontSize: "11px",
                                  fontWeight: 700
                                }}
                                title={`Retained on premises. ${asset.retention_note || ""}`}
                              >
                                <Package size={12} color="#2563eb" />
                                <span>Retained</span>
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: "#f0fdf4",
                                  border: "1.5px solid #16a34a",
                                  color: "#15803d",
                                  fontSize: "11px",
                                  fontWeight: 700
                                }}
                                title="Item cleared and returned with visitor"
                              >
                                <Check size={12} strokeWidth={3} color="#16a34a" />
                                <span>Return</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="it-asset-card-footer no-print">
                <button
                  type="button"
                  className="it-asset-btn-cancel"
                  onClick={() => setItDossierViewMode("checkin")}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  className="it-asset-btn-action checkout completed"
                  disabled={true}
                  style={{
                    background: "#f0fdf4",
                    color: "#166534",
                    border: "1.5px solid #86efac",
                    cursor: "default",
                    opacity: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                  }}
                  title="Campus exit and hardware clearance have already been completed."
                >
                  <CheckCheck size={16} color="#16a34a" />
                  <span>Departure Recorded ({carriedAssets.length} Returned · {retainedAssets.length} Retained)</span>
                </button>
              </div>
            </div>
          );

          // Render Overview Dossier (Technician Profile & Logs)
          const renderOverviewDossier = () => (
            <div className="vms-dossier-modal" onClick={(e) => e.stopPropagation()}>
              <div className="vms-dossier-header" style={{ borderBottom: "1.5px solid #e2e8f0" }}>
                <div className="vms-dossier-header-title">
                  <div className="vms-dossier-header-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                    {isITVisit ? <Server size={18} /> : <ShieldCheck size={18} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                      {isITVisit ? "IT Department Personnel Dossier & Hardware Clearance" : "Official Visitor Departure Dossier & Hardware Clearance"}
                    </h3>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                      {isITVisit ? "Enterprise IT Infrastructure & Technical Contractor Registry" : "Enterprise Security & Departure Audit Registry"} · Ref: <code>{selectedVisit.visit_id}</code>
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    className="ch-btn-refresh no-print"
                    style={{ padding: "7px 14px", fontSize: "12.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    onClick={() => window.print()}
                  >
                    <Printer size={14} /> Print Certificate
                  </button>
                  <button
                    type="button"
                    className="vms-dossier-close-btn no-print"
                    onClick={() => setSelectedVisit(null)}
                    title="Close dossier"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="vms-dossier-body">
                {/* Profile Card */}
                <div className="vms-dossier-profile-card">
                  <div className="vms-dossier-avatar-col">
                    <div className="vms-dossier-avatar-box">
                      {resolvedPhoto ? (
                        <img src={resolvedPhoto} alt={fullName} />
                      ) : (
                        <span className="vms-dossier-avatar-initials">{getInitials(fullName)}</span>
                      )}
                    </div>
                  </div>
                  <div className="vms-dossier-info-col">
                    <div className="vms-dossier-name-row">
                      <h2 className="vms-dossier-name">{fullName}</h2>
                      <div className="vms-dossier-badges">
                        <span className="visitor-id-badge">#{vProfile.visitor_id || "—"}</span>
                        <span className="it-company-tag">
                          <Building2 size={12} />
                          <span>{vProfile.company_name || "Independent Contractor"}</span>
                        </span>
                        <span className="status-pill checked">Offsite / Checked Out</span>
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

                {/* Completed Visit Departure Audit Banner */}
                <div className="vms-active-visit-banner completed-checkout" style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                  <div className="vms-active-visit-top">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span className="vms-live-indicator-pill" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #86efac" }}>
                        <CheckCircle2 size={13} color="#16a34a" />
                        Visit Completed · Campus Departure Recorded
                      </span>
                      <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>
                        Ref: <code>{formattedVisitId}</code>
                      </span>
                    </div>
                    <div className="vms-active-visit-actions no-print">
                      <button
                        type="button"
                        className="vms-btn-it-pass"
                        onClick={() => window.open(`/visitor-pass/${encodeURIComponent(selectedVisit.visit_id)}`, "_blank")}
                        title={isITVisit ? "View digital IT Visitor Pass" : "View digital Visitor Pass"}
                      >
                        <QrCode size={14} />
                        <span>{isITVisit ? "IT Visitor Pass" : "Visitor Pass"}</span>
                      </button>
                    </div>
                  </div>
                  <div className="vms-active-visit-grid">
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Check-In Time:</span>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>{formatDateTime(selectedVisit.check_in_time)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Check-Out / Departure:</span>
                      <strong style={{ fontSize: "13px", color: "#166534" }}>{formatDateTime(selectedVisit.check_out_time)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>{isITVisit ? "Host IT Engineer:" : "Meeting Officer / Host:"}</span>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>{hostName}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Campus Dwell Duration:</span>
                      <strong style={{ fontSize: "13px", color: "#2563eb" }}>{dwellInfo.label}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Exit Hardware Clearance:</span>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                        {mAssets.length} Assets Verified ({carriedAssets.length} Departed, {retainedAssets.length} Retained)
                      </strong>
                    </div>
                    {areaBadge && (
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>Designated Area:</span>
                        <strong style={{ fontSize: "13px", color: "#0f172a" }}>{areaBadge}</strong>
                      </div>
                    )}
                    {cleanPurpose && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 600 }}>{isITVisit ? "Technical Mission & Scope:" : "Visit Purpose & Scope:"}</span>
                        <div style={{ fontSize: "13px", color: "#0f172a", marginTop: "3px", lineHeight: 1.4 }}>
                          {cleanPurpose}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hardware Section Embedded in Overview: Side-by-Side Dual View */}
                <div className="vms-dossier-section" style={{ border: "none", padding: 0, background: "transparent" }}>
                  <div className="vms-dossier-section-header" style={{ marginBottom: "12px", padding: "0 4px" }}>
                    <div className="vms-dossier-section-title">
                      <Laptop size={16} color="#2563eb" />
                      <span>Registered Hardware &amp; Exit Clearance Tracking</span>
                    </div>
                  </div>
                  <div className="it-asset-cards-wrapper" style={{ margin: "0 auto", justifyContent: "center" }}>
                    {renderCheckInCard()}
                    {renderCheckOutCard()}
                  </div>
                </div>

                {/* Hardware Custody Reconciliation Card */}
                <div className="ch-dossier-section highlight-out" style={{ marginTop: "16px" }}>
                  <div className="ch-dossier-section-header">
                    <div className="ch-dossier-section-title-wrap">
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <h4 className="ch-dossier-section-title">
                          Custody Reconciliation &amp; Chain-of-Custody Balance
                        </h4>
                        <div className="ch-dossier-section-sub">
                          Complete audit verification of hardware brought in vs taken out
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", background: "#f0fdf4", padding: "4px 10px", borderRadius: "6px", border: "1px solid #86efac" }}>
                      ✓ AUDIT VERIFIED: Zero Discrepancy
                    </span>
                  </div>

                  <div className="ch-recon-box">
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Check-In Inventory</span>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                        {mAssets.length} Declared Assets
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#059669", textTransform: "uppercase", fontWeight: 700 }}>Return on Exit</span>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
                        {carriedAssets.length} Items Returned
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#1d4ed8", textTransform: "uppercase", fontWeight: 700 }}>Retained in Facility</span>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#1d4ed8", marginTop: "2px" }}>
                        {retainedAssets.length} Items Retained / Installed
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>Reconciliation Verdict</span>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#166534", marginTop: "2px" }}>
                        ✓ 100% Balanced &amp; Accounted
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official Legal & Security Clearance Signatures in Print */}
                <div
                  className="ch-print-signatures"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "18px",
                    marginTop: "24px",
                    paddingTop: "16px",
                    borderTop: "1.5px dashed #cbd5e1",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      {isITVisit ? "Technician / Carrier Signature" : "Visitor / Carrier Signature"}
                    </span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      {isITVisit ? "Host IT Engineer Signature" : "Host Officer Signature"}
                    </span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: "100%", height: "1px", borderBottom: "1px solid #0f172a", marginBottom: "6px" }}></div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      Security Gate Clearance Stamp
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="vms-dossier-footer no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #e2e8f0", borderRadius: "0 0 16px 16px" }}>
                <button
                  type="button"
                  className="it-qr-portal-btn"
                  onClick={() => setSelectedVisit(null)}
                >
                  Close Dossier
                </button>
                <button
                  type="button"
                  className="ch-btn-refresh"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px" }}
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Print Departure Pass</span>
                </button>
              </div>
            </div>
          );

          return (
            <div
              className="it-asset-modal-overlay"
              onClick={() => setSelectedVisit(null)}
              role="dialog"
              aria-modal="true"
            >
              <div className="it-asset-modal-inner" onClick={(e) => e.stopPropagation()}>
                {/* Top View Mode Switcher Pills */}
                <div className="it-asset-view-switcher-bar no-print">
                  <button
                    type="button"
                    className={`it-asset-switcher-pill ${itDossierViewMode === "checkin" ? "active checkin" : ""}`}
                    onClick={() => setItDossierViewMode("checkin")}
                    title="Check-In asset entry registration view"
                  >
                    <ArrowRightCircle size={14} />
                    <span>Check-In Assets ({mAssets.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`it-asset-switcher-pill ${itDossierViewMode === "checkout" ? "active checkout" : ""}`}
                    onClick={() => setItDossierViewMode("checkout")}
                    title="Check-Out asset exit clearance view"
                  >
                    <LogOut size={14} />
                    <span>Check-Out Clearance ({mAssets.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`it-asset-switcher-pill ${itDossierViewMode === "dual" ? "active dual" : ""}`}
                    onClick={() => setItDossierViewMode("dual")}
                    title="View both Check-In and Check-Out cards side-by-side"
                  >
                    <Columns size={14} />
                    <span>Side-by-Side Dual View</span>
                  </button>
                  <button
                    type="button"
                    className={`it-asset-switcher-pill ${itDossierViewMode === "overview" ? "active overview" : ""}`}
                    onClick={() => setItDossierViewMode("overview")}
                    title={isITVisit ? "View technician profile details, host contact & visit log history" : "View visitor profile details, host contact & departure audit record"}
                  >
                    <ShieldCheck size={14} />
                    <span>{isITVisit ? "Technician Profile & Logs" : "Visitor Profile & Logs"}</span>
                  </button>
                </div>

                {/* Cards according to active view mode (screen) */}
                <div className={itDossierViewMode === "overview" ? "" : "no-print"}>
                  {itDossierViewMode === "checkin" && (
                    <div className="it-asset-cards-wrapper single">
                      {renderCheckInCard()}
                    </div>
                  )}

                  {itDossierViewMode === "checkout" && (
                    <div className="it-asset-cards-wrapper single">
                      {renderCheckOutCard()}
                    </div>
                  )}

                  {itDossierViewMode === "dual" && (
                    <div className="it-asset-cards-wrapper">
                      {renderCheckInCard()}
                      {renderCheckOutCard()}
                    </div>
                  )}

                  {itDossierViewMode === "overview" && (
                    renderOverviewDossier()
                  )}
                </div>

                {/* Print-Only Fallback: When on checkin/checkout/dual tab on screen, always print the full Overview Dossier */}
                {itDossierViewMode !== "overview" && (
                  <div className="no-screen it-print-dossier-wrapper">
                    {renderOverviewDossier()}
                  </div>
                )}
              </div>
            </div>
          );
      })()}
    </div>
  );
}
