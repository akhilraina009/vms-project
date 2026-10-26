import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Locate sidebar in App.jsx
old_sidebar_code = """      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={19} />
          </div>
          <div>
            <h1>VMS</h1>
            <span>Visitor Management</span>
          </div>
        </div>

        <div className="sidebar-section">"""

new_sidebar_code = """      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={19} />
          </div>
          <div className="brand-text">
            <h1>VMS</h1>
            <span>Visitor Management</span>
          </div>
        </div>

        <div className="sidebar-nav-scroll">
          <div className="sidebar-section">"""

if old_sidebar_code in content:
    content = content.replace(old_sidebar_code, new_sidebar_code, 1)
    print("Replaced brand & opened sidebar-nav-scroll")
else:
    print("WARNING: Could not find old_sidebar_code")

# Close sidebar-nav-scroll right before <div className="sidebar-bottom">
old_close_marker = """          <button
            className={`sidebar-item ${currentPage === "it-checkout-history" ? "active" : ""}`}
            onClick={() => {
              setCurrentPage("it-checkout-history");
              fetchCheckoutHistory();
            }}
          >
            <History size={14} />
            IT Checkout History
          </button>
        </div>

        <div className="sidebar-bottom">"""

new_close_marker = """          <button
            className={`sidebar-item ${currentPage === "it-checkout-history" ? "active" : ""}`}
            onClick={() => {
              setCurrentPage("it-checkout-history");
              fetchCheckoutHistory();
            }}
          >
            <History size={14} />
            IT Checkout History
          </button>
        </div>
        </div>

        <div className="sidebar-bottom">"""

if old_close_marker in content:
    content = content.replace(old_close_marker, new_close_marker, 1)
    print("Closed sidebar-nav-scroll before sidebar-bottom")
else:
    print("WARNING: Could not find old_close_marker")

# Update logout button inline styles removal
old_logout_btn = """          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              marginTop: "10px",
              padding: "10px 12px",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "8px",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <LogOut size={15} />
            Logout
          </button>"""

new_logout_btn = """          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            title="Sign out of VMS System"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>"""

if old_logout_btn in content:
    content = content.replace(old_logout_btn, new_logout_btn, 1)
    print("Updated logout-button cleanly")
else:
    print("WARNING: Could not find old_logout_btn")

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Saved App.jsx successfully.")
