const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!options.body || typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || data.message || 'Erro na requisição');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => request('/api/profile'),

  updateProfile: (data) =>
    request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getVisits: (date) => request(`/api/visits${date ? `?date=${date}` : ''}`),

  createVisit: (data) =>
    request('/api/visits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateVisit: (id, data) =>
    request(`/api/visits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteVisit: (id) =>
    request(`/api/visits/${id}`, {
      method: 'DELETE',
    }),

  duplicateVisit: (id) =>
    request(`/api/visits/${id}/duplicate`, {
      method: 'POST',
    }),

  optimizeRoute: (data) =>
    request('/api/routes/optimize', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  saveRoute: (data) =>
    request('/api/routes/save', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getHistory: () => request('/api/routes/history'),

  getHistoryRoute: (id) => request(`/api/routes/history/${id}`),

  copyPreviousVisits: () =>
    request('/api/routes/copy-previous', {
      method: 'POST',
    }),

  getCheckoutLink: () => request('/api/checkout-link'),
};
