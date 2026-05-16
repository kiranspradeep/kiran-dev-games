import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createServer } from "http";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimiter";

import healthRouter        from "./routes/health";
import authRouter          from "./routes/auth";
import usersRouter         from "./routes/users";
import scoresRouter        from "./routes/scores";
import leaderboardsRouter  from "./routes/leaderboards";
import notificationsRouter from "./routes/notifications";
import friendsRouter       from "./routes/friends";


import prisma from "./lib/prisma";
import { initializeSocketServer } from "./socket";

const app        = express();
const httpServer = createServer(app);

// ── Initialize Socket.io ──────────────────────────────────────────────────────
const io = initializeSocketServer(httpServer);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy:     false,
  })
);

app.use(
  cors({
    origin:      env.CLIENT_URL,
    credentials: true,
    methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/health",           healthRouter);
app.use("/api/auth",         authRouter);
app.use("/api/users",        usersRouter);
app.use("/api/scores",       scoresRouter);
app.use("/api/leaderboards", leaderboardsRouter);
app.use("/api/notifications",notificationsRouter);
app.use("/api/friends",      friendsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    httpServer.listen(env.PORT, () => {
      console.log("");
      console.log("╔══════════════════════════════════════╗");
      console.log("║       KSP Games Hub — Server         ║");
      console.log("╠══════════════════════════════════════╣");
      console.log(`║  Status:  Running                    ║`);
      console.log(`║  Port:    ${env.PORT}                        ║`);
      console.log(`║  Env:     ${env.NODE_ENV.padEnd(26)}║`);
      console.log(`║  DB:      Neon PostgreSQL            ║`);
      console.log(`║  WS:      Socket.io ready            ║`);
      console.log("╚══════════════════════════════════════╝");
      console.log("");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  io.close();
  httpServer.close(async () => {
    console.log("HTTP + WS server closed");
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

bootstrap();