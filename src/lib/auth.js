// src/lib/auth.js

const isBrowser = typeof window !== "undefined";

export function saveAuth({ token, username, user_id, expires_in }) {
  if (!isBrowser) return;

  if (token) localStorage.setItem("token", token);
  if (username) localStorage.setItem("username", username);
  if (user_id) localStorage.setItem("user_id", user_id);

  if (expires_in) {
    const expiry = Date.now() + Number(expires_in) * 1000;
    localStorage.setItem("tokenExpiry", String(expiry));
  }
}

export function getToken() {
  if (!isBrowser) return null;

  const token = localStorage.getItem("token");
  const expiry = localStorage.getItem("tokenExpiry");

  if (expiry && Date.now() > Number(expiry)) {
    clearAuth();
    return null;
  }
  return token;
}

export function clearAuth() {
  if (!isBrowser) return;

  localStorage.removeItem("token");
  localStorage.removeItem("tokenExpiry");
  localStorage.removeItem("username");
  localStorage.removeItem("user_id");
}

export function isAuthed() {
  if (!isBrowser) return false;
  return !!getToken();
}
