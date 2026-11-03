import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Landmark,
  Users,
  Headphones,
  Menu,
  X,
  ChevronRight,
  UserPlus,
  Laptop,
  ExternalLink,
} from "lucide-react";
import doctorImg from "./assets/coveryou/doctor_isolated.png";
import coverYouLogo from "./assets/coveryou/logo.svg";
import "./Login.css";

const API_BASE_URL = "";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (targetPath, isExternal = false) => {
    setMobileMenuOpen(false);
    if (isExternal) {
      window.open(targetPath, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = targetPath;
    }
  };

  // Set theme to light mode to match the executive CoverYou design
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
    localStorage.setItem("vms_theme", "light");
    localStorage.setItem("vms-theme", "light");
  }, []);

  // Close mobile navigation drawer with Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

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
    <div className="vms-premium-login-container login-page">
      {/* Mobile Top Header (Visible on Mobile only <= 900px) */}
      <header className="vms-login-mob-header">
        <div className="vms-login-mob-header-brand">
          <img src="/vms-logo.png" alt="VMS Logo" className="vms-login-mob-logo" />
          <span className="vms-login-mob-title">VMS</span>
          <span className="vms-login-mob-divider">|</span>
          <span className="vms-login-mob-sub">Visitor Management</span>
        </div>
        <button
          type="button"
          className="vms-login-mob-menu-btn"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <>
          <div
            className="vms-login-mob-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav className="vms-login-mob-drawer" aria-label="Mobile Navigation">
            <div className="vms-mob-drawer-header">
              <span className="vms-mob-drawer-title">Quick Portals &amp; Access</span>
              <span className="vms-mob-drawer-badge">VMS System</span>
            </div>

            <div className="vms-mob-drawer-links">
              <a
                href="/register-visitor"
                className="vms-mob-nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav("/register-visitor");
                }}
              >
                <div className="vms-mob-nav-icon-badge badge-guest">
                  <UserPlus size={18} />
                </div>
                <div className="vms-mob-nav-info">
                  <strong className="vms-mob-nav-title">Visitor Self-Registration</strong>
                  <span className="vms-mob-nav-sub">Walk-in guest entry &amp; QR pass kiosk</span>
                </div>
                <ChevronRight size={16} className="vms-mob-nav-chevron" />
              </a>

              <a
                href="/it-visit"
                className="vms-mob-nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav("/it-visit");
                }}
              >
                <div className="vms-mob-nav-icon-badge badge-it">
                  <Laptop size={18} />
                </div>
                <div className="vms-mob-nav-info">
                  <strong className="vms-mob-nav-title">IT Contractor Clearance</strong>
                  <span className="vms-mob-nav-sub">Hardware &amp; equipment pass declaration</span>
                </div>
                <ChevronRight size={16} className="vms-mob-nav-chevron" />
              </a>

              <a
                href="/guard"
                className="vms-mob-nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav("/guard");
                }}
              >
                <div className="vms-mob-nav-icon-badge badge-guard">
                  <ShieldCheck size={18} />
                </div>
                <div className="vms-mob-nav-info">
                  <strong className="vms-mob-nav-title">Security Gate Terminal</strong>
                  <span className="vms-mob-nav-sub">Check-in scanner &amp; perimeter gate desk</span>
                </div>
                <ChevronRight size={16} className="vms-mob-nav-chevron" />
              </a>

              <a
                href="https://coveryou.in"
                target="_blank"
                rel="noopener noreferrer"
                className="vms-mob-nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav("https://coveryou.in", true);
                }}
              >
                <div className="vms-mob-nav-icon-badge badge-coveryou">
                  <ExternalLink size={18} />
                </div>
                <div className="vms-mob-nav-info">
                  <strong className="vms-mob-nav-title">CoverYou Protection</strong>
                  <span className="vms-mob-nav-sub">Doctor &amp; healthcare indemnity cover</span>
                </div>
                <ChevronRight size={16} className="vms-mob-nav-chevron" />
              </a>
            </div>

            <div className="vms-mob-drawer-footer">
              <div className="vms-mob-drawer-status">
                <span className="vms-mob-status-dot" />
                <span>Gate 01 Access Desk · RBAC Protected</span>
              </div>
              <p className="vms-mob-drawer-help">
                Need administrative account recovery? Contact <a href="mailto:admin@vms.com">admin@vms.com</a>
              </p>
            </div>
          </nav>
        </>
      )}

      <div className="vms-login-split-layout">
        {/* Left Column: CoverYou Visual Hero Section */}
        <section className="vms-login-hero-section">
          {/* CoverYou Brand Logo */}
          <div className="vms-login-coveryou-brand">
            <img
              src={coverYouLogo}
              alt="CoverYou - Click Karo. Cover Karo."
              className="vms-coveryou-logo"
            />
          </div>

          {/* Hero Typography & Value Props */}
          <div className="vms-login-hero-content">
            <div className="vms-login-hero-copy">
              <h1 className="vms-login-hero-headline">
                Let's Find the Right{" "}
                <span className="vms-hero-highlight">Protection</span> for You
              </h1>
              <p className="vms-login-hero-description">
                Get expert guidance and personalized insurance solutions that safeguard
                your practice, people, and future.
              </p>
            </div>

            {/* Doctor Image & 3 Benefits Container */}
            <div className="vms-login-visual-showcase">
              <div className="vms-login-doctor-wrap">
                <img
                  src={doctorImg}
                  alt="Professional Healthcare Advisor"
                  className="vms-login-doctor-img"
                />
              </div>

              {/* Three Feature Cards */}
              <div className="vms-login-benefits-list">
                <div className="vms-benefit-card">
                  <div className="vms-benefit-icon-badge">
                    <Landmark size={18} className="vms-benefit-icon" />
                  </div>
                  <div className="vms-benefit-text">
                    <strong className="vms-benefit-title">IRDAI Assistance</strong>
                    <span className="vms-benefit-sub">100% Compliant</span>
                  </div>
                </div>

                <div className="vms-benefit-card">
                  <div className="vms-benefit-icon-badge">
                    <Users size={18} className="vms-benefit-icon" />
                  </div>
                  <div className="vms-benefit-text">
                    <strong className="vms-benefit-title">25+ Insurers</strong>
                    <span className="vms-benefit-sub">Top Partners</span>
                  </div>
                </div>

                <div className="vms-benefit-card">
                  <div className="vms-benefit-icon-badge">
                    <Headphones size={18} className="vms-benefit-icon" />
                  </div>
                  <div className="vms-benefit-text">
                    <strong className="vms-benefit-title">Claims Support</strong>
                    <span className="vms-benefit-sub">End-to-End Help</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: VMS Login Card */}
        <section className="vms-login-card-section">
          <div className="vms-login-card">
            {/* Card Brand Header */}
            <div className="vms-card-brand">
              <div className="vms-card-logo-row">
                <img src="/vms-logo.png" alt="VMS Logo" className="vms-card-logo-img" />
                <span className="vms-card-logo-divider">|</span>
                <span className="vms-card-logo-text">VMS</span>
              </div>
              <h2 className="vms-card-app-title">Visitor Management System</h2>
              <p className="vms-card-app-subtitle">Enterprise Physical &amp; Digital Access Control</p>
            </div>

            {/* Welcome Back & Subtext */}
            <div className="vms-card-welcome">
              <h3 className="vms-card-welcome-title">Welcome back</h3>
              <p className="vms-card-welcome-desc">
                Sign in to access your security dashboard and gate operations.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="vms-login-form" noValidate={false}>
              {/* Email Field */}
              <div className="vms-form-group">
                <label htmlFor="login-email" className="vms-form-label">
                  Email address
                </label>
                <div className="vms-input-container">
                  <Mail size={16} className="vms-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                    className="vms-login-input"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="vms-form-group">
                <div className="vms-label-row">
                  <label htmlFor="login-password" className="vms-form-label">
                    Password
                  </label>
                </div>
                <div className="vms-input-container">
                  <Lock size={16} className="vms-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="vms-login-input"
                  />
                  <button
                    type="button"
                    className="vms-password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="vms-login-error-alert" role="alert">
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="vms-login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="vms-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={16} className="vms-btn-arrow" />
                  </>
                )}
              </button>
            </form>

            {/* Security Note Footer */}
            <div className="vms-card-security-footer">
              <ShieldCheck size={14} className="vms-security-icon" />
              <span>Protected by Enterprise RBAC · Audit Logging Active</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
