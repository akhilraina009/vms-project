import { useState } from "react";
import { ShieldCheck, Eye, EyeOff, LockKeyhole, Mail, ArrowRight, RefreshCw, KeyRound } from "lucide-react";
import "./Login.css";

const API_BASE_URL = "";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
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
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card-wrapper">
        {/* Top Security Status Indicator */}
        <div className="login-telemetry-pill">
          <span className="status-dot"></span>
          <span>Enterprise Gate Terminal · 256-Bit TLS Encrypted</span>
        </div>

        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo">
              <ShieldCheck size={28} strokeWidth={2.2} />
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
                <Mail size={17} className="login-input-icon" />
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
                <LockKeyhole size={17} className="login-input-icon" />
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
            <KeyRound size={13} />
            <span>Authorized personnel only · ISO 27001 Security Protocol</span>
          </div>
        </div>
      </div>
    </div>
  );
}
