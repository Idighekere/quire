"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDrive = void 0;
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
    // Sync reads as the connected library admin's Google account.
    // Throws 503 when no admin has connected Google yet.
    const adminDriveService = await (0, drive_service_1.driveServiceForAdmin)();
    const added = [];
    const skipped = [];
    const coursesCreated = [];
    let visited = 0;
    const walk = async (parentId, segments) => {
        if (visited >= MAX_VISITED_ITEMS) {
            throw new utils_1.ErrorResponse(`Sync aborted after visiting ${MAX_VISITED_ITEMS} Drive items. Run it again to continue.`, 400);
        }
        const { files, folders } = await adminDriveService.listChildren(parentId);
        visited += files.length + folders.length;
        for (const folder of folders) {
            if (!folder.id)
                continue;
            await walk(folder.id, [...segments, folder.name || ""]);
        }
        // The deepest folder is the course folder (unless the file sits at root).
        const courseSegment = segments.length > 0 ? segments[segments.length - 1] : "";
        const courseMatch = courseSegment
            ? COURSE_FOLDER_REGEX.exec(courseSegment)
            : null;
        for (const file of files) {
            const fileName = file.name || file.id || "unknown";
            if (!file.id) {
                skipped.push({ name: fileName, reason: "Drive file has no id" });
                continue;
            }
            if (!courseMatch) {
                skipped.push({
                    name: fileName,
                    reason: "file is not inside a '<CODE> - <Title>' course folder",
                });
                continue;
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
                        addedBy: req.user._id,
                    });
                    coursesCreated.push({ courseCode, title: folderTitle });
                }
                catch (err) {
                    // Race: two syncs creating the same course at once → reuse the winner
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
            const known = await models_1.Book.findOne({ driveFileId: file.id });
            if (known) {
                skipped.push({ name: fileName, reason: "already in the library" });
                continue;
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
                uploadedBy: req.user._id,
            });
            added.push({
                fileId: file.id,
                name: fileName,
                courseCode,
                title: bookTitle,
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
        return next(new utils_1.ErrorResponse("Failed to read the Drive folder. Check that an admin has connected Google.", 500));
    }
    (0, utils_1.SuccessResponse)(res, 200, {
        added,
        skipped,
        coursesCreated,
        summary: {
            added: added.length,
            skipped: skipped.length,
            coursesCreated: coursesCreated.length,
        },
    }, `Drive sync complete: ${added.length} added, ${skipped.length} skipped, ${coursesCreated.length} courses created`);
});
exports.syncDrive = syncDrive;
