import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  RefreshCw,
  Scan,
  Package,
  FileText,
  Menu,
  X,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";
import "./GuardLogin.css";
import { authStorage } from "./utils/authStorage";

const API_BASE_URL = "";

export default function GuardLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync theme (defaults to executive light as shown in master design reference)
  const [theme, setTheme] = useState(() => localStorage.getItem("vms-theme") || "light");

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

      const userRole = String(user?.role || "").toUpperCase();
      if (userRole !== "GUARD" && userRole !== "SECURITY" && userRole !== "ADMIN") {
        throw new Error("Access restricted to Security Personnel (GUARD / SECURITY) or ADMIN.");
      }

      authStorage.setGuardToken(data.access_token);
      authStorage.setGuardUser(user);
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
    <div className="guard-terminal-access-page">
      {/* =========================================================================
          TOP NAVIGATION HEADER (Desktop & Mobile)
          ========================================================================= */}
      <header className="gt-header">
        <div className="gt-header-inner">
          {/* Left Brand Identity */}
          <div className="gt-brand-wrap">
            <img src="/vms-logo.png" alt="VMS Logo" className="gt-brand-logo" />
            <span className="gt-brand-title">VMS</span>
            <span className="gt-brand-divider">|</span>
            <span className="gt-brand-subtitle">Visitor Management System</span>
          </div>

          {/* Right Header Status Pill & Controls */}
          <div className="gt-header-actions">
            <div className="gt-terminal-pill">
              <ShieldCheck size={14} className="gt-pill-icon" />
              <span>Gate Terminal</span>
            </div>

            {/* Subtle Theme Toggle */}
            <button
              type="button"
              className="gt-theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="gt-mobile-menu-trigger"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Clean Red Accent Underline */}
        <div className="gt-header-accent-line">
          <div className="gt-header-accent-fill" />
        </div>
      </header>

      {/* Mobile Drawer (When Hamburger is Clicked) */}
      {mobileMenuOpen && (
        <div className="gt-mobile-drawer">
          <div className="gt-mobile-drawer-inner">
            <div className="gt-mobile-drawer-title">Gate Terminal Services</div>
            <a href="/register" className="gt-mobile-drawer-link">
              <ExternalLink size={14} />
              <span>Visitor Self-Registration Kiosk</span>
            </a>
            <a href="/it-visit" className="gt-mobile-drawer-link">
              <ExternalLink size={14} />
              <span>IT Contractor Clearance Portal</span>
            </a>
            <a href="/login" className="gt-mobile-drawer-link">
              <ExternalLink size={14} />
              <span>Administrative Headquarters Login</span>
            </a>
            <div className="gt-mobile-drawer-footer">
              <ShieldCheck size={13} />
              <span>Gate Clearance Terminal · Authenticated Officer Access</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN STAGE / CONTENT
          ========================================================================= */}
      <main className="gt-main-stage">
        {/* Subtle Corporate Building Background Overlay */}
        <div className="gt-stage-background" />

        <div className="gt-stage-container">
          {/* 1. LEFT HERO: Security Guard (Desktop) */}
          <div className="gt-guard-col">
            <div className="gt-guard-image-wrap">
              <img
                src="/guard_hero_desktop_clean.png"
                alt="VMS Security Officer"
                className="gt-guard-image"
              />
            </div>
          </div>

          {/* 1.5 MOBILE HERO: Guard & Gate Banner (Mobile Only) */}
          <div className="gt-mobile-hero-banner">
            <div className="gt-mobile-hero-badge">
              <div className="gt-terminal-pill">
                <ShieldCheck size={13} className="gt-pill-icon" />
                <span>Gate Terminal</span>
              </div>
            </div>
            <img
              src="/guard_hero_mobile_clean.png"
              alt="Gate Terminal Guard"
              className="gt-mobile-hero-image"
            />
            {/* Red Curved Swoop under Hero */}
            <div className="gt-mobile-hero-wave">
              <svg viewBox="0 0 500 45" preserveAspectRatio="none" className="gt-wave-svg">
                <path d="M0,0 C150,40 350,45 500,10 L500,45 L0,45 Z" fill="#e43b24" />
              </svg>
            </div>
          </div>

          {/* 2. CENTER: Premium White Login Card */}
          <div className="gt-card-col">
            <div className="gt-login-card">
              {/* Card Header & Brand Ring */}
              <div className="gt-card-brand">
                <div className="gt-card-logo-ring">
                  <img src="/vms-logo.png" alt="VMS Logo" className="gt-card-logo" />
                </div>
                <h1 className="gt-card-title">Gate Terminal Access</h1>
                <p className="gt-card-subtitle">Security Guard Kiosk · Optical Pass Clearance</p>
                <div className="gt-card-red-rule" />
              </div>

              {/* Operator Login Instructions */}
              <div className="gt-card-intro">
                <h2 className="gt-intro-heading">Operator Login</h2>
                <p className="gt-intro-desc">
                  Enter your security guard credentials to operate the gate terminal and verify visitor passes.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="gt-login-form">
                {/* Guard Email / ID */}
                <div className="gt-form-group">
                  <label htmlFor="gt-email" className="gt-form-label">
                    Guard Email / ID
                  </label>
                  <div className="gt-input-wrap">
                    <Mail size={16} className="gt-input-icon" />
                    <input
                      id="gt-email"
                      type="email"
                      className="gt-form-input"
                      placeholder="guard@vms.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Security Password */}
                <div className="gt-form-group">
                  <label htmlFor="gt-password" className="gt-form-label">
                    Security Password
                  </label>
                  <div className="gt-input-wrap">
                    <LockKeyhole size={16} className="gt-input-icon" />
                    <input
                      id="gt-password"
                      type={showPassword ? "text" : "password"}
                      className="gt-form-input"
                      placeholder="Enter access passphrase"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="gt-password-toggle"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="gt-form-error" role="alert">
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className="gt-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="gt-spinner" />
                      <span>Authorizing gate terminal...</span>
                    </>
                  ) : (
                    <>
                      <Scan size={16} className="gt-btn-scan-icon" />
                      <span className="gt-btn-text">Access Guard Station</span>
                      <ArrowRight size={16} className="gt-btn-arrow" />
                    </>
                  )}
                </button>
              </form>

              {/* Card Security Note */}
              <div className="gt-card-security-note">
                <ShieldCheck size={13} className="gt-note-shield" />
                <span>Gate Clearance Terminal · Authenticated Officer Access</span>
              </div>
            </div>
          </div>

          {/* 3. RIGHT HERO: 4 Floating Feature Badges (Desktop) */}
          <div className="gt-features-col">
            <div className="gt-features-list">
              {/* Feature 1 */}
              <div className="gt-feature-badge">
                <div className="gt-badge-icon-box">
                  <Scan size={18} />
                </div>
                <div className="gt-badge-text">
                  <strong className="gt-badge-title">Scan Visitor Pass</strong>
                  <span className="gt-badge-subtitle">QR / Barcode Verification</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="gt-feature-badge">
                <div className="gt-badge-icon-box">
                  <ShieldCheck size={18} />
                </div>
                <div className="gt-badge-text">
                  <strong className="gt-badge-title">Verify Visit</strong>
                  <span className="gt-badge-subtitle">Approval &amp; Validity</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="gt-feature-badge">
                <div className="gt-badge-icon-box">
                  <Package size={18} />
                </div>
                <div className="gt-badge-text">
                  <strong className="gt-badge-title">Manage Assets</strong>
                  <span className="gt-badge-subtitle">Entry &amp; Exit Clearance</span>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="gt-feature-badge">
                <div className="gt-badge-icon-box">
                  <FileText size={18} />
                </div>
                <div className="gt-badge-text">
                  <strong className="gt-badge-title">Record Activity</strong>
                  <span className="gt-badge-subtitle">Real-time Logs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. MOBILE SHORTCUTS ROW (Rendered beneath the card on phone screens) */}
        <div className="gt-mobile-shortcuts-wrap">
          <div className="gt-mobile-shortcuts-grid">
            {/* Shortcut 1 */}
            <div className="gt-mobile-shortcut-item">
              <div className="gt-mobile-shortcut-icon">
                <Scan size={18} />
              </div>
              <span className="gt-mobile-shortcut-label">Scan Visitor Pass</span>
            </div>

            {/* Shortcut 2 */}
            <div className="gt-mobile-shortcut-item">
              <div className="gt-mobile-shortcut-icon">
                <ShieldCheck size={18} />
              </div>
              <span className="gt-mobile-shortcut-label">Verify Visit</span>
            </div>

            {/* Shortcut 3 */}
            <div className="gt-mobile-shortcut-item">
              <div className="gt-mobile-shortcut-icon">
                <Package size={18} />
              </div>
              <span className="gt-mobile-shortcut-label">Manage Assets</span>
            </div>

            {/* Shortcut 4 */}
            <div className="gt-mobile-shortcut-item">
              <div className="gt-mobile-shortcut-icon">
                <FileText size={18} />
              </div>
              <span className="gt-mobile-shortcut-label">Record Activity</span>
            </div>
          </div>
        </div>

        {/* Desktop Red Wave Accents (Bottom Left & Right) */}
        <div className="gt-desktop-waves">
          <div className="gt-desktop-wave-left">
            <svg viewBox="0 0 320 120" preserveAspectRatio="none" className="gt-wave-svg">
              <path d="M0,120 L0,30 C60,5 140,45 220,105 C260,135 300,120 320,120 Z" fill="#e43b24" />
            </svg>
          </div>
          <div className="gt-desktop-wave-right">
            <svg viewBox="0 0 350 100" preserveAspectRatio="none" className="gt-wave-svg">
              <path d="M0,100 C80,85 180,60 260,75 C310,85 340,95 350,100 Z" fill="#e43b24" opacity="0.85" />
            </svg>
          </div>
        </div>

        {/* Mobile Red Bottom Wave Accent */}
        <div className="gt-mobile-bottom-wave">
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="gt-wave-svg">
            <path d="M0,40 C100,15 300,15 400,40 Z" fill="#e43b24" />
          </svg>
        </div>
      </main>

      {/* =========================================================================
          DESKTOP FOOTER BAR
          ========================================================================= */}
      <footer className="gt-footer-bar">
        <div className="gt-footer-inner">
          <ShieldCheck size={14} className="gt-footer-shield" />
          <span className="gt-footer-title">VMS Gate Operations</span>
          <span className="gt-footer-dot">·</span>
          <span className="gt-footer-pill">Secure</span>
          <span className="gt-footer-dot">·</span>
          <span className="gt-footer-pill">Compliant</span>
          <span className="gt-footer-dot">·</span>
          <span className="gt-footer-pill">Monitored</span>
        </div>
      </footer>
    </div>
  );
}
