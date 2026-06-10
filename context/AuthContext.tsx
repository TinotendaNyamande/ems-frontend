"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { login,register as apiRegister, refreshToken, logoutUser, AuthResponse } from "@/services/auth";
import { jwtDecode, JwtPayload } from "jwt-decode";


export type UserPermission = {
  permissionKey: string;
  isAllowed: boolean;
};
type User = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  organisationId: string;
  permissions: UserPermission[];
};

type DecodedJwt = JwtPayload & {
  exp?: number;
  Role?: string;
  role?: string;
  FirstName?: string;
  [key: string]: unknown;
   OrganisationId:string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  rfToken:string|null;
  isAuthReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, FirstName: string, LastName: string) => Promise<void>;
  updateUserProfile: (firstName: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const MAX_TIMEOUT_MS = 2_147_483_647;

function getRefreshTimeout(expSeconds: number) {
  return expSeconds * 1000 - Date.now() - 30_000;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rfToken, setRfToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const refreshTimeoutRef = useRef<number | null>(null);
  const logoutInProgressRef = useRef(false);
  const authMutationVersionRef = useRef(0);

  const setTokenStorage = (jwt: string,refreshJwt:string|null) => {
    setToken(jwt);
    setRfToken(refreshJwt);
    scheduleTokenRefresh(jwt);
  };

  const clearTokenStorage = () => {
    setToken(null);
    setUser(null);
    setRfToken(null);
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  };

  const scheduleTokenRefresh = (jwt: string) => {
    try {
      const decoded = jwtDecode<DecodedJwt>(jwt);
      const expSeconds = Number(decoded?.exp);
      if (!Number.isFinite(expSeconds)) {
        logout();
        return;
      }

      const timeout = getRefreshTimeout(expSeconds);

      if (timeout <= 0) {
        void refreshAccessToken();
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      if (timeout > MAX_TIMEOUT_MS) {
        refreshTimeoutRef.current = window.setTimeout(() => scheduleTokenRefresh(jwt), MAX_TIMEOUT_MS);
        return;
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        void refreshAccessToken();
      }, timeout);
    } catch {
      void logout();
    }
  };

  const refreshAccessToken = async (mode: "logout" | "clear" = "logout") => {
    const versionAtStart = authMutationVersionRef.current;
    try {
      if (logoutInProgressRef.current) return;
      const res = await refreshToken();
      hydrateFromResponse(res);
    } catch {
      if (mode === "logout") {
        await logout();
      } else {
        if (authMutationVersionRef.current !== versionAtStart) {
          return;
        }
        try {
          await logoutUser();
        } catch {
          // Ignore cleanup failure.
        }
        clearTokenStorage();
      }
    } finally {
      setIsAuthReady(true);
    }
  };

  const hydrateFromResponse = (response: AuthResponse) => {
    authMutationVersionRef.current += 1;
    const jwt = response.token;
    const decodedToken = jwtDecode<DecodedJwt>(jwt);
    const claimRole = decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    const role =
      decodedToken.Role ||
      decodedToken.role ||
      (typeof claimRole === "string" ? claimRole : undefined);
    setUser({
      id: response.userId,
      email: response.email,
      role: response.role ?? role ?? "",
      firstName: decodedToken.FirstName ?? "",
      organisationId: decodedToken.OrganisationId ?? "",
      permissions: response.permissions ?? [],
    });
    setTokenStorage(jwt,response.refreshToken);
    setIsAuthReady(true);
  };

  const loginUser = async (email: string, password: string) => {
    const res = await login(email, password);
    hydrateFromResponse(res);
  };


  const registerUser = async (email: string, password: string, firstName: string, LastName: string) => {
    const res = await apiRegister(email, password, firstName, LastName);
    hydrateFromResponse(res);
  };

  const logout = async () => {
    try {
      logoutInProgressRef.current = true;
      await logoutUser();
      clearTokenStorage();
    } finally {
      logoutInProgressRef.current = false;
    }
  };

  const updateUserProfile = (firstName: string) => {
    setUser((prev) => (prev ? { ...prev, firstName } : prev));
  };

  useEffect(() => {
    void refreshAccessToken("clear");
    // Initial auth hydration should run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, token,rfToken, isAuthReady, login: loginUser,register: registerUser, updateUserProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
