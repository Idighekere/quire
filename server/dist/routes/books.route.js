"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const middlewares_1 = require("../middlewares");
const constants_1 = require("../common/constants");
const controllers_1 = require("../controllers");
const express_1 = __importDefault(require("express"));
const booksRoute = express_1.default.Router();
// Static paths (/all, /pending, /course/:courseCode) are declared before the
// parameterized routes so they are never swallowed by /:bookId.
booksRoute.route("/").post(middlewares_1.protectRoute, controllers_1.addBook).get(middlewares_1.protectRoute, controllers_1.getBooksByUser);
booksRoute.route("/all").get(controllers_1.getAllBooks);
booksRoute.route("/pending").get(middlewares_1.protectRoute, (0, middlewares_1.restrict)(constants_1.Role.Admin), controllers_1.listPendingBooks);
booksRoute.route("/course/:courseCode").get(controllers_1.getBooksByCourse);
booksRoute.route("/:bookId/status").patch(middlewares_1.protectRoute, (0, middlewares_1.restrict)(constants_1.Role.Admin), controllers_1.moderateBook);
booksRoute.route("/:bookId").get(middlewares_1.optionalAuth, controllers_1.getBookById).patch(middlewares_1.protectRoute, controllers_1.updateBook).delete(middlewares_1.protectRoute, controllers_1.deleteBook);
exports.default = booksRoute;
