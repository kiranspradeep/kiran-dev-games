// components/WordleGame.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDailyWord, getRandomWord, isValidGuess } from "@/lib/words";
import { saveScore, getScore } from "@/lib/scores";

type LetterState = "correct" | "present" | "absent" | "empty" | "tbd";

interface GuessLetter {
  char: string;
  state: LetterState;
}

type Guess = GuessLetter[];
type GamePhase = "playing" | "revealing" | "won" | "lost";

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const REVEAL_DELAY_PER_TILE = 300;
const REVEAL_TOTAL_DURATION = WORD_LENGTH * REVEAL_DELAY_PER_TILE + 400;

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const STATE_COLORS: Record<LetterState, string> = {
  correct: "#2d7a3a",
  present: "#8a6e10",
  absent: "#1e1e1e",
  empty: "transparent",
  tbd: "#1e1e1e",
};

const STATE_BORDER: Record<LetterState, string> = {
  correct: "#3a9e4a",
  present: "#b89020",
  absent: "#2a2a2a",
  empty: "rgba(255,255,255,0.1)",
  tbd: "rgba(255,255,255,0.25)",
};

function evaluateGuess(guess: string, answer: string): Guess {
  const result: Guess = Array.from({ length: WORD_LENGTH }, (_, i) => ({
    char: guess[i],
    state: "absent" as LetterState,
  }));
  const answerArr = answer.split("");
  const used = Array(WORD_LENGTH).fill(false);

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      result[i].state = "correct";
      used[i] = true;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i].state === "correct") continue;
    const j = answerArr.findIndex((c, idx) => c === guess[i] && !used[idx]);
    if (j !== -1) {
      result[i].state = "present";
      used[j] = true;
    }
  }
  return result;
}

function buildKeyboardMap(guesses: Guess[]): Map<string, LetterState> {
  const priority: LetterState[] = ["correct", "present", "absent", "tbd"];
  const map = new Map<string, LetterState>();
  for (const guess of guesses) {
    for (const { char, state } of guess) {
      const existing = map.get(char);
      if (
        !existing ||
        priority.indexOf(state) < priority.indexOf(existing)
      ) {
        map.set(char, state);
      }
    }
  }
  return map;
}

const WIN_MESSAGES = [
  "Genius!",
  "Magnificent!",
  "Impressive!",
  "Splendid!",
  "Great!",
  "Phew!",
];

