"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = void 0;
const catchAsync_1 = require("./catchAsync");
const services_1 = require("../services");
/**
 * Attaches req.user when valid auth cookies are present,
 * but never rejects anonymous callers. Used by public
 * endpoints (e.g. material requests) that personalize
 * when possible.
 */
const optionalAuth = (0, catchAsync_1.catchAsync)(async (req, _res, next) => {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        return next();
    }
    try {
        const { currentUser } = await (0, services_1.authenticate)({ accessToken, refreshToken });
        req["user"] = currentUser;
    }
    catch {
        // Anonymous — leave req.user unset
    }
    next();
});
exports.optionalAuth = optionalAuth;
