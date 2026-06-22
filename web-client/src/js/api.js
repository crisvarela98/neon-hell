const SERVER_URL = (import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");
const API_ROOT = SERVER_URL ? `${SERVER_URL}/api` : "/api";
const STORAGE_KEY = "neon-hell-session";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_ROOT}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (error) {
    throw new Error(
      SERVER_URL
        ? "No se pudo conectar con el backend. Revisa que Render este activo y VITE_SERVER_URL sea correcto."
        : "Backend offline. Inicia el servidor en http://localhost:3000 o configura VITE_SERVER_URL en Vercel.",
    );
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (!payload.message && [502, 503, 504].includes(response.status)) {
      throw new Error("Backend offline. Inicia el servidor en http://localhost:3000.");
    }

    throw new Error(payload.message || `Error de API (${response.status}).`);
  }

  return payload;
}

export function getSession() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function registerUser(formData) {
  const payload = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(formData),
  });

  setSession(payload);
  return payload;
}

export async function loginUser(formData) {
  const payload = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(formData),
  });

  setSession(payload);
  return payload;
}

export async function fetchTopScores() {
  return request("/scores/top");
}

export async function saveScore(scoreData) {
  const session = getSession();

  return request("/scores", {
    method: "POST",
    headers: session?.token
      ? { Authorization: `Bearer ${session.token}` }
      : {},
    body: JSON.stringify(scoreData),
  });
}
