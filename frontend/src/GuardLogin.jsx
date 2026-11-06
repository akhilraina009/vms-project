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
  User,
  ClipboardCheck,
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
            <div className="gt-terminal-pill gt-desktop-only">
              <ShieldCheck size={14} className="gt-pill-icon" />
              <span>Gate Terminal</span>
            </div>

            {/* Mobile Header Badge (Gate Terminal) */}
            <div className="gt-mobile-header-badge gt-mobile-only">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="gt-mob-turnstile-icon">
                <rect x="3" y="5" width="6" height="14" rx="2" />
                <rect x="15" y="5" width="6" height="14" rx="2" />
                <line x1="9" y1="12" x2="15" y2="12" />
              </svg>
              <span>Gate Terminal</span>
            </div>

            {/* Subtle Theme Toggle */}
            <button
              type="button"
              className="gt-theme-toggle-btn gt-desktop-only"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="gt-mobile-menu-trigger gt-desktop-only"
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
                src="/vms_gate_guard_desktop.png"
                alt="VMS Security Officer"
                className="gt-guard-image"
              />
            </div>
          </div>

          {/* 1.5 MOBILE HERO: Gate Access Terminal Banner (Mobile Only) */}
          <div className="gt-mobile-hero-banner">
            <img
              src="/vms_gate_hero_mobile.jpg"
              alt="Gate Terminal Entrance"
              className="gt-mobile-hero-image"
            />
            <div className="gt-mobile-hero-overlay">
              <div className="gt-mobile-hero-content">
                <div className="gt-mobile-hero-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="gt-hero-pill-icon">
                    <rect x="3" y="5" width="6" height="14" rx="2" />
                    <rect x="15" y="5" width="6" height="14" rx="2" />
                    <line x1="9" y1="12" x2="15" y2="12" />
                  </svg>
                  <span>Gate Terminal</span>
                </div>
                <h1 className="gt-mobile-hero-title">Gate Access Terminal</h1>
                <p className="gt-mobile-hero-desc">
                  Visitor check-in, entry approval and real-time gate operations.
                </p>
                <div className="gt-mobile-hero-red-line" />
              </div>
            </div>
          </div>

          {/* 2. CENTER: Premium White Login Card */}
          <div className="gt-card-col">
            <div className="gt-login-card">
              {/* DESKTOP Card Intro (Hidden on mobile via CSS) */}
              <div className="gt-card-desktop-intro">
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
              </div>

              {/* MOBILE Card Intro (Visible only on mobile <= 768px via CSS) */}
              <div className="gt-card-mobile-intro">
                <div className="gt-mob-card-brand-center">
                  <div className="gt-mob-card-logo-wrap">
                    <img src="/vms-logo.png" alt="VMS Logo" className="gt-mob-card-logo" />
                    <span className="gt-mob-card-brand-name">VMS</span>
                  </div>
                  <h2 className="gt-mob-card-system-title">Gate Terminal Access</h2>
                  <p className="gt-mob-card-system-sub">Security Guard Kiosk · Optical Pass Clearance</p>
                  <div className="gt-mob-card-red-bar" />
                </div>

                <div className="gt-mob-operator-wrap">
                  <div className="gt-mob-operator-title-row">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0b1b3b" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="gt-mob-operator-icon">
                      <path d="M3 13.5c2.5 1 5.5 1.5 9 1.5s6.5-.5 9-1.5" />
                      <path d="M4.2 13.5l1.1-4.8c.7-3.2 3.4-5.2 6.7-5.2s6 2 6.7 5.2l1.1 4.8" />
                      <path d="M2.5 15C4.5 17.5 8 18.5 12 18.5s7.5-1 9.5-3.5" />
                      <circle cx="12" cy="8.5" r="1.5" fill="#0b1b3b" />
                    </svg>
                    <h3 className="gt-mob-operator-heading">Operator Login</h3>
                  </div>
                  <p className="gt-mob-operator-desc">
                    Sign in to access the gate terminal.
                  </p>
                </div>
              </div>

              {/* Form with Clean Search-Box Inputs */}
              <form onSubmit={handleSubmit} className="gt-login-form">
                {/* Mobile Label 1 */}
                <label className="gt-mob-input-label gt-mobile-only" htmlFor="gt-email-mob">
                  Guard Email / ID
                </label>
                {/* Search Box 1: Guard Email / User ID */}
                <div className="gt-search-box-wrap">
                  <span className="gt-input-icon-desktop"><Mail size={16} className="gt-search-box-icon" /></span>
                  <span className="gt-input-icon-mobile"><Mail size={16} className="gt-search-box-icon" /></span>
                  <input
                    id="gt-email"
                    type="text"
                    className="gt-search-box-input gt-desktop-input"
                    placeholder="Guard Email / ID"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    aria-label="Guard Email or ID"
                  />
                  <input
                    id="gt-email-mob"
                    type="text"
                    className="gt-search-box-input gt-mobile-input"
                    placeholder="Enter guard email or ID"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    aria-label="Guard Email or ID"
                  />
                </div>

                {/* Mobile Label 2 */}
                <label className="gt-mob-input-label gt-mobile-only" htmlFor="gt-password-mob">
                  Security Password
                </label>
                {/* Search Box 2: Security Password */}
                <div className="gt-search-box-wrap">
                  <LockKeyhole size={16} className="gt-search-box-icon" />
                  <input
                    id="gt-password"
                    type={showPassword ? "text" : "password"}
                    className="gt-search-box-input gt-password-input gt-desktop-input"
                    placeholder="Security Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    aria-label="Security Password"
                  />
                  <input
                    id="gt-password-mob"
                    type={showPassword ? "text" : "password"}
                    className="gt-search-box-input gt-password-input gt-mobile-input"
                    placeholder="Enter your security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    aria-label="Security Password"
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
                    <span className="gt-loading-state">
                      <RefreshCw size={16} className="gt-spinner" />
                      <span>Authorizing gate terminal...</span>
                    </span>
                  ) : (
                    <>
                      <span className="gt-btn-content-desktop">
                        <Scan size={16} strokeWidth={2.2} className="gt-btn-scan-icon" />
                        <span className="gt-btn-text">Access Guard Station</span>
                        <ArrowRight size={16} strokeWidth={2.2} className="gt-btn-arrow" />
                      </span>
                      <span className="gt-btn-content-mobile">
                        <span className="gt-btn-text">Access Guard Station</span>
                        <ArrowRight size={16} strokeWidth={2.2} className="gt-btn-arrow" />
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Card Security Note */}
              <div className="gt-card-security-note gt-desktop-only">
                <ShieldCheck size={13} className="gt-note-shield" />
                <span>Gate Clearance Terminal · Authenticated Officer Access</span>
              </div>
              <div className="gt-card-security-note gt-mobile-only">
                <ShieldCheck size={14} className="gt-note-shield" />
                <span>Authenticated Officer Access · RBAC Protected</span>
              </div>
            </div>

            {/* Quick Actions (Mobile Viewport Only) */}
            <div className="gt-mobile-quick-actions gt-mobile-only">
              <div className="gt-quick-action-item">
                <div className="gt-quick-action-icon">
                  <Scan size={20} color="#ed202b" strokeWidth={2.2} />
                </div>
                <span className="gt-quick-action-text">Scan Pass</span>
              </div>
              <div className="gt-quick-action-divider" />
              <div className="gt-quick-action-item">
                <div className="gt-quick-action-icon">
                  <ClipboardCheck size={20} color="#ed202b" strokeWidth={2.2} />
                </div>
                <span className="gt-quick-action-text">Verify Visit</span>
              </div>
              <div className="gt-quick-action-divider" />
              <div className="gt-quick-action-item">
                <div className="gt-quick-action-icon">
                  <Package size={20} color="#ed202b" strokeWidth={2.2} />
                </div>
                <span className="gt-quick-action-text">Asset Clearance</span>
              </div>
            </div>

            {/* Mobile Centered Footer (Mobile Viewport Only) */}
            <div className="gt-mobile-page-footer gt-mobile-only">
              © VMS – Visitor Management System
            </div>
          </div>

          {/* 3. RIGHT HERO: 4 Vertical Capability Cards (Desktop Viewport) */}
          <div className="gt-desktop-features-col">
            {/* Capability 1 */}
            <div className="gt-dfc-card">
              <div className="gt-dfc-icon-box">
                <Scan size={18} />
              </div>
              <div className="gt-dfc-text">
                <h3 className="gt-dfc-title">Scan Visitor Pass</h3>
                <p className="gt-dfc-sub">QR / Barcode Verification</p>
              </div>
            </div>

            {/* Capability 2 */}
            <div className="gt-dfc-card">
              <div className="gt-dfc-icon-box">
                <ShieldCheck size={18} />
              </div>
              <div className="gt-dfc-text">
                <h3 className="gt-dfc-title">Verify Visit</h3>
                <p className="gt-dfc-sub">Approval &amp; Validity</p>
              </div>
            </div>

            {/* Capability 3 */}
            <div className="gt-dfc-card">
              <div className="gt-dfc-icon-box">
                <Package size={18} />
              </div>
              <div className="gt-dfc-text">
                <h3 className="gt-dfc-title">Manage Assets</h3>
                <p className="gt-dfc-sub">Entry &amp; Exit Clearance</p>
              </div>
            </div>

            {/* Capability 4 */}
            <div className="gt-dfc-card">
              <div className="gt-dfc-icon-box">
                <FileText size={18} />
              </div>
              <div className="gt-dfc-text">
                <h3 className="gt-dfc-title">Record Activity</h3>
                <p className="gt-dfc-sub">Real-time Logs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Red Wave Accents at bottom corners */}
        <div className="gt-desktop-wave-left">
          <svg viewBox="0 0 320 60" preserveAspectRatio="none" className="gt-wave-svg">
            <path d="M0,60 L0,15 C90,30 200,50 320,60 Z" fill="#e43b24" />
          </svg>
        </div>
        <div className="gt-desktop-wave-right">
          <svg viewBox="0 0 350 70" preserveAspectRatio="none" className="gt-wave-svg">
            <path d="M0,70 C100,60 220,15 350,25 L350,70 Z" fill="#e43b24" />
          </svg>
        </div>

        {/* Mobile Decorative Bottom Swoosh */}
        <div className="gt-mobile-bottom-wave-wrap">
          <svg viewBox="0 0 390 85" preserveAspectRatio="none" className="gt-mob-bottom-svg">
            <path d="M0,85 L0,70 C120,70 240,90 320,65 C355,54 375,46 390,42 L390,85 Z" fill="#011b4c" />
            <path d="M0,85 L0,58 C80,62 170,82 250,70 C310,60 360,46 390,40 L390,55 C360,60 310,72 250,82 C170,92 80,72 0,85 Z" fill="#e43b24" />
          </svg>
        </div>
      </main>

      {/* =========================================================================
          DESKTOP FOOTER BAR (Matching Desktop Master Mockup)
          ========================================================================= */}
      <footer className="gt-desktop-footer-bar">
        <div className="gt-desktop-footer-inner">
          <ShieldCheck size={14} className="gt-df-icon" />
          <span className="gt-df-brand">VMS Gate Operations</span>
          <span className="gt-df-divider">|</span>
          <span className="gt-df-desc">Secure · Compliant · Monitored</span>
        </div>
      </footer>

      {/* =========================================================================
          BOTTOM 4-FEATURE STRIP (Matching new reference design)
          ========================================================================= */}
      <section className="gt-bottom-features-section">
        {/* Soft Wave with Left Red Swoop Accent */}
        <div className="gt-bottom-wave-wrap">
          <svg viewBox="0 0 1200 65" preserveAspectRatio="none" className="gt-bottom-wave-svg">
            <path d="M0,65 L0,22 C140,5 280,38 420,65 Z" fill="#e43b24" />
            <path d="M0,65 C320,55 640,24 1200,32 L1200,65 Z" className="gt-wave-path-fill" />
          </svg>
        </div>

        <div className="gt-bottom-features-container">
          {/* Feature 1 */}
          <div className="gt-bottom-feature-item">
            <div className="gt-bottom-feature-icon">
              <Scan size={20} />
            </div>
            <div className="gt-bottom-feature-text">
              <strong className="gt-bottom-feature-title">Scan Visitor Pass</strong>
              <span className="gt-bottom-feature-sub">QR / Barcode</span>
            </div>
          </div>

          <div className="gt-bottom-feature-divider" />

          {/* Feature 2 */}
          <div className="gt-bottom-feature-item">
            <div className="gt-bottom-feature-icon">
              <ShieldCheck size={20} />
            </div>
            <div className="gt-bottom-feature-text">
              <strong className="gt-bottom-feature-title">Verify Visit</strong>
              <span className="gt-bottom-feature-sub">Approval &amp; Validity</span>
            </div>
          </div>

          <div className="gt-bottom-feature-divider" />

          {/* Feature 3 */}
          <div className="gt-bottom-feature-item">
            <div className="gt-bottom-feature-icon">
              <Package size={20} />
            </div>
            <div className="gt-bottom-feature-text">
              <strong className="gt-bottom-feature-title">Manage Assets</strong>
              <span className="gt-bottom-feature-sub">Entry &amp; Exit Clearance</span>
            </div>
          </div>

          <div className="gt-bottom-feature-divider" />

          {/* Feature 4 */}
          <div className="gt-bottom-feature-item">
            <div className="gt-bottom-feature-icon">
              <FileText size={20} />
            </div>
            <div className="gt-bottom-feature-text">
              <strong className="gt-bottom-feature-title">Record Activity</strong>
              <span className="gt-bottom-feature-sub">Real-time Logs</span>
            </div>
          </div>
        </div>

        {/* Bottom Red Accent Wave along the base */}
        <div className="gt-bottom-accent-wave">
          <svg viewBox="0 0 1200 35" preserveAspectRatio="none" className="gt-bottom-accent-svg">
            <path d="M0,35 L0,5 C300,30 650,33 950,20 C1080,14 1150,7 1200,0 L1200,35 Z" fill="#e43b24" />
          </svg>
        </div>
      </section>
    </div>
  );
}
