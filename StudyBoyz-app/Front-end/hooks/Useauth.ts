// ============================================================
// useAuth.ts — Hook de autenticación para React Native / Expo
// Maneja estado global de sesión, login, registro y logout
// ============================================================

import { useState, useEffect, useCallback } from "react";
import authService from "../services/Authservice";
import type { User } from "../services/Authservice";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (
    userName: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // ── Al montar: revisar si hay sesión guardada ─────────────
  useEffect(() => {
    const checkSession = async () => {
      const user = await authService.getStoredUser();
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
        error: null,
      });
    };
    checkSession();
  }, []);

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(
    async (identifier: string, password: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await authService.login(identifier, password);

      if (result.success && result.user) {
        setState({
          user: result.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.message,
        }));
        return false;
      }
    },
    [],
  );

  // ── Registro ──────────────────────────────────────────────
  const register = useCallback(
    async (
      userName: string,
      email: string,
      password: string,
    ): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await authService.register(userName, email, password);

      if (result.success && result.user) {
        setState({
          user: result.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.message,
        }));
        return false;
      }
    },
    [],
  );

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await authService.logout();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  // ── Limpiar errores ───────────────────────────────────────
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ── Refrescar perfil desde servidor ──────────────────────
  const refreshUser = useCallback(async (): Promise<void> => {
    const user = await authService.getProfile();
    if (user) {
      setState((prev) => ({ ...prev, user }));
    }
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };
};

export default useAuth;
