import { useEffect, useState } from "react";
import { ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import ITVisitForm from "./ITVisitForm";
import "./PublicRegistration.css";

const API_BASE_URL = "";

export default function ITVisitPortal() {
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
          <div className="public-brand">
            <span className="public-brand-icon">
              <ShieldCheck size={26} />
            </span>
            <div>
              <h1>Visitor Management</h1>
              <p>IT Visitor Registration Portal</p>
            </div>
          </div>
          <span className="public-secure-label">
            <ShieldCheck size={16} /> IT Visitor Portal
          </span>
        </header>

        <section className="public-intro" style={{ textAlign: "center", padding: "60px 0" }}>
          <RefreshCw size={32} className="spin" style={{ color: "#2458bc", margin: "0 auto 14px", display: "block" }} />
          <h2>Loading registration portal</h2>
          <p>Connecting to host registry...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="public-registration">
        <header className="public-header">
          <div className="public-brand">
            <span className="public-brand-icon">
              <ShieldCheck size={26} />
            </span>
            <div>
              <h1>Visitor Management</h1>
              <p>IT Visitor Registration Portal</p>
            </div>
          </div>
        </header>

        <div className="public-intro">
          <div className="public-message" role="alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="public-submit"
            style={{ width: "auto", margin: "16px 0" }}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return <ITVisitForm hosts={hosts} />;
}
