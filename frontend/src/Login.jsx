import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import "./Login.css";

const API_BASE_URL = "";

export default function Login({ onLogin }) {
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

      let data = {};
      try {
        data = await response.json();
      } catch {
        // Response may not be JSON
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : response.status === 500
            ? "Database or server connection error. Please try again."
            : "Login failed. Check your credentials."
        );
      }

      if (!data.access_token) {
        throw new Error("The server did not return an access token.");
      }

      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Unable to verify your account. Please try again.");
      }

      const user = await userResponse.json();

      onLogin(data.access_token, user);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Check that the backend is running."
          : err.message || "Invalid credentials. Please try again."
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
          {/* Brand Header */}
          <div className="login-brand">
            <div className="login-logo-ring">
              <img src="/vms-logo.png" alt="VMS Logo" className="login-logo-img" />
            </div>
            <h1 className="login-title">Visitor Management System</h1>
            <p className="login-subtitle">Enterprise Physical &amp; Digital Access Control</p>
          </div>

          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>Sign in to access your security dashboard and gate operations.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-group">
              <label htmlFor="login-email">Email address</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <div className="login-label-row">
                <label htmlFor="login-password">Password</label>
              </div>
              <div className="login-input-wrap">
                <LockKeyhole size={16} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your security password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
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
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <ShieldCheck size={13} />
            <span>Protected by Enterprise RBAC · Audit Logging Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
