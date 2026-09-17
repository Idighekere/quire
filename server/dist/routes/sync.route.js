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
// Admin-only: which Google account + root folder sync reads from.
syncRoute.get('/debug', middlewares_1.protectRoute, (0, middlewares_1.restrict)(constants_1.Role.Admin), controllers_1.getSyncDebug);
// Admin-only: short-lived token for the browser-side Google Picker.
syncRoute.get('/picker-token', middlewares_1.protectRoute, (0, middlewares_1.restrict)(constants_1.Role.Admin), controllers_1.getPickerToken);
// Admin-only: import files/folders selected in the Google Picker by ID.
syncRoute.post('/import', middlewares_1.protectRoute, (0, middlewares_1.restrict)(constants_1.Role.Admin), controllers_1.importPickedFiles);
// Any logged-in user: picker token + import for their OWN Google Drive
// (contributor path — course comes from the submitted form).
syncRoute.get('/my-picker-token', middlewares_1.protectRoute, controllers_1.getMyPickerToken);
syncRoute.post('/my-import', middlewares_1.protectRoute, controllers_1.importFromMyDrive);
// Admin-only: bulk-import files from the shared Google Drive folder.
syncRoute.post('/', middlewares_1.protectRoute, (0, middlewares_1.restrict)(constants_1.Role.Admin), controllers_1.syncDrive);
exports.default = syncRoute;
