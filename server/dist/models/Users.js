"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../common/constants");
const mongoose_1 = require("mongoose");
const isEmail_js_1 = __importDefault(require("validator/lib/isEmail.js"));
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: [true, 'Email already exist'],
        trim: true,
        validate: [isEmail_js_1.default, "Enter a valid email"]
    },
    role: {
        type: String,
        enum: [constants_1.Role.Admin, constants_1.Role.Uploader],
        default: constants_1.Role.Uploader
    },
    password: {
        type: String,
        min: [8, 'Password must be at least 8 characters'],
        select: false
    },
    refreshToken: {
        type: String,
        select: false
    },
    googleRefreshToken: {
        type: String,
        select: false
    }
});
const User = (0, mongoose_1.model)('User', UserSchema);
exports.default = User;
