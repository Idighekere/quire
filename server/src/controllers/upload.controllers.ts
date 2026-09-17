import { ErrorResponse, SuccessResponse, extractDriveFileId, normalizeCourseCode } from "@/common/utils";
import { catchAsync } from "@/middlewares";
import { Book, Course } from "@/models";
import { findOrCreateCourseFromCode } from "@/services/course.service";
import { driveServiceForAdmin, DriveFileResult } from "@/services/drive.service";
import { BookStatus, BookCategory, MAX_UPLOAD_BYTES } from "@/common/constants";
import { Request, Response, NextFunction } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES, // 15 MB
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
    } else {
      cb(new ErrorResponse("Only PDF, DOC, DOCX, PPT, PPTX files are allowed", 400));
    }
  },
}).single("file");

const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new ErrorResponse(`File too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB`, 400));
      }
      return next(new ErrorResponse(err.message, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

/**
 * POST /api/v1/books/upload (protected)
 * Multipart form: file, title, courseCode, category, academicSession?, newCourseTitle?, departmentShortNames[]
 * Uploads file to Google Drive, then creates Book record.
 */
const uploadBookFile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new ErrorResponse("No file uploaded", 400));
  }

  const {
    title,
    courseCode,
    category,
    academicSession,
    newCourseTitle,
    departmentShortNames,
  } = req.body;

  if (!title || !courseCode || !category) {
    return next(new ErrorResponse("Title, course code, and category are required", 400));
  }

  if (!Object.values(BookCategory).includes(category)) {
    return next(new ErrorResponse("Invalid category", 400));
  }

  if (category === BookCategory.PastQuestion && !academicSession) {
    return next(new ErrorResponse("Academic session (YYYY/YYYY) is required for past questions", 400));
  }

  // Find or create course
  // departmentShortNames arrives as a JSON-encoded string in multipart
  // forms. If it is not valid JSON, pass the raw value through — the
  // service coerces single values and rejects anything else with a 400.
  let parsedDepartments: string[] | string | undefined;
  if (departmentShortNames) {
    try {
      parsedDepartments = JSON.parse(departmentShortNames);
    } catch {
      parsedDepartments = departmentShortNames;
    }
  }
  const { course, created: courseCreated } = await findOrCreateCourseFromCode({
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
  const adminDriveService = await driveServiceForAdmin();

  let folderId: string;
  try {
    folderId = await adminDriveService.ensureFolderPath([levelLabel, semesterLabel, courseFolderName]);
  } catch (driveErr) {
    console.error("Drive folder creation failed:", driveErr);
    return next(new ErrorResponse("Failed to create Drive folder structure. Check that an admin has connected Google.", 500));
  }

  // Upload file to Drive
  let uploadResult: DriveFileResult;
  try {
    uploadResult = await adminDriveService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folderId,
    );
  } catch (driveErr) {
    console.error("Drive upload failed:", driveErr);
    return next(new ErrorResponse("Failed to upload file to Google Drive", 500));
  }

  try {
    await adminDriveService.sharePublic(uploadResult.fileId);
  } catch (shareErr) {
    console.error("Drive sharePublic failed:", shareErr);
  }

  // Create Book record
  const book = await Book.create({
    title,
    driveFileId: uploadResult.fileId,
    driveUrl: uploadResult.webViewLink,
    course: course._id,
    category,
    academicSession: academicSession || undefined,
    status: req.user.role === "admin" ? BookStatus.Approved : BookStatus.Pending,
    uploadedBy: req.user._id,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });

  SuccessResponse(res, 201, { book, courseCreated }, courseCreated
    ? "Course created and material uploaded successfully. Pending review."
    : "Material uploaded successfully. Pending review."
  );
});

export { uploadMiddleware, uploadBookFile };