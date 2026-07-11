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

// Serve uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Explicit robots.txt endpoint to avoid returning index.html (which causes Lighthouse SEO issues)
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send("User-agent: *\nAllow: /");
});

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
    .token-helper-card ol {
      color: #475569;
      font-size: 14px;
      padding-left: 20px;
      line-height: 1.6;
      margin-top: 8px;
      margin-bottom: 0;
    }
    .token-helper-card li {
      margin-bottom: 6px;
    }
    .token-helper-card code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="swagger-header">
    <h1>LifeSaver AI Assistant &mdash; API Control Center</h1>
    <span class="badge">OpenAPI 3.0</span>
  </div>

  <div class="token-helper-card">
    <h3>🔐 Authentication</h3>
    <p>Most protected endpoints require a valid JWT access token.</p>
    <p><strong>Steps to authorize:</strong></p>
    <ol>
      <li>Register a new account (or use an existing one via the <strong>Authentication</strong> group).</li>
      <li>Login to receive a JWT access token in the response payload.</li>
      <li>Click the <strong>Authorize</strong> button on the top right.</li>
      <li>Enter your token in the dialog box exactly in the following format: <code>Bearer &lt;your_jwt_token&gt;</code></li>
    </ol>
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

  // Prefer serving the optimized static production build if it exists
  if (fs.existsSync(path.join(distPath, "index.html"))) {
    console.log("[Server Initialization] Found production build in /dist. Serving static optimized assets.");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else if (process.env.NODE_ENV !== "production") {
    console.log("[Server Initialization] Starting Vite Development Server Middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server Initialization] Serving static assets in standard production mode...");
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
