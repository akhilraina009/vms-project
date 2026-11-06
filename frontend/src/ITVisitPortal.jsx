import { useEffect, useState } from "react";
import { ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import ITVisitForm from "./ITVisitForm";
import "./PublicRegistration.css";

const API_BASE_URL = "";

export default function ITVisitPortal() {
  useEffect(() => {
    const prevTheme = document.documentElement.getAttribute("data-theme");
    const hadDarkClass = document.documentElement.classList.contains("dark");
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
    return () => {
      if (prevTheme) document.documentElement.setAttribute("data-theme", prevTheme);
      if (hadDarkClass) document.documentElement.classList.add("dark");
    };
  }, []);

  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHosts() {
      try {
        const response = await fetch(`${API_BASE_URL}/public-registration/hosts`);
        if (!response.ok) {
          throw new Error("Unable to retrieve host employees.");
        }
        const data = await response.json();
        if (!cancelled) {
          setHosts(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to connect to host registry. Please refresh or try again shortly.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHosts();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="public-registration">
        <header className="public-header">
          <div className="public-header-inner">
            <div className="public-brand">
              <div className="public-brand-icon">
                <img src="/vms-logo.png" alt="VMS Logo" />
              </div>
              <div className="public-brand-text">
                <h1>Visitor Management System</h1>
                <p>IT Visitor Registration Portal</p>
              </div>
            </div>
            <span className="public-secure-label">
              <ShieldCheck size={15} /> IT Visitor Portal
            </span>
          </div>
        </header>

        <div className="public-container" style={{ textAlign: "center", padding: "80px 20px" }}>
          <RefreshCw
            size={36}
            style={{
              color: "#2563eb",
              margin: "0 auto 16px",
              display: "block",
              animation: "spin 1s linear infinite",
            }}
          />
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>
            Loading registration portal...
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Connecting to host registry and secure gate service
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="public-registration">
        <header className="public-header">
          <div className="public-header-inner">
            <div className="public-brand">
              <div className="public-brand-icon">
                <img src="/vms-logo.png" alt="VMS Logo" />
              </div>
              <div className="public-brand-text">
                <h1>Visitor Management System</h1>
                <p>IT Visitor Registration Portal</p>
              </div>
            </div>
          </div>
        </header>

        <div className="public-container" style={{ padding: "40px 20px" }}>
          <div className="public-alert-box" role="alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="public-submit-btn"
            style={{ width: "auto", margin: "16px 0" }}
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </button>
        </div>
      </main>
    );
  }

  return <ITVisitForm hosts={hosts} />;
}
