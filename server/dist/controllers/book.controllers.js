"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBooks = exports.listPendingBooks = exports.moderateBook = exports.getBookById = exports.deleteBook = exports.updateBook = exports.getBooksByUser = exports.addBook = exports.getBooksByCourse = void 0;
const utils_1 = require("../common/utils");
const middlewares_1 = require("../middlewares");
const models_1 = require("../models");
const book_service_1 = require("../services/book.service");
const course_service_1 = require("../services/course.service");
const constants_1 = require("../common/constants");
// Add-via-link stores only the Drive file ID + link (no download, no copy,
// no quota), and readers open it with no credentials — so the file must be
// readable anonymously. Returns the publicity probe when verified (callers
// store probe.sizeBytes on the book); otherwise sends the rejection through
// `next` and returns null (caller must return).
const verifyDriveLinkPublic = async (driveFileId, next) => {
    let probe;
    try {
        probe = await (0, utils_1.probeDriveFilePublic)(driveFileId);
    }
    catch {
        next(new utils_1.ErrorResponse("Could not verify the Drive link right now. Check the link and try again.", 503));
        return null;
    }
    if (!probe.isPublic) {
        next(new utils_1.ErrorResponse("This file isn't shared publicly — set sharing to 'Anyone with the link' and try again.", 400));
        return null;
    }
    return probe;
};
const getBooksByCourse = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { courseCode } = req.params;
    if (!courseCode) {
        return next(new utils_1.ErrorResponse("Course parameter is required", 400));
    }
    // const books = await Book.find({ category:"textBook"}).populate('course');
    // const books = await Book.find({ "course": courseId }).populate({
    //     path:'course',
    //     select:"title courseCode"
    // }).lean().exec();
    const books = await models_1.Book.aggregate([
        {
            $lookup: {
                from: "courses",
                localField: "course",
                foreignField: "_id",
                as: "course",
            },
        },
        {
            $match: { "course.courseCode": courseCode },
        },
        // Public listing: only approved materials.
        // $nin also matches legacy books without a status field.
        {
            $match: { status: { $nin: ["pending", "rejected"] } },
        },
        // {
        //     $unwind: '$course',
        // },
        {
            $project: {
                title: 1,
                driveUrl: 1,
                driveFileId: 1,
                previewUrl: 1,
                downloadUrl: 1,
                category: 1,
                academicSession: 1,
                status: 1,
                size: 1,
                "course.title": 1,
                "course.courseCode": 1,
                "course.codePrefix": 1,
            },
        },
    ], { includeVirtuals: true }).exec();
    // if (!book) {
    //     return next(new ErrorResponse("Book not found", 404))
    // }
    (0, utils_1.SuccessResponse)(res, 200, books, "success");
});
exports.getBooksByCourse = getBooksByCourse;
const addBook = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { title, driveUrl, driveLink, driveFileId: driveFileIdInput, courseCode, category, academicSession, 
    // New-course fields (only used when the course doesn't exist yet)
    newCourseTitle, courseTitle, departmentShortNames, } = req.body;
    const link = driveUrl || driveLink;
    if (!title || !courseCode || !category) {
        return next(new utils_1.ErrorResponse("Title, course code and category are required", 400));
    }
    if (!Object.values(constants_1.BookCategory).includes(category)) {
        return next(new utils_1.ErrorResponse("Invalid book category", 400));
    }
    if (academicSession !== undefined && typeof academicSession === "string" &&
        !constants_1.ACADEMIC_SESSION_REGEX.test(academicSession)) {
        return next(new utils_1.ErrorResponse("Academic session must use YYYY/YYYY", 400));
    }
    if (category === constants_1.BookCategory.PastQuestion && !academicSession) {
        return next(new utils_1.ErrorResponse("Academic session is required for past questions", 400));
    }
    if (!link && !driveFileIdInput) {
        return next(new utils_1.ErrorResponse("A Google Drive link or an uploaded file is required", 400));
    }
    // Resolve the canonical Drive file ID from either input mode
    let driveFileId = driveFileIdInput
        ? String(driveFileIdInput).trim()
        : null;
    if (!driveFileId && link) {
        driveFileId = (0, utils_1.extractDriveFileId)(String(link));
    }
    if (!driveFileId) {
        return next(new utils_1.ErrorResponse("Invalid Google Drive link", 400));
    }
    // Skip duplicates: same Drive file already registered
    const duplicate = await models_1.Book.findOne({ driveFileId });
    if (duplicate) {
        return next(new utils_1.ErrorResponse("This file has already been added to the library", 409));
    }
    // Link-mode stores just the ID + link, so the file must be anonymously
    // readable or every reader hits a permission wall. The probe also carries
    // the byte size, captured from the same verification request.
    const linkProbe = await verifyDriveLinkPublic(driveFileId, next);
    if (!linkProbe)
        return;
    // Find-or-create the course: level/semester derived from the code,
    // title + departments required only when creating.
    const { course, created: courseCreated } = await (0, course_service_1.findOrCreateCourseFromCode)({
        courseCode,
        title: newCourseTitle || courseTitle,
        departmentShortNames,
        addedBy: req?.user._id,
    });
    const book = await models_1.Book.create({
        title,
        driveUrl: link || undefined,
        driveFileId,
        course: course._id,
        category,
        academicSession: academicSession || undefined,
        size: linkProbe.sizeBytes,
        status: req?.user?.role === 'admin' ? constants_1.BookStatus.Approved : constants_1.BookStatus.Pending,
        uploadedBy: req?.user._id,
    });
    (0, utils_1.SuccessResponse)(res, 201, { book, courseCreated }, courseCreated
        ? "Course created and book added successfully. Your upload is pending review."
        : "Book added successfully. Your upload is pending review.");
});
exports.addBook = addBook;
//FIXME - Add user object (protect)
const updateBook = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { bookId } = req.params;
    const { title, driveUrl, driveLink, driveFileId, category, academicSession } = req.body;
    const book = await models_1.Book.findById(bookId);
    if (!book) {
        return next(new utils_1.ErrorResponse("Book not found", 404));
    }
    const isOwner = String(req.user._id) === String(book.uploadedBy);
    const isAdmin = req.user.role === constants_1.Role.Admin;
    if (!isOwner && !isAdmin) {
        return next(new utils_1.ErrorResponse("You are not authorized to update this book", 401));
    }
    if (category !== undefined && !Object.values(constants_1.BookCategory).includes(category)) {
        return next(new utils_1.ErrorResponse("Invalid book category", 400));
    }
    if (academicSession !== undefined && typeof academicSession === "string" &&
        !constants_1.ACADEMIC_SESSION_REGEX.test(academicSession)) {
        return next(new utils_1.ErrorResponse("Academic session must use YYYY/YYYY", 400));
    }
    if (title !== undefined)
        book.title = title;
    if (category !== undefined)
        book.category = category;
    if (academicSession !== undefined)
        book.academicSession = academicSession;
    const link = driveUrl || driveLink;
    if (driveFileId) {
        const newFileId = String(driveFileId).trim();
        const idProbe = await verifyDriveLinkPublic(newFileId, next);
        if (!idProbe)
            return;
        book.driveFileId = newFileId;
        book.size = idProbe.sizeBytes;
    }
    else if (link) {
        const fileId = (0, utils_1.extractDriveFileId)(String(link));
        if (!fileId) {
            return next(new utils_1.ErrorResponse("Invalid Google Drive link", 400));
        }
        const linkProbe = await verifyDriveLinkPublic(fileId, next);
        if (!linkProbe)
            return;
        book.driveUrl = link;
        book.driveFileId = fileId;
        book.size = linkProbe.sizeBytes;
    }
    // Non-admin edits go back into the moderation queue.
    if (!isAdmin && book.status === constants_1.BookStatus.Approved) {
        book.status = constants_1.BookStatus.Pending;
    }
    await book.save();
    (0, utils_1.SuccessResponse)(res, 200, book, isAdmin
        ? "Book updated successfully"
        : "Book updated. Your changes are pending review.");
});
exports.updateBook = updateBook;
const deleteBook = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { bookId } = req.params;
    const book = await models_1.Book.findById(bookId);
    if (!book) {
        return next(new utils_1.ErrorResponse("Book not found", 404));
    }
    const isOwner = String(req.user._id) === String(book.uploadedBy);
    const isAdmin = req.user.role === constants_1.Role.Admin;
    if (!isOwner && !isAdmin) {
        return next(new utils_1.ErrorResponse("You are not authorized to delete this book", 401));
    }
    // Never orphan a fulfilled request: the request links to this book.
    const usedByFulfilledRequest = await models_1.MaterialRequest.exists({
        fulfilledBook: book._id,
        status: constants_1.RequestStatus.Fulfilled,
    });
    if (usedByFulfilledRequest) {
        return next(new utils_1.ErrorResponse("This book fulfills an active request and cannot be deleted", 409));
    }
    await models_1.Book.deleteOne({ _id: bookId });
    (0, utils_1.SuccessResponse)(res, 200, null, "Book deleted successfully");
});
exports.deleteBook = deleteBook;
const getBookById = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { bookId } = req.params;
    const book = await models_1.Book.findById(bookId).populate({
        path: "course",
        select: "title courseCode codePrefix level semester",
    });
    if (!book) {
        return next(new utils_1.ErrorResponse("Book not found", 404));
    }
    // Pending/rejected materials are invisible to the public. The uploader and
    // admins may still preview them.
    const isOwner = req.user?._id && String(req.user._id) === String(book.uploadedBy);
    const isAdmin = req.user?.role === constants_1.Role.Admin;
    const isPubliclyVisible = !book.status || book.status === constants_1.BookStatus.Approved;
    if (!isOwner && !isAdmin && !isPubliclyVisible) {
        return next(new utils_1.ErrorResponse("Book not found", 404));
    }
    (0, utils_1.SuccessResponse)(res, 200, book, "success");
});
exports.getBookById = getBookById;
/**
 * PATCH /books/:bookId/status (admin) — approve or reject a pending upload
 * Body: { status: 'approved' | 'rejected' }
 */
