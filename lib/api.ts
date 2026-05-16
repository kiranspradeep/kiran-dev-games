import axios, { AxiosInstance, AxiosError } from "axios";
import type { AuthResponse, ApiResponse, User } from "@/types/auth";

// ── Create axios instance ─────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});

// ── Token management ──────────────────────────────────────────────────────────
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ── Request interceptor — attach token ────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Response interceptor — handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("ksp_refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          { refreshToken }
        );

        const { tokens } = response.data.data;
        setAccessToken(tokens.accessToken);
        localStorage.setItem("ksp_refresh_token", tokens.refreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        return api(originalRequest);
      } catch {
        // Refresh failed — clear auth state
        setAccessToken(null);
        localStorage.removeItem("ksp_refresh_token");
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: async (data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post("/api/auth/register", data);
    return res.data;
  },

  login: async (data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post("/api/auth/login", data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/api/auth/logout");
  },

  me: async (): Promise<ApiResponse<{ user: User }>> => {
    const res = await api.get("/api/auth/me");
    return res.data;
  },

  refresh: async (
    refreshToken: string
  ): Promise<ApiResponse<{ tokens: AuthResponse["tokens"] }>> => {
    const res = await api.post("/api/auth/refresh", { refreshToken });
    return res.data;
  },

  checkUsername: async (
    username: string
  ): Promise<ApiResponse<{ available: boolean }>> => {
    const res = await api.get(`/api/auth/check-username/${username}`);
    return res.data;
  },

  updateProfile: async (data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string | null;
    isPublic?: boolean;
  }): Promise<ApiResponse<{ user: Partial<User> }>> => {
    const res = await api.patch("/api/auth/profile", data);
    return res.data;
  },
};

// ── Scores API ────────────────────────────────────────────────────────────────
export const scoresApi = {
  submit: async (data: {
    gameId: string;
    score: number;
    metadata?: Record<string, unknown>;
  }) => {
    const res = await api.post("/api/scores", data);
    return res.data;
  },

  personal: async () => {
    const res = await api.get("/api/scores/personal");
    return res.data;
  },

  leaderboard: async (gameId: string, limit = 10, offset = 0) => {
    const res = await api.get("/api/scores/leaderboard", {
      params: { gameId, limit, offset },
    });
    return res.data;
  },

  history: async (gameId: string, limit = 10) => {
    const res = await api.get(`/api/scores/history/${gameId}`, {
      params: { limit },
    });
    return res.data;
  },
};

// ── Users API ─────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: async (username: string) => {
    const res = await api.get(`/api/users/${username}`);
    return res.data;
  },

  search: async (q: string, limit = 10) => {
    const res = await api.get("/api/users/search", { params: { q, limit } });
    return res.data;
  },

  getXp: async () => {
    const res = await api.get("/api/users/me/xp");
    return res.data;
  },
};

export default api;

// ── Notifications API ─────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: async (opts?: { unreadOnly?: boolean; limit?: number }) => {
    const res = await api.get("/api/notifications", { params: opts });
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get("/api/notifications/unread-count");
    return res.data.data.count;
  },

  markRead: async (ids: string[]) => {
    await api.post("/api/notifications/read", { ids });
  },

  markAllRead: async () => {
    await api.post("/api/notifications/read-all");
  },

  delete: async (id: string) => {
    await api.delete(`/api/notifications/${id}`);
  },

  clearRead: async () => {
    await api.delete("/api/notifications/clear/read");
  },
};

// ── Friends API ───────────────────────────────────────────────────────────────
export const friendsApi = {
  getAll: async () => {
    const res = await api.get("/api/friends");
    return res.data.data.friends;
  },

  getPending: async () => {
    const res = await api.get("/api/friends/pending");
    return res.data.data;
  },

  getStatus: async (userId: string) => {
    const res = await api.get(`/api/friends/status/${userId}`);
    return res.data.data;
  },

  sendRequest: async (username: string) => {
    const res = await api.post("/api/friends/request", { username });
    return res.data;
  },

  accept: async (friendshipId: string) => {
    await api.post(`/api/friends/${friendshipId}/accept`);
  },

  decline: async (friendshipId: string) => {
    await api.post(`/api/friends/${friendshipId}/decline`);
  },

  remove: async (friendId: string) => {
    await api.delete(`/api/friends/${friendId}`);
  },
};