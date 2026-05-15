"use client";

import { motion } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Music,
  Monitor,
  Bell,
  BellOff,
  RotateCcw,
  Gamepad2,
  Zap,
} from "lucide-react";
import Modal from "./Modal";
import { useUiStore } from "@/store/uiStore";
import { useSettingsStore, type SoundVolume } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/store/uiStore";

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className="relative w-10 h-5 rounded-full transition-all duration-300 cursor-pointer
                 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      style={{
        background: enabled
          ? "linear-gradient(135deg, var(--neon), #0066cc)"
          : "rgba(255,255,255,0.1)",
        border: enabled
          ? "1px solid rgba(0,168,255,0.4)"
          : "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <motion.span
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 rounded-full"
        style={{ background: "#fff" }}
      />
    </button>
  );
}

// ── Volume slider ─────────────────────────────────────────────────────────────
function VolumeSlider({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (v: SoundVolume) => void;
  disabled?: boolean;
}) {
  const steps: SoundVolume[] = [0, 25, 50, 75, 100];

  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step) => (
        <button
          key={step}
          onClick={() => !disabled && onChange(step)}
          disabled={disabled}
          className="flex-1 h-1.5 rounded-full transition-all duration-200 cursor-pointer
                     disabled:cursor-not-allowed"
          style={{
            background:
              step <= value
                ? "linear-gradient(90deg, var(--neon), #0066cc)"
                : "rgba(255,255,255,0.08)",
          }}
        />
      ))}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function SettingsSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: "var(--neon)" }}>{icon}</span>
        <span
          className="font-inter text-xs font-bold uppercase tracking-[0.15em]"
          style={{ color: "var(--muted)" }}
        >
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

// ── Setting row ───────────────────────────────────────────────────────────────
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p
          className="font-inter text-sm font-medium"
          style={{ color: "var(--primary)" }}
        >
          {label}
        </p>
        {description && (
          <p
            className="font-inter text-[11px] mt-0.5 leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SettingsModal() {
  const { activeModal, closeModal } = useUiStore();
  const { user } = useAuthStore();
  const toast = useToast();
  const settings = useSettingsStore();
  const isOpen = activeModal === "settings";

  const handleReset = () => {
    settings.resetToDefaults();
    toast.success("Settings reset", "All settings restored to defaults");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Settings"
      size="md"
      showClose
    >
      <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">

        {/* ── Audio ─────────────────────────────────────────────────────── */}
        <SettingsSection
          icon={<Volume2 size={14} />}
          title="Audio"
        >
          <SettingRow
            label="Sound Effects"
            description="UI clicks, game events, notifications"
          >
            <Toggle
              enabled={settings.soundEnabled}
              onChange={settings.setSoundEnabled}
            />
          </SettingRow>

          {settings.soundEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 pl-0"
            >
              <div>
                <p
                  className="font-inter text-[11px] mb-2"
                  style={{ color: "var(--muted)" }}
                >
                  SFX Volume — {settings.sfxVolume}%
                </p>
                <VolumeSlider
                  value={settings.sfxVolume}
                  onChange={settings.setSfxVolume}
                />
              </div>
            </motion.div>
          )}

          <SettingRow
            label="Music"
            description="Background music (files coming soon)"
          >
            <Toggle
              enabled={settings.musicEnabled}
              onChange={settings.setMusicEnabled}
            />
          </SettingRow>

          {settings.musicEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <p
                className="font-inter text-[11px] mb-2"
                style={{ color: "var(--muted)" }}
              >
                Music Volume — {settings.musicVolume}%
              </p>
              <VolumeSlider
                value={settings.musicVolume}
                onChange={settings.setMusicVolume}
              />
            </motion.div>
          )}
        </SettingsSection>

        {/* ── Visual ────────────────────────────────────────────────────── */}
        <SettingsSection
          icon={<Monitor size={14} />}
          title="Visual"
        >
          <SettingRow
            label="Reduced Motion"
            description="Minimize animations for accessibility"
          >
            <Toggle
              enabled={settings.reducedMotion}
              onChange={settings.setReducedMotion}
            />
          </SettingRow>

          <SettingRow
            label="Show FPS Counter"
            description="Display frame rate during gameplay"
          >
            <Toggle
              enabled={settings.showFps}
              onChange={settings.setShowFps}
            />
          </SettingRow>
        </SettingsSection>

        {/* ── Gameplay ──────────────────────────────────────────────────── */}
        <SettingsSection
          icon={<Gamepad2 size={14} />}
          title="Gameplay"
        >
          <SettingRow
            label="Show Timer"
            description="Display elapsed time during games"
          >
            <Toggle
              enabled={settings.showTimer}
              onChange={settings.setShowTimer}
            />
          </SettingRow>

          <SettingRow
            label="Auto-save Scores"
            description={
              user
                ? "Save scores to your account automatically"
                : "Sign in to enable score saving"
            }
          >
            <Toggle
              enabled={settings.autoSaveScores && !!user}
              onChange={settings.setAutoSaveScores}
              disabled={!user}
            />
          </SettingRow>
        </SettingsSection>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <SettingsSection
          icon={<Bell size={14} />}
          title="Notifications"
        >
          <SettingRow
            label="Enable Notifications"
            description="In-app alerts and updates"
          >
            <Toggle
              enabled={settings.notificationsEnabled}
              onChange={settings.setNotificationsEnabled}
            />
          </SettingRow>

          {settings.notificationsEnabled && (
            <>
              <SettingRow label="Friend Requests">
                <Toggle
                  enabled={settings.friendRequestAlerts}
                  onChange={settings.setFriendRequestAlerts}
                />
              </SettingRow>
              <SettingRow label="Achievement Unlocks">
                <Toggle
                  enabled={settings.achievementAlerts}
                  onChange={settings.setAchievementAlerts}
                />
              </SettingRow>
              <SettingRow label="Match Invites">
                <Toggle
                  enabled={settings.matchInviteAlerts}
                  onChange={settings.setMatchInviteAlerts}
                />
              </SettingRow>
            </>
          )}
        </SettingsSection>

        {/* ── Platform ──────────────────────────────────────────────────── */}
        <SettingsSection
          icon={<Zap size={14} />}
          title="Platform"
        >
          <SettingRow
            label="Account"
            description={user ? `Signed in as @${user.username}` : "Guest mode"}
          >
            <span
              className="font-inter text-[11px] px-2 py-1 rounded-full"
              style={{
                background: user
                  ? "rgba(0,168,255,0.08)"
                  : "rgba(255,255,255,0.04)",
                border: user
                  ? "1px solid rgba(0,168,255,0.2)"
                  : "1px solid var(--border)",
                color: user ? "var(--neon)" : "var(--muted)",
              }}
            >
              {user ? "Authenticated" : "Guest"}
            </span>
          </SettingRow>

          <SettingRow
            label="Data Storage"
            description="Scores and settings stored locally"
          >
            <span
              className="font-inter text-[11px]"
              style={{ color: "var(--muted)" }}
            >
              Local
            </span>
          </SettingRow>
        </SettingsSection>

        {/* ── Reset ─────────────────────────────────────────────────────── */}
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                     font-inter text-sm font-medium transition-all duration-200 cursor-pointer"
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.15)",
            color: "#ef4444",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.06)";
          }}
        >
          <RotateCcw size={14} />
          Reset to Defaults
        </button>
      </div>
    </Modal>
  );
}