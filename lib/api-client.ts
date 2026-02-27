const BASE_URL = "/api";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function apiRequest(endpoint: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers,
  });

  return res;
}

export const apiClient = {
  get: (endpoint: string) => apiRequest(endpoint, { method: "GET" }),
  post: (endpoint: string, body: any) =>
    apiRequest(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) =>
    apiRequest(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint: string, body: any) =>
    apiRequest(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint: string) => apiRequest(endpoint, { method: "DELETE" }),
};

export const setAuthStore = (store: any) => {
  // No-op for compatibility if needed, or can be removed if not used elsewhere
};
