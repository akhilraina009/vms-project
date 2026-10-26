import sys

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. State definition
old_state = '''  // Checkout History
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [checkoutHistoryLoading, setCheckoutHistoryLoading] = useState(false);
  const [checkoutHistoryError, setCheckoutHistoryError] = useState("");
  const [checkoutHistorySearch, setCheckoutHistorySearch] = useState("");
  const [selectedHistoryVisit, setSelectedHistoryVisit] = useState(null);
  const historyDetailsRef = useRef(null);'''

new_state = '''  // Checkout History
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [checkoutHistoryLoading, setCheckoutHistoryLoading] = useState(false);
  const [checkoutHistoryError, setCheckoutHistoryError] = useState("");
  const [checkoutHistorySearch, setCheckoutHistorySearch] = useState("");
  const [selectedHistoryVisit, setSelectedHistoryVisit] = useState(null);
  const historyDetailsRef = useRef(null);

  // IT Checkout History
  const [itCheckoutHistorySearch, setItCheckoutHistorySearch] = useState("");
  const [selectedITHistoryVisit, setSelectedITHistoryVisit] = useState(null);
  const itHistoryDetailsRef = useRef(null);'''

if old_state not in text:
    print("ERROR: old_state not found!")
    sys.exit(1)
text = text.replace(old_state, new_state, 1)

# 2. useEffect update
old_effect = '''  useEffect(() => {
    if (currentPage === "checkout-history") {
      fetchCheckoutHistory();
    }
  }, [currentPage]);'''

new_effect = '''  useEffect(() => {
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
  }, [selectedITHistoryVisit]);'''

if old_effect not in text:
    print("ERROR: old_effect not found!")
    sys.exit(1)
text = text.replace(old_effect, new_effect, 1)

# 3. Sidebar update
old_sidebar_it = '''          <button
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
          </button>'''

new_sidebar_it = '''          <button
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
          </button>'''

if old_sidebar_it not in text:
    print("ERROR: old_sidebar_it not found!")
    sys.exit(1)
text = text.replace(old_sidebar_it, new_sidebar_it, 1)

# 4. Main view router update
old_router = '''{currentPage === "checkout-history" && (
          renderCheckoutHistory()
        )}'''

new_router = '''{currentPage === "checkout-history" && (
          renderCheckoutHistory()
        )}
        {currentPage === "it-checkout-history" && (
          renderITCheckoutHistory()
        )}'''

if old_router not in text:
    print("ERROR: old_router not found!")
    sys.exit(1)
text = text.replace(old_router, new_router, 1)

# 5. General Checkout History filter update: isolate to general visitors only
old_general_filter = '''  const renderCheckoutHistory = () => {
    const query = checkoutHistorySearch.trim().toLowerCase();

    const filteredHistory = checkoutHistory.filter((item) => {'''

new_general_filter = '''  const renderCheckoutHistory = () => {
    const query = checkoutHistorySearch.trim().toLowerCase();

    // Strictly general visitor checkouts (exclude IT technical visits)
    const generalHistory = checkoutHistory.filter(
      (item) => !(item.purpose && item.purpose.includes("[IT_VISIT]"))
    );

    const filteredHistory = generalHistory.filter((item) => {'''

if old_general_filter not in text:
    print("ERROR: old_general_filter not found!")
    sys.exit(1)
text = text.replace(old_general_filter, new_general_filter, 1)

# 6. Add renderITCheckoutHistory right after renderCheckoutHistory
# Find the end of renderCheckoutHistory, right before "  const renderCheckoutReceipt = () => {"
marker = '  const renderCheckoutReceipt = () => {'
if marker not in text:
    print("ERROR: marker for renderCheckoutReceipt not found!")
    sys.exit(1)

