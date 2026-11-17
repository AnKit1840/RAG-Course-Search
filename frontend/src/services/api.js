// Centralized API service with credentials: 'include' for cookie-based auth
const API_BASE = 'http://localhost:5000';

/**
 * Wrapper around fetch that always includes credentials (cookies).
 */
async function apiFetch(endpoint, options = {}) {
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  };

  // Only set Content-Type for JSON bodies (not for FormData — browser sets it automatically)
  if (options.body && !(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  return response;
}

// ---- Auth API ----

export async function login(username, password) {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function register(username, password, role = 'user') {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function logout() {
  const res = await apiFetch('/api/auth/logout', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Logout failed');
  return data;
}

export async function getMe() {
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) return null;   // not logged in — that's fine
  const data = await res.json();
  return data.user;
}

// ---- Search API (public) ----

export async function searchRAG(query) {
  if (!query || query.trim() === '') {
    return {
      answer: 'Please ask a question related to your video course playlist.',
      sources: [],
    };
  }

  try {
    const res = await apiFetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Search API failure:', error);
    return {
      answer: `⚠️ Connection Error: Failed to reach the backend server.\n\nMake sure the Express server is running on port 5000. (Details: ${error.message})`,
      sources: [],
    };
  }
}

// ---- Admin API ----

export async function uploadVideo(file) {
  const formData = new FormData();
  formData.append('video', file);

  const res = await apiFetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(`Upload failed with status ${res.status}`);
  }

  return await res.json();
}

export async function getJobs() {
  const res = await apiFetch('/api/admin/jobs');
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(`Failed to fetch jobs: ${res.status}`);
  }
  return await res.json();
}

export async function getVideos() {
  const res = await apiFetch('/api/admin/videos');
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(`Failed to fetch videos: ${res.status}`);
  }
  return await res.json();
}

// ---- Utilities ----

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
