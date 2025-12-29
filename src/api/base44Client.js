const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://api.vertical-holdings.dev';
const LOGIN_URL =
  import.meta.env.VITE_AUTH_LOGIN_URL || `${API_BASE_URL}/auth/login`;
const LOGOUT_URL =
  import.meta.env.VITE_AUTH_LOGOUT_URL || `${API_BASE_URL}/auth/logout`;
const SERVICE_API_KEY = import.meta.env.VITE_SERVICE_API_KEY || '';

const AUTH_STORAGE_KEY = 'vh_access_token';

const getAuthToken = () => localStorage.getItem(AUTH_STORAGE_KEY);
const setAuthToken = (token) => {
  if (!token) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, token);
};

const buildHeaders = ({ extra = {}, useService = false } = {}) => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(useService && SERVICE_API_KEY
      ? { Authorization: `Bearer ${SERVICE_API_KEY}` }
      : {}),
    ...(!useService && token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    const error = new Error(message || 'Request failed');
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
};

const request = async (path, options = {}, { useService = false } = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: buildHeaders({ extra: options.headers, useService }),
  });
  return handleResponse(res);
};

const entityClient = (resource, { useService = false } = {}) => ({
  list: (orderBy = '-created_at', limit) =>
    request(
      `/entities/${resource}${
        orderBy ? `?orderBy=${encodeURIComponent(orderBy)}` : ''
      }${limit ? `&limit=${limit}` : ''}`,
      { method: 'GET' },
      { useService },
    ),
  filter: (filters = {}, orderBy = '-created_at', limit) =>
    request(
      `/entities/${resource}/filter`,
      {
        method: 'POST',
        body: JSON.stringify({ filters, orderBy, limit }),
      },
      { useService },
    ),
  create: (data) =>
    request(
      `/entities/${resource}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      { useService },
    ),
  update: (id, data) =>
    request(
      `/entities/${resource}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      { useService },
    ),
});

const proxyEntities = (useService = false) =>
  new Proxy(
    {},
    {
      get: (_target, prop) => entityClient(prop.toString(), { useService }),
    },
  );

const functionsClient = (useService = false) => ({
  invoke: (name, payload = {}) =>
    request(
      `/functions/${name}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { useService },
    ),
});

const authClient = {
  me: () => request('/auth/me'),
  login: async (credentials) => {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (result?.token) {
      setAuthToken(result.token);
    }
    return result?.user || result;
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request failed', err);
    }
    setAuthToken(null);
    if (typeof window !== 'undefined') {
      window.location.href = LOGOUT_URL;
    }
  },
  redirectToLogin: (returnTo) => {
    const url = new URL(LOGIN_URL);
    if (returnTo) url.searchParams.set('return_to', returnTo);
    window.location.href = url.toString();
  },
};

const ledger = {
  list: (filters = {}) =>
    request('/ledger/filter', {
      method: 'POST',
      body: JSON.stringify(filters),
    }),
  create: (entry) =>
    request('/ledger', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),
};

const wallet = {
  balance: () => request('/wallet/balance'),
  deposit: (payload) =>
    request('/wallet/deposit', { method: 'POST', body: JSON.stringify(payload) }),
  withdraw: (payload) =>
    request('/wallet/withdraw', { method: 'POST', body: JSON.stringify(payload) }),
};

const rng = {
  requestSeed: (payload) =>
    request('/rng/seed', { method: 'POST', body: JSON.stringify(payload) }, { useService: true }),
  verifyProof: (payload) =>
    request('/rng/verify', { method: 'POST', body: JSON.stringify(payload) }, { useService: true }),
};

const audit = {
  logAction: (entry) =>
    request('/audit', { method: 'POST', body: JSON.stringify(entry) }, { useService: true }),
};

const appLogs = {
  logUserInApp: (pageName) =>
    request('/logs/navigation', {
      method: 'POST',
      body: JSON.stringify({ page: pageName, at: new Date().toISOString() }),
    }),
};

const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: buildHeaders(),
        body: form,
      });
      return handleResponse(res);
    },
  },
};

export const base44 = {
  auth: authClient,
  entities: proxyEntities(false),
  asServiceRole: { entities: proxyEntities(true), functions: functionsClient(true) },
  functions: functionsClient(false),
  ledger,
  wallet,
  rng,
  audit,
  appLogs,
  integrations,
};

export const platformClient = base44;
