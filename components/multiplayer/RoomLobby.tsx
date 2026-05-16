"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Play, LogOut, Send } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import PlayerSlot from "./PlayerSlot";
import { GAME_DISPLAY } from "@/lib/gameIdMap";
import { useToast } from "@/store/uiStore";
import type {
  Room,
  RoomPlayer,
  ChatMessage,
} from "@/store/roomStore";

interface ActionResponse {
  success: boolean;
  error?: string;
}

interface RoomLobbyProps {
  currentRoom: Room | null;
  isHost: boolean;
  myPlayer?: RoomPlayer;
  allReady: boolean;
  chatMessages: ChatMessage[];
  typingUsers: string[];
  leaveRoom: () => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  startGame: () => Promise<ActionResponse>;
  kickPlayer: (userId: string) => Promise<ActionResponse>;
  sendMessage: (message: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
}

export default function RoomLobby({
  currentRoom,
  isHost,
  myPlayer,
  allReady,
  chatMessages,
  typingUsers,
  leaveRoom,
  setReady,
  startGame,
  kickPlayer,
  sendMessage,
  sendTyping,
}: RoomLobbyProps) {
  const { user } = useAuthStore();
  const toast = useToast();
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gameInfo = currentRoom
    ? GAME_DISPLAY[currentRoom.gameId]
    : null;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (!currentRoom) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    await sendMessage(chatInput);
    setChatInput("");
    sendTyping(false);
  };

  const handleChatInput = (value: string) => {
    setChatInput(value);

    if (value) {
      sendTyping(true);

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      typingTimerRef.current = setTimeout(() => {
        sendTyping(false);
      }, 2000);
    } else {
      sendTyping(false);
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    const res = await startGame();

    if (!res.success) {
      toast.error("Cannot start", res.error ?? "Unknown error");
      setIsStarting(false);
    }
  };

  const slots = Array.from({ length: currentRoom.maxPlayers }, (_, i) => {
    return currentRoom.players.find((p) => p.slot === i) ?? null;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Left: lobby */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Room header */}
        <div
          className="p-5 rounded-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{gameInfo?.icon ?? "🎮"}</span>
              <div>
                <h2
                  className="font-inter text-lg font-black"
                  style={{ color: "var(--primary)" }}
                >
                  {gameInfo?.label ?? currentRoom.gameId}
                </h2>
                <div className="flex items-center gap-2">
                  {currentRoom.isRanked && (
                    <span
                      className="font-inter text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(200,169,126,0.1)",
                        border: "1px solid rgba(200,169,126,0.3)",
                        color: "var(--accent)",
                      }}
                    >
                      Ranked
                    </span>
                  )}
                  <span
                    className="font-inter text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    {currentRoom.playerCount}/{currentRoom.maxPlayers} players
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-inter text-sm font-bold transition-all cursor-pointer"
              style={{
                background: "rgba(0,168,255,0.08)",
                border: "1px solid rgba(0,168,255,0.2)",
                color: "var(--neon)",
              }}
            >
              <span className="tracking-[0.2em]">{currentRoom.code}</span>
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        {/* Players */}
        <div
          className="p-4 rounded-2xl flex flex-col gap-2"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="font-inter text-[10px] uppercase tracking-widest mb-1"
            style={{ color: "var(--muted)" }}
          >
            Players
          </p>

          <AnimatePresence>
            {slots.map((player, i) => (
              <PlayerSlot
                key={player?.userId ?? `empty-${i}`}
                player={player ?? undefined}
                slot={i}
                maxPlayers={currentRoom.maxPlayers}
                isCurrentUser={player?.userId === user?.id}
                isHost={isHost}
                canKick={isHost}
                onKick={kickPlayer}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setReady(!myPlayer?.isReady)}
            className="flex-1 py-3 rounded-xl font-inter text-sm font-bold transition-all duration-200 cursor-pointer"
            style={{
              background: myPlayer?.isReady
                ? "rgba(34,197,94,0.12)"
                : "rgba(255,255,255,0.04)",
              border: myPlayer?.isReady
                ? "1px solid rgba(34,197,94,0.3)"
                : "1px solid var(--border)",
              color: myPlayer?.isReady ? "#22c55e" : "var(--muted)",
            }}
          >
            {myPlayer?.isReady ? "✓ Ready" : "Click to Ready"}
          </button>

          {isHost && (
            <button
              onClick={handleStart}
              disabled={!allReady || isStarting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-inter text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: allReady
                  ? "linear-gradient(135deg, var(--neon), #0066cc)"
                  : "var(--card)",
                border: allReady
                  ? "none"
                  : "1px solid var(--border)",
                color: allReady ? "#fff" : "var(--muted)",
                boxShadow: allReady
                  ? "0 0 20px rgba(0,168,255,0.3)"
                  : "none",
              }}
            >
              <Play size={14} />
              {isStarting ? "Starting..." : "Start Game"}
            </button>
          )}

          <button
            onClick={leaveRoom}
            className="w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
            }}
            title="Leave room"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Right: chat */}
      <div
        className="w-full lg:w-72 flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          height: "fit-content",
          maxHeight: 480,
        }}
      >
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="font-inter text-[10px] uppercase tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            Room Chat
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {chatMessages.length === 0 && (
            <p
              className="font-inter text-xs text-center py-4"
              style={{ color: "var(--muted)", opacity: 0.5 }}
            >
              Say hi to your opponents!
            </p>
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.userId === user?.id ? "items-end" : "items-start"
              }`}
            >
              {msg.userId !== user?.id && (
                <span
                  className="font-inter text-[10px] mb-0.5 px-1"
                  style={{ color: "var(--muted)" }}
                >
                  {msg.displayName}
                </span>
              )}

              <div
                className="px-3 py-1.5 rounded-xl max-w-[85%]"
                style={{
                  background:
                    msg.userId === user?.id
                      ? "rgba(0,168,255,0.15)"
                      : "rgba(255,255,255,0.06)",
                  border:
                    msg.userId === user?.id
                      ? "1px solid rgba(0,168,255,0.2)"
                      : "1px solid var(--border)",
                }}
              >
                <p
                  className="font-inter text-xs break-words"
                  style={{
                    color:
                      msg.userId === user?.id
                        ? "var(--neon)"
                        : "var(--primary)",
                  }}
                >
                  {msg.message}
                </p>
              </div>
            </div>
          ))}

          {typingUsers.length > 0 && (
            <div className="flex items-center gap-1.5 px-1">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -3, 0] }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.15,
                      repeat: Infinity,
                    }}
                    className="w-1 h-1 rounded-full"
                    style={{ background: "var(--muted)" }}
                  />
                ))}
              </div>

              <span
                className="font-inter text-[10px]"
                style={{ color: "var(--muted)" }}
              >
                {typingUsers[0]} typing...
              </span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div
          className="p-3 flex gap-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <input
            value={chatInput}
            onChange={(e) => handleChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            placeholder="Message..."
            maxLength={200}
            className="flex-1 px-3 py-2 rounded-lg font-inter text-xs outline-none"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--primary)",
            }}
          />

          <button
            onClick={handleSendMessage}
            disabled={!chatInput.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer disabled:opacity-40"
            style={{
              background: chatInput.trim()
                ? "rgba(0,168,255,0.15)"
                : "var(--surface)",
              border: "1px solid rgba(0,168,255,0.2)",
              color: "var(--neon)",
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}