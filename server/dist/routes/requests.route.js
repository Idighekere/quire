"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const middlewares_1 = require("../middlewares");
const controllers_1 = require("../controllers");
const constants_1 = require("../common/constants");
const express_1 = __importDefault(require("express"));
const requestsRoute = express_1.default.Router();
requestsRoute
    .route('/')
    .get(middlewares_1.optionalAuth, controllers_1.listRequests)
    .post(middlewares_1.optionalAuth, controllers_1.createRequest);
requestsRoute.route('/:id/want').post(middlewares_1.optionalAuth, controllers_1.upvoteRequest);
requestsRoute.route('/:id/fulfill').post(middlewares_1.protectRoute, controllers_1.fulfillRequest);
requestsRoute
    .route('/:id/status')
    .patch(middlewares_1.protectRoute, (0, middlewares_1.restrict)(constants_1.Role.Admin), controllers_1.updateRequestStatus);
exports.default = requestsRoute;
