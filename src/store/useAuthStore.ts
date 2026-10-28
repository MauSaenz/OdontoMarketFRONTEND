/**
 * Estado Global de Autenticación y Sesión con Zustand (`src/store/useAuthStore.ts`).
 * Gestiona en memoria y en `localStorage`:
 * 1. El objeto `user` (Odontólogo comprador o Depósito Dental vendedor con su `vendor_profile`).
 * 2. El token JWT (`token`), sincronizado con `TOKEN_STORAGE_KEY` para que el interceptor
 *    de Axios en `src/services/api.ts` lo inyecte automáticamente en cada petición.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService, TOKEN_STORAGE_KEY } from "@/services/api";
import type { LoginPayload, RegisterPayload, User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Acciones para mutar el estado global de sesión
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (payload: LoginPayload) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(payload);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
          }
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          return response.user;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (payload: RegisterPayload) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(payload);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
          }
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          return response.user;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      refreshProfile: async () => {
        const currentToken =
          get().token ||
          (typeof window !== "undefined"
            ? window.localStorage.getItem(TOKEN_STORAGE_KEY)
            : null);

        if (!currentToken) {
          return;
        }

        try {
          const freshUser = await authService.getMe();
          set({
            user: freshUser,
            token: currentToken,
            isAuthenticated: true,
          });
        } catch {
          // Si el token expiró o es inválido, limpiamos la sesión de forma segura
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(TOKEN_STORAGE_KEY);
          }
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      logout: () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "odontomarket-auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
