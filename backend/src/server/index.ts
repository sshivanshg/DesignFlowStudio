import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import MemoryStore from 'memorystore';
import config from '../config';
import routes from '../routes';
import { errorHandler } from '../middleware/errorHandler';
import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { scheduleWeeklyReports } from "./projectReports";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const MemoryStoreSession = MemoryStore(session);
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  })
);

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

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

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Register all routes and get the server instance
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    // Initialize weekly reports
    scheduleWeeklyReports(storage)
      .then(() => console.log('Weekly report scheduling initialized'))
      .catch(err => console.error('Error initializing weekly report scheduling:', err));

    // Schedule daily checks
    setInterval(() => {
      scheduleWeeklyReports(storage)
        .then(() => console.log('Daily report check complete'))
        .catch(err => console.error('Error in daily report check:', err));
    }, 24 * 60 * 60 * 1000); // 24 hours

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
