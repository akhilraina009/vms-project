import sys

# 1. Append CSS to frontend/src/PremiumEnterprise.css
with open('scratch/it_dossier_styles.css', 'r', encoding='utf-8') as f:
    css_to_add = f.read()

with open('frontend/src/PremiumEnterprise.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

if '.it-dossier-card' not in css_content:
    with open('frontend/src/PremiumEnterprise.css', 'a', encoding='utf-8') as f:
        f.write('\n\n' + css_to_add)
    print("Appended it_dossier_styles to PremiumEnterprise.css")
else:
    print("it_dossier_styles already in PremiumEnterprise.css, updating it...")
    pos = css_content.find('/* =========================================================\n   PREMIUM ENTERPRISE IT DOSSIER & CHECKOUT HISTORY STYLING')
    if pos != -1:
        css_content = css_content[:pos] + css_to_add
        with open('frontend/src/PremiumEnterprise.css', 'w', encoding='utf-8') as f:
            f.write(css_content)

# 2. Update frontend/src/App.jsx
with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    app_text = f.read()

# Replace the table row avatar style to remove lime green
old_table_avatar = '''                            <div
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
                            </div>'''

new_table_avatar = '''                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                minWidth: "42px",
                                borderRadius: "10px",
                                margin: 0,
                                cursor: rowVisitorPhoto ? "pointer" : "default",
                                border: "1px solid #ddd6fe",
                                background: rowVisitorPhoto ? "#ffffff" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                                overflow: "hidden",
                                flexShrink: 0
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
                              title={rowVisitorPhoto ? "Click to zoom contractor photo" : "IT Contractor"}
                            >
                              {rowVisitorPhoto ? (
                                <img
                                  src={rowVisitorPhoto}
                                  alt={visitorFullName}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <span style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.5px" }}>
                                  {getInitials(visitorFullName)}
                                </span>
                              )}
                            </div>'''

if old_table_avatar not in app_text:
    print("Warning: old_table_avatar exact match not found, checking...")
else:
    app_text = app_text.replace(old_table_avatar, new_table_avatar, 1)
    print("Replaced old_table_avatar")

# Replace selectedITHistoryVisit section
dossier_start_marker = '{selectedITHistoryVisit && (() => {'
dossier_end_marker = '        })()}\n      </>\n    );\n  };\n\n    const renderCheckoutReceipt = () => {'

start_idx = app_text.find(dossier_start_marker, app_text.find('const renderITCheckoutHistory = () => {'))
end_idx = app_text.find(dossier_end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print(f"ERROR: could not find dossier bounds: start_idx={start_idx}, end_idx={end_idx}")
    sys.exit(1)

new_dossier_block = '''{selectedITHistoryVisit && (() => {
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
              className="it-dossier-card"
            >
              {/* Executive Action Bar */}
              <div className="it-dossier-topbar no-print">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <h3 className="it-dossier-top-title">
                    IT Technical Personnel Checkout Dossier
                  </h3>
                  <span className="it-dossier-ref-code">
                    {selectedITHistoryVisit.visit_id}
                  </span>
                </div>
                <div className="it-dossier-actions">
                  <button
                    type="button"
                    className="it-dossier-btn-close"
                    onClick={() => setSelectedITHistoryVisit(null)}
                  >
                    <X size={14} />
                    <span>Close Dossier</span>
                  </button>
                  <button
                    type="button"
                    className="it-dossier-btn-print"
                    onClick={() => window.print()}
                  >
                    <Printer size={15} />
                    <span>Print / Export Record</span>
                  </button>
                </div>
              </div>

              {/* Certificate Sheet */}
              <div className="it-cert-sheet">
                {/* Header */}
                <header className="it-cert-header">
                  <div className="it-cert-brand">
                    <div className="it-cert-logo-box">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <h2 className="it-cert-title-h2">
                        VISITOR MANAGEMENT SYSTEM • IT TECHNICAL DIVISION
                      </h2>
                      <div className="it-cert-subtitle">
                        Official IT Technical Personnel Checkout &amp; Hardware Custody Clearance Record
                      </div>
                    </div>
                  </div>

                  <div className="it-cert-badges-col">
                    <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: "4px" }}>
                      Clearance Status
                    </div>
                    <div className="it-cert-badge-row">
                      <span className="it-badge-checkout">
                        <CheckCircle2 size={13} /> {selectedITHistoryVisit.status || "CHECKED_OUT"}
                      </span>
                      <span className="it-badge-verified">
                        <ShieldCheck size={13} /> Hardware Exit Verified
                      </span>
                    </div>
                  </div>
                </header>

                {/* 2-Column Dossier */}
                <div className="it-dossier-columns-grid">
                  {/* Panel 1: Contractor & Identity */}
                  <div className="it-dossier-panel">
                    <div className="it-panel-header">
                      <h3>
                        <UserCheck size={16} color="#7c3aed" />
                        IT Contractor &amp; Technician Profile
                      </h3>
                      {visitorPhoto ? (
                        <span className="it-badge-verified">
                          <CheckCircle2 size={11} /> Photo Verified
                        </span>
                      ) : (
                        <span style={{ fontSize: "11.5px", color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px" }}>
                          Verified Credentials
                        </span>
                      )}
                    </div>

                    <div className="it-contractor-profile">
                      <div
                        className="it-contractor-avatar"
                        onClick={() => {
                          if (visitorPhoto) {
                            setAssetLightbox({
                              url: visitorPhoto,
                              title: `${visitorFullName} (IT Specialist Photograph)`,
                              subtitle: `ID #${selectedVisitor.visitor_id || selectedITHistoryVisit.visitor_id || "—"} • ${selectedVisitor.company_name || "IT Contractor"}`
                            });
                          }
                        }}
                        title={visitorPhoto ? "Click to zoom contractor photograph" : "Verified IT Contractor"}
                      >
                        {visitorPhoto ? (
                          <img src={visitorPhoto} alt={visitorFullName} />
                        ) : (
                          <span>{getInitials(visitorFullName)}</span>
                        )}
                        {visitorPhoto && (
                          <div className="checkout-visitor-photo-zoom-hint no-print">
                            <Eye size={12} />
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="it-contractor-name">{visitorFullName}</h3>
                        <div className="it-contractor-org">
                          <Building2 size={13} />
                          <span>{selectedVisitor.company_name || "External Technical Partner"}</span>
                        </div>
                        <div className="it-contractor-meta-list">
                          <div className="it-meta-row">
                            <Tag size={13} color="#7c3aed" />
                            <span><strong>Phone:</strong> {selectedVisitor.phone || selectedVisitor.phone_number || "Not recorded"}</span>
                          </div>
                          <div className="it-meta-row">
                            <span><strong>Email:</strong> {selectedVisitor.email || "Not recorded"}</span>
                          </div>
                          {itParsed.workId !== "N/A" && (
                            <div className="it-meta-row">
                              <span style={{ color: "#7c3aed", fontWeight: 700 }}>
                                <strong>Contractor Badge / ID:</strong> #{itParsed.workId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="it-address-box">
                      <strong>Facility Registered Permanent Address</strong>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                        <MapPin size={14} color="#7c3aed" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <span>
                          {[
                            selectedVisitor.address_line1,
                            selectedVisitor.address_line2,
                            selectedVisitor.city,
                            selectedVisitor.state,
                            selectedVisitor.postal_code,
                            selectedVisitor.country
                          ].filter(Boolean).join(", ") || "Address recorded on entry clearance manifest"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panel 2: Technical Mission & Escort */}
                  <div className="it-dossier-panel">
                    <div className="it-panel-header">
                      <h3>
                        <Server size={16} color="#7c3aed" />
                        Technical Mission &amp; IT Host Escort
                      </h3>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#6d28d9",
                          background: "#f5f3ff",
                          border: "1px solid #ddd6fe",
                          padding: "3px 9px",
                          borderRadius: "9999px"
                        }}
                      >
                        Authorized Access
                      </span>
                    </div>

                    <div className="it-specs-grid">
                      <div className="it-spec-cell full-width">
                        <span className="it-spec-label">Purpose / Technical Scope</span>
                        <div className="it-spec-value">
                          <span className="it-category-pill">{itParsed.category}</span>
                        </div>
                      </div>

                      <div className="it-spec-cell">
                        <span className="it-spec-label">Designated Facility Area</span>
                        <div className="it-spec-value">
                          <MapPin size={13} color="#7c3aed" />
                          <span>{itParsed.area}</span>
                        </div>
                      </div>

                      <div className="it-spec-cell">
                        <span className="it-spec-label">Helpdesk / Work Ticket</span>
                        <div className="it-spec-value">
                          <Tag size={13} color="#4338ca" />
                          <code className="it-dossier-ref-code">{itParsed.ticket}</code>
                        </div>
                      </div>

                      <div className="it-spec-cell full-width">
                        <span className="it-spec-label">Internal IT Sponsor / Escort</span>
                        <div className="it-spec-value" style={{ flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                            {`${host.first_name || ""} ${host.last_name || ""}`.trim() || "IT Systems Administrator"}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                            {host.department || "IT Infrastructure & Security Division"} • {host.email || ""}
                          </span>
                        </div>
                      </div>

                      <div className="it-spec-cell full-width">
                        <span className="it-spec-label">Total Time on Premises</span>
                        <div className="it-spec-value">
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "3px 10px",
                              borderRadius: "6px",
                              background: "#f3e8ff",
                              color: "#6b21a8",
                              fontWeight: 800,
                              fontSize: "13px"
                            }}
                          >
                            <Clock size={13} /> {durationText}
                          </span>
                        </div>
                      </div>

                      <div className="it-spec-cell">
                        <span className="it-spec-label">Check-in Timestamp</span>
                        <div className="it-spec-value mono">
                          {formatDate(selectedITHistoryVisit.check_in_time)}
                        </div>
                      </div>

                      <div className="it-spec-cell">
                        <span className="it-spec-label">Checkout &amp; Exit Time</span>
                        <div className="it-spec-value mono">
                          {formatDate(selectedITHistoryVisit.check_out_time)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Hardware Custody & Tooling Audit Table */}
                <div className="it-assets-section">
                  <div className="it-panel-header" style={{ marginBottom: "14px" }}>
                    <h3>
                      <Laptop size={16} color="#7c3aed" />
                      IT Hardware, Diagnostics &amp; Custody Audit
                    </h3>
                    <span className="it-badge-verified">
                      <ShieldCheck size={12} /> All Items Cleared for Exit
                    </span>
                  </div>

                  {assets.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", background: "#ffffff", borderRadius: "10px", color: "#64748b", fontSize: "13px", border: "1px solid #f1f0fa" }}>
                      No physical IT hardware registered on this visit. Personnel checked out with standard personal credentials.
                    </div>
                  ) : (
                    <div className="it-assets-table-wrap">
                      <table className="it-assets-table">
                        <thead>
                          <tr>
                            <th>Hardware / Tool Type</th>
                            <th>Brand &amp; Model</th>
                            <th>Serial Number</th>
                            <th>Asset ID</th>
                            <th>Photograph</th>
                            <th>Exit Inspection Status</th>
                            <th>Cleared By Officer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assets.map((asset) => {
                            const assetPhoto = resolvePhotoUrl(asset.photo_url);
                            return (
                              <tr key={asset.asset_id}>
                                <td>
                                  <strong style={{ color: "#1e1b4b", fontSize: "13.5px" }}>
                                    {asset.asset_type || "Technical Hardware"}
                                  </strong>
                                </td>
                                <td style={{ color: "#334155", fontWeight: 600 }}>
                                  {asset.brand_model || "Enterprise Specification"}
                                </td>
                                <td>
                                  <span className="it-asset-mono-tag">
                                    {asset.serial_number || "—"}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#64748b" }}>
                                    {asset.asset_id ? asset.asset_id.substring(0, 14) + "..." : "—"}
                                  </span>
                                </td>
                                <td>
                                  {assetPhoto ? (
                                    <div
                                      style={{
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        border: "1px solid #ddd6fe",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                                      }}
                                      onClick={() => setAssetLightbox({
                                        url: assetPhoto,
                                        title: `${asset.brand_model || "Hardware"} (${asset.asset_type || "IT Tool"})`,
                                        subtitle: `Serial: ${asset.serial_number || "—"} • Cleared for Exit`
                                      })}
                                      title="Click to zoom hardware photograph"
                                    >
                                      <img src={assetPhoto} alt="Asset" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>No photo</span>
                                  )}
                                </td>
                                <td>
                                  <span className="it-badge-verified">
                                    <ShieldCheck size={12} /> Cleared for Exit
                                  </span>
                                </td>
                                <td style={{ fontSize: "12px", color: "#334155" }}>
                                  <div style={{ fontWeight: 600 }}>{asset.cleared_by || "Security Officer (Main Gate)"}</div>
                                  {asset.cleared_at && (
                                    <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
                                      {formatDate(asset.cleared_at)}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 3: Dual Sign-Off Grid */}
                <div className="it-signoff-grid">
                  <div className="it-signoff-card">
                    <div className="it-signoff-title">Authorized IT Escort Sign-Off</div>
                    <div className="it-signoff-stamp escort">
                      <Check size={14} /> IT Mission Completed &amp; Signed
                    </div>
                    <div className="it-signoff-name">
                      {`${host.first_name || ""} ${host.last_name || ""}`.trim() || "IT Systems Administrator"}
                    </div>
                    <div className="it-signoff-role">
                      {host.department || "IT Infrastructure & Security Operations"}
                    </div>
                  </div>

                  <div className="it-signoff-card">
                    <div className="it-signoff-title">Security Gate Exit Audit Officer</div>
                    <div className="it-signoff-stamp security">
                      <ShieldCheck size={14} /> Gate Exit Permit Verified
                    </div>
                    <div className="it-signoff-name">
                      Corporate Security Control Officer
                    </div>
                    <div className="it-signoff-role">
                      Physical Security &amp; Asset Protection Division
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <footer className="it-cert-footer">
                  <span>Visitor Management System • IT Technical Facility Gate Clearance Record</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Ref: {selectedITHistoryVisit.visit_id}</span>
                  <span>Official Enterprise Security Audit Document • Page 1 of 1</span>
                </footer>
              </div>
            </section>
          );
        })()}'''

app_text = app_text[:start_idx] + new_dossier_block + app_text[end_idx:]

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(app_text)

print("SUCCESS: App.jsx updated with professional IT Dossier UI and typography!")
