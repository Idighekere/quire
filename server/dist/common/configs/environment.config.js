"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENVIRONMENT = void 0;
require("dotenv/config");
exports.ENVIRONMENT = {
    APP: {
        PORT: parseInt(process.env.PORT || process.env.APP_PORT || '5000'),
        ENV: process.env.NODE_ENV,
        CLIENT: process.env.FRONTEND_URL,
        // Comma-separated extra origins. Falls back to FRONTEND_URL alone so
        // existing single-frontend setups keep working with no new env var.
        ALLOWED_ORIGINS: (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_URL || "")
            .split(",")
            .map((s) => s.trim().replace(/\/+$/, ""))
            .filter((s) => s.length > 0),
    },
    DB: {
        URI: process.env.MONGO_URI
    },
    JWT: {
        ACCESS_KEY: process.env.ACCESS_SECRET,
        REFRESH_KEY: process.env.REFRESH_SECRET,
        EXPIRES_IN: {
            ACCESS: process?.env?.ACCESS_EXPIRES_IN,
            REFRESH: process.env.REFRESH_EXPIRES_IN
        }
    },
    DRIVE: {
        ROOT_FOLDER_ID: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '',
        SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
        SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || ''
    },
    GOOGLE: {
        CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
        CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
        REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || ''
    }
};
