"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const middlewares_1 = require("../middlewares");
const controllers_1 = require("../controllers");
const express_1 = __importDefault(require("express"));
const authRoutes = express_1.default.Router();
authRoutes.post('/login', controllers_1.login).post("/register", controllers_1.register).post("/logout", middlewares_1.protectRoute, controllers_1.logout);
authRoutes.get('/google', controllers_1.googleAuthStart).get('/google/callback', controllers_1.googleAuthCallback);
// .post('/refresh-token',refreshToken);
exports.default = authRoutes;
