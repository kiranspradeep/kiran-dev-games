// ── Sound Manager ─────────────────────────────────────────────────────────────
// Infrastructure only — no real audio files yet.
// All hooks are wired up and ready. Add real .mp3/.ogg files later.

export type SoundEvent =
  | "ui_click"
  | "ui_hover"
  | "ui_modal_open"
  | "ui_modal_close"
  | "ui_success"
  | "ui_error"
  | "ui_notification"
  | "game_start"
  | "game_over"
  | "game_win"
  | "game_eat"
  | "game_level_up"
  | "game_power_up"
  | "game_countdown"
  | "achievement_unlock"
  | "rank_up"
  | "match_found"
  | "match_start"
  | "match_end";

// Map sound events to file paths (add files here later)
const SOUND_MAP: Partial<Record<SoundEvent, string>> = {
  // ui_click:   "/sounds/ui/click.mp3",
  // ui_hover:   "/sounds/ui/hover.mp3",
  // game_start: "/sounds/game/start.mp3",
  // game_over:  "/sounds/game/over.mp3",
  // game_win:   "/sounds/game/win.mp3",
};

// ── Audio cache ───────────────────────────────────────────────────────────────
const audioCache = new Map<string, HTMLAudioElement>();

function getAudio(src: string): HTMLAudioElement {
  if (!audioCache.has(src)) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audioCache.set(src, audio);
  }
  return audioCache.get(src)!;
}

// ── Sound state (module-level, not React) ─────────────────────────────────────
let sfxEnabled = true;
let sfxVolume = 0.75;

export function configureSoundManager(opts: {
  sfxEnabled: boolean;
  sfxVolume: number; // 0–1
}) {
  sfxEnabled = opts.sfxEnabled;
  sfxVolume = opts.sfxVolume;
}

// ── Play a sound ──────────────────────────────────────────────────────────────
export function playSound(event: SoundEvent): void {
  if (!sfxEnabled) return;
  if (typeof window === "undefined") return;

  const src = SOUND_MAP[event];
  if (!src) {
    // Sound file not yet added — silent in dev, log in debug mode
    if (process.env.NODE_ENV === "development") {
      // console.debug(`[Sound] No file mapped for: ${event}`);
    }
    return;
  }

  try {
    const audio = getAudio(src);
    audio.volume = Math.max(0, Math.min(1, sfxVolume));
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Browser autoplay policy — silently ignore
    });
  } catch {
    // Ignore audio errors
  }
}

// ── Convenience exports ───────────────────────────────────────────────────────
export const Sound = {
  click:             () => playSound("ui_click"),
  hover:             () => playSound("ui_hover"),
  modalOpen:         () => playSound("ui_modal_open"),
  modalClose:        () => playSound("ui_modal_close"),
  success:           () => playSound("ui_success"),
  error:             () => playSound("ui_error"),
  notification:      () => playSound("ui_notification"),
  gameStart:         () => playSound("game_start"),
  gameOver:          () => playSound("game_over"),
  gameWin:           () => playSound("game_win"),
  eat:               () => playSound("game_eat"),
  levelUp:           () => playSound("game_level_up"),
  powerUp:           () => playSound("game_power_up"),
  achievementUnlock: () => playSound("achievement_unlock"),
  rankUp:            () => playSound("rank_up"),
  matchFound:        () => playSound("match_found"),
};