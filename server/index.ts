import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db/index";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



// Use CORS middleware and allow all deployed frontend origins
const allowedOrigins = [
  "https://uniso-6y1vw9byd-adityak05s-projects.vercel.app",
  "https://uniso-d46oauvuy-adityak05s-projects.vercel.app"
];
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Explicitly handle preflight OPTIONS requests for all routes
app.options('*', cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure database schema exists (runs once when tables are missing)
  async function ensureDatabaseSchema() {
    try {
      const check = await pool.query("SELECT to_regclass('public.users') as t");
      const usersTable = check.rows?.[0]?.t;
      if (!usersTable) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const schemaPath = path.join(__dirname, "db", "schema.sql");
        const schemaSql = fs.readFileSync(schemaPath, "utf-8");
        await pool.query(schemaSql);
        log("database schema created");
      }
    } catch (err) {
      console.error("Failed ensuring database schema:", err);
    }
  }

  await ensureDatabaseSchema();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
  // serveStatic(app); // Removed: no static frontend serving in API-only deployment
  }

  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on 0.0.0.0:${port} (use Render's provided URL in production)`);
  });
})();