it_checkout_history_code = '''  /* =========================================================
     IT CHECKOUT HISTORY (DEDICATED TO IT VISITORS ONLY)
  ========================================================= */
  const renderITCheckoutHistory = () => {
    const query = itCheckoutHistorySearch.trim().toLowerCase();

    // Filter strictly to IT technical visits only
    const itHistory = checkoutHistory.filter(
      (item) => item.purpose && item.purpose.includes("[IT_VISIT]")
    );

    const parseITPurpose = (purposeStr) => {
      if (!purposeStr) return {
        raw: "",
        category: "IT Technical Visit",
        area: "IT Operations / Server Room",
        ticket: "N/A",
        workId: "N/A",
        notes: "Authorized technical facility access"
      };

      const cleaned = purposeStr.replace(/\\[IT_VISIT\\]\\s*/i, "").trim();
      const parts = cleaned.split("|").map((s) => s.trim()).filter(Boolean);

      let category = parts[0] || "IT Technical Visit";
      let area = "";
      let ticket = "";
      let workId = "";
      let notes = "";

      for (let i = 1; i < parts.length; i++) {
        const p = parts[i];
        if (p.toLowerCase().startsWith("area:")) {
          area = p.replace(/area:\\s*/i, "").trim();
        } else if (p.toLowerCase().startsWith("ticket:")) {
          ticket = p.replace(/ticket:\\s*/i, "").trim();
        } else if (p.toLowerCase().startsWith("id:")) {
          workId = p.replace(/id:\\s*/i, "").trim();
        } else {
          notes += (notes ? " | " : "") + p;
        }
      }

      return {
        raw: cleaned,
        category,
        area: area || "Data Center / Server Room",
        ticket: ticket || "Not recorded",
        workId: workId || "N/A",
        notes: notes || "Standard authorized IT site visit"
      };
    };

    const calculateDuration = (inTime, outTime) => {
      if (!inTime || !outTime) return "Not recorded";
      const start = new Date(inTime).getTime();
      const end = new Date(outTime).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "Not recorded";
      const diffSec = Math.floor((end - start) / 1000);
      const hours = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      if (hours > 0) return `${hours}h ${mins}m`;
      if (mins > 0) return `${mins}m ${secs}s`;
      return `${secs}s`;
    };

    const formatDate = (value) => {
      if (!value) return "Not recorded";
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? "Not recorded"
        : date.toLocaleString();
    };

    const filteredHistory = itHistory.filter((item) => {
      const visitor = item.visitor || {};
      const host = item.host_employee || {};

      const visitorName = `${visitor.first_name || ""} ${visitor.last_name || ""}`.trim();
      const hostName = `${host.first_name || ""} ${host.last_name || ""}`.trim();
      const itParsed = parseITPurpose(item.purpose);

      const searchableFields = [
        visitorName,
        visitor.company_name,
        visitor.phone_number,
        visitor.email,
        visitor.address_line1,
        visitor.address_line2,
        visitor.city,
        visitor.state,
        visitor.postal_code,
        visitor.country,
        hostName,
        host.department,
        item.visit_id,
        item.purpose,
        itParsed.category,
        itParsed.area,
        itParsed.ticket,
        itParsed.workId,
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

    const totalClearedAssets = itHistory.reduce(
      (sum, item) => sum + (item.assets || []).length,
      0
    );
    const contractorCompanies = new Set(
      itHistory.map((item) => item.visitor?.company_name).filter(Boolean)
    ).size;

    return (
      <>
        {/* Executive Header */}
        <div className="notif-management-header no-print">
          <div className="notif-header-title-box">
            <div className="notif-header-badge-row">
              <span
                className="notif-division-pill"
                style={{ background: "#faf5ff", color: "#7c3aed", borderColor: "#d8b4fe" }}
              >
                IT DEPARTMENT DIVISION
              </span>
              <span
                className="notif-telemetry-pill"
                style={{ borderColor: "#d8b4fe", color: "#6b21a8" }}
              >
                <span
                  className="status-dot"
                  style={{ background: "#7c3aed", boxShadow: "0 0 6px rgba(124,58,237,0.6)" }}
                ></span>
                IT Technical Personnel Checkout Archives
              </span>
            </div>
            <h2 className="notif-page-title">IT Visitor Checkout History</h2>
            <p className="notif-page-desc">
              Comprehensive historical records and hardware exit clearances exclusively for IT technical personnel and contractors
            </p>
          </div>

          <div className="notif-header-controls">
            <button
              type="button"
              className="refresh-button"
              onClick={fetchCheckoutHistory}
              disabled={checkoutHistoryLoading}
              title="Refresh IT checkout history"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "#faf5ff",
                color: "#7c3aed",
                border: "1px solid #d8b4fe",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px"
              }}
            >
              <RefreshCw
                size={14}
                className={checkoutHistoryLoading ? "spin" : ""}
              />
              <span>Refresh Records</span>
            </button>
            <button
              type="button"
              className="back-button"
              onClick={openDashboard}
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div
          className="no-print"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "14px",
            marginBottom: "18px"
          }}
        >
          <div style={{ background: "#ffffff", border: "1px solid #e9d5ff", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#6b21a8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total IT Checkouts
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#4c1d95", marginTop: "4px" }}>
              {itHistory.length}
            </div>
            <div style={{ fontSize: "12px", color: "#7c3aed", marginTop: "2px" }}>
              Technical personnel visits recorded
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e9d5ff", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#6b21a8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Cleared Hardware Assets
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#4c1d95", marginTop: "4px" }}>
              {totalClearedAssets}
            </div>
            <div style={{ fontSize: "12px", color: "#7c3aed", marginTop: "2px" }}>
              Diagnostic tools &amp; equipment cleared
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e9d5ff", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#6b21a8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Contractor Firms
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#4c1d95", marginTop: "4px" }}>
              {contractorCompanies}
            </div>
            <div style={{ fontSize: "12px", color: "#7c3aed", marginTop: "2px" }}>
              External vendor organizations
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Exit Audit Status
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#065f46", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={22} color="#059669" /> 100%
            </div>
            <div style={{ fontSize: "12px", color: "#047857", marginTop: "2px" }}>
              Security &amp; gate cleared
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <section className="table-card notif-main-card no-print">
          {/* Toolbar */}
          <div className="notif-toolbar" style={{ flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "#faf5ff",
                  color: "#7c3aed",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  border: "1px solid #d8b4fe"
                }}
              >
                {filteredHistory.length} IT Checkout Record{filteredHistory.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="notif-search-field" style={{ flex: 1, minWidth: "280px" }}>
              <Search size={14} />
              <input
                value={itCheckoutHistorySearch}
                onChange={(e) => setItCheckoutHistorySearch(e.target.value)}
                placeholder="Search contractor name, vendor, ticket #, purpose, serial..."
              />
              {itCheckoutHistorySearch && (
                <button
                  type="button"
                  className="notif-search-clear"
                  onClick={() => setItCheckoutHistorySearch("")}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {checkoutHistoryLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              <RefreshCw size={24} className="spin" style={{ margin: "0 auto 10px" }} />
              <p>Loading IT visitor checkout records...</p>
            </div>
          ) : checkoutHistoryError ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#b42318" }}>
              <p>{checkoutHistoryError}</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="empty-state notif-empty-state">
              <div className="notif-empty-icon-wrap" style={{ background: "#faf5ff", color: "#7c3aed" }}>
                <History size={26} />
              </div>
              <strong className="notif-empty-title">
                {itCheckoutHistorySearch
                  ? `No IT checkout records matching "${itCheckoutHistorySearch}"`
                  : "No IT visitor checkouts recorded yet"}
              </strong>
              <p className="notif-empty-desc">
                {itCheckoutHistorySearch
                  ? "Try adjusting your search terms or clearing the filter."
                  : "When IT technical visitors and contractors complete their visit and check out at the gate, their complete dossiers and hardware clearance records will appear here."}
              </p>
              {itCheckoutHistorySearch && (
                <button
                  type="button"
                  className="primary-button notif-reset-btn"
                  onClick={() => setItCheckoutHistorySearch("")}
                >
                  <RefreshCw size={13} />
                  <span>Clear Search Filter</span>
                </button>
              )}
            </div>
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
                  <tr style={{ background: "#faf5ff" }}>
                    {[
                      "IT Contractor / Visitor",
                      "Organization",
                      "IT Scope & Area",
                      "Host / Escort",
                      "Check-In",
                      "Checkout",
                      "Duration",
                      "Hardware & Tools",
                      "Details Dossier",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px 14px",
                          borderBottom: "1.5px solid #e9d5ff",
                          color: "#6b21a8",
                          fontSize: "11px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
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
                    const historyVisitor = item.visitor || {};
                    const directoryVisitor = visitorList.find(
                      (entry) => String(entry.visitor_id) === String(historyVisitor.visitor_id || item.visitor_id)
                    ) || {};
                    const visitor = {
                      ...directoryVisitor,
                      ...historyVisitor,
                      photo_url: historyVisitor.photo_url || directoryVisitor.photo_url || item.photo_url || item.visitor_photo_url || "",
                      address_line1: historyVisitor.address_line1 || directoryVisitor.address_line1 || "",
                      address_line2: historyVisitor.address_line2 || directoryVisitor.address_line2 || "",
                      city: historyVisitor.city || directoryVisitor.city || "",
                      state: historyVisitor.state || directoryVisitor.state || "",
                      postal_code: historyVisitor.postal_code || directoryVisitor.postal_code || "",
                      country: historyVisitor.country || directoryVisitor.country || "",
                    };
                    const host = item.host_employee || {};
                    const rowVisitorPhoto = resolvePhotoUrl(visitor.photo_url);
                    const visitorFullName = `${visitor.first_name || ""} ${visitor.last_name || ""}`.trim() || "IT Contractor";
                    const itDetails = parseITPurpose(item.purpose);
                    const durationText = calculateDuration(item.check_in_time, item.check_out_time);
                    const assets = item.assets || [];
                    const isSelected = selectedITHistoryVisit?.visit_id === item.visit_id;

                    return (
                      <tr
                        key={item.visit_id}
                        style={{
                          background: isSelected ? "#fbf8ff" : "transparent",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* 1. Contractor Info */}
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3e8ff" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              className="checkout-visitor-photo-wrap"
                              style={{
                                width: "42px",
                                height: "42px",
                                minWidth: "42px",
                                borderRadius: "8px",
                                margin: 0,
                                cursor: rowVisitorPhoto ? "pointer" : "default",
                                border: "1px solid #d8b4fe",
                                background: "#faf5ff"
                              }}
                              onClick={(e) => {
                                if (rowVisitorPhoto) {
                                  e.stopPropagation();
                                  setAssetLightbox({
                                    url: rowVisitorPhoto,
                                    title: `${visitorFullName} (IT Technical Contractor)`,
                                    subtitle: `ID #${visitor.visitor_id || item.visitor_id || "—"} • ${visitor.company_name || "IT Contractor"}`
                                  });
                                }
                              }}
                              title={rowVisitorPhoto ? "Click to zoom contractor photo" : "No photo registered"}
                            >
                              {rowVisitorPhoto ? (
                                <img
                                  src={rowVisitorPhoto}
                                  alt={visitorFullName}
                                  className="checkout-visitor-photo"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                    const fallback = event.currentTarget.parentElement?.querySelector(".checkout-visitor-photo-fallback");
                                    if (fallback) fallback.style.display = "grid";
                                  }}
                                />
                              ) : null}
                              <span className="checkout-visitor-photo-fallback" style={{ fontSize: "14px", color: "#7c3aed" }}>
                                {getInitials(visitorFullName)}
                              </span>
                              {rowVisitorPhoto && (
                                <div className="checkout-visitor-photo-zoom-hint" style={{ width: "16px", height: "16px" }}>
                                  <Eye size={9} />
                                </div>
                              )}
                            </div>
                            <div>
                              <strong style={{ color: "#1e1b4b", fontSize: "13.5px", display: "block" }}>
                                {visitorFullName}
                              </strong>
                              <div style={{ fontSize: "12px", color: "#6b21a8" }}>
                                {visitor.phone_number || "No phone"}
                              </div>
                              {itDetails.workId !== "N/A" && (
                                <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 600 }}>
                                  Badge ID: {itDetails.workId}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Organization */}
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3e8ff", color: "#334155" }}>
                          <strong style={{ color: "#0f172a", display: "block" }}>
                            {visitor.company_name || "Independent Specialist"}
                          </strong>
                          <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                            {[visitor.city, visitor.state].filter(Boolean).join(", ") || "Location recorded"}
                          </span>
                        </td>

                        {/* 3. IT Scope & Area */}
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3e8ff" }}>
                          <span
                            className="notif-category-badge badge-it"
                            style={{ display: "inline-block", marginBottom: "4px", fontSize: "11px" }}
                          >
                            {itDetails.category}
                          </span>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "11.5px", color: "#4b5563" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <MapPin size={11} color="#7c3aed" /> {itDetails.area}
                            </span>
                            {itDetails.ticket !== "Not recorded" && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "#4338ca", fontWeight: 600 }}>
                                <Tag size={11} /> #{itDetails.ticket}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Host / Escort */}
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3e8ff", color: "#334155" }}>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>
                            {`${host.first_name || ""} ${host.last_name || ""}`.trim() || "IT Escort"}
                          </div>
                          <span style={{ fontSize: "11.5px", color: "#7c3aed" }}>
                            {host.department || "IT Department"}
                          </span>
                        </td>

                        {/* 5. Check-in */}
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3e8ff", color: "#334155", whiteSpace: "nowrap", fontSize: "12.5px" }}>
                          {formatDate(item.check_in_time)}
                        </td>

                        {/* 6. Checkout */}
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3e8ff", color: "#334155", whiteSpace: "nowrap", fontSize: "12.5px" }}>
                          {formatDate(item.check_out_time)}
                        </td>

                        {/* 7. Duration */}
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3e8ff", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 7px",
                              borderRadius: "6px",
                              background: "#f3e8ff",
                              color: "#6b21a8",
                              fontWeight: 700,
                              fontSize: "11.5px"
                            }}
                          >
                            <Clock size={11} /> {durationText}
                          </span>
                        </td>

                        {/* 8. Hardware & Tools */}
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3e8ff" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: assets.length > 0 ? "#faf5ff" : "#f8fafc",
                                color: assets.length > 0 ? "#7c3aed" : "#94a3b8",
                                border: "1px solid #d8b4fe",
                                fontWeight: 700,
                                fontSize: "12px"
                              }}
                            >
                              {assets.length} Item{assets.length === 1 ? "" : "s"}
                            </span>
                            {assets.length > 0 && (
                              <span
                                title="Exit clearance verified"
                                style={{ display: "inline-flex", color: "#059669" }}
                              >
                                <ShieldCheck size={14} />
                              </span>
                            )}
                          </div>
                          {assets[0] && (
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                              {assets[0].asset_type} ({assets[0].brand_model})
                            </div>
                          )}
                        </td>

                        {/* 9. Action */}
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3e8ff" }}>
                          <button
                            type="button"
                            className="back-button"
                            onClick={() => setSelectedITHistoryVisit(item)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              borderColor: "#d8b4fe",
                              background: isSelected ? "#7c3aed" : "#ffffff",
                              color: isSelected ? "#ffffff" : "#6b21a8",
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
          )}
        </section>

        {/* =========================================================
           SELECTED IT VISIT: COMPLETE COMPREHENSIVE DOSSIER
        ========================================================= */}
        {selectedITHistoryVisit && (() => {
          const historyVisitor = selectedITHistoryVisit.visitor || {};
          const directoryVisitor = visitorList.find(
            (item) => String(item.visitor_id) === String(historyVisitor.visitor_id || selectedITHistoryVisit.visitor_id)
          ) || {};
          const selectedVisitor = {
            ...directoryVisitor,
            ...historyVisitor,
            photo_url: historyVisitor.photo_url || directoryVisitor.photo_url || selectedITHistoryVisit.photo_url || selectedITHistoryVisit.visitor_photo_url || "",
          };
          const visitorFullName = `${selectedVisitor.first_name || ""} ${selectedVisitor.last_name || ""}`.trim() || "IT Contractor";
          const visitorPhoto = resolvePhotoUrl(selectedVisitor.photo_url);
          const itParsed = parseITPurpose(selectedITHistoryVisit.purpose);
          const durationText = calculateDuration(selectedITHistoryVisit.check_in_time, selectedITHistoryVisit.check_out_time);
          const host = selectedITHistoryVisit.host_employee || {};
          const assets = selectedITHistoryVisit.assets || [];

          return (
            <section
              ref={itHistoryDetailsRef}
              className="page-card checkout-history-details"
              style={{ marginTop: "20px", scrollMarginTop: "24px", borderColor: "#d8b4fe" }}
            >
              {/* Action Bar (Screen Only) */}
              <div className="checkout-screen-action-bar no-print">
                <div>
                  <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 750, color: "#1e1b4b" }}>
                    Official IT Technical Personnel Dossier &amp; Hardware Security Clearance Record
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b21a8" }}>
                    Visit Reference: <code style={{ color: "#4c1d95", background: "#faf5ff", padding: "2px 7px", borderRadius: "4px", fontWeight: 700, border: "1px solid #d8b4fe" }}>{selectedITHistoryVisit.visit_id}</code>
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="back-button"
                    onClick={() => setSelectedITHistoryVisit(null)}
                  >
                    Close Dossier
                  </button>
                  <button
                    type="button"
                    className="back-button"
                    style={{ background: "#7c3aed", color: "#ffffff", borderColor: "#6d28d9" }}
                    onClick={() => window.print()}
                  >
                    <Printer size={15} />
                    Print / Export IT Record
                  </button>
                </div>
              </div>

              {/* Certificate Container */}
              <div className="checkout-cert-sheet">
                {/* Executive Letterhead */}
                <header
                  className="checkout-cert-header"
                  style={{ borderBottom: "2.5px solid #7c3aed" }}
                >
                  <div className="checkout-cert-brand">
                    <div
                      className="checkout-cert-logo"
                      style={{ background: "#faf5ff", border: "1px solid #d8b4fe" }}
                    >
                      <ShieldCheck size={28} color="#7c3aed" />
                    </div>
                    <div>
                      <h2 className="checkout-cert-title" style={{ color: "#4c1d95" }}>
                        VISITOR MANAGEMENT SYSTEM • IT TECHNICAL DIVISION
                      </h2>
                      <div className="checkout-cert-subtitle" style={{ color: "#6b21a8" }}>
                        Official IT Technical Personnel Checkout &amp; Hardware Custody Clearance Record
                      </div>
                    </div>
                  </div>

                  <div className="checkout-cert-meta">
                    <div className="checkout-cert-meta-item">
                      <span className="meta-label">VISIT REFERENCE</span>
                      <span className="meta-val monospace">{selectedITHistoryVisit.visit_id}</span>
                    </div>
                    <div className="checkout-cert-meta-item">
                      <span className="meta-label">SECURITY VERIFICATION</span>
                      <div className="checkout-cert-badges">
                        <span
                          className="cert-status-badge"
                          style={{ background: "#faf5ff", color: "#7c3aed", border: "1px solid #d8b4fe" }}
                        >
                          <CheckCircle2 size={12} /> {selectedITHistoryVisit.status || "CHECKED_OUT"}
                        </span>
                        <span
                          className="cert-status-badge status-cleared"
                        >
                          <ShieldCheck size={12} /> Hardware Exit Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Section 1: Contractor & Mission Dossier */}
                <div className="checkout-cert-dossier">
                  {/* Column 1: Contractor Profile */}
                  <div className="checkout-dossier-col visitor-col" style={{ borderColor: "#e9d5ff" }}>
                    <div className="checkout-col-heading">
                      <h4 style={{ color: "#4c1d95" }}>IT Contractor &amp; Technician Profile</h4>
                      {visitorPhoto ? (
                        <span className="cert-pill-green">
                          <CheckCircle2 size={11} /> Photo Verified
                        </span>
                      ) : (
                        <span className="cert-pill-gray">No Photo on File</span>
                      )}
                    </div>

                    <div className="checkout-visitor-profile-card">
                      <div
                        className="checkout-visitor-photo-wrap"
                        style={{ border: "1px solid #d8b4fe" }}
                        onClick={() => {
                          if (visitorPhoto) {
                            setAssetLightbox({
                              url: visitorPhoto,
                              title: `${visitorFullName} (IT Specialist Photograph)`,
                              subtitle: `Visitor ID #${selectedVisitor.visitor_id || selectedITHistoryVisit.visitor_id || "—"} • ${selectedVisitor.company_name || "IT Contractor"}`
                            });
                          }
                        }}
                        title={visitorPhoto ? "Click to inspect contractor photograph" : "No photograph on file"}
                      >
                        {visitorPhoto ? (
                          <img src={visitorPhoto} alt={visitorFullName} className="checkout-visitor-photo" />
                        ) : null}
                        <span className="checkout-visitor-photo-fallback" style={{ color: "#7c3aed" }}>
                          {getInitials(visitorFullName)}
                        </span>
                        {visitorPhoto && (
                          <div className="checkout-visitor-photo-zoom-hint no-print">
                            <Eye size={12} />
                          </div>
                        )}
                      </div>

                      <div className="checkout-visitor-profile-details">
                        <h3 className="checkout-visitor-name" style={{ color: "#1e1b4b" }}>{visitorFullName}</h3>
                        <div className="checkout-profile-meta-row">
                          <span className="profile-meta-item">
                            <Building2 size={13} color="#7c3aed" /> <strong>Organization:</strong> {selectedVisitor.company_name || "External Technical Partner"}
                          </span>
                        </div>
                        <div className="checkout-profile-meta-row">
                          <span className="profile-meta-item">
                            <Tag size={13} color="#7c3aed" /> <strong>Phone:</strong> {selectedVisitor.phone || selectedVisitor.phone_number || "Not recorded"}
                          </span>
                          <span className="profile-meta-item">
                            <strong>Email:</strong> {selectedVisitor.email || "Not recorded"}
                          </span>
                        </div>
                        {itParsed.workId !== "N/A" && (
                          <div className="checkout-profile-meta-row">
                            <span className="profile-meta-item">
                              <Tag size={13} color="#7c3aed" /> <strong>Contractor Badge / ID:</strong> {itParsed.workId}
                            </span>
                          </div>
                        )}
                        <div className="checkout-profile-meta-row address-row">
                          <span className="profile-meta-item">
                            <MapPin size={13} color="#7c3aed" />
                            <strong>Permanent Address:</strong> {[
                              selectedVisitor.address_line1,
                              selectedVisitor.address_line2,
                              selectedVisitor.city,
                              selectedVisitor.state,
                              selectedVisitor.postal_code,
                              selectedVisitor.country
                            ].filter(Boolean).join(", ") || "Address recorded on clearance form"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Mission & Escort Details */}
                  <div className="checkout-dossier-col visit-col" style={{ borderColor: "#e9d5ff" }}>
                    <div className="checkout-col-heading">
                      <h4 style={{ color: "#4c1d95" }}>Technical Mission &amp; IT Host Escort</h4>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#7c3aed",
                          background: "#faf5ff",
                          border: "1px solid #d8b4fe",
                          padding: "2px 8px",
                          borderRadius: "9999px"
                        }}
                      >
                        <Server size={11} /> IT Authorization
                      </span>
                    </div>

                    <div className="checkout-visit-details-list">
                      <div className="checkout-visit-detail-item">
                        <span className="detail-label">PURPOSE / SCOPE</span>
                        <span className="detail-value" style={{ color: "#4c1d95", fontWeight: 700 }}>
                          {itParsed.category}
                        </span>
                      </div>

                      <div className="checkout-visit-detail-item">
                        <span className="detail-label">DESIGNATED FACILITY AREA</span>
                        <span className="detail-value">
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={12} color="#7c3aed" /> {itParsed.area}
                          </span>
                        </span>
                      </div>

                      <div className="checkout-visit-detail-item">
                        <span className="detail-label">HELPDESK TICKET / WORK ORDER</span>
                        <span className="detail-value">
                          <code style={{ background: "#faf5ff", color: "#6b21a8", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e9d5ff" }}>
                            {itParsed.ticket}
                          </code>
                        </span>
                      </div>

                      <div className="checkout-visit-detail-item">
                        <span className="detail-label">INTERNAL IT SPONSOR / ESCORT</span>
                        <span className="detail-value">
                          <strong>{`${host.first_name || ""} ${host.last_name || ""}`.trim() || "IT Systems Administrator"}</strong>
                          <span style={{ display: "block", fontSize: "11.5px", color: "#64748b" }}>
                            {host.department || "IT Infrastructure & Security"} • {host.email || ""}
                          </span>
                        </span>
                      </div>

                      <div className="checkout-visit-detail-item">
                        <span className="detail-label">TOTAL TIME ON PREMISES</span>
                        <span className="detail-value" style={{ fontWeight: 700, color: "#4c1d95" }}>
                          {durationText}
                        </span>
                      </div>

                      <div className="checkout-visit-detail-item">
                        <span className="detail-label">CHECK-IN TIMESTAMP</span>
                        <span className="detail-value monospace">
                          {formatDate(selectedITHistoryVisit.check_in_time)}
                        </span>
                      </div>

                      <div className="checkout-visit-detail-item">
                        <span className="detail-label">CHECKOUT &amp; EXIT TIME</span>
                        <span className="detail-value monospace">
                          {formatDate(selectedITHistoryVisit.check_out_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: IT Hardware Custody & Tooling Audit Table */}
                <div className="checkout-cert-assets-block">
                  <div className="checkout-col-heading">
                    <h4 style={{ color: "#4c1d95" }}>IT Hardware, Diagnostics &amp; Custody Audit</h4>
                    <span
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "#059669",
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        padding: "2px 8px",
                        borderRadius: "9999px"
                      }}
                    >
                      <ShieldCheck size={11} /> All Items Cleared for Exit
                    </span>
                  </div>

                  {assets.length === 0 ? (
                    <div style={{ padding: "18px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", color: "#64748b", fontSize: "13px" }}>
                      No physical IT hardware registered on this visit. Personnel checked out with standard personal credentials.
                    </div>
                  ) : (
                    <table className="checkout-assets-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#faf5ff" }}>
                          <th style={{ color: "#6b21a8" }}>Hardware / Tool Type</th>
                          <th style={{ color: "#6b21a8" }}>Brand &amp; Model</th>
                          <th style={{ color: "#6b21a8" }}>Serial Number</th>
                          <th style={{ color: "#6b21a8" }}>Asset ID</th>
                          <th style={{ color: "#6b21a8" }}>Photograph</th>
                          <th style={{ color: "#6b21a8" }}>Exit Inspection Status</th>
                          <th style={{ color: "#6b21a8" }}>Cleared By Officer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.map((asset) => {
                          const assetPhoto = resolvePhotoUrl(asset.photo_url);
                          return (
                            <tr key={asset.asset_id}>
                              <td>
                                <strong style={{ color: "#1e1b4b" }}>{asset.asset_type || "Technical Hardware"}</strong>
                              </td>
                              <td style={{ color: "#334155" }}>{asset.brand_model || "Enterprise Specification"}</td>
                              <td className="monospace" style={{ fontWeight: 600 }}>{asset.serial_number || "—"}</td>
                              <td className="monospace" style={{ fontSize: "11px", color: "#64748b" }}>
                                {asset.asset_id ? asset.asset_id.substring(0, 13) + "..." : "—"}
                              </td>
                              <td>
                                {assetPhoto ? (
                                  <div
                                    style={{
                                      width: "36px",
                                      height: "36px",
                                      borderRadius: "6px",
                                      overflow: "hidden",
                                      cursor: "pointer",
                                      border: "1px solid #d8b4fe"
                                    }}
                                    onClick={() => setAssetLightbox({
                                      url: assetPhoto,
                                      title: `${asset.brand_model || "Hardware"} (${asset.asset_type || "IT Tool"})`,
                                      subtitle: `Serial: ${asset.serial_number || "—"} • Cleared for Exit`
                                    })}
                                    title="Click to inspect hardware photograph"
                                  >
                                    <img src={assetPhoto} alt="Asset" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  </div>
                                ) : (
                                  <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>No photo</span>
                                )}
                              </td>
                              <td>
                                <span
                                  className="cert-status-badge status-cleared"
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px" }}
                                >
                                  <ShieldCheck size={11} /> Cleared for Exit
                                </span>
                              </td>
                              <td style={{ fontSize: "11.5px", color: "#334155" }}>
                                {asset.cleared_by || "Security Officer (Main Gate)"}
                                {asset.cleared_at && (
                                  <div style={{ fontSize: "10.5px", color: "#64748b" }}>
                                    {formatDate(asset.cleared_at)}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Section 3: Sign-Off & Footer */}
                <div className="checkout-cert-signoff-row">
                  <div className="checkout-signoff-box">
                    <div className="signoff-role">AUTHORIZED IT ESCORT SIGN-OFF</div>
                    <div className="signoff-signature-line">
                      <div className="signoff-stamp it">
                        <Check size={12} /> IT MISSION COMPLETED
                      </div>
                    </div>
                    <div className="signoff-name">{`${host.first_name || ""} ${host.last_name || ""}`.trim() || "IT Systems Administrator"}</div>
                    <div className="signoff-title">{host.department || "IT Operations Division"}</div>
                  </div>

                  <div className="checkout-signoff-box">
                    <div className="signoff-role">SECURITY GATE AUDIT OFFICER</div>
                    <div className="signoff-signature-line">
                      <div className="signoff-stamp security">
                        <ShieldCheck size={12} /> GATE EXIT VERIFIED
                      </div>
                    </div>
                    <div className="signoff-name">Security Gate Control Officer</div>
                    <div className="signoff-title">Corporate Facility Physical Security</div>
                  </div>
                </div>

                {/* Official Print Footer */}
                <footer className="checkout-cert-footer">
                  <span>Visitor Management System • IT Technical Facility Gate Clearance</span>
                  <span>Visit Ref: {selectedITHistoryVisit.visit_id}</span>
                  <span>Official Security Audit Document • Page 1 of 1</span>
                </footer>
              </div>
            </section>
          );
        })()}
      </>
    );
  };

  '''

text = text.replace(marker, it_checkout_history_code + marker, 1)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS: App.jsx updated with IT Checkout History!")
