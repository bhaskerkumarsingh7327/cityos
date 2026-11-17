import { useAuthStore } from "@/store/useAuthStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Thin fetch wrapper that unwraps CityOS's standardized API response
 * envelope and throws a typed error on failure, so callers (TanStack Query
 * hooks) can just `await apiRequest<T>(...)` without re-checking `success`.
 */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authStore = useAuthStore.getState();
  const currentRole = authStore.user?.role || "CITIZEN";
  const currentEmail = authStore.user?.email || "citizen@cityos.local";
  const token = authStore.token;

  const authHeaders: Record<string, string> = {
    "X-User-Role": currentRole,
    "X-User-Email": currentEmail,
  };

  if (token && token !== "demo-jwt-token") {
    authHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
    credentials: "include",
    ...options,
  });

  const body = (await res.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ApiClientError(body.error.code, body.error.message, body.error.details);
  }

  return body.data;
}
