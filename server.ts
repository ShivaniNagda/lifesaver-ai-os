import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import { connectDB } from "./server/config/db";
import apiRouter from "./server/routes/api";
import { initScheduler } from "./server/services/notificationService";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Global HTTP Request Logger
app.use((req, res, next) => {
  const sanitizedHeaders = req.headers.authorization 
    ? { ...req.headers, authorization: "Bearer [REDACTED]" } 
    : req.headers;
  console.log(`[Request Received] Method: ${req.method} | URL: ${req.originalUrl} | Headers: ${JSON.stringify(sanitizedHeaders)}`);
  next();
});

// Mount our production API router
app.use("/api", apiRouter);

// Serve the Swagger OpenAPI spec
app.get("/api/openapi.json", (req, res) => {
  res.sendFile(path.join(process.cwd(), "server/openapi.json"));
});

// Serve interactive Swagger UI
app.get(["/api-docs", "/swagger"], (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LifeSaver AI OS - Interactive API Command Center</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      background-color: #f8fafc;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .swagger-header {
      background-color: #0f172a;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .swagger-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.025em;
      background: linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .swagger-header .badge {
      background-color: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .swagger-ui {
      font-family: 'Inter', sans-serif !important;
      max-width: 1200px;
      margin: 24px auto;
      padding: 0 24px;
    }
    .swagger-ui .info {
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.06);
      border-radius: 16px;
      padding: 32px !important;
      margin-bottom: 24px !important;
      box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.03), 0 8px 16px -3px rgba(15, 23, 42, 0.015);
    }
    .swagger-ui .info .title {
      font-family: 'Inter', sans-serif !important;
      font-size: 32px !important;
      font-weight: 700 !important;
      color: #0f172a !important;
      letter-spacing: -0.03em !important;
    }
    .swagger-ui .info p {
      font-size: 15px !important;
      line-height: 1.6 !important;
      color: #475569 !important;
    }
    .swagger-ui .scheme-container {
      background: #ffffff !important;
      border: 1px solid rgba(15, 23, 42, 0.06) !important;
      border-radius: 16px !important;
      padding: 20px 32px !important;
      box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.03) !important;
      margin-bottom: 24px !important;
    }
    .swagger-ui .btn.authorize {
      background-color: #4f46e5 !important;
      border-color: #4f46e5 !important;
      color: #ffffff !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      padding: 8px 16px !important;
      box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05) !important;
      transition: all 0.2s ease !important;
    }
    .swagger-ui .btn.authorize:hover {
      background-color: #4338ca !important;
      border-color: #4338ca !important;
    }
    .swagger-ui .btn.authorize svg {
      fill: #ffffff !important;
    }
    .swagger-ui .opblock {
      border-radius: 12px !important;
      box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.02) !important;
      border: 1px solid rgba(15, 23, 42, 0.06) !important;
      overflow: hidden !important;
    }
    .swagger-ui .opblock .opblock-summary {
      padding: 12px 20px !important;
    }
    .swagger-ui .opblock-tag {
      font-size: 20px !important;
      font-weight: 700 !important;
      color: #0f172a !important;
      letter-spacing: -0.02em !important;
      border-bottom: 2px solid #e2e8f0 !important;
      padding-bottom: 8px !important;
    }
    .token-helper-card {
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 16px;
      padding: 24px;
      max-width: 1200px;
      margin: 24px auto 0 auto;
      box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.03);
    }
    .token-helper-card h3 {
      margin-top: 0;
      color: #0f172a;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .token-helper-card p {
      color: #475569;
      font-size: 14px;
      margin-bottom: 12px;
    }
    .token-helper-code {
      background: #f1f5f9;
      padding: 12px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #cbd5e1;
    }
    .copy-btn {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      font-size: 12px;
      transition: all 0.2s;
    }
    .copy-btn:hover {
      background: #4338ca;
    }
  </style>
</head>
<body>
  <div class="swagger-header">
    <h1>LifeSaver AI OS &mdash; API Control Center</h1>
    <span class="badge">OpenAPI 3.0</span>
  </div>

  <div class="token-helper-card">
    <h3>🔑 Quick Authentication Helper</h3>
    <p>To perform interactive testing, please click "Authorize" on the right of the schema panel below, then enter your JWT bearer token. Here is a pre-registered mock token for instant testing:</p>
    <div class="token-helper-code">
      <span id="mock-token-text">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im1vY2stdXNlci0xMjMiLCJ1c2VybmFtZSI6InNoaXZhbmlfZGV2ZWxvcGVyIiwiZW1haWwiOiJzaGl2YW5pZnMuMTc4NjE0NUBnbWFpbC5jb20ifQ.mock_signature_for_testing</span>
      <button class="copy-btn" onclick="copyToken()">Copy Token</button>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        filter: true
      });
      window.ui = ui;
    };

    function copyToken() {
      const token = document.getElementById("mock-token-text").innerText;
      navigator.clipboard.writeText(token);
      alert("Mock JWT Token copied to clipboard! Paste it into the BearerAuth dialog in Swagger UI.");
    }
  </script>
</body>
</html>`);
});

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
  // Await Database connection before starting server or accepting any requests
  await connectDB();

  // Initialize the Smart Deadline Notification Scheduler
  initScheduler();

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
