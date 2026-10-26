path = r'z:\vms-project\frontend\src\SecurityGuardPortal.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Visitor photo fallback in dossier
target_vis = """                            <img
                              src={resolvePhotoUrl(verifiedVisit.visitor?.photo_url || verifiedVisit.photo_url)}
                              alt="Visitor official capture"
                            />
                            <div className="sgp-photo-zoom-hint">
                              <Maximize2 size={11} /> Zoom
                            </div>"""

repl_vis = """                            <img
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
                            </div>"""

# 2. Asset photo fallback
target_asset = """                              {assetPhoto ? (
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
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "8px",
                                    background: "#e2e8f0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#475569",
                                  }}
                                >
                                  <Laptop size={20} />
                                </div>
                              )}"""

repl_asset = """                              {assetPhoto ? (
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
                              </div>"""

text_norm = text.replace("\r\n", "\n")
target_vis_norm = target_vis.replace("\r\n", "\n")
repl_vis_norm = repl_vis.replace("\r\n", "\n")
target_asset_norm = target_asset.replace("\r\n", "\n")
repl_asset_norm = repl_asset.replace("\r\n", "\n")

if target_vis_norm in text_norm:
    text_norm = text_norm.replace(target_vis_norm, repl_vis_norm, 1)
    print("SUCCESS replaced visitor photo fallback")
else:
    print("target_vis not found")

if target_asset_norm in text_norm:
    text_norm = text_norm.replace(target_asset_norm, repl_asset_norm, 1)
    print("SUCCESS replaced asset photo fallback")
else:
    print("target_asset not found")

with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(text_norm)
print("Finished updating SecurityGuardPortal.jsx")
