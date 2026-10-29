// Centralized authentication storage for VMS
// Uses sessionStorage so each browser tab has an isolated session.
// This allows running multiple different accounts in separate tabs simultaneously
// without page refreshes overwriting each other.

const VMS_TOKEN_KEY = "vms_token";
const VMS_USER_KEY = "vms_user";
const GUARD_TOKEN_KEY = "guard_token";
const GUARD_USER_KEY = "guard_user";

export const authStorage = {
  getVmsToken: () => {
    try {
      const sessionVal = sessionStorage.getItem(VMS_TOKEN_KEY);
      if (sessionVal) return sessionVal;
      // One-time migration from localStorage if present
      const localVal = localStorage.getItem(VMS_TOKEN_KEY);
      if (localVal) {
        sessionStorage.setItem(VMS_TOKEN_KEY, localVal);
        try { localStorage.removeItem(VMS_TOKEN_KEY); } catch {}
        return localVal;
      }
    } catch (e) {
      console.warn("authStorage.getVmsToken error:", e);
    }
    return null;
  },

  setVmsToken: (token) => {
    try {
      if (token) {
        sessionStorage.setItem(VMS_TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(VMS_TOKEN_KEY);
      }
      localStorage.removeItem(VMS_TOKEN_KEY);
    } catch (e) {
      console.warn("authStorage.setVmsToken error:", e);
    }
  },

  getVmsUser: () => {
    try {
      let raw = sessionStorage.getItem(VMS_USER_KEY);
      if (!raw) {
        raw = localStorage.getItem(VMS_USER_KEY);
        if (raw) {
          sessionStorage.setItem(VMS_USER_KEY, raw);
          try { localStorage.removeItem(VMS_USER_KEY); } catch {}
        }
      }
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("authStorage.getVmsUser error:", e);
      return null;
    }
  },

  setVmsUser: (user) => {
    try {
      if (user) {
        sessionStorage.setItem(
          VMS_USER_KEY,
          typeof user === "string" ? user : JSON.stringify(user)
        );
      } else {
        sessionStorage.removeItem(VMS_USER_KEY);
      }
      localStorage.removeItem(VMS_USER_KEY);
    } catch (e) {
      console.warn("authStorage.setVmsUser error:", e);
    }
  },

  clearVmsAuth: () => {
    try {
      sessionStorage.removeItem(VMS_TOKEN_KEY);
      sessionStorage.removeItem(VMS_USER_KEY);
      localStorage.removeItem(VMS_TOKEN_KEY);
      localStorage.removeItem(VMS_USER_KEY);
    } catch (e) {
      console.warn("authStorage.clearVmsAuth error:", e);
    }
  },

  getGuardToken: () => {
    try {
      const sessionVal = sessionStorage.getItem(GUARD_TOKEN_KEY);
      if (sessionVal) return sessionVal;
      const localVal = localStorage.getItem(GUARD_TOKEN_KEY);
      if (localVal) {
        sessionStorage.setItem(GUARD_TOKEN_KEY, localVal);
        try { localStorage.removeItem(GUARD_TOKEN_KEY); } catch {}
        return localVal;
      }
    } catch (e) {
      console.warn("authStorage.getGuardToken error:", e);
    }
    return null;
  },

  setGuardToken: (token) => {
    try {
      if (token) {
        sessionStorage.setItem(GUARD_TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(GUARD_TOKEN_KEY);
      }
      localStorage.removeItem(GUARD_TOKEN_KEY);
    } catch (e) {
      console.warn("authStorage.setGuardToken error:", e);
    }
  },

  getGuardUser: () => {
    try {
      let raw = sessionStorage.getItem(GUARD_USER_KEY);
      if (!raw) {
        raw = localStorage.getItem(GUARD_USER_KEY);
        if (raw) {
          sessionStorage.setItem(GUARD_USER_KEY, raw);
          try { localStorage.removeItem(GUARD_USER_KEY); } catch {}
        }
      }
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("authStorage.getGuardUser error:", e);
      return null;
    }
  },

  setGuardUser: (user) => {
    try {
      if (user) {
        sessionStorage.setItem(
          GUARD_USER_KEY,
          typeof user === "string" ? user : JSON.stringify(user)
        );
      } else {
        sessionStorage.removeItem(GUARD_USER_KEY);
      }
      localStorage.removeItem(GUARD_USER_KEY);
    } catch (e) {
      console.warn("authStorage.setGuardUser error:", e);
    }
  },

  clearGuardAuth: () => {
    try {
      sessionStorage.removeItem(GUARD_TOKEN_KEY);
      sessionStorage.removeItem(GUARD_USER_KEY);
      localStorage.removeItem(GUARD_TOKEN_KEY);
      localStorage.removeItem(GUARD_USER_KEY);
    } catch (e) {
      console.warn("authStorage.clearGuardAuth error:", e);
    }
  },

  getAnyToken: () => {
    try {
      return (
        sessionStorage.getItem(VMS_TOKEN_KEY) ||
        sessionStorage.getItem(GUARD_TOKEN_KEY) ||
        localStorage.getItem(VMS_TOKEN_KEY) ||
        localStorage.getItem(GUARD_TOKEN_KEY) ||
        ""
      );
    } catch {
      return "";
    }
  },
};

export default authStorage;

