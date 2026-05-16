"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { notificationsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function useNotifications() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.notifications(user?.id ?? ""),
    queryFn: () => notificationsApi.getAll({ limit: 20 }),
    enabled: !!user,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // poll every 30s
  });
}

export function useUnreadCount() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.unreadCount(user?.id ?? ""),
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: !!user,
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
  });
}

export function useMarkNotificationsRead() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => notificationsApi.markRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications(user?.id ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.unreadCount(user?.id ?? ""),
      });
    },
  });
}

export function useMarkAllRead() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications(user?.id ?? ""),
      });
      queryClient.setQueryData(
        queryKeys.unreadCount(user?.id ?? ""),
        { count: 0 }
      );
    },
  });
}

export function useDeleteNotification() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications(user?.id ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.unreadCount(user?.id ?? ""),
      });
    },
  });
}