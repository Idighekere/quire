"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectGoogleConnection = exports.getGoogleConnectionStatus = exports.googleAuthCallback = exports.googleAuthStart = exports.resetPassword = exports.forgotPassword = exports.register = exports.logout = exports.login = void 0;
const configs_1 = require("../common/configs");
const utils_1 = require("../common/utils");
const constants_1 = require("../common/constants");
const middlewares_1 = require("../middlewares");
const models_1 = require("../models");
const crypto_1 = __importDefault(require("crypto"));
const googleapis_1 = require("googleapis");
const login = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { password, email } = req.body;
    if (!email || !password) {
        return next(new utils_1.ErrorResponse("Incomplete login data", 400));
    }
    const user = await models_1.User.findOne({ email }).select("+password");
    if (!user) {
        return next(new utils_1.ErrorResponse("Invalid credentials", 401));
    }
    const isPasswordMatching = await (0, utils_1.comparePassword)(password, user.password);
    if (!isPasswordMatching) {
        return next(new utils_1.ErrorResponse("Invalid credentials", 401));
    }
    const accessToken = utils_1.generateTokens.access({ id: user._id.toString() }, { expiresIn: Number(configs_1.ENVIRONMENT?.JWT?.EXPIRES_IN?.ACCESS) });
    (0, utils_1.setCookie)(res, "accessToken", accessToken, { maxAge: 15 * 60 * 1000 }); //15 minutes
    const refreshToken = utils_1.generateTokens.refresh({ id: user._id.toString() }, { expiresIn: Number(configs_1.ENVIRONMENT.JWT.EXPIRES_IN.REFRESH) }, configs_1.ENVIRONMENT.JWT.REFRESH_KEY);
    (0, utils_1.setCookie)(res, 'refreshToken', refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    user.refreshToken = refreshToken;
    await user.save();
    user.refreshToken = undefined;
    user.password = undefined;
    const responseData = {
        user,
        accessToken
    };
    //FIXME - handle response properly
    (0, utils_1.SuccessResponse)(res, 200, responseData, "Login successful");
});
exports.login = login;
const register = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { email, name, password } = req.body;
    if (!email || !password || !name) {
        return next(new utils_1.ErrorResponse("Incomplete signup data", 400));
    }
    const userExists = await models_1.User.findOne({ email });
    if (userExists) {
        return next(new utils_1.ErrorResponse("Email already exist", 409));
    }
    const hashedPassword = await (0, utils_1.hashPassword)(password);
    const newUser = await models_1.User.create({ email, name, password: hashedPassword });
    (0, utils_1.SuccessResponse)(res, 201, { email, name, role: newUser.role }, "User created successfully");
});
exports.register = register;
const logout = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { user } = req;
    if (!user) {
        return next(new utils_1.ErrorResponse("You are not logged in", 404));
    }
    await models_1.User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } }); // unset will remove the refreshToken field
    (0, utils_1.clearCookie)(res, "refreshToken");
    (0, utils_1.clearCookie)(res, "accessToken");
    (0, utils_1.SuccessResponse)(res, 200, null, 'Logout successful');
});
exports.logout = logout;
//TODO - Implement forgot and reset passord functionality
const forgotPassword = (0, middlewares_1.catchAsync)(async (req, res, next) => {
});
exports.forgotPassword = forgotPassword;
const resetPassword = (0, middlewares_1.catchAsync)(async (req, res, next) => {
});
exports.resetPassword = resetPassword;
const GOOGLE_OAUTH_SCOPES = ["email", "profile"];
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
// Accepts only bare origins like "https://app.example.com" (scheme + host
// + optional port, no path). Returns null for anything else.
const normalizeOrigin = (value) => {
    if (typeof value !== "string")
        return null;
    const trimmed = value.trim().replace(/\/+$/, "");
    if (!/^https?:\/\/[^/]+$/i.test(trimmed))
        return null;
    return trimmed;
};
const isAllowedOrigin = (origin) => {
    return configs_1.ENVIRONMENT.APP.ALLOWED_ORIGINS.includes(origin);
};
const isGoogleOAuthConfigured = () => {
    return Boolean(configs_1.ENVIRONMENT.GOOGLE.CLIENT_ID &&
        configs_1.ENVIRONMENT.GOOGLE.CLIENT_SECRET &&
        configs_1.ENVIRONMENT.GOOGLE.REDIRECT_URI);
};
const buildGoogleOAuthClient = () => {
    return new googleapis_1.google.auth.OAuth2(configs_1.ENVIRONMENT.GOOGLE.CLIENT_ID, configs_1.ENVIRONMENT.GOOGLE.CLIENT_SECRET, configs_1.ENVIRONMENT.GOOGLE.REDIRECT_URI);
};
// GET /api/v1/auth/google[?redirect=<origin>][&drive=1] — redirect the
// browser to Google's consent screen. An optional `redirect` origin is bound
// into the OAuth state so multi-frontend setups return to the requesting
// frontend. It must exactly match FRONTEND_ORIGINS or it is ignored.
// `?drive=1` requests the Drive scope (admin-only, one-time connection so
// uploads run as the library account); regular sign-ins get email+profile
// only and no offline access. The drive flag is encoded in the state so the
// callback can read back which flow it was.
const googleAuthStart = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    if (!isGoogleOAuthConfigured()) {
        return next(new utils_1.ErrorResponse("Google sign-in is not configured on this server", 500));
    }
    const requestedOrigin = normalizeOrigin(req.query.redirect);
    const safeReturnTo = requestedOrigin && isAllowedOrigin(requestedOrigin)
        ? requestedOrigin
        : null;
    const wantDrive = req.query.drive === "1" || req.query.drive === "true";
    const stateToken = crypto_1.default.randomBytes(16).toString("hex");
    (0, utils_1.setCookie)(res, "oauth_state", stateToken, { maxAge: 10 * 60 * 1000 });
    // State shape: "<token>" | "<token>.<drive|encodedReturnTo>" |
    // "<token>.drive.<encodedReturnTo>". The token is verified against the
    // oauth_state cookie in the callback; the rest is parsed there.
    const stateParts = [stateToken];
    if (wantDrive) {
        stateParts.push("drive");
    }
    if (safeReturnTo) {
        stateParts.push(encodeURIComponent(safeReturnTo));
    }
    const state = stateParts.join(".");
    const authUrlOptions = {
        scope: wantDrive ? [...GOOGLE_OAUTH_SCOPES, GOOGLE_DRIVE_SCOPE] : GOOGLE_OAUTH_SCOPES,
        state,
        prompt: "select_account",
    };
    if (wantDrive) {
        authUrlOptions.access_type = "offline";
    }
    const authUrl = buildGoogleOAuthClient().generateAuthUrl(authUrlOptions);
    res.redirect(authUrl);
});
exports.googleAuthStart = googleAuthStart;
// GET /api/v1/auth/google/callback — Google redirects here with ?code=…&state=….
// Exchanges the code, finds-or-creates the user by email, sets the same
// session cookies as password login, then redirects to the frontend.
const googleAuthCallback = (0, middlewares_1.catchAsync)(async (req, res) => {
    const defaultOrigin = configs_1.ENVIRONMENT.APP.CLIENT || "/";
    const { code, state } = req.query;
    // Resolve the return origin BEFORE any failure redirect: state is
    // "<token>" or "<token>[.drive][.<encodedReturnTo>]". The token must
    // match the oauth_state cookie, and the origin must be allowlisted —
    // otherwise everything falls back to FRONTEND_URL. The optional "drive"
    // segment marks the admin Drive-connection flow (regular sign-ins omit
    // it, keeping backward compatibility with previously issued states).
    let returnOrigin = defaultOrigin;
    let stateToken = null;
    if (typeof state === "string") {
        const segments = state.split(".");
        stateToken = segments[0] || null;
        const rest = segments.slice(1);
        if (rest[0] === "drive") {
            rest.shift();
        }
        if (rest.length > 0) {
            try {
                const candidate = normalizeOrigin(decodeURIComponent(rest.join(".")));
                if (candidate && isAllowedOrigin(candidate)) {
                    returnOrigin = candidate;
                }
            }
            catch {
                // keep the default origin
            }
        }
    }
    const fail = (code) => {
        res.redirect(`${returnOrigin}/auth/login?error=${code}`);
    };
    if (!isGoogleOAuthConfigured()) {
        fail("google_not_configured");
        return;
    }
    if (typeof code !== "string" || !code) {
        fail("google_failed");
        return;
    }
    if (!stateToken || stateToken !== req.cookies?.oauth_state) {
        fail("google_failed");
        return;
    }
    (0, utils_1.clearCookie)(res, "oauth_state");
    try {
        const oauthClient = buildGoogleOAuthClient();
        const { tokens } = await oauthClient.getToken(code);
        oauthClient.setCredentials(tokens);
        const oauth2 = googleapis_1.google.oauth2({ version: "v2", auth: oauthClient });
        const { data } = await oauth2.userinfo.get();
        const email = data.email?.toLowerCase().trim();
        if (!email || data.verified_email !== true) {
            fail("google_no_email");
            return;
        }
        const name = data.name?.trim() || email.split("@")[0];
        let user = await models_1.User.findOne({ email });
        if (!user) {
            user = await models_1.User.create({ email, name });
        }
        if (tokens.refresh_token) {
            user.googleRefreshToken = tokens.refresh_token;
        }
        const accessToken = utils_1.generateTokens.access({ id: user._id.toString() }, { expiresIn: Number(configs_1.ENVIRONMENT?.JWT?.EXPIRES_IN?.ACCESS) });
        (0, utils_1.setCookie)(res, "accessToken", accessToken, { maxAge: 15 * 60 * 1000 });
        const refreshToken = utils_1.generateTokens.refresh({ id: user._id.toString() }, { expiresIn: Number(configs_1.ENVIRONMENT.JWT.EXPIRES_IN.REFRESH) }, configs_1.ENVIRONMENT.JWT.REFRESH_KEY);
        (0, utils_1.setCookie)(res, 'refreshToken', refreshToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        user.refreshToken = refreshToken;
        await user.save();
        res.redirect(`${returnOrigin}/dashboard`);
    }
    catch {
        fail("google_failed");
    }
});
exports.googleAuthCallback = googleAuthCallback;
// GET /api/v1/auth/google/status (admin) — whether any ADMIN has a stored
// Google Drive refresh token. Uploads run as the admin account, so a token
// on a non-admin record must NOT report connected (it previously did,
// while every upload failed).
const getGoogleConnectionStatus = (0, middlewares_1.catchAsync)(async (_req, res) => {
    const connectedAdmin = await models_1.User.exists({
        role: constants_1.Role.Admin,
        googleRefreshToken: { $exists: true, $ne: null },
    });
    (0, utils_1.SuccessResponse)(res, 200, { connected: Boolean(connectedAdmin) }, "Drive connection status");
});
exports.getGoogleConnectionStatus = getGoogleConnectionStatus;
// DELETE /api/v1/auth/google/connection — clears the CALLER's own stored
// Google Drive refresh token.
const disconnectGoogleConnection = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const callerId = req.user?._id;
    if (!callerId) {
        return next(new utils_1.ErrorResponse("You are not logged in", 404));
    }
    const dbUser = await models_1.User.findById(callerId);
    if (!dbUser) {
        return next(new utils_1.ErrorResponse("User not found", 404));
    }
    dbUser.googleRefreshToken = undefined;
    await dbUser.save();
    (0, utils_1.SuccessResponse)(res, 200, { connected: false }, "Google Drive disconnected");
});
exports.disconnectGoogleConnection = disconnectGoogleConnection;
