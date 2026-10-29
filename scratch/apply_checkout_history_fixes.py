import os
import re

print("Starting update script...")

# 1. Update frontend/src/CheckoutHistory.jsx
ch_path = "frontend/src/CheckoutHistory.jsx"
with open(ch_path, "r", encoding="utf-8") as f:
    ch_code = f.read()

# A. Change default itDossierViewMode from "dual" to "overview"
ch_code = ch_code.replace(
    'const [itDossierViewMode, setItDossierViewMode] = useState("dual");',
    'const [itDossierViewMode, setItDossierViewMode] = useState("overview");'
)

# B. Wrap background main content
# Look for return ( <div className="ch-container"> {/* Executive Header */} <header className="ch-header">
target_start = """  return (
    <div className="ch-container">
      {/* Executive Header */}
      <header className="ch-header">"""
replacement_start = """  return (
    <div className="ch-container">
      <div className={`ch-main-content ${selectedVisit ? "no-print" : ""}`}>
      {/* Executive Header */}
      <header className="ch-header">"""

if target_start in ch_code:
    ch_code = ch_code.replace(target_start, replacement_start)
    print("Wrapped ch-main-content start in CheckoutHistory.jsx")
else:
    print("WARNING: target_start not found in CheckoutHistory.jsx")

# Find the end of table section before `{/* Interactive Dossier & Exit Certificate Modal */}`
target_end = """        </div>
      </section>

      {/* Interactive Dossier & Exit Certificate Modal */}"""
replacement_end = """        </div>
      </section>
      </div>

      {/* Interactive Dossier & Exit Certificate Modal */}"""

if target_end in ch_code:
    ch_code = ch_code.replace(target_end, replacement_end)
    print("Wrapped ch-main-content end in CheckoutHistory.jsx")
else:
    print("WARNING: target_end not found in CheckoutHistory.jsx")

# C. In it-asset-modal-inner in CheckoutHistory.jsx:
# Tag .it-asset-view-switcher-bar with no-print
ch_code = ch_code.replace(
    '<div className="it-asset-view-switcher-bar">',
    '<div className="it-asset-view-switcher-bar no-print">'
)

# D. Wrap the screen views and add the print-only fallback in CheckoutHistory.jsx
target_switcher = """                {/* Cards according to active view mode */}
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
                )}"""

replacement_switcher = """                {/* Cards according to active view mode (screen) */}
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
                )}"""

if target_switcher in ch_code:
    ch_code = ch_code.replace(target_switcher, replacement_switcher)
    print("Updated itDossierViewMode switcher and print fallback in CheckoutHistory.jsx")
else:
    print("WARNING: target_switcher not found in CheckoutHistory.jsx")

# E. Inside renderOverviewDossier() in CheckoutHistory.jsx:
# Tag header buttons, banner buttons, and modal footer with no-print
ch_code = ch_code.replace(
    """                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    className="ch-btn-refresh\"""",
    """                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    className="ch-btn-refresh no-print\""""
)

ch_code = ch_code.replace(
    'className="vms-dossier-close-btn"',
    'className="vms-dossier-close-btn no-print"'
)

ch_code = ch_code.replace(
    '<div className="vms-active-visit-actions">',
    '<div className="vms-active-visit-actions no-print">'
)

ch_code = ch_code.replace(
    '<div className="vms-dossier-footer"',
    '<div className="vms-dossier-footer no-print"'
)

# In renderCheckInCard in CheckoutHistory:
ch_code = ch_code.replace(
    'className="it-asset-close-btn"',
    'className="it-asset-close-btn no-print"'
)

ch_code = ch_code.replace(
    '<div className="it-asset-card-footer">',
    '<div className="it-asset-card-footer no-print">'
)

with open(ch_path, "w", encoding="utf-8") as f:
    f.write(ch_code)
print("Saved CheckoutHistory.jsx successfully.")
