import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Verify renderNotifications block exists
render_start = text.find('  const renderNotifications = () => {')
render_end = text.find('  const renderDashboard = () => {')

print("render_start:", render_start)
print("render_end:", render_end)

if render_start == -1 or render_end == -1:
    print("Could not find renderNotifications block")
else:
    print("renderNotifications block found, length:", render_end - render_start)

# Verify sidebar Notifications block exists
sidebar_notif = '<button\n            className={`sidebar-item ${currentPage === "notifications" ? "active" : ""}`}'
print("sidebar_notif in text:", sidebar_notif in text)

# Verify sidebar it-visitors exists
sidebar_it_visitors = '<button\n            className={`sidebar-item ${currentPage === "it-visitors" ? "active" : ""}`}'
print("sidebar_it_visitors in text:", sidebar_it_visitors in text)

# Verify main-content router exists
router_target = '{currentPage === "notifications" && renderNotifications()}'
print("router_target in text:", router_target in text)
