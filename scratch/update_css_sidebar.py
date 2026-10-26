with open('frontend/src/PremiumEnterprise.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

# Target sidebar section
old_sidebar_section = """/* =========================================================
   SIDEBAR (OBSIDIAN GLASS)
========================================================= */

.sidebar {
  background: #ffffff;
  border-right: 1px solid var(--enterprise-border);
  box-shadow: 2px 0 12px rgba(15, 23, 42, 0.04);
}

.brand {
  padding-top: 22px;
  padding-bottom: 22px;
}

.brand-icon {
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
  color: #ffffff;
}

.brand-title,
.brand strong {
  color: #0f172a;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.sidebar-label {
  letter-spacing: 1.4px;
  font-size: 10px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  opacity: 0.85;
}

.sidebar-item {
  min-height: 42px;
  margin-bottom: 5px;
  border-radius: 10px;
  color: #475569;
  font-weight: 550;
  font-size: 13px;
  border: 1px solid transparent;
  transition: all 180ms ease;
}

.sidebar-item:hover {
  background: #f8fafc;
  color: #0f172a;
  transform: translateX(2px);
}

.sidebar-item.active,
.sidebar-item.active:hover {
  color: #4338ca;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  box-shadow: 0 1px 4px rgba(79, 70, 229, 0.08);
  font-weight: 700;
}

.security-profile {
  background: #f8fafc;
  border: 1px solid var(--enterprise-border);
  border-radius: 12px;
  padding: 10px 12px;
}

.profile-avatar {
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  color: #ffffff;
  font-weight: 700;
  border-radius: 8px;
}

.security-profile strong {
  color: #0f172a;
  font-size: 12.5px;
}

.security-profile span {
  color: #64748b;
  font-size: 11px;
}

.online-dot {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
  animation: livePulse 2s infinite ease-in-out;
}

.logout-button {
  background: #ffffff !important;
  border: 1px solid var(--enterprise-border) !important;
  color: #94a3b8 !important;
  transition: all 0.2s ease !important;
}

.logout-button:hover {
  background: #fef2f2 !important;
  border-color: #fecaca !important;
  color: #b91c1c !important;
}

/* =========================================================
   MAIN WORKSPACE & TOPBAR
========================================================= */

.main-content {
  min-height: 100vh;
  padding: 28px 32px 40px;
  background: var(--enterprise-bg);
  color: var(--enterprise-text);
}"""

new_sidebar_section = """/* =========================================================
   EXECUTIVE SIDEBAR (PINNED WITH SCROLLABLE NAVIGATION)
========================================================= */

.sidebar {
  width: 250px !important;
  height: 100vh !important;
  max-height: 100vh !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  bottom: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  background: #ffffff !important;
  border-right: 1px solid var(--enterprise-border) !important;
  box-shadow: 2px 0 16px rgba(15, 23, 42, 0.04) !important;
  z-index: 40 !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.brand {
  flex-shrink: 0 !important;
  height: 72px !important;
  min-height: 72px !important;
  padding: 0 18px !important;
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  border-bottom: 1px solid var(--enterprise-border) !important;
  background: #ffffff !important;
}

.brand-icon {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  border-radius: 10px !important;
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%) !important;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25) !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.brand-text h1,
.brand h1 {
  margin: 0 !important;
  font-size: 16px !important;
  font-weight: 800 !important;
  color: #0f172a !important;
  letter-spacing: -0.3px !important;
  line-height: 1.1 !important;
}

.brand-text span,
.brand span {
  display: block !important;
  margin-top: 2px !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  color: #64748b !important;
  letter-spacing: 0.2px !important;
}

/* Middle Navigation Scrollable Area */
.sidebar-nav-scroll {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding: 14px 10px 18px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  overscroll-behavior: contain !important;
  scroll-behavior: smooth !important;
}

/* Premium Minimal Scrollbar */
.sidebar-nav-scroll::-webkit-scrollbar {
  width: 4px;
}
.sidebar-nav-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-nav-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
  transition: background 0.2s ease;
}
.sidebar-nav-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.sidebar-nav-scroll {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.sidebar-section {
  padding: 0 !important;
  margin-bottom: 16px !important;
}

.sidebar-section:last-child {
  margin-bottom: 4px !important;
}

.sidebar-label {
  margin: 0 0 8px 10px !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: 1.2px !important;
  color: #64748b !important;
  text-transform: uppercase !important;
  opacity: 0.85 !important;
}

.sidebar-item {
  width: 100% !important;
  min-height: 38px !important;
  margin-bottom: 3px !important;
  padding: 8px 12px !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  border-radius: 9px !important;
  border: 1px solid transparent !important;
  background: transparent !important;
  color: #475569 !important;
  font-size: 12.5px !important;
  font-weight: 550 !important;
  cursor: pointer !important;
  text-align: left !important;
  transition: all 0.15s ease !important;
}

.sidebar-item:hover {
  background: #f8fafc !important;
  color: #0f172a !important;
  transform: translateX(2px) !important;
}

.sidebar-item.active {
  background: #eef2ff !important;
  color: #4338ca !important;
  border-color: #c7d2fe !important;
  font-weight: 700 !important;
  box-shadow: 0 1px 4px rgba(79, 70, 229, 0.08) !important;
}

/* Docked Bottom Profile & Logout */
.sidebar-bottom {
  flex-shrink: 0 !important;
  margin-top: auto !important;
  padding: 12px 14px !important;
  border-top: 1px solid var(--enterprise-border) !important;
  background: #ffffff !important;
  box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.03) !important;
}

.security-profile {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  padding: 8px 10px !important;
  border-radius: 10px !important;
  background: #f8fafc !important;
  border: 1px solid var(--enterprise-border) !important;
  min-height: 48px !important;
}

.profile-avatar {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  border-radius: 8px !important;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  font-size: 11.5px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2) !important;
  flex-shrink: 0 !important;
}

.security-profile strong {
  display: block !important;
  color: #0f172a !important;
  font-size: 12px !important;
  font-weight: 750 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 135px !important;
  line-height: 1.25 !important;
}

.security-profile span {
  display: block !important;
  color: #64748b !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.4px !important;
  margin-top: 2px !important;
}

.online-dot {
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background: #10b981 !important;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25) !important;
  margin-left: auto !important;
  flex-shrink: 0 !important;
}

.logout-button {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  width: 100% !important;
  margin-top: 8px !important;
  padding: 8px 12px !important;
  border: 1px solid var(--enterprise-border) !important;
  border-radius: 8px !important;
  background: #ffffff !important;
  color: #64748b !important;
  font-size: 12px !important;
  font-weight: 650 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.logout-button:hover {
  background: #fef2f2 !important;
  border-color: #fecaca !important;
  color: #dc2626 !important;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.08) !important;
}

/* Fallback for ultra-short screens (< 450px) */
@media (max-height: 450px) {
  .sidebar {
    overflow-y: auto !important;
  }
  .sidebar-nav-scroll {
    overflow-y: visible !important;
    flex: initial !important;
  }
  .sidebar-bottom {
    position: static !important;
    margin-top: 8px !important;
  }
}

/* =========================================================
   MAIN WORKSPACE & RESPONSIVE DASHBOARD
========================================================= */

.main-content {
  margin-left: 250px !important;
  width: calc(100% - 250px) !important;
  min-height: 100vh !important;
  padding: 24px 28px 40px !important;
  background: var(--enterprise-bg) !important;
  color: var(--enterprise-text) !important;
  box-sizing: border-box !important;
}

.stats-grid {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)) !important;
  gap: 14px !important;
  margin-top: 18px !important;
  margin-bottom: 22px !important;
}

.it-management-header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: flex-start !important;
  gap: 16px !important;
  flex-wrap: wrap !important;
}

.it-header-controls {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
}

.table-toolbar {
  flex-wrap: wrap !important;
  gap: 12px !important;
}

.it-filter-pills-row {
  flex-wrap: wrap !important;
  gap: 8px !important;
}"""

if old_sidebar_section in css_content:
    css_content = css_content.replace(old_sidebar_section, new_sidebar_section, 1)
    print("Replaced old_sidebar_section in PremiumEnterprise.css successfully")
else:
    print("ERROR: old_sidebar_section not found in PremiumEnterprise.css")

with open('frontend/src/PremiumEnterprise.css', 'w', encoding='utf-8') as f:
    f.write(css_content)
