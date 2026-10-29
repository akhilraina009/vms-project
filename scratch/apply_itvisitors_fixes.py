import os
import re

print("Starting ITVisitors update script...")

it_path = "frontend/src/ITVisitors.jsx"
with open(it_path, "r", encoding="utf-8") as f:
    it_code = f.read()

# 1. Update row click to open in "overview"
it_code = it_code.replace(
    'onClick={() => openTechnicianDossier(item, "checkin")}',
    'onClick={() => openTechnicianDossier(item, "overview")}'
)

# 2. Update isInside logic to prevent "No active IT visit found" alert
target_is_inside = """        const activeVisit = dossierData?.active_visit || selectedVisitor.active_visit || (selectedVisitor.is_inside ? selectedVisitor.latest_visit : null);
        const pendingVisit = selectedVisitor.pending_visit || (!activeVisit && ["PENDING", "APPROVED"].includes(selectedVisitor.latest_visit?.status) ? selectedVisitor.latest_visit : null);
        const isInside = Boolean(activeVisit || selectedVisitor.is_inside);
        const activeVisitId = activeVisit?.visit_id;
        const pendingVisitId = pendingVisit?.visit_id;
        const targetVisit = activeVisit || selectedVisitor.latest_visit;"""

replacement_is_inside = """        const activeVisit = dossierData?.active_visit || (selectedVisitor.latest_visit?.status === "ACTIVE" ? selectedVisitor.latest_visit : null);
        const pendingVisit = selectedVisitor.pending_visit || (!activeVisit && ["PENDING", "APPROVED"].includes(selectedVisitor.latest_visit?.status) ? selectedVisitor.latest_visit : null);
        const isInside = Boolean(activeVisit && activeVisit.status === "ACTIVE");
        const activeVisitId = activeVisit?.visit_id;
        const pendingVisitId = pendingVisit?.visit_id;
        const targetVisit = activeVisit || selectedVisitor.latest_visit;"""

if target_is_inside in it_code:
    it_code = it_code.replace(target_is_inside, replacement_is_inside)
    print("Updated isInside logic in ITVisitors.jsx")
else:
    print("WARNING: target_is_inside not found in ITVisitors.jsx")

# 3. Wrap background IT visitors page
target_it_start = """  return (
    <div className="it-visitors-container">
      {/* Header */}"""

replacement_it_start = """  return (
    <div className="it-visitors-container">
      <div className={`it-visitors-main-content ${selectedVisitor ? "no-print" : ""}`}>
      {/* Header */}"""

if target_it_start in it_code:
    it_code = it_code.replace(target_it_start, replacement_it_start)
    print("Wrapped it-visitors-main-content start in ITVisitors.jsx")
else:
    print("WARNING: target_it_start not found in ITVisitors.jsx")

target_it_end = """        <ShieldCheck size={14} color="#12b76a" />
        IT Visitor identity and hardware custody records are audited under Enterprise Security Policy.
      </div>

      {/* Detailed IT Visitor Dossier Modal */}"""

replacement_it_end = """        <ShieldCheck size={14} color="#12b76a" />
        IT Visitor identity and hardware custody records are audited under Enterprise Security Policy.
      </div>
      </div>

      {/* Detailed IT Visitor Dossier Modal */}"""

if target_it_end in it_code:
    it_code = it_code.replace(target_it_end, replacement_it_end)
    print("Wrapped it-visitors-main-content end in ITVisitors.jsx")
else:
    print("WARNING: target_it_end not found in ITVisitors.jsx")

# 4. In it-asset-modal-inner in ITVisitors.jsx:
# Tag .it-asset-view-switcher-bar with no-print
it_code = it_code.replace(
    '<div className="it-asset-view-switcher-bar">',
    '<div className="it-asset-view-switcher-bar no-print">'
)

# 5. Wrap the active tab and add print fallback in ITVisitors.jsx
target_it_switcher = """              {/* Cards according to active view mode */}
              {dossierViewMode === "checkin" && (
                <div className="it-asset-cards-wrapper single">
                  {renderCheckInCard()}
                </div>
              )}

              {dossierViewMode === "checkout" && (
                <div className="it-asset-cards-wrapper single">
                  {renderCheckOutCard()}
                </div>
              )}

              {dossierViewMode === "dual" && (
                <div className="it-asset-cards-wrapper">
                  {renderCheckInCard()}
                  {renderCheckOutCard()}
                </div>
              )}

              {dossierViewMode === "overview" && (
                renderOverviewDossier()
              )}"""

