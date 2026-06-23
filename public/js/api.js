const API_ROOT = "/api";
const STORAGE_KEY = "neon-hell-session";

async function request(path, options = {}) {
  let response;
  const { headers = {}, ...fetchOptions } = options;

  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  } catch (error) {
    throw new Error("Backend offline. Inicia el servidor en http://localhost:3000.");
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

function authHeaders() {
  const session = getSession();

  return session?.token
    ? { Authorization: `Bearer ${session.token}` }
    : {};
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

export async function fetchProfile() {
  return request("/auth/me", {
    headers: authHeaders(),
  });
}

export async function fetchTopScores(scope = "global") {
  return request(`/scores/top?scope=${encodeURIComponent(scope)}`, {
    headers: authHeaders(),
  });
}

export async function fetchSocialDashboard() {
  return request("/scores/social", {
    headers: authHeaders(),
  });
}

export async function fetchSquadLeaderboard() {
  return request("/scores/squads", {
    headers: authHeaders(),
  });
}

export async function fetchProductDashboard() {
  return request("/product/dashboard", {
    headers: authHeaders(),
  });
}

export async function purchaseProduct(itemId) {
  return request(`/product/purchase/${encodeURIComponent(itemId)}`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function fetchLiveOps() {
  return request("/product/liveops");
}

export async function fetchSquads() {
  return request("/squads", {
    headers: authHeaders(),
  });
}

export async function createSquad(name) {
  return request("/squads", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
}

export async function inviteSquadMember(squadKey, username) {
  return request(`/squads/${encodeURIComponent(squadKey)}/invites/${encodeURIComponent(username)}`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function acceptSquadInvite(squadKey) {
  return request(`/squads/${encodeURIComponent(squadKey)}/accept`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function trackAnalytics(type, properties = {}) {
  return request("/analytics/events", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ type, properties }),
  });
}

export async function fetchAdminAnalytics(adminToken) {
  return request("/admin/analytics", {
    headers: {
      ...authHeaders(),
      "x-admin-token": adminToken,
    },
  });
}

export async function updateAdminConfig(adminToken, key, value) {
  return request(`/admin/liveops/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({ value }),
  });
}

export async function saveScore(scoreData) {
  return request("/scores", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(scoreData),
  });
}

export async function addFriend(username) {
  const payload = await request(`/auth/friends/${encodeURIComponent(username)}`, {
    method: "POST",
    headers: authHeaders(),
  });
  const session = getSession();

  if (session?.token && payload?.user) {
    setSession({
      ...session,
      user: payload.user,
    });
  }

  return payload;
}

export async function createChallenge(username) {
  return request(`/scores/challenges/${encodeURIComponent(username)}`, {
    method: "POST",
    headers: authHeaders(),
  });
}
