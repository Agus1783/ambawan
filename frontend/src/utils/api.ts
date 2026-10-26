const BASE_URL = globalThis.process.env.BASE_URL;

function getAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('accessToken');
}

function putAccessToken(token) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('accessToken', token);
}

function removeAccessToken(token) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(token);
}

async function _fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers
  });
}

async function register({ name, email, password }) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({ name, email, password })
  });

  const responseJson = await response.json();

  if (!response.ok) {
    throw new Error(responseJson.message);
  }

  return responseJson.data;
}

async function login({ email, password }) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const responseJson = await response.json();

  if (!response.ok) {
    throw new Error(responseJson.message)
  }

  putAccessToken(responseJson.data.token);

  return responseJson.data;
}

const api = {
  getAccessToken,
  putAccessToken,
  removeAccessToken,
  _fetchWithAuth,
  register,
  login
}

export default api;
