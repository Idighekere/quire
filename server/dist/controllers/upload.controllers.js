"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBookFile = exports.uploadMiddleware = void 0;
const utils_1 = require("../common/utils");
const middlewares_1 = require("../middlewares");
const models_1 = require("../models");
const course_service_1 = require("../services/course.service");
const drive_service_1 = require("../services/drive.service");
const constants_1 = require("../common/constants");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: constants_1.MAX_UPLOAD_BYTES, // 15 MB
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new utils_1.ErrorResponse("Only PDF, DOC, DOCX, PPT, PPTX files are allowed", 400));
        }
    },
}).single("file");
const uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return next(new utils_1.ErrorResponse(`File too large. Maximum size is ${constants_1.MAX_UPLOAD_BYTES / (1024 * 1024)} MB`, 400));
            }
            return next(new utils_1.ErrorResponse(err.message, 400));
        }
        else if (err) {
            return next(err);
        }
        next();
    });
};
exports.uploadMiddleware = uploadMiddleware;
/**
 * POST /api/v1/books/upload (protected)
 * Multipart form: file, title, courseCode, category, academicSession?, newCourseTitle?, departmentShortNames[]
 * Uploads file to Google Drive, then creates Book record.
 */
const uploadBookFile = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    if (!req.file) {
        return next(new utils_1.ErrorResponse("No file uploaded", 400));
    }
    const { title, courseCode, category, academicSession, newCourseTitle, departmentShortNames, } = req.body;
    if (!title || !courseCode || !category) {
        return next(new utils_1.ErrorResponse("Title, course code, and category are required", 400));
    }
    if (!Object.values(constants_1.BookCategory).includes(category)) {
        return next(new utils_1.ErrorResponse("Invalid category", 400));
    }
    if (category === constants_1.BookCategory.PastQuestion && !academicSession) {
        return next(new utils_1.ErrorResponse("Academic session (YYYY/YYYY) is required for past questions", 400));
    }
    // Find or create course
    // departmentShortNames arrives as a JSON-encoded string in multipart
    // forms. If it is not valid JSON, pass the raw value through — the
    // service coerces single values and rejects anything else with a 400.
    let parsedDepartments;
    if (departmentShortNames) {
        try {
            parsedDepartments = JSON.parse(departmentShortNames);
        }
        catch {
            parsedDepartments = departmentShortNames;
        }
    }
    const { course, created: courseCreated } = await (0, course_service_1.findOrCreateCourseFromCode)({
        courseCode,
        title: newCourseTitle,
        departmentShortNames: parsedDepartments,
        addedBy: req.user._id,
    });
    // Build folder path: {Level} Level/{Semester} Semester/{CODE - Title}
    const levelLabel = `${course.level} Level`;
    const semesterLabel = course.semester === "1st" ? "1st Semester" : "2nd Semester";
    const courseFolderName = `${course.courseCode} - ${course.title}`;
    // Uploads run as the library admin's Google account (single
    // ownership/quota): reuse the connected admin's stored Drive token.
    // Any logged-in uploader may upload; only an admin needs to have
    // connected Google. driveServiceForAdmin throws 503 when none has.
    const adminDriveService = await (0, drive_service_1.driveServiceForAdmin)();
    let folderId;
    try {
        folderId = await adminDriveService.ensureFolderPath([levelLabel, semesterLabel, courseFolderName]);
    }
    catch (driveErr) {
        console.error("Drive folder creation failed:", driveErr);
        return next(new utils_1.ErrorResponse("Failed to create Drive folder structure. Check that an admin has connected Google.", 500));
    }
    // Upload file to Drive
    let uploadResult;
    try {
        uploadResult = await adminDriveService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, folderId);
    }
    catch (driveErr) {
        console.error("Drive upload failed:", driveErr);
        return next(new utils_1.ErrorResponse("Failed to upload file to Google Drive", 500));
    }
    try {
        await adminDriveService.sharePublic(uploadResult.fileId);
    }
    catch (shareErr) {
        console.error("Drive sharePublic failed:", shareErr);
    }
    // Create Book record
    const book = await models_1.Book.create({
        title,
        driveFileId: uploadResult.fileId,
        driveUrl: uploadResult.webViewLink,
        course: course._id,
        category,
        academicSession: academicSession || undefined,
        status: req.user.role === "admin" ? constants_1.BookStatus.Approved : constants_1.BookStatus.Pending,
        uploadedBy: req.user._id,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
    });
    (0, utils_1.SuccessResponse)(res, 201, { book, courseCreated }, courseCreated
        ? "Course created and material uploaded successfully. Pending review."
        : "Material uploaded successfully. Pending review.");
});
exports.uploadBookFile = uploadBookFile;