export default function WordleGame() {
  const [mode, setMode] = useState<"daily" | "random">("daily");
  const [answer, setAnswer] = useState(() => getDailyWord());
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [message, setMessage] = useState("");
  const [invalidShake, setInvalidShake] = useState(false);
  const [revealingRowIndex, setRevealingRowIndex] = useState<number | null>(
    null
  );
  const [pendingReveal, setPendingReveal] = useState<Guess | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [popTile, setPopTile] = useState<number | null>(null);

  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPlaying = phase === "playing" || phase === "revealing";

  useEffect(() => {
    const data = getScore("wordle");
    setHighScore(data.highScore);
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  const showMessage = useCallback((msg: string, duration = 2000) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    setMessage(msg);
    if (duration > 0) {
      messageTimerRef.current = setTimeout(() => setMessage(""), duration);
    }
  }, []);

  const triggerShake = useCallback(() => {
    setInvalidShake(true);
    setTimeout(() => setInvalidShake(false), 600);
  }, []);

  const triggerPop = useCallback((index: number) => {
    setPopTile(index);
    setTimeout(() => setPopTile(null), 100);
  }, []);

  const submitGuess = useCallback(() => {
    if (phase !== "playing") return;
    if (currentGuess.length < WORD_LENGTH) {
      showMessage("Not enough letters");
      triggerShake();
      return;
    }
    if (!isValidGuess(currentGuess)) {
      showMessage("Not in word list");
      triggerShake();
      return;
    }

    const evaluated = evaluateGuess(currentGuess, answer);
    const rowIndex = guesses.length;

    setPhase("revealing");
    setPendingReveal(evaluated);
    setRevealingRowIndex(rowIndex);
    setCurrentGuess("");

    revealTimerRef.current = setTimeout(() => {
      const newGuesses = [...guesses, evaluated];
      setGuesses(newGuesses);
      setPendingReveal(null);
      setRevealingRowIndex(null);

      const isWin = evaluated.every((l) => l.state === "correct");
      if (isWin) {
        setPhase("won");
        const score = (MAX_GUESSES - rowIndex) * 100;
        const result = saveScore("wordle", score);
        setHighScore(result.highScore);
        showMessage(WIN_MESSAGES[rowIndex] ?? "Nice!", 3000);

        // ── Score sync (1 line) ──
        if (typeof window !== "undefined" && window.__syncScore) {
          window.__syncScore(score, { guesses: rowIndex + 1, word: answer });
        }
      } else if (newGuesses.length >= MAX_GUESSES) {
        setPhase("lost");
        saveScore("wordle", 0);
        showMessage(answer, 0);

        // ── Score sync (zero score) ──
        if (typeof window !== "undefined" && window.__syncScore) {
          window.__syncScore(0, { guesses: MAX_GUESSES, word: answer });
        }
      } else {
        setPhase("playing");
      }
    }, REVEAL_TOTAL_DURATION);
  }, [phase, currentGuess, answer, guesses, showMessage, triggerShake]);

  const addLetter = useCallback(
    (letter: string) => {
      if (phase !== "playing") return;
      if (currentGuess.length >= WORD_LENGTH) return;
      setCurrentGuess((g) => g + letter);
      triggerPop(currentGuess.length);
    },
    [phase, currentGuess, triggerPop]
  );

  const removeLetter = useCallback(() => {
    if (phase !== "playing") return;
    if (currentGuess.length === 0) return;
    setCurrentGuess((g) => g.slice(0, -1));
  }, [phase, currentGuess]);

  const handleKey = useCallback(
    (key: string) => {
      if (phase === "revealing" || phase === "won" || phase === "lost")
        return;
      if (key === "ENTER") {
        submitGuess();
        return;
      }
      if (key === "⌫" || key === "BACKSPACE") {
        removeLetter();
        return;
      }
      if (/^[A-Z]$/.test(key)) addLetter(key);
    },
    [phase, submitGuess, removeLetter, addLetter]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        handleKey("ENTER");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleKey("BACKSPACE");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleKey(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const newGame = useCallback(
    (m: "daily" | "random") => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      setMode(m);
      setAnswer(m === "daily" ? getDailyWord() : getRandomWord());
      setGuesses([]);
      setCurrentGuess("");
      setPhase("playing");
      setMessage("");
      setRevealingRowIndex(null);
      setPendingReveal(null);
      setInvalidShake(false);
      setPopTile(null);
    },
    []
  );

  const keyMap = buildKeyboardMap(guesses);

  const displayGrid: Array<{
    letters: Array<{ char: string; state: LetterState }>;
    isActive: boolean;
    isRevealing: boolean;
  }> = [];

  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      displayGrid.push({
        letters: guesses[i],
        isActive: false,
        isRevealing: false,
      });
    } else if (
      i === guesses.length &&
      pendingReveal &&
      revealingRowIndex === i
    ) {
      displayGrid.push({
        letters: pendingReveal,
        isActive: false,
        isRevealing: true,
      });
    } else if (
      i === guesses.length &&
      !pendingReveal &&
      (phase === "playing" || phase === "revealing")
    ) {
      const letters = Array.from({ length: WORD_LENGTH }, (_, ci) => ({
        char: currentGuess[ci] ?? "",
        state: (currentGuess[ci] ? "tbd" : "empty") as LetterState,
      }));
      displayGrid.push({ letters, isActive: true, isRevealing: false });
    } else {
      displayGrid.push({
        letters: Array.from({ length: WORD_LENGTH }, () => ({
          char: "",
          state: "empty" as LetterState,
        })),
        isActive: false,
        isRevealing: false,
      });
    }
  }

  const isGameOver = phase === "won" || phase === "lost";

  let correctCount = 0;
  let presentCount = 0;
  let absentCount = 0;
  guesses.forEach((g) =>
    g.forEach((l) => {
      if (l.state === "correct") correctCount++;
      else if (l.state === "present") presentCount++;
      else if (l.state === "absent") absentCount++;
    })
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start select-none">
      {/* Score sidebar - compact on mobile when playing */}
      <div
        className={`w-full lg:w-[10%] lg:min-w-[140px] flex lg:flex-col gap-2 lg:gap-4
                    lg:sticky lg:top-24 shrink-0`}
      >
        {/* Mode */}
        <div className="bg-card border border-white/[0.06] rounded-xl p-3 lg:p-4 flex-1 lg:flex-none">
          <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-2">
            Mode
          </div>
          <div className="flex gap-1">
            {(["daily", "random"] as const).map((m) => (
              <button
                key={m}
                onClick={() => newGame(m)}
                className={`px-2 lg:px-3 py-1 rounded-md font-inter text-[10px] capitalize
                           transition-all cursor-pointer
                           ${
                             mode === m
                               ? "bg-accent/10 text-accent border border-accent/20"
                               : "text-muted hover:text-primary border border-transparent"
                           }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Guesses */}
        <div className="bg-card border border-white/[0.06] rounded-xl p-3 lg:p-4 flex-1 lg:flex-none">
          <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
            Guesses
          </div>
          <div className="font-cormorant text-2xl lg:text-3xl text-primary">
            {guesses.length}
            <span className="text-muted text-base lg:text-lg">
              /{MAX_GUESSES}
            </span>
          </div>
        </div>

        {/* Best score - hide on mobile when playing */}
        <div
          className={`bg-card border border-white/[0.06] rounded-xl p-3 lg:p-4 flex-1 lg:flex-none ${
            isPlaying ? "hidden sm:block" : ""
          }`}
        >
          <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
            Best
          </div>
          <div className="font-cormorant text-2xl lg:text-3xl text-accent">
            {highScore > 0 ? highScore : "—"}
          </div>
        </div>

        {/* Letter stats - hide on mobile when playing */}
        {guesses.length > 0 && (
          <div
            className={`bg-card border border-white/[0.06] rounded-xl p-3 lg:p-4 flex-1 lg:flex-none ${
              isPlaying ? "hidden sm:block" : ""
            }`}
          >
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-3">
              Letters
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: "#2d7a3a" }}
                />
                <span className="font-inter text-xs text-muted">
                  Correct:{" "}
                  <span className="text-primary">{correctCount}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: "#8a6e10" }}
                />
                <span className="font-inter text-xs text-muted">
                  Present:{" "}
                  <span className="text-primary">{presentCount}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: "#1e1e1e",
                    border: "1px solid #2a2a2a",
                  }}
                />
                <span className="font-inter text-xs text-muted">
                  Absent:{" "}
                  <span className="text-primary">{absentCount}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center gap-3 lg:gap-4 w-full lg:w-[90%]">
        {/* Toast */}
        <div className="h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                key={message}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-2 bg-primary text-background font-inter text-sm
                           font-medium rounded-lg shadow-lg"
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tile grid */}
        <div className="flex flex-col gap-[6px]">
          {displayGrid.map((row, rowIdx) => (
            <motion.div
              key={rowIdx}
              animate={
                invalidShake && row.isActive
                  ? { x: [0, -6, 6, -6, 6, -3, 3, 0] }
                  : { x: 0 }
              }
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex gap-[6px]"
            >
              {row.letters.map((letter, ci) => (
                <LetterTile
                  key={`${rowIdx}-${ci}`}
                  char={letter.char}
                  state={letter.state}
                  isRevealing={row.isRevealing}
                  revealIndex={ci}
                  isPopping={row.isActive && popTile === ci}
                  revealed={
                    !row.isActive &&
                    !row.isRevealing &&
                    rowIdx < guesses.length
                  }
                />
              ))}
            </motion.div>
          ))}
        </div>

        {/* Keyboard */}
        <div className="flex flex-col gap-[6px] mt-2 w-full max-w-[500px]">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-[4px] sm:gap-[5px] justify-center">
              {row.map((key) => {
                const state = keyMap.get(key);
                const isWide = key === "ENTER" || key === "⌫";
                return (
                  <KeyButton
                    key={key}
                    label={key}
                    state={state}
                    wide={isWide}
                    onPress={() => handleKey(key)}
                    disabled={phase === "revealing"}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Game over */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="text-center">
                {phase === "won" ? (
                  <p className="font-inter text-sm text-accent">
                    Solved in {guesses.length}/{MAX_GUESSES} guesses
                  </p>
                ) : (
                  <p className="font-inter text-sm text-muted">
                    The word was{" "}
                    <span className="text-accent font-semibold tracking-wider">
                      {answer}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => newGame("random")}
                  className="px-5 py-2.5 bg-accent text-background font-inter text-sm
                             font-medium rounded-lg hover:bg-accent/90 transition-colors
                             active:scale-95 cursor-pointer"
                >
                  Random Word
                </button>
                <button
                  onClick={() => newGame("daily")}
                  className="px-5 py-2.5 bg-card border border-white/[0.06] text-muted
                             font-inter text-sm rounded-lg hover:text-primary
                             hover:border-accent/20 transition-all active:scale-95 cursor-pointer"
                >
                  Daily Word
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Letter Tile ──────────────────────────────────────────────────────────────
interface TileProps {
  char: string;
  state: LetterState;
  isRevealing: boolean;
  revealIndex: number;
  isPopping: boolean;
  revealed: boolean;
}

function LetterTile({
  char,
  state,
  isRevealing,
  revealIndex,
  isPopping,
  revealed,
}: TileProps) {
  const [displayState, setDisplayState] = useState<LetterState>(state);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (!isRevealing) {
      setDisplayState(state);
      return;
    }
    setDisplayState("tbd");
    const flipDelay = revealIndex * REVEAL_DELAY_PER_TILE;

    const f1 = setTimeout(() => setIsFlipping(true), flipDelay);
    const f2 = setTimeout(
      () => setDisplayState(state),
      flipDelay + 250
    );
    const f3 = setTimeout(() => setIsFlipping(false), flipDelay + 500);

    return () => {
      clearTimeout(f1);
      clearTimeout(f2);
      clearTimeout(f3);
    };
  }, [isRevealing, state, revealIndex]);

  useEffect(() => {
    if (revealed) {
      setDisplayState(state);
      setIsFlipping(false);
    }
  }, [revealed, state]);

  useEffect(() => {
    if (!isRevealing && !revealed) setDisplayState(state);
  }, [state, isRevealing, revealed]);

  return (
    <motion.div
      animate={{
        scale: isPopping ? [1, 1.12, 1] : 1,
        rotateX: isFlipping ? [0, -90, 0] : 0,
      }}
      transition={
        isFlipping
          ? { duration: 0.5, ease: "easeInOut" }
          : isPopping
          ? { duration: 0.1 }
          : { duration: 0.15 }
      }
      className="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] flex items-center
                 justify-center rounded-lg font-cormorant text-2xl sm:text-3xl
                 font-semibold uppercase select-none"
      style={{
        backgroundColor: STATE_COLORS[displayState],
        border: `2px solid ${STATE_BORDER[displayState]}`,
        color: displayState === "empty" ? "transparent" : "#e7e7e7",
        transition: isFlipping
          ? "none"
          : "background-color 0.15s ease, border-color 0.15s ease",
      }}
    >
      {char || ""}
    </motion.div>
  );
}

// ─── Key Button ───────────────────────────────────────────────────────────────
interface KeyProps {
  label: string;
  state?: LetterState;
  wide?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

function KeyButton({ label, state, wide, onPress, disabled }: KeyProps) {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.92 }}
      onClick={() => {
        if (!disabled) onPress();
      }}
      disabled={disabled}
      className={`h-[52px] sm:h-14 rounded-lg font-inter font-medium
                  transition-all duration-150
                  ${
                    disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer active:scale-95"
                  }`}
      style={{
        backgroundColor: state ? STATE_COLORS[state] : "#2a2a2a",
        border: `1px solid ${
          state ? STATE_BORDER[state] : "rgba(255,255,255,0.08)"
        }`,
        color:
          state === "correct" || state === "present" ? "#fff" : "#c0c0c0",
        minWidth: wide ? "58px" : "28px",
        padding: wide ? "0 10px" : "0 4px",
        fontSize: wide ? "11px" : "14px",
        letterSpacing: wide ? "0.05em" : "0",
        transition: "background-color 0.3s, border-color 0.3s, color 0.3s",
      }}
    >
      {label}
    </motion.button>
  );
}