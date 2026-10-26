import sys

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update mark and clear functions
old_mark_and_clear = '''  const markAllNotificationsAsRead = () => {
    const preferences = readNotificationPreferences();
    preferences.readIds = [
      ...new Set([
        ...preferences.readIds,
        ...notifications.map((notification) => String(notification.id)),
      ]),
    ];
    saveNotificationPreferences(preferences);
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    const preferences = readNotificationPreferences();
    preferences.hiddenIds = [
      ...new Set([
        ...preferences.hiddenIds,
        ...notifications.map((notification) => String(notification.id)),
      ]),
    ];
    // Remove read-state entries for items being cleared to keep preferences small.
    const clearedIds = new Set(notifications.map((notification) => String(notification.id)));
    preferences.readIds = preferences.readIds.filter((id) => !clearedIds.has(String(id)));
    saveNotificationPreferences(preferences);
    setNotifications([]);
  };'''

new_mark_and_clear = '''  const markGeneralNotificationsAsRead = () => {
    const preferences = readNotificationPreferences();
    preferences.readIds = [
      ...new Set([
        ...preferences.readIds,
        ...generalNotifications.map((notification) => String(notification.id)),
      ]),
    ];
    saveNotificationPreferences(preferences);
    setNotifications((previous) =>
      previous.map((notification) =>
        !isITNotification(notification) ? { ...notification, read: true } : notification
      )
    );
  };

  const clearGeneralNotifications = () => {
    const idsToClear = new Set(generalNotifications.map((n) => String(n.id)));
    const preferences = readNotificationPreferences();
    preferences.hiddenIds = [...new Set([...preferences.hiddenIds, ...idsToClear])];
    preferences.readIds = preferences.readIds.filter((id) => !idsToClear.has(String(id)));
    saveNotificationPreferences(preferences);
    setNotifications((previous) => previous.filter((n) => isITNotification(n)));
  };

  const markITNotificationsAsRead = () => {
    const preferences = readNotificationPreferences();
    preferences.readIds = [
      ...new Set([
        ...preferences.readIds,
        ...itNotifications.map((notification) => String(notification.id)),
      ]),
    ];
    saveNotificationPreferences(preferences);
    setNotifications((previous) =>
      previous.map((notification) =>
        isITNotification(notification) ? { ...notification, read: true } : notification
      )
    );
  };

  const clearITNotifications = () => {
    const idsToClear = new Set(itNotifications.map((n) => String(n.id)));
    const preferences = readNotificationPreferences();
    preferences.hiddenIds = [...new Set([...preferences.hiddenIds, ...idsToClear])];
    preferences.readIds = preferences.readIds.filter((id) => !idsToClear.has(String(id)));
    saveNotificationPreferences(preferences);
    setNotifications((previous) => previous.filter((n) => !isITNotification(n)));
  };

  const markAllNotificationsAsRead = markGeneralNotificationsAsRead;
  const clearNotifications = clearGeneralNotifications;'''

if old_mark_and_clear not in text:
    print("ERROR: old_mark_and_clear not found!")
    sys.exit(1)
text = text.replace(old_mark_and_clear, new_mark_and_clear, 1)

# 2. Replace renderNotifications and append renderITNotifications
render_start = text.find('  const renderNotifications = () => {')
render_end = text.find('  const renderDashboard = () => {')

if render_start == -1 or render_end == -1:
    print("ERROR: Could not find renderNotifications block bounds!")
    sys.exit(1)

