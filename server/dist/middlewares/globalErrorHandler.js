"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const configs_1 = require("../common/configs");
const errorResponse_1 = __importDefault(require("../common/utils/errorResponse"));
const productionError = (res, error) => {
    if (error.isOperational) {
        res.status(error.statusCode).json({
            message: error.message,
            status: error.status
        });
    }
    else {
        res.status(500).json({
            status: 'error',
            message: "Something went wrong. Please try again later."
        });
    }
};
const developmentError = (res, error) => {
    res.status(error.statusCode).json({
        message: error.message,
        status: error.status,
        stackTRace: error.stack,
        error
    });
};
const castErrorHandler = (err) => {
    const errMessage = `Invalid value: ${err.value} for field: ${err.path}`;
    return new errorResponse_1.default(errMessage, 400);
};
const duplicateKeyHandler = (err) => {
    const keyValue = err.keyValue || {};
    const field = Object.keys(keyValue)[0];
    const value = field ? keyValue[field] : '';
    const errMessage = field
        ? `${field} '${value}' already exists.`
        : `Duplicate value already exists. Please try another`;
    return new errorResponse_1.default(errMessage, 409);
};
const validationErrorHandler = (err) => {
    const firstField = Object.keys(err.errors || {})[0];
    const firstMessage = firstField ? err.errors[firstField]?.message : undefined;
    return new errorResponse_1.default(firstMessage || "Invalid input. Please check your data.", 400);
};
const JWTtokenErrorHandler = (err) => {
    return new errorResponse_1.default('Invalid token. Please login again!', 401);
};
const tokenExpireErrorHandler = (err) => {
    return new errorResponse_1.default('JWT has expired. Please login again!', 401);
};
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (configs_1.ENVIRONMENT.APP.ENV == 'development') {
        developmentError(res, err);
    }
    else if (configs_1.ENVIRONMENT.APP.ENV == "production") {
        if (err.code == 11000) {
            err = duplicateKeyHandler(err);
        }
        if (err.name == 'CastError') {
            err = castErrorHandler(err);
        }
        if (err.name == "TokenExpireError") {
            err = tokenExpireErrorHandler(err);
        }
        if (err.name == 'ValidationError') {
            err = validationErrorHandler(err);
        }
        if (err.name == 'JWTTokenError') {
            err = JWTtokenErrorHandler(err);
        }
        productionError(res, err);
    }
};
exports.globalErrorHandler = globalErrorHandler;
