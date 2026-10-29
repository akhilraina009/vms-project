import os

# Update frontend/src/ITVisit.css
it_css_path = "frontend/src/ITVisit.css"
with open(it_css_path, "r", encoding="utf-8") as f:
    it_css = f.read()

target_it_print = """/* Master IT Visit Print Rules */
@media print {
  .it-asset-modal-overlay {
    position: static !important;
    inset: auto !important;
    background: transparent !important;
    backdrop-filter: none !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    overflow: visible !important;
    width: 100% !important;
  }

  .it-asset-modal-inner {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
  }

  .it-asset-view-switcher-bar,
  .it-asset-card-footer,
  .vms-dossier-footer,
  .it-asset-btn-action,
  .it-asset-btn-cancel,
  .it-asset-btn-add,
  .it-asset-btn-scan,
  .it-asset-close-btn,
  .vms-dossier-close-btn {
    display: none !important;
  }

  .it-asset-cards-wrapper {
    display: flex !important;
    flex-direction: row !important;
    gap: 16px !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .it-asset-tracker-card {
    flex: 1 !important;
    max-width: 49% !important;
    border: 1.5px solid #0f172a !important;
    border-radius: 10px !important;
    box-shadow: none !important;
    page-break-inside: avoid !important;
    background: #ffffff !important;
  }
}"""

replacement_it_print = """/* Master IT Visit Print Rules */
@media print {
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }

  .it-visitors-main-content.no-print,
  .no-print,
  .it-asset-view-switcher-bar,
  .it-asset-card-footer,
  .vms-dossier-footer,
  .it-asset-btn-action,
  .it-asset-btn-cancel,
  .it-asset-btn-add,
  .it-asset-btn-scan,
  .it-asset-close-btn,
  .vms-dossier-close-btn,
  .vms-dossier-change-photo-btn,
  .vms-active-visit-actions,
  .it-asset-add-box,
  .it-qr-portal-btn,
  .vms-btn-it-pass,
  .btn-dossier-checkout,
  .vms-btn-checkout-prominent {
    display: none !important;
  }

  .no-screen {
    display: block !important;
  }

  .it-asset-modal-overlay {
    position: static !important;
    inset: auto !important;
    background: transparent !important;
    backdrop-filter: none !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    overflow: visible !important;
    width: 100% !important;
  }

  .it-asset-modal-inner,
  .vms-dossier-modal {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: #ffffff !important;
    transform: none !important;
    overflow: visible !important;
  }

  .vms-dossier-profile-card,
  .vms-active-visit-banner {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin-bottom: 12px !important;
  }

  .it-asset-cards-wrapper {
    display: flex !important;
    flex-direction: row !important;
    gap: 12px !important;
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 12px !important;
  }

  .it-asset-tracker-card {
    flex: 1 1 50% !important;
    max-width: 49% !important;
    border: 1.5px solid #cbd5e1 !important;
    border-radius: 10px !important;
    box-shadow: none !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    background: #ffffff !important;
  }

  .ch-dossier-section,
  .ch-recon-box {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .ch-recon-box {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 8px !important;
    background: #f8fafc !important;
    border: 1.5px solid #cbd5e1 !important;
    padding: 10px !important;
    border-radius: 8px !important;
  }

  .it-cert-signatures-row,
  .ch-print-signatures {
    display: grid !important;
    grid-template-columns: 1fr 1fr 1fr !important;
    gap: 16px !important;
    margin-top: 16px !important;
    padding-top: 14px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}

/* Screen hidden, print visible */
.no-screen {
  display: none !important;
}"""

if target_it_print in it_css:
    it_css = it_css.replace(target_it_print, replacement_it_print)
    with open(it_css_path, "w", encoding="utf-8") as f:
        f.write(it_css)
    print("Updated ITVisit.css successfully.")
else:
    print("WARNING: target_it_print not found in ITVisit.css")

# Update frontend/src/CheckoutHistory.css
ch_css_path = "frontend/src/CheckoutHistory.css"
with open(ch_css_path, "r", encoding="utf-8") as f:
    ch_css = f.read()

# Make sure it-asset-modal-overlay and it-asset-modal-inner are styled in CheckoutHistory.css @media print
if ".it-asset-modal-overlay" not in ch_css[ch_css.find("@media print"):]:
    target_ch_modal = """  .ch-modal,
  .vms-dossier-modal {"""
    replacement_ch_modal = """  .it-asset-modal-overlay {
    position: static !important;
    inset: auto !important;
    background: transparent !important;
    backdrop-filter: none !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    overflow: visible !important;
    width: 100% !important;
  }

  .it-asset-modal-inner {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: #ffffff !important;
    overflow: visible !important;
  }

  .it-asset-cards-wrapper {
    display: flex !important;
    flex-direction: row !important;
    gap: 12px !important;
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 12px !important;
  }

  .it-asset-tracker-card {
    flex: 1 1 50% !important;
    max-width: 49% !important;
    border: 1.5px solid #cbd5e1 !important;
    border-radius: 10px !important;
    box-shadow: none !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    background: #ffffff !important;
  }

  .ch-modal,
  .vms-dossier-modal {"""
    ch_css = ch_css.replace(target_ch_modal, replacement_ch_modal, 1)
    with open(ch_css_path, "w", encoding="utf-8") as f:
        f.write(ch_css)
    print("Updated CheckoutHistory.css with it-asset modal print styles.")
else:
    print("CheckoutHistory.css already has it-asset-modal-overlay styles.")

