import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db/index";

// Simple log function for production
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Root route for friendly message
app.get('/', (req, res) => {
  res.send('UNiSO API is running!');
});

// CORS configuration for development and production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://uniso.vercel.app',
  process.env.FRONTEND_URL, // Add your Vercel URL as environment variable
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches Vercel preview deployments
    if (allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add explicit OPTIONS handler for all routes
app.options('*', cors());

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

  // Only load Vite in development - skip entirely in production
  if (process.env.NODE_ENV === "development" && process.env.SKIP_VITE !== "true") {
    try {
      const { setupVite } = await import("./vite.js");
      await setupVite(app, server);
    } catch (err) {
      log("Vite setup skipped - running in API-only mode");
    }
  } else {
    // Production: API-only mode, no frontend serving
    log("Running in production mode - API only");
  }

  // Use PORT from environment (Render provides this) or default to 5000
  const port = process.env.PORT || 5000;
  // Always bind to 0.0.0.0 in production (when PORT is set by platform)
  const host = process.env.PORT ? '0.0.0.0' : 'localhost';
  
  server.listen(Number(port), host, () => {
    log(`serving on http://${host}:${port}`);
  });
})();
