"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importFromMyDrive = exports.getMyPickerToken = void 0;
const constants_1 = require("../common/constants");
const utils_1 = require("../common/utils");
const middlewares_1 = require("../middlewares");
const models_1 = require("../models");
const drive_service_1 = require("../services/drive.service");
const course_service_1 = require("../services/course.service");
const VALID_CATEGORIES = Object.values(constants_1.BookCategory);
const MAX_PICKED_IDS = 50;
/**
 * Load the caller's own stored Google refresh token (any role).
 * Throws 409 telling them to connect Google Drive first.
 */
const driveServiceForCaller = async (userId) => {
    const caller = await models_1.User.findById(userId).select("+googleRefreshToken");
    if (!caller?.googleRefreshToken) {
        throw new utils_1.ErrorResponse("Connect your Google Drive first — open the 'From my Google Drive' option and follow the connect step.", 409);
    }
    return (0, drive_service_1.driveServiceForUser)(caller.googleRefreshToken);
};
/**
 * GET /api/v1/sync/my-picker-token (any logged-in user)
 * Mints a short-lived access token from the CALLER's own stored Google
 * token for the browser-side picker on their own Drive. 409 when they
 * have not connected Google yet.
 */
const getMyPickerToken = (0, middlewares_1.catchAsync)(async (req, res) => {
    const userDriveService = await driveServiceForCaller(req.user?._id);
    const accessToken = await userDriveService.getAccessToken();
    (0, utils_1.SuccessResponse)(res, 200, { accessToken }, "Picker token minted");
});
exports.getMyPickerToken = getMyPickerToken;
/**
 * POST /api/v1/sync/my-import (any logged-in user)
 * Imports files the caller picked from their OWN Google Drive by ID.
 * The course comes from the submitted form (code/title/departments), so
 * picked files never need a particular folder layout. Files the caller
 * owns can be shared publicly on their behalf (makePublic); files shared
 * with them by others cannot and are skipped. No bytes are downloaded —
 * only ID + link are stored. Admin imports are approved immediately;
 * contributor imports enter the moderation queue.
 *
 * Body: { fileIds: string[], courseCode: string, category: string,
 *         academicSession?: string, newCourseTitle?: string,
 *         departmentShortNames?: string[] | string, makePublic?: boolean }
 */
const importFromMyDrive = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { fileIds, courseCode, category, academicSession, newCourseTitle, departmentShortNames, makePublic, } = req.body;
    if (!Array.isArray(fileIds) || fileIds.length === 0 || fileIds.length > MAX_PICKED_IDS) {
        return next(new utils_1.ErrorResponse(`Send between 1 and ${MAX_PICKED_IDS} picked Drive file IDs`, 400));
    }
    const ids = [];
    for (const id of fileIds) {
        if (typeof id !== "string" || !id.trim()) {
            return next(new utils_1.ErrorResponse("Picked IDs must be non-empty strings", 400));
        }
        ids.push(id.trim());
    }
    if (typeof courseCode !== "string" || !courseCode.trim()) {
        return next(new utils_1.ErrorResponse("Course code is required", 400));
    }
    if (typeof category !== "string" || !VALID_CATEGORIES.includes(category)) {
        return next(new utils_1.ErrorResponse("A valid category is required", 400));
    }
    if (category === constants_1.BookCategory.PastQuestion &&
        (typeof academicSession !== "string" || !academicSession.trim())) {
        return next(new utils_1.ErrorResponse("Academic session (YYYY/YYYY) is required for past questions", 400));
    }
    const userDriveService = await driveServiceForCaller(req.user?._id);
    const { course } = await (0, course_service_1.findOrCreateCourseFromCode)({
        courseCode,
        title: typeof newCourseTitle === "string" ? newCourseTitle : undefined,
        departmentShortNames,
        addedBy: req.user._id,
    });
    const isAdmin = req.user?.role === constants_1.Role.Admin;
    const added = [];
    const skipped = [];
    for (const id of [...new Set(ids)]) {
        let meta;
        try {
            meta = await userDriveService.getFile(id);
        }
        catch {
            skipped.push({ name: id, reason: "not accessible — pick the file itself in the picker" });
            continue;
        }
        const fileName = meta.name || id;
        if (meta.mimeType === "application/vnd.google-apps.folder") {
            skipped.push({ name: fileName, reason: "folders can't be added — pick the files inside" });
            continue;
        }
        const known = await models_1.Book.findOne({ driveFileId: id });
        if (known) {
            skipped.push({ name: fileName, reason: "already in the library" });
            continue;
        }
        let isPublic = false;
        try {
            isPublic = await (0, utils_1.isDriveFilePublic)(id);
        }
        catch {
            skipped.push({ name: fileName, reason: "could not verify sharing — try again" });
            continue;
        }
        if (!isPublic && makePublic === true) {
            try {
                await userDriveService.sharePublic(id);
                isPublic = await (0, utils_1.isDriveFilePublic)(id);
            }
            catch {
                isPublic = false;
            }
        }
        if (!isPublic) {
            skipped.push({
                name: fileName,
                reason: "not shared publicly — tick 'share my files' or set sharing to 'Anyone with the link'",
            });
            continue;
        }
        const parsedSize = meta.size ? parseInt(meta.size, 10) : NaN;
        const title = fileName.replace(/\.[^./\\]+$/, "").replace(/_/g, " ").replace(/\s+/g, " ").trim() || fileName;
        await models_1.Book.create({
            title,
            driveFileId: id,
            driveUrl: `https://drive.google.com/file/d/${id}/view`,
            course: course._id,
            category,
            academicSession: typeof academicSession === "string" && academicSession.trim() ? academicSession.trim() : undefined,
            status: isAdmin ? constants_1.BookStatus.Approved : constants_1.BookStatus.Pending,
            fileName: meta.name,
            size: Number.isFinite(parsedSize) ? parsedSize : undefined,
            uploadedBy: req.user._id,
        });
        added.push({ fileId: id, name: fileName, title });
    }
    (0, utils_1.SuccessResponse)(res, 201, {
        added,
        skipped,
        summary: { added: added.length, skipped: skipped.length },
    }, `Drive import complete: ${added.length} added, ${skipped.length} skipped${isAdmin ? "" : " (pending review)"}`);
});
exports.importFromMyDrive = importFromMyDrive;
