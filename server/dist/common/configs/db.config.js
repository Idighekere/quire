"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDatabaseConnected = exports.connectToDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const environment_config_1 = require("./environment.config");
const uri = environment_config_1.ENVIRONMENT.DB.URI || "mongodb://localhost:27017/faculty-library";
//This is to prevent multiple connections in prduction
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}
const connectToDatabase = async () => {
    if (cached.conn)
        return cached.conn;
    if (!cached.promise) {
        // Note: Do NOT 'await' here, assign the promise itself
        cached.promise = mongoose_1.default.connect(uri, {
            bufferCommands: false,
        });
    }
    try {
        cached.conn = await cached.promise;
        console.log(`Connected to MongoDB`);
    }
    catch (e) {
        cached.promise = null; // Reset if it fails
        throw e;
    }
    return cached.conn;
};
exports.connectToDatabase = connectToDatabase;
/**
 * Synchronous, allocation-free read of the driver state.
 * Lets request middleware skip work entirely when the
 * startup-time connection is already up.
 */
const isDatabaseConnected = () => {
    return mongoose_1.default.connection.readyState === 1;
};
exports.isDatabaseConnected = isDatabaseConnected;
