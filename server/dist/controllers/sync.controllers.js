"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importPickedFiles = exports.getPickerToken = exports.getSyncDebug = exports.syncDrive = void 0;
const configs_1 = require("../common/configs");
const constants_1 = require("../common/constants");
const utils_1 = require("../common/utils");
const middlewares_1 = require("../middlewares");
const models_1 = require("../models");
const drive_service_1 = require("../services/drive.service");
// Matches course folders named like "GET211 - Strength of Materials" (case-insensitive).
// An optional "UUY-" school prefix is accepted and stripped ("UUY-CPE313 - Title").
const COURSE_FOLDER_REGEX = /^(?:UUY\s*-\s*)?([A-Z]{3}\s*[1-5][12][0-9])\s*[-–—]\s*(.+)$/i;
const VALID_CATEGORIES = Object.values(constants_1.BookCategory);
// Hard guard so a huge Drive never blows past a serverless function timeout.
const MAX_VISITED_ITEMS = 2500;
/**
 * Derive a book title from the Drive file name: strip the extension,
 * turn underscores into spaces, collapse whitespace, trim. Falls back to
 * the course folder title when nothing readable remains.
 */
const deriveBookTitleFromFileName = (rawName, folderTitleFallback) => {
    const withoutExt = rawName.replace(/\.[^./\\]+$/, "");
    const withSpaces = withoutExt.replace(/_/g, " ");
    const collapsed = withSpaces.replace(/\s+/g, " ").trim();
    if (collapsed)
        return collapsed;
    return folderTitleFallback.trim();
};
/**
 * Import one Drive file into the library: resolve (or auto-create) its
 * course from the deepest folder segment, skip duplicates, optionally
 * verify public sharing, then create the book. Shared by the sync walk
 * and the picker import so both paths catalog identically.
 */
const importDriveFile = async (args) => {
    const { file, segments, category, addedBy, adminDriveService, added, skipped, coursesCreated, checkPublicity, makePublic, parentFolderId, } = args;
    const fileName = file.name || file.id || "unknown";
    if (!file.id) {
        skipped.push({ name: fileName, reason: "Drive file has no id" });
        return;
    }
    // The deepest folder is the course folder (unless the file sits at root).
    const courseSegment = segments.length > 0 ? segments[segments.length - 1] : "";
    const courseMatch = courseSegment
        ? COURSE_FOLDER_REGEX.exec(courseSegment)
        : null;
    if (!courseMatch) {
        skipped.push({
            name: fileName,
            reason: "file is not inside a '<CODE> - <Title>' course folder",
        });
        return;
    }
    const rawCodeSegment = (courseSegment.split(/[-–—]/)[0] || courseMatch[1]).trim();
    const { prefix } = (0, utils_1.splitCourseCodePrefix)(rawCodeSegment);
    const courseCode = (0, utils_1.normalizeCourseCode)(courseMatch[1]);
    let course = await models_1.Course.findOne({ courseCode });
    if (!course) {
        // Auto-create the course from the folder name so a well-named Drive
        // tree imports wholesale. It starts department-less; an admin can
        // assign departments later from the course list. Lookup is by code,
        // so a typo'd folder title never forks a duplicate course.
        const folderTitle = courseMatch[2].trim();
        try {
            course = await models_1.Course.create({
                title: folderTitle,
                courseCode,
                codePrefix: prefix || undefined,
                departments: [],
                addedBy,
            });
            coursesCreated.push({ courseCode, title: folderTitle });
        }
        catch (err) {
            // Race: two imports creating the same course at once → reuse the winner
            if (err && typeof err === "object" && "code" in err && err.code === 11000) {
                const winner = await models_1.Course.findOne({ courseCode });
                if (winner) {
                    course = winner;
                    if (!course.codePrefix && prefix) {
                        course.codePrefix = prefix;
                        await course.save();
                    }
                }
                else {
                    throw err;
                }
            }
            else {
                throw err;
            }
        }
    }
    else if (!course.codePrefix && prefix) {
        course.codePrefix = prefix;
        await course.save();
    }
    // Bind the course folder so later app uploads resolve it by ID instead
    // of re-matching by name (invisible manual folders can never match).
    if (parentFolderId && !course.driveFolderId) {
        course.driveFolderId = parentFolderId;
        await course.save();
    }
    const known = await models_1.Book.findOne({ driveFileId: file.id });
    // Drive reports size as a decimal string; native Google Docs/Sheets have
    // none. Backfill it onto older books that were imported before sizes.
    const parsedSize = file.size ? parseInt(file.size, 10) : NaN;
    const sizeBytes = Number.isFinite(parsedSize) ? parsedSize : undefined;
    if (known) {
        if (known.size == null && sizeBytes !== undefined) {
            known.size = sizeBytes;
            await known.save();
        }
        skipped.push({ name: fileName, reason: "already in the library" });
        return;
    }
    if (checkPublicity) {
        let isPublic = false;
        try {
            isPublic = await (0, utils_1.isDriveFilePublic)(file.id);
        }
        catch {
            skipped.push({ name: fileName, reason: "could not verify sharing — try again" });
            return;
        }
        if (!isPublic && makePublic) {
            try {
                await adminDriveService.sharePublic(file.id);
                isPublic = await (0, utils_1.isDriveFilePublic)(file.id);
            }
            catch {
                isPublic = false;
            }
        }
        if (!isPublic) {
            skipped.push({
                name: fileName,
                reason: "not shared publicly — set sharing to 'Anyone with the link' and try again",
            });
            return;
        }
    }
    const bookTitle = deriveBookTitleFromFileName(fileName, courseMatch[2].trim());
    await models_1.Book.create({
        title: bookTitle,
        driveFileId: file.id,
        driveUrl: `https://drive.google.com/file/d/${file.id}/view`,
        course: course._id,
        category,
        status: constants_1.BookStatus.Approved,
        fileName: file.name,
        size: sizeBytes,
        uploadedBy: addedBy,
    });
    added.push({
        fileId: file.id,
        name: fileName,
        courseCode,
        title: bookTitle,
    });
};
/**
 * POST /api/v1/sync (admin)
 * Walks the shared Google Drive root folder, parses each course folder
 * (e.g. "GET211 - Strength of Materials"), and adds any file that is not
 * already in the library. Courses that are not in the library yet are
 * auto-created from the folder name (code + title) so a well-named Drive
 * tree can be imported wholesale.
 *
 * Query: ?category=pastQuestion|textBook|lectureNote (default textBook)
 */
