import * as dotenv from "dotenv";
dotenv.config();
if (process.env.NODE_ENV === "production") {
  require("module-alias/register");
}

import express, { NextFunction, Request, Response } from "express";
import { globalErrorHandler } from "@/middlewares";
import morgan from "morgan";
import { ErrorResponse } from "@/common/utils";
import cookie from "cookie-parser";
import {
  authRoutes,
  booksRoute,
  coursesRoute,
  departmentsRoute,
  requestsRoute,
  syncRoute,
  uploadRoute,
  userRoutes,
} from "@/routes";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet, { HelmetOptions } from "helmet";
import { connectToDatabase, isDatabaseConnected, ENVIRONMENT } from "./common/configs";
import mongoSanitize from "express-mongo-sanitize";
// import xss from 'xss-clean';

const app = express();

// Log all responses, including JSON parsing and database errors.
app.use(morgan(ENVIRONMENT.APP.ENV !== "development" ? "combined" : "dev"));

// Middleware to parse JSON and cookies
app.use(express.json());
app.use(cookie());

// The server connects once at startup (see server.ts). This guard only
// reconnects on serverless cold starts or after a dropped connection —
// when already connected it is a synchronous readyState check.
app.use(async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      await connectToDatabase();
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});
// CORS configuration
// Uses FRONTEND_ORIGINS when set, otherwise the previous hardcoded list.
const FALLBACK_ORIGINS = [
  "http://localhost:5173",
  "http://192.168.44.119:5173",
  "https://nuesa-library.loca.lt",
  "https://faculty-library.netlify.app",
];
const corsOptions = {
  origin:
    ENVIRONMENT.APP.ALLOWED_ORIGINS.length > 0
      ? ENVIRONMENT.APP.ALLOWED_ORIGINS
      : FALLBACK_ORIGINS,
  credentials: true, // Allow credentials (cookies) to be sent and received
  optionsSuccessStatus: 200,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization, X-Requested-With",
};
// Add headers to the response
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Apply CORS middleware
app.use(cors(corsOptions));

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: ENVIRONMENT.APP.ENV == "development" ? 1000 : 100,
  message: "Too many requests from this IP, please try again later",
});
app.use("/api/v1/courses", apiLimiter);
app.use("/api/v1/books", apiLimiter);
app.use("/api/v1/auth", apiLimiter);
app.use("/api/v1/requests", apiLimiter);
app.use("/api/v1/upload", apiLimiter);
app.use("/api/v1/sync", apiLimiter);

// Security headers configuration
const helmetConfig: HelmetOptions = {
  xssFilter: true,
  frameguard: { action: "deny" },
  referrerPolicy: { policy: "strict-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
};
app.use(helmet(helmetConfig));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world!");
});

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/books", booksRoute);
app.use("/api/v1/courses", coursesRoute);
app.use("/api/v1/departments", departmentsRoute);
app.use("/api/v1/requests", requestsRoute);
app.use("/api/v1/upload", uploadRoute);
app.use("/api/v1/sync", syncRoute);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  return next(
    new ErrorResponse(`Can't find ${req.originalUrl} in the server`, 404),
  );
});

app.use(globalErrorHandler);

export default app;
