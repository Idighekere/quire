import { protectRoute } from '@/middlewares';
import { uploadMiddleware, uploadBookFile } from '@/controllers';
import express from 'express';

const uploadRoute = express.Router();

uploadRoute.post("/book", protectRoute, uploadMiddleware, uploadBookFile);

export default uploadRoute;