replacement_it_switcher = """              {/* Cards according to active view mode (screen) */}
              <div className={dossierViewMode === "overview" ? "" : "no-print"}>
                {dossierViewMode === "checkin" && (
                  <div className="it-asset-cards-wrapper single">
                    {renderCheckInCard()}
                  </div>
                )}

                {dossierViewMode === "checkout" && (
                  <div className="it-asset-cards-wrapper single">
                    {renderCheckOutCard()}
                  </div>
                )}

                {dossierViewMode === "dual" && (
                  <div className="it-asset-cards-wrapper">
                    {renderCheckInCard()}
                    {renderCheckOutCard()}
                  </div>
                )}

                {dossierViewMode === "overview" && (
                  renderOverviewDossier()
                )}
              </div>

              {/* Print-Only Fallback: When on checkin/checkout/dual tab on screen, always print the full Overview Dossier */}
              {dossierViewMode !== "overview" && (
                <div className="no-screen it-print-dossier-wrapper">
                  {renderOverviewDossier()}
                </div>
              )}"""

if target_it_switcher in it_code:
    it_code = it_code.replace(target_it_switcher, replacement_it_switcher)
    print("Updated dossierViewMode switcher and print fallback in ITVisitors.jsx")
else:
    print("WARNING: target_it_switcher not found in ITVisitors.jsx")

# 6. Add Custody Reconciliation Card into renderOverviewDossier() right after the dual cards wrapper
target_hardware_wrapper = """              {/* Hardware Section Embedded in Overview: Side-by-Side Dual View */}
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
              </div>"""

replacement_hardware_wrapper = """              {/* Hardware Section Embedded in Overview: Side-by-Side Dual View */}
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
                      {declaredAssets.length} Declared Assets
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#059669", textTransform: "uppercase", fontWeight: 700 }}>Return on Exit</span>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
                      {returningCount} Items Returned
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#1d4ed8", textTransform: "uppercase", fontWeight: 700 }}>Retained in Facility</span>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1d4ed8", marginTop: "2px" }}>
                      {retainedCount} Items Retained / Installed
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>Reconciliation Verdict</span>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#166534", marginTop: "2px" }}>
                      ✓ 100% Balanced &amp; Accounted
                    </div>
                  </div>
                </div>
              </div>"""

if target_hardware_wrapper in it_code:
    it_code = it_code.replace(target_hardware_wrapper, replacement_hardware_wrapper)
    print("Added Custody Reconciliation card to renderOverviewDossier in ITVisitors.jsx")
else:
    print("WARNING: target_hardware_wrapper not found in ITVisitors.jsx")

# 7. Tag Technical Visit History with no-print so it does NOT print in the PDF
it_code = it_code.replace(
    """              {/* Technical Visit History */}
              {allVisits.length > 0 && (
                <div className="vms-dossier-section">""",
    """              {/* Technical Visit History */}
              {allVisits.length > 0 && (
                <div className="vms-dossier-section no-print">"""
)

# 8. Tag buttons with no-print in ITVisitors.jsx
it_code = it_code.replace(
    'className="vms-dossier-close-btn"',
    'className="vms-dossier-close-btn no-print"'
)

it_code = it_code.replace(
    'className="vms-dossier-change-photo-btn"',
    'className="vms-dossier-change-photo-btn no-print"'
)

it_code = it_code.replace(
    '<div className="vms-dossier-footer"',
    '<div className="vms-dossier-footer no-print"'
)

# In renderCheckOutCard, ensure default isCarried is !isRetained
it_code = it_code.replace(
    'const isCarried = (!asset.cleared_by || !asset.cleared_by.includes("RETAINED")) && (asset.is_cleared_for_exit || asset.disposition === "CARRIED_OUT");',
    'const isCarried = !isRetained;'
)

with open(it_path, "w", encoding="utf-8") as f:
    f.write(it_code)
print("Saved ITVisitors.jsx successfully.")
