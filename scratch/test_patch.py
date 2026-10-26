import sys

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update markAllNotificationsAsRead and clearNotifications
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

if old_mark_and_clear not in content:
    print("ERROR: old_mark_and_clear not found!")
    # Check normalized
    if old_mark_and_clear.replace('\r\n', '\n') in content.replace('\r\n', '\n'):
        print("Found with LF normalization")
    sys.exit(1)
else:
    print("Found old_mark_and_clear")
