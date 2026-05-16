"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { usersApi, friendsApi, authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/store/uiStore";

// ── Public profile ────────────────────────────────────────────────────────────
export function usePublicProfile(username: string) {
  return useQuery({
    queryKey: queryKeys.profile(username),
    queryFn: () =>
      usersApi.getProfile(username).then((r) => r.data.profile),
    enabled: !!username,
    staleTime: 60 * 1000,
  });
}

// ── Friendship status ─────────────────────────────────────────────────────────
export function useFriendshipStatus(targetUserId: string) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.friendStatus(user?.id ?? "", targetUserId),
    queryFn: () => friendsApi.getStatus(targetUserId),
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
    staleTime: 30 * 1000,
  });
}

// ── Send friend request ───────────────────────────────────────────────────────
export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();

  return useMutation({
    mutationFn: (username: string) => friendsApi.sendRequest(username),
    onSuccess: () => {
      toast.success("Friend request sent!");
      queryClient.invalidateQueries({
        queryKey: queryKeys.friends(user?.id ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: ["friends-status"],
      });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : "Could not send friend request";
      toast.error("Failed", msg);
    },
  });
}

// ── Accept friend request ─────────────────────────────────────────────────────
export function useAcceptFriendRequest() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (friendshipId: string) => friendsApi.accept(friendshipId),
    onSuccess: () => {
      toast.success("Friend request accepted!");
      queryClient.invalidateQueries({
        queryKey: queryKeys.friends(user?.id ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pendingRequests(user?.id ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications(user?.id ?? ""),
      });
    },
  });
}

// ── Remove friend ─────────────────────────────────────────────────────────────
export function useRemoveFriend() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (friendId: string) => friendsApi.remove(friendId),
    onSuccess: () => {
      toast.info("Friend removed");
      queryClient.invalidateQueries({
        queryKey: queryKeys.friends(user?.id ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: ["friends-status"],
      });
    },
  });
}

// ── Update profile ────────────────────────────────────────────────────────────
export function useUpdateProfile() {
  const { updateUser } = useAuthStore();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: {
      displayName?: string;
      bio?: string;
      avatarUrl?: string | null;
      isPublic?: boolean;
    }) => authApi.updateProfile(data),
    onSuccess: (res) => {
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      toast.success("Profile updated!");
    },
    onError: () => {
      toast.error("Update failed", "Could not save profile changes");
    },
  });
}