const syncDrive = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const rootFolderId = configs_1.ENVIRONMENT.DRIVE.ROOT_FOLDER_ID;
    if (!rootFolderId) {
        return next(new utils_1.ErrorResponse("Google Drive is not configured on this server", 500));
    }
    const requestedCategory = req.query.category;
    const category = requestedCategory && VALID_CATEGORIES.includes(requestedCategory)
        ? requestedCategory
        : constants_1.BookCategory.TextBook;
    // Sync reads as the library service account, which sees every file
    // inside the shared master folder by folder ACL (hand-dropped files
    // included). Throws 503 when the SA credentials are not configured.
    const syncDriveService = (0, drive_service_1.driveServiceForServiceAccount)();
    const added = [];
    const skipped = [];
    const coursesCreated = [];
    const folders = [];
    let visited = 0;
    const walk = async (parentId, segments) => {
        const displayPath = segments.join(" / ") || "(root)";
        if (folders.length < 200) {
            folders.push(displayPath);
        }
        if (visited >= MAX_VISITED_ITEMS) {
            throw new utils_1.ErrorResponse(`Sync aborted after visiting ${MAX_VISITED_ITEMS} Drive items. Run it again to continue.`, 400);
        }
        const { files, folders: childFolders } = await syncDriveService.listChildren(parentId);
        visited += files.length + childFolders.length;
        for (const folder of childFolders) {
            if (!folder.id)
                continue;
            await walk(folder.id, [...segments, folder.name || ""]);
        }
        for (const file of files) {
            await importDriveFile({
                file,
                segments,
                category,
                addedBy: req.user._id,
                adminDriveService: syncDriveService,
                added,
                skipped,
                coursesCreated,
                checkPublicity: false,
                makePublic: false,
                parentFolderId: parentId,
            });
        }
    };
    try {
        await walk(rootFolderId, []);
    }
    catch (err) {
        if (err instanceof utils_1.ErrorResponse)
            throw err;
        console.error("Drive sync failed:", err);
        return next(new utils_1.ErrorResponse("Failed to read the Drive folder. Check that the library master folder is shared with the service account.", 500));
    }
    (0, utils_1.SuccessResponse)(res, 200, {
        added,
        skipped,
        coursesCreated,
        visited,
        folders,
        summary: {
            added: added.length,
            skipped: skipped.length,
            coursesCreated: coursesCreated.length,
            visited,
            folders,
        },
    }, `Drive sync complete: ${added.length} added, ${skipped.length} skipped, ${coursesCreated.length} courses created`);
});
exports.syncDrive = syncDrive;
/**
 * GET /api/v1/sync/debug (admin)
 * Exposes which Google account and root folder the server syncs from,
 * plus a summary of the root's direct children. The reader is the library
 * service account: a populated childNames proves the master folder share
 * works; an empty one means the share is missing.
 */
const getSyncDebug = (0, middlewares_1.catchAsync)(async (_req, res) => {
    // Throws 503 when the SA credentials are not configured.
    const syncDriveService = (0, drive_service_1.driveServiceForServiceAccount)();
    const debug = await syncDriveService.about();
    (0, utils_1.SuccessResponse)(res, 200, debug, "Sync debug: connected Google account and root folder");
});
exports.getSyncDebug = getSyncDebug;
/**
 * GET /api/v1/sync/picker-token (admin)
 * Mints a short-lived access token for the browser-side Google Picker.
 * The picker proves the admin selected each file, which grants the app
 * per-file access under drive.file — no broad scope, no new consent.
 */