new_renders = '''  const renderNotifications = () => {
    const unreadCount = generalUnreadCount;
    const gateCount = generalNotifications.filter(
      (n) =>
        (n.title || "").toLowerCase().includes("gate") ||
        (n.title || "").toLowerCase().includes("entry") ||
        (n.title || "").toLowerCase().includes("verified") ||
        (n.title || "").toLowerCase().includes("clear")
    ).length;
    const requestCount = generalNotifications.filter(
      (n) =>
        (n.title || "").toLowerCase().includes("request") ||
        (n.title || "").toLowerCase().includes("register") ||
        (n.title || "").toLowerCase().includes("pre-approval")
    ).length;

    const filtered = generalNotifications.filter((n) => {
      // Tab filter
      if (notificationFilter === "unread" && n.read) return false;
      if (
        notificationFilter === "gate" &&
        !(n.title || "").toLowerCase().includes("gate") &&
        !(n.title || "").toLowerCase().includes("entry") &&
        !(n.title || "").toLowerCase().includes("verified") &&
        !(n.title || "").toLowerCase().includes("clear")
      )
        return false;
      if (
        notificationFilter === "request" &&
        !(n.title || "").toLowerCase().includes("request") &&
        !(n.title || "").toLowerCase().includes("register") &&
        !(n.title || "").toLowerCase().includes("pre-approval")
      )
        return false;

      // Search query filter
      if (notifSearchQuery.trim()) {
        const q = notifSearchQuery.toLowerCase();
        const inTitle = (n.title || "").toLowerCase().includes(q);
        const inMsg = (n.message || "").toLowerCase().includes(q);
        const inTime = (n.time || "").toLowerCase().includes(q);
        if (!inTitle && !inMsg && !inTime) return false;
      }

      return true;
    });

    return (
      <>
        {/* Executive Notifications Header */}
        <div className="notif-management-header">
          <div className="notif-header-title-box">
            <div className="notif-header-badge-row">
              <span className="notif-division-pill">VISITOR MANAGEMENT</span>
              <span className="notif-telemetry-pill">
                <span className="status-dot"></span>
                Visitor Telemetry Active
              </span>
            </div>
            <h2 className="notif-page-title">Visitor Notifications</h2>
            <p className="notif-page-desc">
              Audit log of general visitor check-ins, security gate clearances, host arrivals, and visitor requests
            </p>
          </div>

          <div className="notif-header-controls">
            {unreadCount > 0 ? (
              <div className="notif-unread-indicator-badge">
                <span className="unread-pulse-dot"></span>
                <span>
                  <strong>{unreadCount}</strong> Unread Notification{unreadCount > 1 ? "s" : ""}
                </span>
              </div>
            ) : (
              <div className="notif-caught-up-badge">
                <CheckCircle2 size={13} color="#059669" />
                <span>All Caught Up</span>
              </div>
            )}

            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-header-btn"
                onClick={markGeneralNotificationsAsRead}
                title="Mark all visitor notifications as read"
              >
                <CheckCheck size={15} />
                <span>Mark all as read</span>
              </button>
            )}

            {generalNotifications.length > 0 && (
              <button
                type="button"
                className="notif-header-btn clear"
                onClick={clearGeneralNotifications}
                title="Clear general notification history"
              >
                <Trash2 size={14} />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications Main Panel */}
        <section className="table-card notif-main-card">
          <div className="notif-toolbar">
            <div className="notif-filter-pills-row">
              <button
                type="button"
                className={`notif-filter-tab ${notificationFilter === "all" ? "active" : ""}`}
                onClick={() => setNotificationFilter("all")}
              >
                All Activities ({generalNotifications.length})
              </button>
              <button
                type="button"
                className={`notif-filter-tab ${notificationFilter === "unread" ? "active" : ""}`}
                onClick={() => setNotificationFilter("unread")}
              >
                <span className="unread-dot-small"></span>
                Unread ({unreadCount})
              </button>
              {gateCount > 0 && (
                <button
                  type="button"
                  className={`notif-filter-tab ${notificationFilter === "gate" ? "active" : ""}`}
                  onClick={() => setNotificationFilter("gate")}
                >
                  <ShieldCheck size={12} />
                  Gate Clearances ({gateCount})
                </button>
              )}
              {requestCount > 0 && (
                <button
                  type="button"
                  className={`notif-filter-tab ${notificationFilter === "request" ? "active" : ""}`}
                  onClick={() => setNotificationFilter("request")}
                >
                  <Users size={12} />
                  Visitor Requests ({requestCount})
                </button>
              )}
            </div>

            <div className="notif-search-field">
              <Search size={14} />
              <input
                value={notifSearchQuery}
                onChange={(e) => setNotifSearchQuery(e.target.value)}
                placeholder="Search visitor notification text, visitor, host..."
              />
              {notifSearchQuery && (
                <button
                  type="button"
                  className="notif-search-clear"
                  onClick={() => setNotifSearchQuery("")}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state notif-empty-state">
              <div className="notif-empty-icon-wrap">
                <BellOff size={26} />
              </div>
              <strong className="notif-empty-title">
                {notificationFilter === "unread"
                  ? "You're all caught up! No unread notifications"
                  : notifSearchQuery
                  ? `No notifications found matching "${notifSearchQuery}"`
                  : "No notifications available"}
              </strong>
              <p className="notif-empty-desc">
                {notificationFilter === "unread"
                  ? "All general visitor activities have been acknowledged."
                  : notifSearchQuery
                  ? "Try a different search keyword or reset the filter."
                  : "General visitor check-ins, entry approvals, and security passes will appear here in real-time."}
              </p>
              {(notificationFilter !== "all" || notifSearchQuery) && (
                <button
                  type="button"
                  className="primary-button notif-reset-btn"
                  onClick={() => {
                    setNotificationFilter("all");
                    setNotifSearchQuery("");
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Show All Activities</span>
                </button>
              )}
            </div>
          ) : (
            <div className="notif-list-wrap">
              {filtered.map((notification) => {
                const isUnread = !notification.read;
                const isSuccess = notification.type === "success";
                const isWarning = notification.type === "warning";

                // Choose badge and icon
                let iconElem = <Bell size={18} />;
                let iconTypeClass = "info";
                let badgeText = "VISITOR EVENT";
                let badgeClass = "badge-info";

                if (isSuccess) {
                  iconElem = <CheckCircle2 size={18} />;
                  iconTypeClass = "success";
                  badgeText = notification.title?.includes("Cleared")
                    ? "EXIT CLEARANCE"
                    : notification.title?.includes("Checked Out")
                    ? "CHECKOUT"
                    : "VERIFIED";
                  badgeClass = "badge-success";
                } else if (isWarning) {
                  iconElem = <AlertTriangle size={18} />;
                  iconTypeClass = "warning";
                  badgeText = "ALERT";
                  badgeClass = "badge-warning";
                } else if (
                  notification.type === "visitor" ||
                  notification.title?.includes("Visitor")
                ) {
                  iconElem = <UserCheck size={18} />;
                  iconTypeClass = "visitor";
                  badgeText = "VISITOR PASS";
                  badgeClass = "badge-visitor";
                }

                return (
                  <div
                    key={notification.id}
                    className={`notif-item-row ${isUnread ? "unread" : "read"}`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className={`notif-item-icon-box ${iconTypeClass}`}>{iconElem}</div>

                    <div className="notif-item-content">
                      <div className="notif-item-topbar">
                        <div className="notif-title-group">
                          <strong className="notif-title">{notification.title}</strong>
                          <span className={`notif-category-badge ${badgeClass}`}>{badgeText}</span>
                          {isUnread && (
                            <span
                              className="notif-unread-glow-dot"
                              title="Unread notification"
                            />
                          )}
                        </div>

                        <div className="notif-timestamp">
                          <Clock size={11} />
                          <span>{notification.time}</span>
                        </div>
                      </div>

                      <p className="notif-message-text">{notification.message}</p>
                    </div>

                    <div className="notif-item-actions" onClick={(e) => e.stopPropagation()}>
                      {isUnread && (
                        <button
                          type="button"
                          className="notif-item-btn read-btn"
                          onClick={() => markNotificationAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="notif-item-btn dismiss-btn"
                        onClick={(e) => dismissNotification(e, notification.id)}
                        title="Dismiss notification"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </>
    );
  };

  const renderITNotifications = () => {
    const unreadCount = itUnreadCount;
    const assetCount = itNotifications.filter(
      (n) =>
        (n.action || "").includes("ASSET") ||
        (n.title || "").toLowerCase().includes("asset") ||
        (n.message || "").toLowerCase().includes("hardware") ||
        (n.message || "").toLowerCase().includes("asset")
    ).length;
    const gateCount = itNotifications.filter(
      (n) =>
        (n.action || "").includes("CHECK") ||
        (n.title || "").toLowerCase().includes("gate") ||
        (n.title || "").toLowerCase().includes("entry") ||
        (n.title || "").toLowerCase().includes("verified") ||
        (n.title || "").toLowerCase().includes("clear")
    ).length;

    const filtered = itNotifications.filter((n) => {
      // Tab filter
      if (itNotifFilter === "unread" && n.read) return false;
      if (
        itNotifFilter === "asset" &&
        !(n.action || "").includes("ASSET") &&
        !(n.title || "").toLowerCase().includes("asset") &&
        !(n.message || "").toLowerCase().includes("hardware") &&
        !(n.message || "").toLowerCase().includes("asset")
      )
        return false;
      if (
        itNotifFilter === "gate" &&
        !(n.action || "").includes("CHECK") &&
        !(n.title || "").toLowerCase().includes("gate") &&
        !(n.title || "").toLowerCase().includes("entry") &&
        !(n.title || "").toLowerCase().includes("verified") &&
        !(n.title || "").toLowerCase().includes("clear")
      )
        return false;

      // Search query filter
      if (itNotifSearchQuery.trim()) {
        const q = itNotifSearchQuery.toLowerCase();
        const inTitle = (n.title || "").toLowerCase().includes(q);
        const inMsg = (n.message || "").toLowerCase().includes(q);
        const inTime = (n.time || "").toLowerCase().includes(q);
        if (!inTitle && !inMsg && !inTime) return false;
      }

      return true;
    });

    return (
      <>
        {/* Executive IT Notifications Header */}
        <div className="notif-management-header">
          <div className="notif-header-title-box">
            <div className="notif-header-badge-row">
              <span
                className="notif-division-pill"
                style={{
                  background: "#faf5ff",
                  color: "#7c3aed",
                  borderColor: "#d8b4fe",
                }}
              >
                IT DEPARTMENT DIVISION
              </span>
              <span
                className="notif-telemetry-pill"
                style={{
                  borderColor: "#d8b4fe",
                  color: "#6b21a8",
                }}
              >
                <span
                  className="status-dot"
                  style={{ background: "#7c3aed", boxShadow: "0 0 6px rgba(124,58,237,0.6)" }}
                ></span>
                IT Technical Telemetry Active
              </span>
            </div>
            <h2 className="notif-page-title">IT Visit Notifications</h2>
            <p className="notif-page-desc">
              Dedicated real-time telemetry, hardware custody alerts, and security clearances exclusively for IT technical personnel and contractors
            </p>
          </div>

          <div className="notif-header-controls">
            {unreadCount > 0 ? (
              <div
                className="notif-unread-indicator-badge"
                style={{
                  background: "#faf5ff",
                  borderColor: "#d8b4fe",
                  color: "#6b21a8",
                }}
              >
                <span
                  className="unread-pulse-dot"
                  style={{ background: "#7c3aed" }}
                ></span>
                <span>
                  <strong>{unreadCount}</strong> Unread IT Notification{unreadCount > 1 ? "s" : ""}
                </span>
              </div>
            ) : (
              <div className="notif-caught-up-badge">
                <CheckCircle2 size={13} color="#059669" />
                <span>All Caught Up</span>
              </div>
            )}

            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-header-btn"
                onClick={markITNotificationsAsRead}
                title="Mark all IT notifications as read"
              >
                <CheckCheck size={15} />
                <span>Mark all as read</span>
              </button>
            )}

            {itNotifications.length > 0 && (
              <button
                type="button"
                className="notif-header-btn clear"
                onClick={clearITNotifications}
                title="Clear IT notification history"
              >
                <Trash2 size={14} />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* IT Notifications Main Panel */}
        <section className="table-card notif-main-card">
          <div className="notif-toolbar">
            <div className="notif-filter-pills-row">
              <button
                type="button"
                className={`notif-filter-tab ${itNotifFilter === "all" ? "active" : ""}`}
                onClick={() => setItNotifFilter("all")}
              >
                All IT Visits ({itNotifications.length})
              </button>
              <button
                type="button"
                className={`notif-filter-tab ${itNotifFilter === "unread" ? "active" : ""}`}
                onClick={() => setItNotifFilter("unread")}
              >
                <span className="unread-dot-small" style={{ background: "#7c3aed" }}></span>
                Unread ({unreadCount})
              </button>
              {assetCount > 0 && (
                <button
                  type="button"
                  className={`notif-filter-tab ${itNotifFilter === "asset" ? "active" : ""}`}
                  onClick={() => setItNotifFilter("asset")}
                >
                  <Laptop size={12} />
                  Hardware Custody ({assetCount})
                </button>
              )}
              {gateCount > 0 && (
                <button
                  type="button"
                  className={`notif-filter-tab ${itNotifFilter === "gate" ? "active" : ""}`}
                  onClick={() => setItNotifFilter("gate")}
                >
                  <ShieldCheck size={12} />
                  Gate Clearances ({gateCount})
                </button>
              )}
            </div>

            <div className="notif-search-field">
              <Search size={14} />
              <input
                value={itNotifSearchQuery}
                onChange={(e) => setItNotifSearchQuery(e.target.value)}
                placeholder="Search IT notifications, asset ID, contractor, serial..."
              />
              {itNotifSearchQuery && (
                <button
                  type="button"
                  className="notif-search-clear"
                  onClick={() => setItNotifSearchQuery("")}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state notif-empty-state">
              <div className="notif-empty-icon-wrap" style={{ background: "#faf5ff", color: "#7c3aed" }}>
                <BellRing size={26} />
              </div>
              <strong className="notif-empty-title">
                {itNotifFilter === "unread"
                  ? "You're all caught up! No unread IT visit notifications"
                  : itNotifSearchQuery
                  ? `No IT notifications found matching "${itNotifSearchQuery}"`
                  : "No IT visit notifications available"}
              </strong>
              <p className="notif-empty-desc">
                {itNotifFilter === "unread"
                  ? "All IT contractor arrivals, gate clearances, and hardware custody updates have been acknowledged."
                  : itNotifSearchQuery
                  ? "Try a different search keyword or reset the filter."
                  : "Real-time alerts for IT visits, contractor entry/exit, and equipment tracking will appear here."}
              </p>
              {(itNotifFilter !== "all" || itNotifSearchQuery) && (
                <button
                  type="button"
                  className="primary-button notif-reset-btn"
                  onClick={() => {
                    setItNotifFilter("all");
                    setItNotifSearchQuery("");
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Show All IT Visits</span>
                </button>
              )}
            </div>
          ) : (
            <div className="notif-list-wrap">
              {filtered.map((notification) => {
                const isUnread = !notification.read;
                const act = String(notification.action || "");
                const tit = String(notification.title || "");

                // Categorize IT item
                let iconElem = <Laptop size={18} />;
                let badgeText = "IT VISIT";

                if (act.includes("ASSET") || tit.includes("Asset")) {
                  iconElem = <Laptop size={18} />;
                  badgeText = tit.includes("Cleared") ? "ASSET EXIT CLEARANCE" : "HARDWARE CUSTODY";
                } else if (act.includes("REQUEST") || tit.includes("Request")) {
                  iconElem = <Server size={18} />;
                  badgeText = "IT VISIT REQUEST";
                } else if (act.includes("CHECKED_IN") || tit.includes("Checked In")) {
                  iconElem = <UserCheck size={18} />;
                  badgeText = "IT CONTRACTOR ARRIVED";
                } else if (act.includes("CHECKED_OUT") || tit.includes("Checked Out")) {
                  iconElem = <CheckCircle2 size={18} />;
                  badgeText = "IT CONTRACTOR CHECKED OUT";
                } else if (act.includes("VERIF") || tit.includes("Verified")) {
                  iconElem = <ShieldCheck size={18} />;
                  badgeText = "IT SECURITY VERIFIED";
                }

                return (
                  <div
                    key={notification.id}
                    className={`notif-item-row ${isUnread ? "unread" : "read"}`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="notif-item-icon-box it">{iconElem}</div>

                    <div className="notif-item-content">
                      <div className="notif-item-topbar">
                        <div className="notif-title-group">
                          <strong className="notif-title">{notification.title}</strong>
                          <span className="notif-category-badge badge-it">{badgeText}</span>
                          {isUnread && (
                            <span
                              className="notif-unread-glow-dot"
                              style={{ background: "#7c3aed", boxShadow: "0 0 6px rgba(124,58,237,0.7)" }}
                              title="Unread notification"
                            />
                          )}
                        </div>

                        <div className="notif-timestamp">
                          <Clock size={11} />
                          <span>{notification.time}</span>
                        </div>
                      </div>

                      <p className="notif-message-text">{notification.message}</p>
                    </div>

                    <div className="notif-item-actions" onClick={(e) => e.stopPropagation()}>
                      {isUnread && (
                        <button
                          type="button"
                          className="notif-item-btn read-btn"
                          onClick={() => markNotificationAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="notif-item-btn dismiss-btn"
                        onClick={(e) => dismissNotification(e, notification.id)}
                        title="Dismiss notification"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </>
    );
  };

  '''

