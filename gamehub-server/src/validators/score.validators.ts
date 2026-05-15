import { z } from "zod";

export const VALID_GAME_IDS = [
  "SNAKE",
  "PACMAN",
  "WORDLE",
  "GAME_2048",
  "STRATEGY_LUDO",
  "BATTLE_SNAKE",
  "AIM_TRAINER",
  "ROPE_SWING",
  "DESTRUCTION",
] as const;

export const submitScoreSchema = z.object({
  gameId: z.enum(VALID_GAME_IDS),
  score: z
    .number()
    .int("Score must be a whole number")
    .min(0, "Score cannot be negative")
    .max(10_000_000, "Score exceeds maximum"),
  metadata: z
    .record(z.unknown())
    .optional()
    .default({}),
});

export type SubmitScoreInput = z.infer<typeof submitScoreSchema>;

export const leaderboardQuerySchema = z.object({
  gameId: z.enum(VALID_GAME_IDS),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform(Number)
    .pipe(z.number().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .default("0")
    .transform(Number)
    .pipe(z.number().min(0)),
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;