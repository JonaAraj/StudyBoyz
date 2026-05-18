// ============================================================
// authService.ts — Servicio de autenticación (Front-end)
// Maneja login, registro, sesión persistente con AsyncStorage
// Adaptable a cualquier proyecto Expo/React Native
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "./apiConfig";

const STORAGE_KEYS = {
  TOKEN: "@studyboyz_token",
  USER: "@studyboyz_user",
};

// ── Tipos ────────────────────────────────────────────────────
export interface User {
  id: number;
  userName: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

// ── Helper: fetch con headers base ──────────────────────────
const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
};

// ── AUTH SERVICE ─────────────────────────────────────────────
const authService = {
  /**
   * Inicia sesión con userName/email y password
   * Guarda el token y datos del usuario en AsyncStorage
   */
  async login(identifier: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.token && data.user) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(data.user),
        );
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: "No se pudo conectar con el servidor. Verifica tu conexión.",
      };
    }
  },

  /**
   * Registra un nuevo usuario
   */
  async register(
    userName: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    try {
      const response = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ userName, email, password }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.token && data.user) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(data.user),
        );
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: "No se pudo conectar con el servidor. Verifica tu conexión.",
      };
    }
  },

  /**
   * Cierra la sesión y limpia el almacenamiento local
   */
  async logout(): Promise<void> {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (_) {
      // Aunque falle el servidor, limpiamos localmente
    } finally {
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
    }
  },

  /**
   * Devuelve el usuario guardado localmente (sin llamada al servidor)
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Devuelve el token almacenado
   */
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  /**
   * Verifica si hay una sesión activa (token presente)
   * Opcionalmente valida con el servidor
   */
  async isAuthenticated(validateWithServer = false): Promise<boolean> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return false;

    if (validateWithServer) {
      try {
        const response = await apiFetch("/auth/me");
        return response.ok;
      } catch {
        return false;
      }
    }

    return true;
  },

  /**
   * Obtiene el perfil actualizado desde el servidor
   */
  async getProfile(): Promise<User | null> {
    try {
      const response = await apiFetch("/auth/me");
      const data = await response.json();
      if (data.success && data.user) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(data.user),
        );
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  },
};

export default authService;
