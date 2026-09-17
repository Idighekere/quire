"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const configs_1 = require("../common/configs");
const utils_1 = require("../common/utils");
const models_1 = require("../models");
const authenticate = async ({ accessToken, refreshToken }) => {
    const isProd = configs_1.ENVIRONMENT?.APP.ENV === "production";
    if (!refreshToken) {
        throw new utils_1.ErrorResponse(`${isProd ? "Unauthorized" : "No refresh token provided"}`, 401);
    }
    /**
     * Verify user after token validation
     */
    const verifyUser = async (userId) => {
        //TODO - Handle caching
        const user = await models_1.User.findById(userId).select('+refreshToken');
        // checking if the refresh token provided matches what's in the db
        if (!user) {
            throw new utils_1.ErrorResponse('User not found', 404);
        }
        if (user.refreshToken !== refreshToken) {
            throw new utils_1.ErrorResponse('Invalid token. Please log in again!', 401);
        }
        return user;
    };
    /**
 * Refresh access token using refresh token
 */
    const refreshAccessToken = async () => {
        if (!refreshToken) {
            throw new utils_1.ErrorResponse('No refresh token provided', 401);
        }
        try {
            // Verify the refresh token
            const decoded = await (0, utils_1.verifyToken)(refreshToken, configs_1.ENVIRONMENT.JWT.REFRESH_KEY);
            // Verify and get user
            const user = await verifyUser(decoded?.id);
            // Generate new access token
            const newAccessToken = utils_1.generateTokens.access({ id: user._id.toString() }, { "expiresIn": Number(configs_1.ENVIRONMENT.JWT.EXPIRES_IN.ACCESS) });
            return {
                currentUser: user,
                accessToken: newAccessToken,
            };
        }
        catch (error) {
            if (!(error instanceof utils_1.ErrorResponse)) {
                throw new utils_1.ErrorResponse('Session expired, please log in again', 401);
            }
            throw error;
        }
    };
    if (!accessToken) {
        return refreshAccessToken();
    }
    try {
        // Verify the access token
        const decoded = await (0, utils_1.verifyToken)(accessToken, configs_1.ENVIRONMENT.JWT.ACCESS_KEY);
        // Verify and get user
        const user = await verifyUser(decoded?.id);
        return { currentUser: user };
    }
    catch (error) {
        // If access token is invalid or expired, try to refresh it
        if (error instanceof utils_1.ErrorResponse || error instanceof Error) {
            return refreshAccessToken();
        }
        // Handle unexpected errors
        throw new utils_1.ErrorResponse('Authentication failed', 401);
    }
};
exports.authenticate = authenticate;
