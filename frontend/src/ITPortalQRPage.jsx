import { useEffect, useState } from "react";
import { Server, Printer, Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import "./PublicRegistration.css";

export default function ITPortalQRPage() {
  const [qrSrc, setQrSrc] = useState("");
  const [copied, setCopied] = useState(false);

  const itUrl = `${window.location.origin}/it-visit`;

  useEffect(() => {
    QRCode.toDataURL(itUrl, {
      width: 480,
      margin: 4,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setQrSrc(url))
      .catch((err) => console.error("QR Generation error:", err));
  }, [itUrl]);

  return (
    <main className="public-registration" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="public-header no-print">
        <div className="public-brand">
          <span className="public-brand-icon">
            <img src="/vms-logo.png" alt="VMS Logo" />
          </span>
          <div>
            <h1>Visitor Management</h1>
            <p>IT Department Gate Pass &amp; Registration</p>
          </div>
        </div>
        <span className="public-secure-label">
          <ShieldCheck size={16} /> Technical Entry Placard
        </span>
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 16px" }}>
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #e2e8f0",
            borderRadius: "20px",
            padding: "36px 32px",
            maxWidth: "460px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              background: "#eff6ff",
              color: "#2458bc",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 14px",
            }}
          >
            <Server size={26} />
          </div>

          <span
            style={{
              fontSize: "11px",
              fontWeight: "750",
              letterSpacing: "1.5px",
              color: "#2458bc",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "6px",
            }}
          >
            IT DEPARTMENT ACCESS
          </span>

          <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: "800", color: "#1d2b43" }}>
            Scan to Register IT Visit
          </h2>

          <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#68778c", lineHeight: "1.5" }}>
            Aim your mobile phone camera at the QR code below to open the official IT contractor &amp; technical check-in form.
          </p>

          {/* QR Code Container with ample pure white quiet zone */}
          <div
            style={{
              background: "#ffffff",
              padding: "18px",
              borderRadius: "16px",
              display: "inline-block",
              border: "1.5px solid #cbd5e1",
              margin: "0 auto 20px",
            }}
          >
            {qrSrc ? (
              <img
                src={qrSrc}
                alt="IT Visit QR Code"
                style={{ width: "260px", height: "260px", display: "block" }}
              />
            ) : (
              <div style={{ width: "260px", height: "260px", display: "grid", placeItems: "center", color: "#64748b" }}>
                Generating QR code...
              </div>
            )}
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "#334155",
                fontFamily: "monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "left",
              }}
            >
              {itUrl}
            </span>

            <button
              type="button"
              className="public-secondary-button"
              style={{ padding: "6px 10px", fontSize: "11px", whiteSpace: "nowrap" }}
              onClick={() => {
                navigator.clipboard.writeText(itUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="no-print" style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="public-submit"
              style={{ padding: "12px", fontSize: "13px" }}
              onClick={() => window.print()}
            >
              <Printer size={15} /> Print Stand Placard
            </button>
            <a
              href="/it-visit"
              className="public-secondary-button"
              style={{
                padding: "12px 16px",
                fontSize: "13px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Open Form <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
