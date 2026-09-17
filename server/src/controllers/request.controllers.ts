import { ACADEMIC_SESSION_REGEX, COURSE_CODE_REGEX, BookCategory, BookStatus, RequestStatus, Role } from "@/common/constants";
import { Types } from "mongoose";
import { ErrorResponse, SuccessResponse, normalizeCourseCode } from "@/common/utils";
import { catchAsync } from "@/middlewares";
import { Book, Course, MaterialRequest } from "@/models";
import { Request, Response, NextFunction } from "express";

const VALID_CATEGORIES = Object.values(BookCategory);
const VALID_STATUSES = Object.values(RequestStatus);
const ACTIVE_STATUSES = [RequestStatus.Open, RequestStatus.InProgress];

function validObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

// Never send the voter roster to clients, including mutation responses.
function publicRequest<T extends { upvotes?: Types.ObjectId[]; anonymousUpvoteCount?: number }>(
  request: T,
  userId?: Types.ObjectId,
) {
  const { upvotes = [], anonymousUpvoteCount = 0, ...data } = request;
  return {
    ...data,
    upvoteCount: upvotes.length + anonymousUpvoteCount,
    hasUpvoted: Boolean(userId && upvotes.some((id) => String(id) === String(userId))),
  };
}

function boundedInteger(value: unknown, fallback: number, max: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d{1,6}$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 && parsed <= max ? parsed : null;
}

/**
 * POST /api/v1/requests (public — no login required)
 * Body: { courseCode, category?, academicSession?, requesterName?, requesterLevel? }
 */
const createRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseCode, category, academicSession, requesterName, requesterLevel } =
      req.body ?? {};

    if (typeof courseCode !== "string" || courseCode.length > 32) {
      return next(new ErrorResponse("A valid course code is required", 400));
    }
    const normalizedCode = normalizeCourseCode(courseCode);
    if (!COURSE_CODE_REGEX.test(normalizedCode)) {
      return next(new ErrorResponse("Invalid course code (e.g. GET211)", 400));
    }
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return next(new ErrorResponse("Invalid material category", 400));
    }
    if (academicSession !== undefined &&
        (typeof academicSession !== "string" || !ACADEMIC_SESSION_REGEX.test(academicSession))) {
      return next(new ErrorResponse("Academic session must use YYYY/YYYY", 400));
    }
    if (category === BookCategory.PastQuestion && !academicSession) {
      return next(new ErrorResponse("Academic session is required for past questions", 400));
    }
    if (requesterName !== undefined &&
        (typeof requesterName !== "string" || !requesterName.trim() || requesterName.trim().length > 100)) {
      return next(new ErrorResponse("Requester name must contain 1 to 100 characters", 400));
    }
    if (requesterLevel !== undefined &&
        (typeof requesterLevel !== "number" || ![100, 200, 300, 400, 500].includes(requesterLevel))) {
      return next(new ErrorResponse("Invalid requester level", 400));
    }

    // Link to the course when it already exists (helps department/level filtering)
    const course = await Course.findOne({ courseCode: normalizedCode });

    // Avoid duplicate open requests for the same course + category
    const wantedCategory = category || BookCategory.TextBook;
    const existing = await MaterialRequest.findOne({
      courseCode: normalizedCode,
      category: wantedCategory,
      academicSession: academicSession || { $exists: false },
      status: { $in: [RequestStatus.Open, RequestStatus.InProgress] },
    });
    if (existing) {
      return next(
        new ErrorResponse("An open request for this material already exists", 409),
      );
    }

    const request = await MaterialRequest.create({
      course: course?._id,
      courseCode: normalizedCode,
      category: wantedCategory,
      academicSession: academicSession || undefined,
      requestedBy: req.user?._id,
      requesterName: requesterName || req.user?.name,
      requesterLevel,
    });

    SuccessResponse(res, 201, publicRequest(request.toObject(), req.user?._id), "Material request submitted");
  },
);

/**
 * GET /api/v1/requests (public)
 * Query: ?status=&search=&page=&limit= — open requests first, newest first
 */
const listRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, search, page, limit } = req.query;
    const pageNum = boundedInteger(page, 1, 1000);
    const limitNum = boundedInteger(limit, 12, 50);
    if (pageNum === null || limitNum === null) {
      return next(new ErrorResponse("Page must be 1–1000 and limit must be 1–50", 400));
    }
    if (status !== undefined && (typeof status !== "string" || !VALID_STATUSES.includes(status as RequestStatus))) {
      return next(new ErrorResponse("Invalid request status", 400));
    }
    if (search !== undefined && (typeof search !== "string" || search.length > 100)) {
      return next(new ErrorResponse("Search must be a string of at most 100 characters", 400));
    }
    const skip = (pageNum - 1) * limitNum;
    const match: Record<string, unknown> = {};
    if (status) match["status"] = status;
    if (typeof search === "string" && search.trim()) {
      const rx = new RegExp(escapeRegExp(search.trim()), "i");
      const matchingCourses = await Course.find({
        $or: [{ courseCode: rx }, { title: rx }],
      }).select("_id").limit(500);
      match["$or"] = [
        { courseCode: rx },
        { course: { $in: matchingCourses.map((c) => c._id) } },
      ];
    }

    const [requests, total] = await Promise.all([
      MaterialRequest.find(match)
        .populate({ path: "course", select: "title courseCode level semester" })
        .populate({
          path: "fulfilledBook",
          select: "title driveFileId category",
          match: { status: BookStatus.Approved },
        })
        .sort({ status: 1, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MaterialRequest.countDocuments(match),
    ]);

    SuccessResponse(res, 200, {
      requests: requests.map((request) => publicRequest(request, req.user?._id)),
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  },
);

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * POST /api/v1/requests/:id/want (protected)
 * One vote per account; repeated votes are idempotent.
 */
const upvoteRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!validObjectId(id)) {
      return next(new ErrorResponse("Invalid request id", 400));
    }

    const userId = req.user?._id;
    if (!userId) {
      return next(new ErrorResponse("You must be logged in to vote", 401));
    }

    const request = await MaterialRequest.findById(id);
    if (!request) {
      return next(new ErrorResponse("Request not found", 404));
    }
    if (request.status === RequestStatus.Fulfilled) {
      return next(new ErrorResponse("This request has already been fulfilled", 400));
    }

    // Atomic: a vote can only ever be added once per account.
    await MaterialRequest.updateOne(
      { _id: request._id },
      { $addToSet: { upvotes: userId } },
    );

    const updated = await MaterialRequest.findById(id).lean();
    if (!updated) {
      return next(new ErrorResponse("Request not found", 404));
    }

    SuccessResponse(res, 200, publicRequest(updated, userId), "Vote recorded");
  },
);

/**
 * POST /api/v1/requests/:id/fulfill (protected — requester, book uploader, or admin)
 * Body: { bookId }
 * The linked book must exist, be approved, and match the request's course,
 * category, and (when set) academic session. The status transition is atomic
 * so two contributors can never fulfill the same request.
 */
const fulfillRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { bookId } = req.body ?? {};

    if (!validObjectId(id)) {
      return next(new ErrorResponse("Invalid request id", 400));
    }
    if (typeof bookId !== "string" || !validObjectId(bookId)) {
      return next(
        new ErrorResponse("A valid bookId of the uploaded material is required", 400),
      );
    }

    const request = await MaterialRequest.findById(id);
    if (!request) {
      return next(new ErrorResponse("Request not found", 404));
    }
    if (request.status === RequestStatus.Fulfilled) {
      return next(new ErrorResponse("This request has already been fulfilled", 400));
    }

    const book = await Book.findById(bookId).populate<{
      course: { courseCode?: string } | null;
    }>("course");
    if (!book) {
      return next(new ErrorResponse("Book not found", 404));
    }

    // Only approved materials can fulfill a request. Legacy books without a
    // status field are treated as approved.
    if (book.status && book.status !== BookStatus.Approved) {
      return next(
        new ErrorResponse(
          "This book is not approved yet and cannot fulfill a request",
          409,
        ),
      );
    }

    const bookCourseCode = book.course?.courseCode;
    if (!bookCourseCode || bookCourseCode !== request.courseCode) {
      return next(
        new ErrorResponse("The book's course code must match the request", 400),
      );
    }
    if (book.category !== request.category) {
      return next(
        new ErrorResponse("The book's category must match the request", 400),
      );
    }
    if (request.academicSession && book.academicSession !== request.academicSession) {
      return next(
        new ErrorResponse("The book's academic session must match the request", 400),
      );
    }

    const isRequester =
      request.requestedBy && String(request.requestedBy) === String(req.user._id);
    const isUploader =
      book.uploadedBy && String(book.uploadedBy) === String(req.user._id);
    const isAdmin = req.user.role === Role.Admin;
    if (!isRequester && !isUploader && !isAdmin) {
      return next(
        new ErrorResponse("You are not authorized to fulfill this request", 403),
      );
    }

    // Atomic open/inProgress → fulfilled. If another request already won the
    // race, no update matches and we report the conflict.
    const updated = await MaterialRequest.findOneAndUpdate(
      { _id: request._id, status: { $in: ACTIVE_STATUSES } },
      {
        status: RequestStatus.Fulfilled,
        fulfilledBy: req.user._id,
        fulfilledBook: book._id,
      },
      { new: true },
    );
    if (!updated) {
      return next(
        new ErrorResponse("This request has already been fulfilled", 409),
      );
    }

    SuccessResponse(
      res,
      200,
      publicRequest(updated.toObject(), req.user._id),
      "Request marked as fulfilled",
    );
  },
);

/**
 * PATCH /api/v1/requests/:id/status (admin)
 * Body: { status: inProgress|expired|open }
 */
const updateRequestStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!validObjectId(id)) {
      return next(new ErrorResponse("Invalid request id", 400));
    }

    if (!VALID_STATUSES.includes(status) || status === RequestStatus.Fulfilled) {
      return next(
        new ErrorResponse(
          "Status must be one of: open, inProgress, expired. Fulfill via the fulfill endpoint.",
          400,
        ),
      );
    }

    const request = await MaterialRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!request) {
      return next(new ErrorResponse("Request not found", 404));
    }

    SuccessResponse(res, 200, request, "Request status updated");
  },
);

export { createRequest, listRequests, upvoteRequest, fulfillRequest, updateRequestStatus };
