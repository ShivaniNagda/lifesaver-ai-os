import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import { connectDB } from "./server/config/db";
import apiRouter from "./server/routes/api";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Database connection (Attempts MongoDB, falls back to secure Local JSON)
connectDB();

// Mount our production API router
app.use("/api", apiRouter);

// Maintain backward compatibility for simulated legacy client endpoints
app.use("/api/agent/process", (req, res, next) => {
  req.url = "/ai/process";
  apiRouter(req, res, next);
});
app.use("/api/agent/negotiate", (req, res, next) => {
  req.url = "/ai/negotiate";
  apiRouter(req, res, next);
});
app.use("/api/agent/twin-chat", (req, res, next) => {
  req.url = "/ai/twin-chat";
  apiRouter(req, res, next);
});
app.use("/api/agent/prepare", (req, res, next) => {
  req.url = "/ai/prepare";
  apiRouter(req, res, next);
});

// Serve frontend assets
async function startServer() {
  const distPath = path.join(process.cwd(), "dist");

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LifeSaver AI OS Production Backend running on http://localhost:${PORT}`);
  });
}

startServer();
export default app;
