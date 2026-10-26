import { useState } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  RefreshCw,
  KeyRound,
  Smartphone,
  Radio,
} from "lucide-react";
import "./Login.css";

const API_BASE_URL = "";

export default function GuardLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fillDemoGuard = () => {
    setEmail("guard@vms.com");
    setPassword("Guard@123");
    setError("");
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
            : "Login failed. Check your security credentials."
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
        throw new Error("Unable to verify security account. Please try again.");
      }

      const user = await userResponse.json();

      onLogin(data.access_token, user);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to server. Check Wi-Fi connection and backend status."
          : err.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0f1d 0%, #0f172a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "'Plus Jakarta Sans', Inter, -apple-system, sans-serif",
        color: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(37, 99, 235, 0.15)",
          padding: "32px 26px",
          color: "#0f172a",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Terminal Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 0 20px rgba(37, 99, 235, 0.45)",
            }}
          >
            <ShieldCheck size={30} strokeWidth={2.4} />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#eff6ff",
              color: "#1d4ed8",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            <Radio size={12} /> GATE 01 · ACCESS DESK
          </div>

          <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
            Gate Terminal Login
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>
            Enter your security guard credentials to operate the mobile gate scanner &amp; check-in desk.
          </p>
        </div>

        {/* Quick Demo Fill Pill for Touch/Phone */}
        <div
          onClick={fillDemoGuard}
          style={{
            background: "#f8fafc",
            border: "1.5px dashed #93c5fd",
            borderRadius: "12px",
            padding: "10px 14px",
            marginBottom: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#1d4ed8",
            transition: "all 0.2s ease",
          }}
          title="Tap to auto-fill guard credentials"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Smartphone size={16} color="#2563eb" />
            <span>
              Tap to auto-fill <strong>guard@vms.com</strong>
            </span>
          </div>
          <span style={{ fontWeight: 700, fontSize: "11px", textDecoration: "underline" }}>
            1-Tap Fill
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="guard-email"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                color: "#334155",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              Guard Email / ID
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={17}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                id="guard-email"
                type="email"
                placeholder="guard@vms.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                style={{
                  width: "100%",
                  padding: "13px 12px 13px 40px",
                  borderRadius: "12px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#0f172a",
                  background: "#ffffff",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="guard-password"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                color: "#334155",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              Security Password
            </label>
            <div style={{ position: "relative" }}>
              <LockKeyhole
                size={17}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                id="guard-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "13px 42px 13px 40px",
                  borderRadius: "12px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#0f172a",
                  background: "#ffffff",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginBottom: "18px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "12.5px",
                lineHeight: "1.4",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "12px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontSize: "15px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={17} className="spin" />
                <span>Verifying Guard Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Gate Terminal</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "11.5px",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <KeyRound size={13} color="#94a3b8" />
          <span>Gate Desk Terminal · TLS Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}
