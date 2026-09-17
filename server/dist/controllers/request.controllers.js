"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRequestStatus = exports.fulfillRequest = exports.upvoteRequest = exports.listRequests = exports.createRequest = void 0;
const constants_1 = require("../common/constants");
const utils_1 = require("../common/utils");
const middlewares_1 = require("../middlewares");
const models_1 = require("../models");
const VALID_CATEGORIES = Object.values(constants_1.BookCategory);
const VALID_STATUSES = Object.values(constants_1.RequestStatus);
const ACTIVE_STATUSES = [constants_1.RequestStatus.Open, constants_1.RequestStatus.InProgress];
function validObjectId(value) {
    return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}
// Never send the voter roster to clients, including mutation responses.
function publicRequest(request, userId) {
    const { upvotes = [], anonymousUpvoteCount = 0, ...data } = request;
    return {
        ...data,
        upvoteCount: upvotes.length + anonymousUpvoteCount,
        hasUpvoted: Boolean(userId && upvotes.some((id) => String(id) === String(userId))),
    };
}
function boundedInteger(value, fallback, max) {
    if (value === undefined)
        return fallback;
    if (typeof value !== "string" || !/^\d{1,6}$/.test(value))
        return null;
    const parsed = Number(value);
    return parsed >= 1 && parsed <= max ? parsed : null;
}
/**
 * POST /api/v1/requests (public — no login required)
 * Body: { courseCode, category?, academicSession?, requesterName?, requesterLevel? }
 */
const createRequest = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { courseCode, category, academicSession, requesterName, requesterLevel } = req.body ?? {};
    if (typeof courseCode !== "string" || courseCode.length > 32) {
        return next(new utils_1.ErrorResponse("A valid course code is required", 400));
    }
    const normalizedCode = (0, utils_1.normalizeCourseCode)(courseCode);
    if (!constants_1.COURSE_CODE_REGEX.test(normalizedCode)) {
        return next(new utils_1.ErrorResponse("Invalid course code (e.g. GET211)", 400));
    }
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
        return next(new utils_1.ErrorResponse("Invalid material category", 400));
    }
    if (academicSession !== undefined &&
        (typeof academicSession !== "string" || !constants_1.ACADEMIC_SESSION_REGEX.test(academicSession))) {
        return next(new utils_1.ErrorResponse("Academic session must use YYYY/YYYY", 400));
    }
    if (category === constants_1.BookCategory.PastQuestion && !academicSession) {
        return next(new utils_1.ErrorResponse("Academic session is required for past questions", 400));
    }
    if (requesterName !== undefined &&
        (typeof requesterName !== "string" || !requesterName.trim() || requesterName.trim().length > 100)) {
        return next(new utils_1.ErrorResponse("Requester name must contain 1 to 100 characters", 400));
    }
    if (requesterLevel !== undefined &&
        (typeof requesterLevel !== "number" || ![100, 200, 300, 400, 500].includes(requesterLevel))) {
        return next(new utils_1.ErrorResponse("Invalid requester level", 400));
    }
    // Link to the course when it already exists (helps department/level filtering)
    const course = await models_1.Course.findOne({ courseCode: normalizedCode });
    // Avoid duplicate open requests for the same course + category
    const wantedCategory = category || constants_1.BookCategory.TextBook;
    const existing = await models_1.MaterialRequest.findOne({
        courseCode: normalizedCode,
        category: wantedCategory,
        academicSession: academicSession || { $exists: false },
        status: { $in: [constants_1.RequestStatus.Open, constants_1.RequestStatus.InProgress] },
    });
    if (existing) {
        return next(new utils_1.ErrorResponse("An open request for this material already exists", 409));
    }
    const request = await models_1.MaterialRequest.create({
        course: course?._id,
        courseCode: normalizedCode,
        category: wantedCategory,
        academicSession: academicSession || undefined,
        requestedBy: req.user?._id,
        requesterName: requesterName || req.user?.name,
        requesterLevel,
    });
    (0, utils_1.SuccessResponse)(res, 201, publicRequest(request.toObject(), req.user?._id), "Material request submitted");
});
exports.createRequest = createRequest;
/**
 * GET /api/v1/requests (public)
 * Query: ?status=&search=&page=&limit= — open requests first, newest first
 */
const listRequests = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { status, search, page, limit } = req.query;
    const pageNum = boundedInteger(page, 1, 1000);
    const limitNum = boundedInteger(limit, 12, 50);
    if (pageNum === null || limitNum === null) {
        return next(new utils_1.ErrorResponse("Page must be 1–1000 and limit must be 1–50", 400));
    }
    if (status !== undefined && (typeof status !== "string" || !VALID_STATUSES.includes(status))) {
        return next(new utils_1.ErrorResponse("Invalid request status", 400));
    }
    if (search !== undefined && (typeof search !== "string" || search.length > 100)) {
        return next(new utils_1.ErrorResponse("Search must be a string of at most 100 characters", 400));
    }
    const skip = (pageNum - 1) * limitNum;
    const match = {};
    if (status)
        match["status"] = status;
    if (typeof search === "string" && search.trim()) {
        const rx = new RegExp(escapeRegExp(search.trim()), "i");
        const matchingCourses = await models_1.Course.find({
            $or: [{ courseCode: rx }, { title: rx }],
        }).select("_id").limit(500);
        match["$or"] = [
            { courseCode: rx },
            { course: { $in: matchingCourses.map((c) => c._id) } },
        ];
    }
    const [requests, total] = await Promise.all([
        models_1.MaterialRequest.find(match)
            .populate({ path: "course", select: "title courseCode level semester" })
            .populate({
            path: "fulfilledBook",
            select: "title driveFileId category",
            match: { status: constants_1.BookStatus.Approved },
        })
            .sort({ status: 1, createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        models_1.MaterialRequest.countDocuments(match),
    ]);
    (0, utils_1.SuccessResponse)(res, 200, {
        requests: requests.map((request) => publicRequest(request, req.user?._id)),
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
        },
    });
});
exports.listRequests = listRequests;
function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
 * POST /api/v1/requests/:id/want (protected)
 * One vote per account; repeated votes are idempotent.
 */
