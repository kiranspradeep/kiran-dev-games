"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import RoomLobby from "@/components/multiplayer/RoomLobby";
import OnlineIndicator from "@/components/multiplayer/OnlineIndicator";
import { useRoom } from "@/hooks/useRoom";
import { usePresence } from "@/hooks/usePresence";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { GAME_DISPLAY, LIVE_GAME_IDS } from "@/lib/gameIdMap";
import { Swords, Plus, Hash } from "lucide-react";
import { useToast } from "@/store/uiStore";

export default function ArenaPage() {
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useUiStore();
  const room = useRoom();
  const { isConnected } = usePresence();
  const toast = useToast();

  const [joinCode, setJoinCode] = useState("");
  const [selectedGame, setSelectedGame] = useState("SNAKE");
  const [isRanked, setIsRanked] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  const handleCreate = async () => {
    if (!isAuthenticated) {
      openModal("auth", "login");
      return;
    }

    const res = await room.createRoom({
      gameId: selectedGame,
      isRanked,
      maxPlayers,
    });

    if (!res.success) {
      toast.error("Failed to create room", res.error ?? "Unknown error");
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      openModal("auth", "login");
      return;
    }

    if (joinCode.length !== 6) {
      toast.error("Invalid code", "Room codes are 6 characters");
      return;
    }

    const res = await room.joinRoom(joinCode);
    if (!res.success) {
      toast.error("Could not join room", res.error ?? "Room not found");
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      <Navbar />

      <div
        className="fixed top-[57px] left-0 right-0 z-30 h-[1px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--neon-dim), transparent)",
        }}
      />

      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="h-5 w-[2px] rounded-full"
                    style={{ background: "var(--neon)" }}
                  />
                  <h1
                    className="font-inter font-black text-3xl sm:text-4xl"
                    style={{ color: "var(--primary)" }}
                  >
                    Arena
                  </h1>
                </div>
                <p
                  className="font-inter text-sm ml-5"
                  style={{ color: "var(--muted)" }}
                >
                  Create or join a multiplayer room
                </p>
              </div>

              <div className="flex items-center gap-3">
                <OnlineIndicator showCount size="md" />
                {isConnected && (
                  <div
                    className="px-3 py-1.5 rounded-lg font-inter text-xs"
                    style={{
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      color: "#22c55e",
                    }}
                  >
                    Connected
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Active lobby */}
          {room.isInRoom ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <RoomLobby
                currentRoom={room.currentRoom}
                isHost={room.isHost}
                myPlayer={room.myPlayer}
                allReady={room.allReady}
                chatMessages={room.chatMessages}
                typingUsers={room.typingUsers}
                leaveRoom={room.leaveRoom}
                setReady={room.setReady}
                startGame={room.startGame}
                kickPlayer={room.kickPlayer}
                sendMessage={room.sendMessage}
                sendTyping={room.sendTyping}
              />
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create / Join panel */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Tab switcher */}
                <div
                  className="flex p-1 rounded-xl mb-4 gap-1"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {(["create", "join"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-inter text-xs font-semibold capitalize transition-all cursor-pointer"
                      style={{
                        background:
                          activeTab === tab
                            ? "rgba(0,168,255,0.12)"
                            : "transparent",
                        color:
                          activeTab === tab
                            ? "var(--neon)"
                            : "var(--muted)",
                        border:
                          activeTab === tab
                            ? "1px solid rgba(0,168,255,0.2)"
                            : "1px solid transparent",
                      }}
                    >
                      {tab === "create" ? <Plus size={13} /> : <Hash size={13} />}
                      {tab === "create" ? "Create Room" : "Join Room"}
                    </button>
                  ))}
                </div>

                {/* Create room */}
                {activeTab === "create" && (
                  <div
                    className="p-5 rounded-2xl flex flex-col gap-4"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {/* Game selector */}
                    <div>
                      <p
                        className="font-inter text-[10px] uppercase tracking-widest mb-2"
                        style={{ color: "var(--muted)" }}
                      >
                        Game
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        {LIVE_GAME_IDS.map((id) => {
                          const info = GAME_DISPLAY[id];
                          const isSelected = selectedGame === id;

                          return (
                            <button
                              key={id}
                              onClick={() => setSelectedGame(id)}
                              className="flex items-center gap-2 p-3 rounded-xl font-inter text-sm font-medium transition-all cursor-pointer text-left"
                              style={{
                                background: isSelected
                                  ? `${info?.color ?? "var(--neon)"}15`
                                  : "rgba(255,255,255,0.02)",
                                border: isSelected
                                  ? `1px solid ${info?.color ?? "var(--neon)"}30`
                                  : "1px solid var(--border)",
                                color: isSelected
                                  ? info?.color ?? "var(--neon)"
                                  : "var(--muted)",
                              }}
                            >
                              <span>{info?.icon}</span>
                              <span>{info?.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Max players */}
                    <div>
                      <p
                        className="font-inter text-[10px] uppercase tracking-widest mb-2"
                        style={{ color: "var(--muted)" }}
                      >
                        Max Players
                      </p>

                      <div className="flex gap-2">
                        {[2, 3, 4].map((n) => (
                          <button
                            key={n}
                            onClick={() => setMaxPlayers(n)}
                            className="flex-1 py-2 rounded-lg font-inter text-sm font-bold transition-all cursor-pointer"
                            style={{
                              background:
                                maxPlayers === n
                                  ? "rgba(0,168,255,0.12)"
                                  : "rgba(255,255,255,0.03)",
                              border:
                                maxPlayers === n
                                  ? "1px solid rgba(0,168,255,0.3)"
                                  : "1px solid var(--border)",
                              color:
                                maxPlayers === n
                                  ? "var(--neon)"
                                  : "var(--muted)",
                            }}
                          >
                            {n}P
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ranked toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="font-inter text-sm font-medium"
                          style={{ color: "var(--primary)" }}
                        >
                          Ranked Match
                        </p>
                        <p
                          className="font-inter text-[11px]"
                          style={{ color: "var(--muted)" }}
                        >
                          Affects ELO rating
                        </p>
                      </div>

                      <button
                        onClick={() => setIsRanked((v) => !v)}
                        className="relative w-10 h-5 rounded-full transition-all duration-300 cursor-pointer"
                        style={{
                          background: isRanked
                            ? "linear-gradient(135deg, var(--neon), #0066cc)"
                            : "rgba(255,255,255,0.1)",
                          border: isRanked
                            ? "1px solid rgba(0,168,255,0.4)"
                            : "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <motion.span
                          animate={{ x: isRanked ? 20 : 2 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                          className="absolute top-0.5 w-4 h-4 rounded-full"
                          style={{ background: "#fff" }}
                        />
                      </button>
                    </div>

                    <button
                      onClick={handleCreate}
                      disabled={room.isConnecting}
                      className="w-full py-3 rounded-xl font-inter text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--neon), #0066cc)",
                        color: "#fff",
                        boxShadow: "0 0 20px rgba(0,168,255,0.2)",
                      }}
                    >
                      {room.isConnecting ? "Creating..." : "Create Room"}
                    </button>
                  </div>
                )}

                {/* Join room */}
                {activeTab === "join" && (
                  <div
                    className="p-5 rounded-2xl flex flex-col gap-4"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <p
                        className="font-inter text-[10px] uppercase tracking-widest mb-2"
                        style={{ color: "var(--muted)" }}
                      >
                        Room Code
                      </p>

                      <input
                        value={joinCode}
                        onChange={(e) =>
                          setJoinCode(
                            e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, "")
                              .slice(0, 6)
                          )
                        }
                        placeholder="XXXXXX"
                        className="w-full px-4 py-3 rounded-xl font-inter text-xl font-black text-center tracking-[0.3em] outline-none"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--neon)",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border =
                            "1px solid rgba(0,168,255,0.4)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border =
                            "1px solid var(--border)";
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleJoin();
                        }}
                        maxLength={6}
                      />

                      <p
                        className="font-inter text-[11px] mt-2 text-center"
                        style={{ color: "var(--muted)" }}
                      >
                        Get the 6-character code from your friend
                      </p>
                    </div>

                    <button
                      onClick={handleJoin}
                      disabled={room.isConnecting || joinCode.length !== 6}
                      className="w-full py-3 rounded-xl font-inter text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--neon), #0066cc)",
                        color: "#fff",
                        boxShadow:
                          joinCode.length === 6
                            ? "0 0 20px rgba(0,168,255,0.2)"
                            : "none",
                      }}
                    >
                      {room.isConnecting ? "Joining..." : "Join Room"}
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Right: Info panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col gap-4"
              >
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Swords size={16} style={{ color: "var(--neon)" }} />
                    <p
                      className="font-inter text-[10px] uppercase tracking-widest"
                      style={{ color: "var(--muted)" }}
                    >
                      How it works
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {[
                      {
                        step: "1",
                        title: "Create a Room",
                        desc: "Choose a game, set players, get a 6-digit code",
                      },
                      {
                        step: "2",
                        title: "Share the Code",
                        desc: "Send the code to friends to join your lobby",
                      },
                      {
                        step: "3",
                        title: "Everyone Readies Up",
                        desc: "All players click Ready when prepared",
                      },
                      {
                        step: "4",
                        title: "Host Starts",
                        desc: "Host starts the game when all are ready",
                      },
                    ].map(({ step, title, desc }) => (
                      <div key={step} className="flex gap-3">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-inter text-[11px] font-black shrink-0"
                          style={{
                            background: "rgba(0,168,255,0.12)",
                            border: "1px solid rgba(0,168,255,0.25)",
                            color: "var(--neon)",
                          }}
                        >
                          {step}
                        </div>

                        <div>
                          <p
                            className="font-inter text-sm font-semibold"
                            style={{ color: "var(--primary)" }}
                          >
                            {title}
                          </p>
                          <p
                            className="font-inter text-[11px] leading-relaxed"
                            style={{ color: "var(--muted)" }}
                          >
                            {desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: "rgba(0,168,255,0.04)",
                    border: "1px solid rgba(0,168,255,0.1)",
                  }}
                >
                  <p
                    className="font-inter text-xs leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    🚧 Arena is in early access. Rooms are available now.
                    Full multiplayer gameplay for Strategy Ludo and Battle
                    Snake & Ladder arrives in Phase 5.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}