import { BASE_URL } from "./helper";

export type AuthResponse = {
  token: string;
  email: string;
  userId: string;
  refreshToken: string;
  role:string;
  permissions?: {
    permissionKey: string;
    isAllowed: boolean;
  }[];
};


export type ChangePasswordPayload = {
  email: string;
  userId: string;
  password: string;
  newPassword: string;
};

export type ProfileResponse = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  currentPassword?: string;
  newPassword?: string;
};

export type ForgotPasswordPayload = {
  email: string;
  resetUrlBase: string;
};

export type ResetPasswordPayload = {
  email: string;
  token: string;
  newPassword: string;
};

export type ReportIssuePayload = {
  message: string;
  email?: string;
  pageUrl?: string;
};

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "X-CSRF-Token";

const getCookieValue = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((value) => value.startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] ?? null : null;
};

const getCsrfHeaders = (): HeadersInit => {
  const csrfToken = getCookieValue(CSRF_COOKIE_NAME);
  return csrfToken ? { [CSRF_HEADER_NAME]: decodeURIComponent(csrfToken) } : {};
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  })
  const data = await response.json();
  if (response.ok) {
    return data;
  } else {
    throw new Error(data.detail)
  }

};

export const refreshToken = async (): Promise<AuthResponse> => {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
    body: JSON.stringify({}),
    credentials: "include",
  })
  const data = await response.json();
  if (response.ok) {
    return data;
  } else {
    throw new Error(data.detail)
  }
};



export const register = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AuthResponse> => {

  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, firstName, lastName }),
    credentials: "include",
  })
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail)
  }
  return data;
};


export const logoutUser = async (): Promise<void> => {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
    body: JSON.stringify({}),
    credentials: "include",
  })

};


export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    if (typeof decoded.exp !== "number") return true;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const getProfile = async (token: string, userId: string): Promise<ProfileResponse> => {
  const response = await fetch(`${BASE_URL}/auth/profile/${userId}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail);
  }
  return data;
};
export const changePassword = async (payload: ChangePasswordPayload, token: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail);
  }
};