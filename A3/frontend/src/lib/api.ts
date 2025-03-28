const API_BASE_URL = 'http://localhost:3000';

interface LoginResponse {
  token: string;
  expiresAt: string;
}

interface ProfileUpdateData {
  name?: string;
  email?: string;
  birthday?: string;
  avatar?: File;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');

  // Check if token is expired
  if (tokenExpiresAt && new Date(tokenExpiresAt) < new Date()) {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiresAt');
    window.location.href = '/login';
    throw new Error('Token expired');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'API request failed');
  }

  return response.json();
}

// Helper functions for common API calls
export const api = {
  // Auth
  login: (utorid: string, password: string): Promise<LoginResponse> =>
    apiRequest('/auth/tokens', {
      method: 'POST',
      body: JSON.stringify({ utorid, password }),
    }),

  // User
  getCurrentUser: () => apiRequest('/users/me'),
  updateProfile: (data: ProfileUpdateData) =>
    apiRequest('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updatePassword: (oldPassword: string, newPassword: string) =>
    apiRequest('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ old: oldPassword, new: newPassword }),
    }),

  // Points
  getPoints: () => apiRequest('/points'),

  // Transactions
  getTransactions: (params?: Record<string, string>) => {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return apiRequest(`/transactions${queryString}`);
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiresAt');
  },
}; 