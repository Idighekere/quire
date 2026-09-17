"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialRequest = exports.User = exports.Department = exports.Course = exports.Book = void 0;
var Books_1 = require("./Books");
Object.defineProperty(exports, "Book", { enumerable: true, get: function () { return __importDefault(Books_1).default; } });
var Courses_1 = require("./Courses");
Object.defineProperty(exports, "Course", { enumerable: true, get: function () { return __importDefault(Courses_1).default; } });
var Departments_1 = require("./Departments");
Object.defineProperty(exports, "Department", { enumerable: true, get: function () { return __importDefault(Departments_1).default; } });
var Users_1 = require("./Users");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return __importDefault(Users_1).default; } });
var MaterialRequest_1 = require("./MaterialRequest");
Object.defineProperty(exports, "MaterialRequest", { enumerable: true, get: function () { return __importDefault(MaterialRequest_1).default; } });
