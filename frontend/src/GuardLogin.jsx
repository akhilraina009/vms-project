import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import "./Login.css";
import { authStorage } from "./utils/authStorage";

const API_BASE_URL = "";

export default function GuardLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync theme
  const [theme, setTheme] = useState(() => localStorage.getItem("vms-theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("vms-theme", theme);
    localStorage.setItem("vms_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : response.status === 500
            ? "Database or server connection error. Please try again."
            : "Login failed. Check your security credentials."
        );
      }

      if (!data.access_token) {
        throw new Error("No authorization token received.");
      }

      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Unable to verify security operator account.");
      }

      const user = await userResponse.json();

      if (user.role !== "GUARD" && user.role !== "ADMIN") {
        throw new Error("Access restricted to Security Personnel (GUARD) or ADMIN.");
      }

      authStorage.setGuardToken(data.access_token);
      onLogin(data.access_token, user);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to gate authentication server."
          : err.message || "Invalid operator credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Top Theme Toggle */}
      <div className="login-top-bar">
        <button
          type="button"
          className="login-theme-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
      </div>

      <div className="login-card-wrapper">
        <div className="login-card">
          {/* Terminal Header */}
          <div className="login-brand">
            <div className="login-logo-ring">
              <img src="/vms-logo.png" alt="VMS Logo" className="login-logo-img" />
            </div>
            <h1 className="login-title">Gate Terminal Access</h1>
            <p className="login-subtitle">Security Guard Kiosk · Optical Pass Clearance</p>
          </div>

          <div className="login-heading">
            <h2>Operator Login</h2>
            <p>Enter your security guard credentials to operate the mobile gate scanner.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-group">
              <label htmlFor="guard-email">Guard Email / ID</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  id="guard-email"
                  type="email"
                  placeholder="guard@vms.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="login-form-group">
              <label htmlFor="guard-password">Security Password</label>
              <div className="login-input-wrap">
                <LockKeyhole size={16} className="login-input-icon" />
                <input
                  id="guard-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter access passphrase"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span>{error}</span>
              </div>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="spin" />
                  <span>Authorizing gate terminal...</span>
                </>
              ) : (
                <>
                  <span>Access Guard Station</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <ShieldCheck size={13} />
            <span>Gate Clearance Terminal · Authenticated Officer Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
