const cors = require("cors");
const express = require("express");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const institutionRoutes = require("./routes/institutionRoutes");
const contractRoutes = require("./routes/contractRoutes");
const routeRoutes = require("./routes/routeRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const alertRoutes = require("./routes/alertRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const systemRoutes = require("./routes/systemRoutes");
const { env } = require("./config/env");
const { errorMiddleware, notFoundMiddleware } = require("./middleware/errorMiddleware");
const { sanitizationMiddleware } = require("./middleware/sanitizationMiddleware");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const logger = require("./utils/logger");

const app = express();

const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(morganFormat, { stream: { write: message => logger.info(message.trim()) } }));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "https://accounts.google.com"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "connect-src": ["'self'", "https://accounts.google.com"],
        "frame-src": ["'self'", "https://accounts.google.com"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

const allowedOrigins = env.corsOrigin 
  ? env.corsOrigin.split(',').map(o => o.trim()) 
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, postman, mobile apps, or local tests)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
        (env.nodeEnv === "development" && (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("vercel.app");
      
      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use("/api/", apiLimiter);
app.use(sanitizationMiddleware);

app.get("/health", (req, res) => {
  res.json({ success: true, message: "API is healthy" });
});

// ----- API Routes -----
app.use("/api/auth", authRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/system", systemRoutes);

const fs = require("fs");

// ----- Serve Frontend (Production) -----
// In production, the backend serves the Vite-built static files from frontend/dist.
// This allows a single-port deployment (port 5000) serving both the API and the UI.
const distPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(distPath));

// SPA fallback: any non-API route falls through to index.html so React Router works.
app.get("*", (req, res, next) => {
  // Only serve index.html for non-API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      success: false,
      message: "API Route not found (Frontend static files are not built on this host)."
    });
  }
});

// ----- Error Handling -----
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
