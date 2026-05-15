import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { env } from "../config/env";

const router = Router();

// GET /health — Basic health check
router.get("/", async (_req: Request, res: Response) => {
  const start = Date.now();

  let dbStatus: "connected" | "error" = "error";
  let dbLatency = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
    dbLatency = Date.now() - start;
  } catch (err) {
    console.error("DB health check failed:", err);
  }

  const health = {
    success: true,
    status: dbStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    services: {
      database: {
        status: dbStatus,
        latency: dbLatency ? `${dbLatency}ms` : null,
      },
      server: {
        status: "running",
        port: env.PORT,
      },
    },
  };

  res.status(dbStatus === "connected" ? 200 : 503).json(health);
});

// GET /health/ping — Ultra lightweight check
router.get("/ping", (_req: Request, res: Response) => {
  res.status(200).json({ pong: true, ts: Date.now() });
});

export default router;