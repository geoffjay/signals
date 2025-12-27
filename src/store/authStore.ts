import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pb, type PBUser } from "@/lib/pocketbase";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (user: User) => void;
  logout: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: "google" | "github") => Promise<void>;
  checkAuth: () => void;
  clearError: () => void;
}

// Helper to transform PocketBase user to app User
const transformPBUser = (pbUser: PBUser | null): User | null => {
  if (!pbUser) return null;
  return {
    id: pbUser.id,
    email: pbUser.email,
    name: pbUser.name || pbUser.username || pbUser.email.split("@")[0],
    avatar: pbUser.avatar ? pb.files.getUrl(pbUser, pbUser.avatar) : undefined,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: (user: User) =>
        set({
          user,
          isAuthenticated: true,
          error: null,
        }),

      logout: async () => {
        try {
          pb.authStore.clear();
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        } catch (error) {
          console.error("Logout error:", error);
          // Force logout even if error
          pb.authStore.clear();
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      loginWithEmail: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const authData = await pb
            .collection("users")
            .authWithPassword(email, password);
          const user = transformPBUser(authData.record as unknown as PBUser);

          if (user) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error("Failed to transform user data");
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Login failed";
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      loginWithOAuth: async (provider: "google" | "github") => {
        set({ isLoading: true, error: null });
        try {
          const authData = await pb
            .collection("users")
            .authWithOAuth2({ provider });
          const user = transformPBUser(authData.record as unknown as PBUser);

          if (user) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error("Failed to transform user data");
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "OAuth login failed";
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      checkAuth: () => {
        // Check if PocketBase has valid auth token
        if (pb.authStore.isValid && pb.authStore.model) {
          const user = transformPBUser(pb.authStore.model as unknown as PBUser);
          if (user) {
            set({
              user,
              isAuthenticated: true,
              error: null,
            });
          }
        } else {
          // Token expired or invalid
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      // Partial persist - don't persist isLoading or error states
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Initialize auth state from PocketBase on app load
if (pb.authStore.isValid && pb.authStore.model) {
  const user = transformPBUser(pb.authStore.model as unknown as PBUser);
  if (user) {
    useAuthStore.setState({
      user,
      isAuthenticated: true,
    });
  }
}

// Listen to PocketBase auth changes (logout from other tab, token refresh, etc.)
pb.authStore.onChange(() => {
  if (pb.authStore.isValid && pb.authStore.model) {
    const user = transformPBUser(pb.authStore.model as unknown as PBUser);
    if (user) {
      useAuthStore.setState({
        user,
        isAuthenticated: true,
      });
    }
  } else {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    });
  }
});
