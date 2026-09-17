"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const middlewares_1 = require("../middlewares");
const controllers_1 = require("../controllers");
const express_1 = __importDefault(require("express"));
const constants_1 = require("../common/constants");
const coursesRoute = express_1.default.Router();
coursesRoute.route("/").post(middlewares_1.protectRoute, (0, middlewares_1.restrict)(constants_1.Role.Admin, constants_1.Role.Uploader), controllers_1.createCourse).get(controllers_1.filterCourses);
coursesRoute.get('/me', middlewares_1.protectRoute, controllers_1.getCoursesByUser);
coursesRoute.get('/lookup/:courseCode', controllers_1.lookupCourse);
coursesRoute.route("/:id").patch(middlewares_1.protectRoute, controllers_1.updateCourse).delete(middlewares_1.protectRoute, controllers_1.deleteCourse);
exports.default = coursesRoute;