const moderateBook = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { bookId } = req.params;
    const { status } = req.body;
    if (![constants_1.BookStatus.Approved, constants_1.BookStatus.Rejected].includes(status)) {
        return next(new utils_1.ErrorResponse("Status must be 'approved' or 'rejected'", 400));
    }
    const book = await models_1.Book.findByIdAndUpdate(bookId, { status }, { new: true });
    if (!book) {
        return next(new utils_1.ErrorResponse("Book not found", 404));
    }
    (0, utils_1.SuccessResponse)(res, 200, book, `Book ${status}`);
});
exports.moderateBook = moderateBook;
/**
 * GET /books/pending (admin) — moderation queue, newest first
 */
const listPendingBooks = (0, middlewares_1.catchAsync)(async (req, res, _next) => {
    const { page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 50);
    const [books, total] = await Promise.all([
        models_1.Book.find({ status: constants_1.BookStatus.Pending })
            .populate({ path: "course", select: "title courseCode codePrefix" })
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        models_1.Book.countDocuments({ status: constants_1.BookStatus.Pending }),
    ]);
    (0, utils_1.SuccessResponse)(res, 200, {
        books,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
        },
    });
});
exports.listPendingBooks = listPendingBooks;
const getBooksByUser = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { search, courseCode, department, level, semester, category, sort = "newest", page = "1", limit = "20", } = req.query;
    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
    // Admins see every book; non-admins see only their own uploads.
    const isAdmin = req?.user?.role === constants_1.Role.Admin;
    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filters = [];
    if (typeof search === "string" && search.trim()) {
        const rx = new RegExp(escapeRegex(search.trim()), "i");
        filters.push({
            $or: [{ title: rx }, { "course.title": rx }, { "course.courseCode": rx }],
        });
    }
    if (typeof courseCode === "string" && courseCode.trim()) {
        const normalized = courseCode
            .replace(/\s+/g, "")
            .toUpperCase()
            .replace(/^UUY-/, "");
        filters.push({ "course.courseCode": normalized });
    }
    if (typeof department === "string" && department.trim()) {
        filters.push({
            "courseDepartments.shortName": department.trim().toUpperCase(),
        });
    }
    if (level !== undefined && String(level).trim() !== "") {
        const levelNum = parseInt(String(level), 10);
        if (!Number.isNaN(levelNum)) {
            filters.push({ "course.level": levelNum });
        }
    }
    if (typeof semester === "string" && semester.trim()) {
        filters.push({ "course.semester": semester.trim() });
    }
    if (typeof category === "string" && category.trim()) {
        filters.push({ category: category.trim() });
    }
    // $lookup courses first so filters can match on course fields and the
    // looked-up department shortNames.
    const basePipeline = [
        ...(isAdmin ? [] : [{ $match: { uploadedBy: req?.user._id } }]),
        {
            $lookup: {
                from: "courses",
                localField: "course",
                foreignField: "_id",
                as: "course",
            },
        },
        { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "departments",
                localField: "course.departments",
                foreignField: "_id",
                as: "courseDepartments",
            },
        },
        ...(filters.length > 0 ? [{ $match: { $and: filters } }] : []),
    ];
    const countResult = await models_1.Book.aggregate([
        ...basePipeline,
        { $count: "total" },
    ]);
    const total = countResult[0]?.total || 0;
    const BOOK_SORTS = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        "title-az": { title: 1 },
        "title-za": { title: -1 },
    };
    const bookSortStage = BOOK_SORTS[String(sort)] ?? BOOK_SORTS.newest;
    const books = await models_1.Book.aggregate([
        ...basePipeline,
        { $sort: bookSortStage },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
        {
            $project: {
                title: 1,
                driveUrl: 1,
                driveFileId: 1,
                academicSession: 1,
                status: 1,
                course: {
                    title: 1,
                    courseCode: 1,
                    codePrefix: 1,
                },
                createdAt: 1,
                category: 1,
            },
        },
    ]);
    (0, utils_1.SuccessResponse)(res, 200, {
        books,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
        },
    });
});
exports.getBooksByUser = getBooksByUser;
const getAllBooks = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { page = 1, limit = 10, search, category } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit) || 10;
    const { books, pagination } = await (0, book_service_1.getAllBooksService)(pageNum, limitNum, search, category);
    (0, utils_1.SuccessResponse)(res, 200, { books, pagination });
});
exports.getAllBooks = getAllBooks;
