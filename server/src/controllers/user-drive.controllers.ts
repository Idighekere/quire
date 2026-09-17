import { BookCategory, BookStatus, Role } from "@/common/constants";
import { ErrorResponse, SuccessResponse, isDriveFilePublic } from "@/common/utils";
import { catchAsync } from "@/middlewares";
import { Book, User } from "@/models";
import { driveServiceForUser } from "@/services/drive.service";
import { findOrCreateCourseFromCode } from "@/services/course.service";
import { Request, Response, NextFunction } from "express";

const VALID_CATEGORIES = Object.values(BookCategory);
const MAX_PICKED_IDS = 50;

interface UserImportAdded {
  fileId: string;
  name: string;
  title: string;
}

interface UserImportSkipped {
  name: string;
  reason: string;
}

/**
 * Load the caller's own stored Google refresh token (any role).
 * Throws 409 telling them to connect Google Drive first.
 */
const driveServiceForCaller = async (userId: unknown) => {
  const caller = await User.findById(userId).select("+googleRefreshToken");
  if (!caller?.googleRefreshToken) {
    throw new ErrorResponse(
      "Connect your Google Drive first — open the 'From my Google Drive' option and follow the connect step.",
      409,
    );
  }
  return driveServiceForUser(caller.googleRefreshToken);
};

/**
 * GET /api/v1/sync/my-picker-token (any logged-in user)
 * Mints a short-lived access token from the CALLER's own stored Google
 * token for the browser-side picker on their own Drive. 409 when they
 * have not connected Google yet.
 */
const getMyPickerToken = catchAsync(async (req: Request, res: Response) => {
  const userDriveService = await driveServiceForCaller(req.user?._id);
  const accessToken = await userDriveService.getAccessToken();

  SuccessResponse(res, 200, { accessToken }, "Picker token minted");
});

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
const importFromMyDrive = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      fileIds,
      courseCode,
      category,
      academicSession,
      newCourseTitle,
      departmentShortNames,
      makePublic,
    } = req.body as {
      fileIds?: unknown;
      courseCode?: unknown;
      category?: unknown;
      academicSession?: unknown;
      newCourseTitle?: unknown;
      departmentShortNames?: string[] | string;
      makePublic?: unknown;
    };

    if (!Array.isArray(fileIds) || fileIds.length === 0 || fileIds.length > MAX_PICKED_IDS) {
      return next(
        new ErrorResponse(`Send between 1 and ${MAX_PICKED_IDS} picked Drive file IDs`, 400),
      );
    }
    const ids: string[] = [];
    for (const id of fileIds) {
      if (typeof id !== "string" || !id.trim()) {
        return next(new ErrorResponse("Picked IDs must be non-empty strings", 400));
      }
      ids.push(id.trim());
    }

    if (typeof courseCode !== "string" || !courseCode.trim()) {
      return next(new ErrorResponse("Course code is required", 400));
    }
    if (typeof category !== "string" || !VALID_CATEGORIES.includes(category as BookCategory)) {
      return next(new ErrorResponse("A valid category is required", 400));
    }
    if (
      category === BookCategory.PastQuestion &&
      (typeof academicSession !== "string" || !academicSession.trim())
    ) {
      return next(
        new ErrorResponse("Academic session (YYYY/YYYY) is required for past questions", 400),
      );
    }

    const userDriveService = await driveServiceForCaller(req.user?._id);

    const { course } = await findOrCreateCourseFromCode({
      courseCode,
      title: typeof newCourseTitle === "string" ? newCourseTitle : undefined,
      departmentShortNames,
      addedBy: req.user._id,
    });

    const isAdmin = req.user?.role === Role.Admin;
    const added: UserImportAdded[] = [];
    const skipped: UserImportSkipped[] = [];

    for (const id of [...new Set(ids)]) {
      let meta;
      try {
        meta = await userDriveService.getFile(id);
      } catch {
        skipped.push({ name: id, reason: "not accessible — pick the file itself in the picker" });
        continue;
      }

      const fileName = meta.name || id;
      if (meta.mimeType === "application/vnd.google-apps.folder") {
        skipped.push({ name: fileName, reason: "folders can't be added — pick the files inside" });
        continue;
      }

      const known = await Book.findOne({ driveFileId: id });
      if (known) {
        skipped.push({ name: fileName, reason: "already in the library" });
        continue;
      }

      let isPublic = false;
      try {
        isPublic = await isDriveFilePublic(id);
      } catch {
        skipped.push({ name: fileName, reason: "could not verify sharing — try again" });
        continue;
      }
      if (!isPublic && makePublic === true) {
        try {
          await userDriveService.sharePublic(id);
          isPublic = await isDriveFilePublic(id);
        } catch {
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

      await Book.create({
        title,
        driveFileId: id,
        driveUrl: `https://drive.google.com/file/d/${id}/view`,
        course: course._id,
        category,
        academicSession: typeof academicSession === "string" && academicSession.trim() ? academicSession.trim() : undefined,
        status: isAdmin ? BookStatus.Approved : BookStatus.Pending,
        fileName: meta.name,
        size: Number.isFinite(parsedSize) ? parsedSize : undefined,
        uploadedBy: req.user._id,
      });

      added.push({ fileId: id, name: fileName, title });
    }

    SuccessResponse(
      res,
      201,
      {
        added,
        skipped,
        summary: { added: added.length, skipped: skipped.length },
      },
      `Drive import complete: ${added.length} added, ${skipped.length} skipped${isAdmin ? "" : " (pending review)"}`,
    );
  },
);

export { getMyPickerToken, importFromMyDrive };