text = text[:render_start] + new_renders + text[render_end:]

# 3. Update sidebar Notifications button
old_sidebar_notif = '''          <button
            className={`sidebar-item ${currentPage === "notifications" ? "active" : ""}`}
            onClick={() => setCurrentPage("notifications")}
          >
            <Bell size={14} />
            Notifications
            {notifications.some((notification) => !notification.read) && (
              <span
                className="notification-count"
                style={{
                  background: "#ef4444",
                  color: "white",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  marginLeft: "auto",
                }}
              >
                {notifications.filter((notification) => !notification.read).length}
              </span>
            )}
          </button>'''

new_sidebar_notif = '''          <button
            className={`sidebar-item ${currentPage === "notifications" ? "active" : ""}`}
            onClick={() => setCurrentPage("notifications")}
          >
            <Bell size={14} />
            Notifications
            {generalUnreadCount > 0 && (
              <span
                className="notification-count"
                style={{
                  background: "#ef4444",
                  color: "white",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  marginLeft: "auto",
                }}
              >
                {generalUnreadCount}
              </span>
            )}
          </button>'''

if old_sidebar_notif not in text:
    print("ERROR: old_sidebar_notif not found!")
    sys.exit(1)
text = text.replace(old_sidebar_notif, new_sidebar_notif, 1)

