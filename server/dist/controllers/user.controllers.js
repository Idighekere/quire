"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = void 0;
const utils_1 = require("../common/utils");
const middlewares_1 = require("../middlewares");
const models_1 = require("../models");
const getCurrentUser = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    // Anonymous (optionalAuth left req.user unset) — 200 + null, not 401.
    // Lets the SPA boot logged-out without a console error.
    if (!req['user']) {
        return (0, utils_1.SuccessResponse)(res, 200, null, "No active session");
    }
    const user = await models_1.User.findById(req['user']._id);
    if (!user) {
        return next(new utils_1.ErrorResponse("User not found", 404));
    }
    user.password = undefined;
    (0, utils_1.SuccessResponse)(res, 200, user, "User found successfully");
});
exports.getCurrentUser = getCurrentUser;
