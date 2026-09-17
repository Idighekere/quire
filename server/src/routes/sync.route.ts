import { protectRoute, restrict } from '@/middlewares';
import { syncDrive } from '@/controllers';
import { Role } from '@/common/constants';
import express from 'express';

const syncRoute = express.Router();

// Admin-only: bulk-import files from the shared Google Drive folder.
syncRoute.post('/', protectRoute, restrict(Role.Admin), syncDrive);

export default syncRoute;