const getPickerToken = (0, middlewares_1.catchAsync)(async (_req, res) => {
    // Throws 503 when no admin has connected Google yet.
    const adminDriveService = await (0, drive_service_1.driveServiceForAdmin)();
    const accessToken = await adminDriveService.getAccessToken();
    (0, utils_1.SuccessResponse)(res, 200, { accessToken }, "Picker token minted");
});
exports.getPickerToken = getPickerToken;
const MAX_PICKED_IDS = 100;
/**
 * POST /api/v1/sync/import (admin)
 * Imports files the admin selected in the Google Picker by Drive ID.
 * Accepts file IDs and folder IDs (folders are walked recursively).
 * Each file goes through the same course-resolution, dedupe, and
 * publicity verification as the sync walk, and results share the
 * added/skipped shape so the moderation panel renders both identically.
 *
 * Body: { fileIds: string[], makePublic?: boolean }
 * Query: ?category=... (default textBook)
 */
const importPickedFiles = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { fileIds, makePublic } = req.body;
    if (!Array.isArray(fileIds) || fileIds.length === 0 || fileIds.length > MAX_PICKED_IDS) {
        return next(new utils_1.ErrorResponse(`Send between 1 and ${MAX_PICKED_IDS} picked Drive file or folder IDs`, 400));
    }
    const ids = [];
    for (const id of fileIds) {
        if (typeof id !== "string" || !id.trim()) {
            return next(new utils_1.ErrorResponse("Picked IDs must be non-empty strings", 400));
        }
        ids.push(id.trim());
    }
    const uniqueIds = [...new Set(ids)];
    const requestedCategory = req.query.category;
    const category = requestedCategory && VALID_CATEGORIES.includes(requestedCategory)
        ? requestedCategory
        : constants_1.BookCategory.TextBook;
    // Picker import reads as the connected library admin's Google account.
    // Throws 503 when no admin has connected Google yet.
    const adminDriveService = await (0, drive_service_1.driveServiceForAdmin)();
    const added = [];
    const skipped = [];
    const coursesCreated = [];
    let visited = 0;
    const importFromFolder = async (folderId, segments) => {
        if (visited >= MAX_VISITED_ITEMS) {
            throw new utils_1.ErrorResponse(`Import aborted after visiting ${MAX_VISITED_ITEMS} Drive items. Pick smaller folders.`, 400);
        }
        let children;
        try {
            children = await adminDriveService.listChildren(folderId);
        }
        catch {
            skipped.push({
                name: segments[segments.length - 1] || folderId,
                reason: "could not list folder contents",
            });
            return;
        }
        visited += children.files.length + children.folders.length;
        for (const sub of children.folders) {
            if (!sub.id)
                continue;
            await importFromFolder(sub.id, [...segments, sub.name || ""]);
        }
        for (const file of children.files) {
            await importDriveFile({
                file,
                segments,
                category,
                addedBy: req.user._id,
                adminDriveService,
                added,
                skipped,
                coursesCreated,
                checkPublicity: true,
                makePublic: makePublic === true,
                parentFolderId: folderId,
            });
        }
    };
    const importPickedId = async (id) => {
        let meta;
        try {
            meta = await adminDriveService.getFile(id);
        }
        catch {
            skipped.push({
                name: id,
                reason: "not accessible — pick the file itself in the picker",
            });
            return;
        }
        if (meta.mimeType === "application/vnd.google-apps.folder") {
            let segments;
            try {
                segments = await adminDriveService.getFilePath(id);
            }
            catch {
                skipped.push({ name: meta.name || id, reason: "could not read folder location" });
                return;
            }
            await importFromFolder(id, segments);
            return;
        }
        let segments;
        try {
            // getFilePath includes the file's own name last; the course
            // folder is its parent, so drop the final segment.
            segments = (await adminDriveService.getFilePath(id)).slice(0, -1);
        }
        catch {
            skipped.push({ name: meta.name || id, reason: "could not read file location" });
            return;
        }
        visited += 1;
        await importDriveFile({
            file: meta,
            segments,
            category,
            addedBy: req.user._id,
            adminDriveService,
            added,
            skipped,
            coursesCreated,
            checkPublicity: true,
            makePublic: makePublic === true,
            parentFolderId: meta.parents?.[0] ?? null,
        });
    };
    try {
        for (const id of uniqueIds) {
            await importPickedId(id);
        }
    }
    catch (err) {
        if (err instanceof utils_1.ErrorResponse)
            throw err;
        console.error("Drive import failed:", err);
        return next(new utils_1.ErrorResponse("Failed to import from Drive. Check that an admin has connected Google.", 500));
    }
    (0, utils_1.SuccessResponse)(res, 200, {
        added,
        skipped,
        coursesCreated,
        visited,
        summary: {
            added: added.length,
            skipped: skipped.length,
            coursesCreated: coursesCreated.length,
            visited,
        },
    }, `Drive import complete: ${added.length} added, ${skipped.length} skipped, ${coursesCreated.length} courses created`);
});
exports.importPickedFiles = importPickedFiles;