# 4. Update sidebar IT section to include IT Notifications
old_sidebar_it_visitors = '''          <button
            className={`sidebar-item ${currentPage === "it-visitors" ? "active" : ""}`}
            onClick={() => setCurrentPage("it-visitors")}
          >
            <Users size={14} />
            IT Visitors
          </button>'''

new_sidebar_it_visitors = '''          <button
            className={`sidebar-item ${currentPage === "it-visitors" ? "active" : ""}`}
            onClick={() => setCurrentPage("it-visitors")}
          >
            <Users size={14} />
            IT Visitors
          </button>
          <button
            className={`sidebar-item ${currentPage === "it-notifications" ? "active" : ""}`}
            onClick={() => setCurrentPage("it-notifications")}
          >
            <BellRing size={14} />
            IT Notifications
            {itUnreadCount > 0 && (
              <span
                className="notification-count"
                style={{
                  background: "#7c3aed",
                  color: "white",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  marginLeft: "auto",
                }}
              >
                {itUnreadCount}
              </span>
            )}
          </button>'''

if old_sidebar_it_visitors not in text:
    print("ERROR: old_sidebar_it_visitors not found!")
    sys.exit(1)
text = text.replace(old_sidebar_it_visitors, new_sidebar_it_visitors, 1)

# 5. Update main content router
old_router_notif = '{currentPage === "notifications" && renderNotifications()}'
new_router_notif = '''{currentPage === "notifications" && renderNotifications()}
        {currentPage === "it-notifications" && renderITNotifications()}'''

if old_router_notif not in text:
    print("ERROR: old_router_notif not found!")
    sys.exit(1)
text = text.replace(old_router_notif, new_router_notif, 1)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS: App.jsx updated with IT Notifications and separated General Notifications!")
