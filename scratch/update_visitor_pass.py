path = r'z:\vms-project\frontend\src\PublicVisitorPass.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add resolvePhotoUrl at top
target_top = """const API_BASE_URL = "";
const PHOTO_BASE_URL = "";"""

repl_top = """const API_BASE_URL = "";
const PHOTO_BASE_URL = "";

const resolvePhotoUrl = (url) => {
  if (!url) return null;
  const clean = String(url).trim().replace(/\\\\/g, "/");
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
};"""

# 2. Update visitor photo section
target_photo = """              {pass?.photo_url ? (
                <div
                  className="pass-photo-wrapper"
                  onClick={() =>
                    setLightboxImage(
                      pass.photo_url.startsWith("http")
                        ? pass.photo_url
                        : `${PHOTO_BASE_URL}${pass.photo_url}`
                    )
                  }
                  title="Click to enlarge photo"
                >
                  <img
                    src={
                      pass.photo_url.startsWith("http")
                        ? pass.photo_url
                        : `${PHOTO_BASE_URL}${pass.photo_url}`
                    }
                    alt={`Photo of ${visitorName}`}
                    className="pass-hero-photo"
                  />
                  <div className="pass-photo-zoom-hint">View</div>
                </div>
              ) : (
                <div className="pass-hero-photo-placeholder">
                  <UserRound size={36} strokeWidth={1.5} />
                  <span>{getInitials(visitorName)}</span>
                </div>
              )}"""

repl_photo = """              {pass?.photo_url ? (
                <div
                  className="pass-photo-wrapper"
                  onClick={() => setLightboxImage(resolvePhotoUrl(pass.photo_url))}
                  title="Click to enlarge photo"
                >
                  <img
                    src={resolvePhotoUrl(pass.photo_url)}
                    alt={`Photo of ${visitorName}`}
                    className="pass-hero-photo"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fb = e.currentTarget.parentElement?.parentElement?.querySelector(".pass-hero-photo-placeholder");
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                  <div className="pass-photo-zoom-hint">View</div>
                </div>
              ) : null}
              <div
                className="pass-hero-photo-placeholder"
                style={{ display: pass?.photo_url ? "none" : "flex" }}
              >
                <UserRound size={36} strokeWidth={1.5} />
                <span>{getInitials(visitorName)}</span>
              </div>"""

# 3. Update asset photo section
target_asset = """                      {asset.photo_url ? (
                        <div
                          className="pass-asset-thumb-box"
                          onClick={() =>
                            setLightboxImage(
                              asset.photo_url.startsWith("http")
                                ? asset.photo_url
                                : `${PHOTO_BASE_URL}${asset.photo_url}`
                            )
                          }
                          title="Click to zoom hardware photo"
                        >
                          <img
                            src={
                              asset.photo_url.startsWith("http")
                                ? asset.photo_url
                                : `${PHOTO_BASE_URL}${asset.photo_url}`
                            }
                            alt={asset.asset_type || "Asset"}
                            className="pass-asset-thumb"
                          />
                        </div>
                      ) : (
                        <div className="pass-asset-fallback-box">
                          <Laptop size={18} />
                        </div>
                      )}"""

repl_asset = """                      {asset.photo_url ? (
                        <div
                          className="pass-asset-thumb-box"
                          onClick={() => setLightboxImage(resolvePhotoUrl(asset.photo_url))}
                          title="Click to zoom hardware photo"
                        >
                          <img
                            src={resolvePhotoUrl(asset.photo_url)}
                            alt={asset.asset_type || "Asset"}
                            className="pass-asset-thumb"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fb = e.currentTarget.parentElement?.parentElement?.querySelector(".pass-asset-fallback-box");
                              if (fb) fb.style.display = "flex";
                            }}
                          />
                        </div>
                      ) : null}
                      <div
                        className="pass-asset-fallback-box"
                        style={{ display: asset.photo_url ? "none" : "flex" }}
                      >
                        <Laptop size={18} />
                      </div>"""

text_norm = text.replace("\r\n", "\n")
target_top_norm = target_top.replace("\r\n", "\n")
repl_top_norm = repl_top.replace("\r\n", "\n")
target_photo_norm = target_photo.replace("\r\n", "\n")
repl_photo_norm = repl_photo.replace("\r\n", "\n")
target_asset_norm = target_asset.replace("\r\n", "\n")
repl_asset_norm = repl_asset.replace("\r\n", "\n")

if target_top_norm in text_norm:
    text_norm = text_norm.replace(target_top_norm, repl_top_norm, 1)
    print("SUCCESS replaced top resolvePhotoUrl in PublicVisitorPass.jsx")
else:
    print("target_top not found")

if target_photo_norm in text_norm:
    text_norm = text_norm.replace(target_photo_norm, repl_photo_norm, 1)
    print("SUCCESS replaced photo section in PublicVisitorPass.jsx")
else:
    print("target_photo not found")

if target_asset_norm in text_norm:
    text_norm = text_norm.replace(target_asset_norm, repl_asset_norm, 1)
    print("SUCCESS replaced asset section in PublicVisitorPass.jsx")
else:
    print("target_asset not found")

with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(text_norm)
print("Finished updating PublicVisitorPass.jsx")