const upvoteRequest = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    if (!validObjectId(id)) {
        return next(new utils_1.ErrorResponse("Invalid request id", 400));
    }
    const userId = req.user?._id;
    if (!userId) {
        return next(new utils_1.ErrorResponse("You must be logged in to vote", 401));
    }
    const request = await models_1.MaterialRequest.findById(id);
    if (!request) {
        return next(new utils_1.ErrorResponse("Request not found", 404));
    }
    if (request.status === constants_1.RequestStatus.Fulfilled) {
        return next(new utils_1.ErrorResponse("This request has already been fulfilled", 400));
    }
    // Atomic: a vote can only ever be added once per account.
    await models_1.MaterialRequest.updateOne({ _id: request._id }, { $addToSet: { upvotes: userId } });
    const updated = await models_1.MaterialRequest.findById(id).lean();
    if (!updated) {
        return next(new utils_1.ErrorResponse("Request not found", 404));
    }
    (0, utils_1.SuccessResponse)(res, 200, publicRequest(updated, userId), "Vote recorded");
});
exports.upvoteRequest = upvoteRequest;
/**
 * POST /api/v1/requests/:id/fulfill (protected — requester, book uploader, or admin)
 * Body: { bookId }
 * The linked book must exist, be approved, and match the request's course,
 * category, and (when set) academic session. The status transition is atomic
 * so two contributors can never fulfill the same request.
 */
const fulfillRequest = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const { bookId } = req.body ?? {};
    if (!validObjectId(id)) {
        return next(new utils_1.ErrorResponse("Invalid request id", 400));
    }
    if (typeof bookId !== "string" || !validObjectId(bookId)) {
        return next(new utils_1.ErrorResponse("A valid bookId of the uploaded material is required", 400));
    }
    const request = await models_1.MaterialRequest.findById(id);
    if (!request) {
        return next(new utils_1.ErrorResponse("Request not found", 404));
    }
    if (request.status === constants_1.RequestStatus.Fulfilled) {
        return next(new utils_1.ErrorResponse("This request has already been fulfilled", 400));
    }
    const book = await models_1.Book.findById(bookId).populate("course");
    if (!book) {
        return next(new utils_1.ErrorResponse("Book not found", 404));
    }
    // Only approved materials can fulfill a request. Legacy books without a
    // status field are treated as approved.
    if (book.status && book.status !== constants_1.BookStatus.Approved) {
        return next(new utils_1.ErrorResponse("This book is not approved yet and cannot fulfill a request", 409));
    }
    const bookCourseCode = book.course?.courseCode;
    if (!bookCourseCode || bookCourseCode !== request.courseCode) {
        return next(new utils_1.ErrorResponse("The book's course code must match the request", 400));
    }
    if (book.category !== request.category) {
        return next(new utils_1.ErrorResponse("The book's category must match the request", 400));
    }
    if (request.academicSession && book.academicSession !== request.academicSession) {
        return next(new utils_1.ErrorResponse("The book's academic session must match the request", 400));
    }
    const isRequester = request.requestedBy && String(request.requestedBy) === String(req.user._id);
    const isUploader = book.uploadedBy && String(book.uploadedBy) === String(req.user._id);
    const isAdmin = req.user.role === constants_1.Role.Admin;
    if (!isRequester && !isUploader && !isAdmin) {
        return next(new utils_1.ErrorResponse("You are not authorized to fulfill this request", 403));
    }
    // Atomic open/inProgress → fulfilled. If another request already won the
    // race, no update matches and we report the conflict.
    const updated = await models_1.MaterialRequest.findOneAndUpdate({ _id: request._id, status: { $in: ACTIVE_STATUSES } }, {
        status: constants_1.RequestStatus.Fulfilled,
        fulfilledBy: req.user._id,
        fulfilledBook: book._id,
    }, { new: true });
    if (!updated) {
        return next(new utils_1.ErrorResponse("This request has already been fulfilled", 409));
    }
    (0, utils_1.SuccessResponse)(res, 200, publicRequest(updated.toObject(), req.user._id), "Request marked as fulfilled");
});
exports.fulfillRequest = fulfillRequest;
/**
 * PATCH /api/v1/requests/:id/status (admin)
 * Body: { status: inProgress|expired|open }
 */
const updateRequestStatus = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!validObjectId(id)) {
        return next(new utils_1.ErrorResponse("Invalid request id", 400));
    }
    if (!VALID_STATUSES.includes(status) || status === constants_1.RequestStatus.Fulfilled) {
        return next(new utils_1.ErrorResponse("Status must be one of: open, inProgress, expired. Fulfill via the fulfill endpoint.", 400));
    }
    const request = await models_1.MaterialRequest.findByIdAndUpdate(id, { status }, { new: true });
    if (!request) {
        return next(new utils_1.ErrorResponse("Request not found", 404));
    }
    (0, utils_1.SuccessResponse)(res, 200, request, "Request status updated");
});
exports.updateRequestStatus = updateRequestStatus;
