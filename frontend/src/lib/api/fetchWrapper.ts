export const API_BASE_URL = "http://localhost:3000";

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

export interface ResponseFields {
  error?: string;
  status: number;
}

export async function fetchWrapper(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("token");
  const tokenExpiresAt = localStorage.getItem("tokenExpiresAt");

  // Check if token is expired
  if (tokenExpiresAt && new Date(tokenExpiresAt) < new Date()) {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiresAt");
    window.location.href = "/login";
    throw new Error("Token expired");
  }

  // If the body is FormData, don't set the Content-Type header
  const isFormData = options.body instanceof FormData;
  const defaultHeaders: HeadersInit = isFormData
    ? {}
    : { "Content-Type": "application/json" };

  const headers = {
    ...defaultHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    return {
      error: response.ok ? undefined : "Failed to parse JSON response",
      status: response.status,
    };
  }

  if (!response.ok) {
    const errorMessage = data?.error || response.statusText;
    console.error(
      `Request failed with status ${response.status}: ${errorMessage}`
    );
    data.error = errorMessage;
  }

  data.status = response.status;
  return data;
}

// Helper functions for common API calls
export const api = {
  // Auth
  login: (utorid: string, password: string): Promise<LoginResponse> =>
    fetchWrapper("/auth/tokens", {
      method: "POST",
      body: JSON.stringify({ utorid, password }),
    }),

  // User
  getCurrentUser: () => fetchWrapper("/users/me"),
  updateProfile: (data: ProfileUpdateData) =>
    fetchWrapper("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  updatePassword: (oldPassword: string, newPassword: string) =>
    fetchWrapper("/users/me/password", {
      method: "PATCH",
      body: JSON.stringify({ old: oldPassword, new: newPassword }),
    }),

  // Points
  getPoints: () => fetchWrapper("/points"),

  // Transactions
  getTransactions: (params?: Record<string, string>) => {
    const queryString = params
      ? "?" + new URLSearchParams(params).toString()
      : "";
    return fetchWrapper(`/transactions${queryString}`);
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiresAt");
  },
};
