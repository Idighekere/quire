import { protectRoute, restrict } from '@/middlewares';
import { syncDrive, getSyncDebug, getPickerToken, importPickedFiles, getMyPickerToken, importFromMyDrive } from '@/controllers';
import { Role } from '@/common/constants';
import express from 'express';

const syncRoute = express.Router();

// Admin-only: which Google account + root folder sync reads from.
syncRoute.get('/debug', protectRoute, restrict(Role.Admin), getSyncDebug);

// Admin-only: short-lived token for the browser-side Google Picker.
syncRoute.get('/picker-token', protectRoute, restrict(Role.Admin), getPickerToken);

// Admin-only: import files/folders selected in the Google Picker by ID.
syncRoute.post('/import', protectRoute, restrict(Role.Admin), importPickedFiles);

// Any logged-in user: picker token + import for their OWN Google Drive
// (contributor path — course comes from the submitted form).
syncRoute.get('/my-picker-token', protectRoute, getMyPickerToken);
syncRoute.post('/my-import', protectRoute, importFromMyDrive);

// Admin-only: bulk-import files from the shared Google Drive folder.
syncRoute.post('/', protectRoute, restrict(Role.Admin), syncDrive);

export default syncRoute;