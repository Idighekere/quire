"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const controllers_1 = require("../controllers");
const middlewares_1 = require("../middlewares");
const express_1 = __importDefault(require("express"));
const userRoutes = express_1.default.Router();
// NOTE: optionalAuth (not protectRoute) on purpose. AuthProvider fires this
// on every page load including anonymous visits; a 401 here logs a console
// error in every visitor's browser and dings the PageSpeed console audit.
// Anonymous callers get 200 + null instead — the client treats null as
// logged-out, same as before.
userRoutes.get('/me', middlewares_1.optionalAuth, controllers_1.getCurrentUser);
exports.default = userRoutes;
