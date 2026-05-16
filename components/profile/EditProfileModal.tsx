"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useAuthStore } from "@/store/authStore";

interface EditProfileFormData {
  displayName: string;
  bio: string;
  isPublic: boolean;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
}: EditProfileModalProps) {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    defaultValues: {
      displayName: user?.displayName ?? "",
      bio: user?.bio ?? "",
      isPublic: true,
    },
  });

  const watchedBio = watch("bio", "");

  useEffect(() => {
    if (user && isOpen) {
      reset({
        displayName: user.displayName,
        bio: user.bio ?? "",
        isPublic: true,
      });
    }
  }, [user, isOpen, reset]);

  const onSubmit = async (data: EditProfileFormData) => {
    await updateProfile.mutateAsync({
      displayName: data.displayName.trim(),
      bio: data.bio.trim() || undefined,
      isPublic: data.isPublic,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      size="sm"
      showClose
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {/* Display Name */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-inter text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Display Name
          </label>
          <input
            {...register("displayName", {
              required: "Display name is required",
              minLength: { value: 2, message: "At least 2 characters" },
              maxLength: { value: 30, message: "At most 30 characters" },
            })}
            type="text"
            className="w-full px-3 py-2.5 rounded-xl font-inter text-sm
                       outline-none transition-all"
            style={{
              background: "var(--card)",
              border: errors.displayName
                ? "1px solid rgba(239,68,68,0.5)"
                : "1px solid var(--border)",
              color: "var(--primary)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.border =
                "1px solid rgba(0,168,255,0.4)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.border = errors.displayName
                ? "1px solid rgba(239,68,68,0.5)"
                : "1px solid var(--border)")
            }
          />
          {errors.displayName && (
            <p
              className="font-inter text-[11px]"
              style={{ color: "#ef4444" }}
            >
              {errors.displayName.message}
            </p>
          )}
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              className="font-inter text-xs font-medium"
              style={{ color: "var(--muted)" }}
            >
              Bio
            </label>
            <span
              className="font-inter text-[10px]"
              style={{ color: "var(--muted)" }}
            >
              {watchedBio.length}/300
            </span>
          </div>
          <textarea
            {...register("bio", {
              maxLength: { value: 300, message: "At most 300 characters" },
            })}
            rows={3}
            placeholder="Tell others about yourself..."
            className="w-full px-3 py-2.5 rounded-xl font-inter text-sm
                       outline-none transition-all resize-none"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--primary)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.border =
                "1px solid rgba(0,168,255,0.4)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.border = "1px solid var(--border)")
            }
          />
          {errors.bio && (
            <p
              className="font-inter text-[11px]"
              style={{ color: "#ef4444" }}
            >
              {errors.bio.message}
            </p>
          )}
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p
              className="font-inter text-sm font-medium"
              style={{ color: "var(--primary)" }}
            >
              Public Profile
            </p>
            <p
              className="font-inter text-[11px]"
              style={{ color: "var(--muted)" }}
            >
              Allow others to view your profile
            </p>
          </div>
          <input
            {...register("isPublic")}
            type="checkbox"
            className="w-4 h-4 cursor-pointer"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={updateProfile.isPending}
            fullWidth
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}