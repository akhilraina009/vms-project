import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  DoorOpen,
  Headphones,
  Menu,
  X,
  ChevronRight,
  UserPlus,
  Laptop,
  Users,
  CalendarCheck,
  Package,
  BarChart3,
  ExternalLink,
  LogIn,
} from "lucide-react";
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

  // Ensure default clean light theme matching the executive enterprise design reference
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
    localStorage.setItem("vms_theme", "light");
    localStorage.setItem("vms-theme", "light");
  }, []);

  // Close mobile navigation drawer with Escape key and manage body overflow
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
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
    <div className="vms-premium-login-page">
      {/* =========================================================================
          TOP NAVIGATION HEADER (Desktop & Mobile)
          ========================================================================= */}
      <header className="vms-login-header">
        <div className="vms-login-header-inner">
          {/* Left Brand Identity */}
          <div className="vms-header-brand-wrap">
            <img src="/vms-logo.png" alt="VMS Logo" className="vms-header-brand-logo" />
            <span className="vms-header-brand-title">VMS</span>
            <span className="vms-header-brand-divider">|</span>
            <span className="vms-header-brand-sub">Visitor Management System</span>
          </div>

          {/* Right Header Navigation & Actions (Desktop) */}
          <div className="vms-header-actions-desktop">
            <div className="vms-header-status-item">
              <ShieldCheck size={15} className="vms-header-icon" />
              <span>Secure Access</span>
            </div>

            <span className="vms-header-action-divider">|</span>

            <a href="/guard" className="vms-header-link-item" title="Open Guard Gate Terminal">
              <DoorOpen size={15} className="vms-header-icon" />
              <span>Gate Terminal</span>
            </a>

            <span className="vms-header-action-divider">|</span>

            <a href="mailto:admin@vms.com" className="vms-header-link-item" title="Contact System Administrator">
              <Headphones size={15} className="vms-header-icon" />
              <span>Help</span>
            </a>
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            className="vms-mobile-menu-trigger"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Clean Red Accent Underline */}
        <div className="vms-header-accent-line">
          <div className="vms-header-accent-fill" />
        </div>
      </header>

      {/* =========================================================================
          MOBILE NAVIGATION DRAWER
          ========================================================================= */}
      {mobileMenuOpen && (
        <div
          className="vms-mobile-drawer-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMobileMenuOpen(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          <nav className="vms-mobile-drawer-panel" aria-label="Mobile Navigation">
            <div className="vms-mobile-drawer-topbar">
              <div className="vms-header-brand-wrap">
                <img src="/vms-logo.png" alt="VMS Logo" className="vms-header-brand-logo" />
                <span className="vms-header-brand-title">VMS</span>
                <span className="vms-header-brand-divider">|</span>
                <span className="vms-header-brand-sub">Visitor Management</span>
              </div>
              <button
                type="button"
                className="vms-mobile-drawer-close"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="vms-mobile-drawer-body">
              <div className="vms-drawer-section-label">Quick Portals &amp; Access</div>

              <div className="vms-drawer-nav-list">
                <a
                  href="/register-visitor"
                  className="vms-drawer-item"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav("/register-visitor");
                  }}
                >
                  <div className="vms-drawer-item-icon badge-guest">
                    <UserPlus size={18} />
                  </div>
                  <div className="vms-drawer-item-info">
                    <strong className="vms-drawer-item-title">Visitor Self-Registration</strong>
                    <span className="vms-drawer-item-sub">Walk-in guest entry &amp; QR pass kiosk</span>
                  </div>
                  <ChevronRight size={16} className="vms-drawer-chevron" />
                </a>

                <a
                  href="/it-visit"
                  className="vms-drawer-item"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav("/it-visit");
                  }}
                >
                  <div className="vms-drawer-item-icon badge-it">
                    <Laptop size={18} />
                  </div>
                  <div className="vms-drawer-item-info">
                    <strong className="vms-drawer-item-title">IT Contractor Clearance</strong>
                    <span className="vms-drawer-item-sub">Hardware &amp; equipment pass declaration</span>
                  </div>
                  <ChevronRight size={16} className="vms-drawer-chevron" />
                </a>

                <a
                  href="/guard"
                  className="vms-drawer-item"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav("/guard");
                  }}
                >
                  <div className="vms-drawer-item-icon badge-guard">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="vms-drawer-item-info">
                    <strong className="vms-drawer-item-title">Security Gate Terminal</strong>
                    <span className="vms-drawer-item-sub">Check-in scanner &amp; optical clearance</span>
                  </div>
                  <ChevronRight size={16} className="vms-drawer-chevron" />
                </a>

                <a
                  href="mailto:admin@vms.com"
                  className="vms-drawer-item"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav("mailto:admin@vms.com", true);
                  }}
                >
                  <div className="vms-drawer-item-icon badge-help">
                    <Headphones size={18} />
                  </div>
                  <div className="vms-drawer-item-info">
                    <strong className="vms-drawer-item-title">System Support</strong>
                    <span className="vms-drawer-item-sub">Contact system administrator</span>
                  </div>
                  <ChevronRight size={16} className="vms-drawer-chevron" />
                </a>
              </div>

              <div className="vms-drawer-footer">
                <div className="vms-drawer-status-line">
                  <span className="vms-status-dot" />
                  <span>Gate 01 Access Desk · RBAC Protected</span>
                </div>
                <p className="vms-drawer-contact">
                  Need account assistance? Contact <a href="mailto:admin@vms.com">admin@vms.com</a>
                </p>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* =========================================================================
          MAIN STAGE: Split Layout with Corporate Entrance & Login Card
          ========================================================================= */}
      <main className="vms-login-main-stage">
        {/* Clean Corporate Entrance Background Overlay */}
        <div className="vms-stage-backdrop-wrap">
          <div className="vms-stage-backdrop-img" />
          <div className="vms-stage-backdrop-gradient" />
        </div>

        {/* Mobile Reception Hero Banner */}
        <div className="vms-mobile-hero-banner">
          <img
            src="/vms_corporate_reception_mob.png"
            alt="Corporate Reception"
            className="vms-mobile-hero-img"
          />
          <div className="vms-mobile-hero-overlay" />
          <div className="vms-mobile-hero-caption">
            <h2 className="vms-mobile-caption-heading">
              <span className="vms-mob-head-white">Smart &amp; Secure</span>
              <span className="vms-mob-head-red">Visitor Management</span>
            </h2>
            <div className="vms-mobile-hero-red-line" />
            <p className="vms-mobile-caption-sub">
              Manage visitor registration, pre-approvals, check-in, asset tracking, and reports — all in one place.
            </p>
          </div>
        </div>

        <div className="vms-login-content-grid">
          {/* =====================================================================
              LEFT COLUMN: Hero Typography & 4 Capability Cards
              ===================================================================== */}
          <section className="vms-login-hero-col">
            <div className="vms-hero-text-wrap">
              <h1 className="vms-hero-headline">
                <span className="vms-hero-headline-white">Smart, Secure &amp; Contactless</span>
                <span className="vms-hero-headline-red">Visitor Management</span>
              </h1>

              <div className="vms-hero-red-line" />

              <p className="vms-hero-description">
                Digitize visitor entry, approvals, asset tracking and gate operations for a safer workplace.
              </p>
            </div>

            {/* 4 Capability Cards (Horizontal row on desktop, 2x2 grid on mobile) */}
            <div className="vms-capability-cards-grid">
              {/* Card 1 */}
              <div className="vms-capability-card">
                <div className="vms-cap-icon-box">
                  <Users size={22} className="vms-cap-icon" />
                </div>
                <div className="vms-cap-text-wrap">
                  <strong className="vms-cap-title">Visitor Registration</strong>
                  <span className="vms-cap-sub">Quick &amp; contactless check-in</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="vms-capability-card">
                <div className="vms-cap-icon-box">
                  <CalendarCheck size={22} className="vms-cap-icon" />
                </div>
                <div className="vms-cap-text-wrap">
                  <strong className="vms-cap-title">Pre-Approvals &amp; Scheduling</strong>
                  <span className="vms-cap-sub">Plan visits &amp; approve access</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="vms-capability-card">
                <div className="vms-cap-icon-box">
                  <Package size={22} className="vms-cap-icon" />
                </div>
                <div className="vms-cap-text-wrap">
                  <strong className="vms-cap-title">Asset Management</strong>
                  <span className="vms-cap-sub">Track items in &amp; out</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="vms-capability-card">
                <div className="vms-cap-icon-box">
                  <BarChart3 size={22} className="vms-cap-icon" />
                </div>
                <div className="vms-cap-text-wrap">
                  <strong className="vms-cap-title">Reports &amp; Audit Logs</strong>
                  <span className="vms-cap-sub">Review activity &amp; history</span>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================================
              RIGHT COLUMN: Floating White Login Card
              ===================================================================== */}
          <section className="vms-login-card-col">
            <div className="vms-login-card">
              {/* Card Brand Header */}
              <div className="vms-card-brand-header">
                <div className="vms-card-brand-row">
                  <img src="/vms-logo.png" alt="VMS Logo" className="vms-card-brand-logo" />
                  <span className="vms-card-brand-text">VMS</span>
                </div>
                <h2 className="vms-card-system-title">Visitor Management System</h2>
                <p className="vms-card-system-subtitle">Enterprise Physical &amp; Digital Access Control</p>
                <div className="vms-card-red-rule" />
              </div>

              {/* Welcome Back & Subtitle */}
              <div className="vms-card-welcome-header">
                <h3 className="vms-card-welcome-title">Welcome back</h3>
                <p className="vms-card-welcome-sub">
                  Sign in to access your VMS dashboard.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="vms-login-form" noValidate={false}>
                {/* Field 1: Email address / User ID */}
                <div className="vms-form-group">
                  <label htmlFor="vms-login-email" className="vms-form-label">
                    <Mail size={14} className="vms-label-icon" />
                    <span>Email address / User ID</span>
                  </label>
                  <div className="vms-search-input-wrap">
                    <input
                      id="vms-login-email"
                      type="email"
                      name="email"
                      placeholder="enter@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="username"
                      className="vms-search-box-input"
                      aria-label="Email address or User ID"
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div className="vms-form-group">
                  <label htmlFor="vms-login-password" className="vms-form-label">
                    <Lock size={14} className="vms-label-icon" />
                    <span>Password</span>
                  </label>
                  <div className="vms-search-input-wrap vms-password-input-wrap">
                    <input
                      id="vms-login-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="vms-search-box-input vms-password-input"
                      aria-label="Security Password"
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

                {/* Primary Red Button: Sign In to VMS → */}
                <button
                  type="submit"
                  className="vms-sign-in-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="vms-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to VMS</span>
                      <ArrowRight size={17} className="vms-btn-arrow" />
                    </>
                  )}
                </button>
              </form>

              {/* RBAC Security Footer Note */}
              <div className="vms-card-rbac-footer">
                <ShieldCheck size={15} className="vms-rbac-icon" />
                <span>Protected by Role-Based Access Control (RBAC)</span>
              </div>
            </div>

            {/* Mobile-Only Key Capabilities Section (Outside Card, below in page flow) */}
            <div className="vms-mobile-capabilities-wrap">
              <div className="vms-capabilities-divider">
                <span className="vms-divider-line" />
                <span className="vms-divider-text">Key Capabilities</span>
                <span className="vms-divider-line" />
              </div>

              <div className="vms-mobile-cap-grid">
                <div className="vms-mob-cap-card">
                  <div className="vms-mob-cap-icon-box">
                    <Users size={22} className="vms-mob-cap-icon" />
                  </div>
                  <div className="vms-mob-cap-text">
                    <strong className="vms-mob-cap-title">Visitor Registration</strong>
                    <span className="vms-mob-cap-desc">Quick visitor check-in</span>
                  </div>
                </div>

                <div className="vms-mob-cap-card">
                  <div className="vms-mob-cap-icon-box">
                    <CalendarCheck size={22} className="vms-mob-cap-icon" />
                  </div>
                  <div className="vms-mob-cap-text">
                    <strong className="vms-mob-cap-title">Pre-Approvals &amp; Scheduling</strong>
                    <span className="vms-mob-cap-desc">Plan and approve visits</span>
                  </div>
                </div>

                <div className="vms-mob-cap-card">
                  <div className="vms-mob-cap-icon-box">
                    <Package size={22} className="vms-mob-cap-icon" />
                  </div>
                  <div className="vms-mob-cap-text">
                    <strong className="vms-mob-cap-title">Asset Management</strong>
                    <span className="vms-mob-cap-desc">Track items entering and leaving</span>
                  </div>
                </div>

                <div className="vms-mob-cap-card">
                  <div className="vms-mob-cap-icon-box">
                    <BarChart3 size={22} className="vms-mob-cap-icon" />
                  </div>
                  <div className="vms-mob-cap-text">
                    <strong className="vms-mob-cap-title">Reports &amp; Audit Logs</strong>
                    <span className="vms-mob-cap-desc">Review activity and security history</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Right Curved Red Accent Wave */}
        <div className="vms-stage-bottom-swoosh">
          <svg viewBox="0 0 500 120" preserveAspectRatio="none" className="vms-swoosh-svg">
            <path
              d="M0,120 C140,115 280,75 500,20 L500,120 Z"
              fill="#0b1329"
            />
            <path
              d="M0,120 C180,105 320,60 500,0 L500,120 Z"
              fill="#e43b24"
            />
          </svg>
        </div>
      </main>
    </div>
  );
}
