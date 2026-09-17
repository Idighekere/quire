"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const middlewares_1 = require("../middlewares");
const controllers_1 = require("../controllers");
const constants_1 = require("../common/constants");
const express_1 = __importDefault(require("express"));
const syncRoute = express_1.default.Router();
// Admin-only: bulk-import files from the shared Google Drive folder.
syncRoute.post('/', middlewares_1.protectRoute, (0, middlewares_1.restrict)(constants_1.Role.Admin), controllers_1.syncDrive);
exports.default = syncRoute;
