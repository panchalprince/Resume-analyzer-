import { UserProfile } from "../types.js";

const AUTH_TOKEN_KEY = "sp_resumai_auth_token";
const AUTH_USER_KEY = "sp_resumai_auth_user";

/**
 * Retrieves the configured backend API base URL.
 * Checks VITE_API_URL, VITE_BACKEND_URL, and VITE_API_BASE_URL.
 * When empty, relative URLs (same-origin) are used.
 */
export function getApiBaseUrl(): string {
  const envUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";

  if (typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "";
}

/**
 * Builds the full endpoint URL using the configured API base URL.
 */
export function buildApiUrl(endpointPath: string): string {
  const base = getApiBaseUrl();
  const cleanPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  return `${base}${cleanPath}`;
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession(user: UserProfile, token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn("[Auth] Failed to persist session to storage:", err);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (err) {
    console.warn("[Auth] Failed to clear session from storage:", err);
  }
}

/**
 * Safe Auth fetch handler with detailed diagnostic feedback for Amplify & static deployments.
 */
async function fetchAuthEndpoint(
  endpoint: string,
  payload?: any,
): Promise<{ user: UserProfile; token: string }> {
  const fullUrl = buildApiUrl(endpoint);
  console.log(`[Auth] Initiating request to: ${fullUrl}`);

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
  } catch (netErr: any) {
    console.error(`[Auth] Network fetch error connecting to ${fullUrl}:`, netErr);
    throw new Error(
      `Network error: Unable to connect to backend server. Please verify your backend server is active and CORS is allowed.`
    );
  }

  console.log(`[Auth] Response status: ${res.status} ${res.statusText} from ${fullUrl}`);

  const text = await res.text();
  const trimmed = text.trim();
  const isHtml =
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<head");

  if (isHtml) {
    console.error(`[Auth] Received HTML page from ${fullUrl} instead of JSON API response.`);
    throw new Error(
      `Server returned an HTML response instead of JSON. If deployed on AWS Amplify, please set the VITE_API_URL environment variable to your production backend server URL.`
    );
  }

  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    console.error(`[Auth] JSON parse error from server response:`, text);
    throw new Error(`Unexpected server response format (Status ${res.status}).`);
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(data?.error || "Invalid email or password.");
    }
    if (res.status === 409) {
      throw new Error(data?.error || "An account with this email already exists.");
    }
    if (res.status === 404) {
      throw new Error(
        data?.error || "Authentication endpoint not found. Please verify your backend URL."
      );
    }
    if (res.status >= 500) {
      throw new Error(
        data?.error || `Backend server error (${res.status}). Please check server logs.`
      );
    }
    throw new Error(data?.error || `Authentication failed with status ${res.status}.`);
  }

  if (!data?.user || !data?.token) {
    throw new Error("Invalid authentication response received from server.");
  }

  return { user: data.user, token: data.token };
}

/**
 * Real Account Login
 */
export async function loginWithEmail(
  email: string,
  password?: string,
): Promise<{ user: UserProfile; token: string }> {
  const result = await fetchAuthEndpoint("/api/auth/login", { email, password });
  setAuthSession(result.user, result.token);
  return result;
}

/**
 * Real Account Signup / Registration
 */
export async function signupWithEmail(
  email: string,
  fullName: string,
  password?: string,
): Promise<{ user: UserProfile; token: string }> {
  const result = await fetchAuthEndpoint("/api/auth/signup", {
    email,
    fullName,
    password,
  });
  setAuthSession(result.user, result.token);
  return result;
}

/**
 * Instant Demo Login (Zero Signup)
 */
export async function loginAsDemo(): Promise<{ user: UserProfile; token: string }> {
  const result = await fetchAuthEndpoint("/api/auth/demo-login");
  setAuthSession(result.user, result.token);
  return result;
}

/**
 * Verify active session with backend
 */
export async function verifySession(): Promise<UserProfile | null> {
  const token = getAuthToken();
  if (!token) return null;

  const fullUrl = buildApiUrl("/api/auth/me");
  try {
    const res = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (res.status === 401) {
      clearAuthSession();
      return null;
    }

    const text = await res.text();
    const trimmed = text.trim();
    if (
      trimmed.startsWith("<!DOCTYPE") ||
      trimmed.startsWith("<!doctype") ||
      trimmed.startsWith("<html")
    ) {
      return getStoredUser();
    }

    const data = JSON.parse(text);
    if (res.ok && data?.user) {
      setAuthSession(data.user, token);
      return data.user;
    }
  } catch (err) {
    console.warn("[Auth] Session verification error (using cached user):", err);
    return getStoredUser();
  }

  return null;
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  const token = getAuthToken();
  clearAuthSession();

  if (token) {
    try {
      const fullUrl = buildApiUrl("/api/auth/logout");
      await fetch(fullUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      // Ignore background logout network errors
    }
  }
}
