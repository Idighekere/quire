import { protectRoute, restrict, optionalAuth } from '@/middlewares';
import {
  createRequest,
  listRequests,
  upvoteRequest,
  fulfillRequest,
  updateRequestStatus,
} from '@/controllers';
import { Role } from '@/common/constants';
import express from 'express';

const requestsRoute = express.Router();

requestsRoute
  .route('/')
  .get(optionalAuth, listRequests)
  .post(optionalAuth, createRequest);

requestsRoute.route('/:id/want').post(optionalAuth, upvoteRequest);
requestsRoute.route('/:id/fulfill').post(protectRoute, fulfillRequest);
requestsRoute
  .route('/:id/status')
  .patch(protectRoute, restrict(Role.Admin), updateRequestStatus);

export default requestsRoute;
