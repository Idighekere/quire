"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const middlewares_1 = require("../middlewares");
const controllers_1 = require("../controllers");
const express_1 = __importDefault(require("express"));
const uploadRoute = express_1.default.Router();
uploadRoute.post("/book", middlewares_1.protectRoute, controllers_1.uploadMiddleware, controllers_1.uploadBookFile);
exports.default = uploadRoute;
