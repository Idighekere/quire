import { ErrorResponse, SuccessResponse, extractDriveFileId, probeDriveFilePublic, type DrivePublicProbe } from "@/common/utils";
import { catchAsync } from "@/middlewares";
import { Book, MaterialRequest } from "@/models";
import { getAllBooksService } from "@/services/book.service";
import { findOrCreateCourseFromCode } from "@/services/course.service";
import {
  ACADEMIC_SESSION_REGEX,
  BookCategory,
  BookStatus,
  RequestStatus,
  Role,
} from "@/common/constants";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

// Add-via-link stores only the Drive file ID + link (no download, no copy,
// no quota), and readers open it with no credentials — so the file must be
// readable anonymously. Returns the publicity probe when verified (callers
// store probe.sizeBytes on the book); otherwise sends the rejection through
// `next` and returns null (caller must return).
const verifyDriveLinkPublic = async (
  driveFileId: string,
  next: NextFunction,
): Promise<DrivePublicProbe | null> => {
  let probe: DrivePublicProbe;
  try {
    probe = await probeDriveFilePublic(driveFileId);
  } catch {
    next(
      new ErrorResponse(
        "Could not verify the Drive link right now. Check the link and try again.",
        503,
      ),
    );
    return null;
  }
  if (!probe.isPublic) {
    next(
      new ErrorResponse(
        "This file isn't shared publicly — set sharing to 'Anyone with the link' and try again.",
        400,
      ),
    );
    return null;
  }
  return probe;
};

const getBooksByCourse = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { courseCode } = req.params;
    const { page = "1", limit = "12", category, search } = req.query;

    if (!courseCode) {
      return next(new ErrorResponse("Course parameter is required", 400));
    }

    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 12, 1), 100);

    // const books = await Book.find({ category:"textBook"}).populate('course');
    // const books = await Book.find({ "course": courseId }).populate({
    //     path:'course',
    //     select:"title courseCode"
    // }).lean().exec();

    const basePipeline = [
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
    ];

    const pagePipeline: mongoose.PipelineStage[] = [...basePipeline];

    if (typeof category === "string" && category.trim() && category.trim() !== "all") {
      pagePipeline.push({ $match: { category: category.trim() } });
    }

    if (typeof search === "string" && search.trim()) {
      const rx = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      pagePipeline.push({ $match: { title: rx } });
    }

    const countResult = await Book.aggregate([...pagePipeline, { $count: "total" }]).exec();
    const total = (countResult[0] as { total?: number } | undefined)?.total || 0;

    const books = await Book.aggregate(
      [
        ...pagePipeline,
        { $sort: { createdAt: -1 } },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
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
            createdAt: 1,
            "course.title": 1,
            "course.courseCode": 1,
            "course.codePrefix": 1,
          },
        },
      ],
      { includeVirtuals: true },
    ).exec();

    // if (!book) {
    //     return next(new ErrorResponse("Book not found", 404))
    // }

    SuccessResponse(res, 200, {
      books,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    }, "success");
  },
);

const addBook = catchAsync(async (req: Request, res, next) => {
  const {
    title,
    driveUrl,
    driveLink,
    driveFileId: driveFileIdInput,
    courseCode,
    category,
    academicSession,
    // New-course fields (only used when the course doesn't exist yet)
    newCourseTitle,
    courseTitle,
    departmentShortNames,
  } = req.body;

  const link = driveUrl || driveLink;

  if (!title || !courseCode || !category) {
    return next(new ErrorResponse("Title, course code and category are required", 400));
  }

  if (!Object.values(BookCategory).includes(category)) {
    return next(new ErrorResponse("Invalid book category", 400));
  }

  if (academicSession !== undefined && typeof academicSession === "string" &&
      !ACADEMIC_SESSION_REGEX.test(academicSession)) {
    return next(new ErrorResponse("Academic session must use YYYY/YYYY", 400));
  }

  if (category === BookCategory.PastQuestion && !academicSession) {
    return next(new ErrorResponse("Academic session is required for past questions", 400));
  }

  if (!link && !driveFileIdInput) {
    return next(
      new ErrorResponse("A Google Drive link or an uploaded file is required", 400),
    );
  }

  // Resolve the canonical Drive file ID from either input mode
  let driveFileId = driveFileIdInput
    ? String(driveFileIdInput).trim()
    : null;
  if (!driveFileId && link) {
    driveFileId = extractDriveFileId(String(link));
  }
  if (!driveFileId) {
    return next(new ErrorResponse("Invalid Google Drive link", 400));
  }

  // Skip duplicates: same Drive file already registered
  const duplicate = await Book.findOne({ driveFileId });
  if (duplicate) {
    return next(
      new ErrorResponse("This file has already been added to the library", 409),
    );
  }

  // Link-mode stores just the ID + link, so the file must be anonymously
  // readable or every reader hits a permission wall. The probe also carries
  // the byte size, captured from the same verification request.
  const linkProbe = await verifyDriveLinkPublic(driveFileId, next);
  if (!linkProbe) return;

  // Find-or-create the course: level/semester derived from the code,
  // title + departments required only when creating.
  const { course, created: courseCreated } = await findOrCreateCourseFromCode({
    courseCode,
    title: newCourseTitle || courseTitle,
    departmentShortNames,
    addedBy: req?.user._id,
  });

  const book = await Book.create({
    title,
    driveUrl: link || undefined,
    driveFileId,
    course: course._id,
    category,
    academicSession: academicSession || undefined,
    size: linkProbe.sizeBytes,
    status: req?.user?.role === 'admin' ? BookStatus.Approved : BookStatus.Pending,
    uploadedBy: req?.user._id,
  });

  SuccessResponse(
    res,
    201,
    { book, courseCreated },
    courseCreated
      ? "Course created and book added successfully. Your upload is pending review."
      : "Book added successfully. Your upload is pending review.",
  );
});

//FIXME - Add user object (protect)
const updateBook = catchAsync(async (req, res, next) => {
  const { bookId } = req.params;

  const { title, driveUrl, driveLink, driveFileId, category, academicSession } =
    req.body;

  const book = await Book.findById(bookId);

  if (!book) {
    return next(new ErrorResponse("Book not found", 404));
  }

  const isOwner = String(req.user._id) === String(book.uploadedBy);
  const isAdmin = req.user.role === Role.Admin;
  if (!isOwner && !isAdmin) {
    return next(
      new ErrorResponse("You are not authorized to update this book", 401),
    );
  }

  if (category !== undefined && !Object.values(BookCategory).includes(category)) {
    return next(new ErrorResponse("Invalid book category", 400));
  }

  if (academicSession !== undefined && typeof academicSession === "string" &&
      !ACADEMIC_SESSION_REGEX.test(academicSession)) {
    return next(new ErrorResponse("Academic session must use YYYY/YYYY", 400));
  }

  if (title !== undefined) book.title = title;
  if (category !== undefined) book.category = category;
  if (academicSession !== undefined) book.academicSession = academicSession;

  const link = driveUrl || driveLink;
  if (driveFileId) {
    const newFileId = String(driveFileId).trim();
    const idProbe = await verifyDriveLinkPublic(newFileId, next);
    if (!idProbe) return;
    book.driveFileId = newFileId;
    book.size = idProbe.sizeBytes;
  } else if (link) {
    const fileId = extractDriveFileId(String(link));
    if (!fileId) {
      return next(new ErrorResponse("Invalid Google Drive link", 400));
    }
    const linkProbe = await verifyDriveLinkPublic(fileId, next);
    if (!linkProbe) return;
    book.driveUrl = link;
    book.driveFileId = fileId;
    book.size = linkProbe.sizeBytes;
  }

  // Non-admin edits go back into the moderation queue.
  if (!isAdmin && book.status === BookStatus.Approved) {
    book.status = BookStatus.Pending;
  }

  await book.save();

  SuccessResponse(
    res,
    200,
    book,
    isAdmin
      ? "Book updated successfully"
      : "Book updated. Your changes are pending review.",
  );
});

const deleteBook = catchAsync(async (req, res, next) => {
  const { bookId } = req.params;

  const book = await Book.findById(bookId);

  if (!book) {
    return next(new ErrorResponse("Book not found", 404));
  }

  const isOwner = String(req.user._id) === String(book.uploadedBy);
  const isAdmin = req.user.role === Role.Admin;
  if (!isOwner && !isAdmin) {
    return next(
      new ErrorResponse("You are not authorized to delete this book", 401),
    );
  }

  // Never orphan a fulfilled request: the request links to this book.
  const usedByFulfilledRequest = await MaterialRequest.exists({
    fulfilledBook: book._id,
    status: RequestStatus.Fulfilled,
  });
  if (usedByFulfilledRequest) {
    return next(
      new ErrorResponse(
        "This book fulfills an active request and cannot be deleted",
        409,
      ),
    );
  }

  await Book.deleteOne({ _id: bookId });

  SuccessResponse(res, 200, null, "Book deleted successfully");
});

const getBookById = catchAsync(async (req: Request, res, next) => {
  const { bookId } = req.params;

  const book = await Book.findById(bookId).populate({
    path: "course",
    select: "title courseCode codePrefix level semester",
  });

  if (!book) {
    return next(new ErrorResponse("Book not found", 404));
  }

  // Pending/rejected materials are invisible to the public. The uploader and
  // admins may still preview them.
  const isOwner =
    req.user?._id && String(req.user._id) === String(book.uploadedBy);
  const isAdmin = req.user?.role === Role.Admin;
  const isPubliclyVisible =
    !book.status || book.status === BookStatus.Approved;
  if (!isOwner && !isAdmin && !isPubliclyVisible) {
    return next(new ErrorResponse("Book not found", 404));
  }

  SuccessResponse(res, 200, book, "success");
});

/**
 * PATCH /books/:bookId/status (admin) — approve or reject a pending upload
 * Body: { status: 'approved' | 'rejected' }
 */
const moderateBook = catchAsync(async (req, res, next) => {
  const { bookId } = req.params;
  const { status } = req.body;

  if (![BookStatus.Approved, BookStatus.Rejected].includes(status)) {
    return next(
      new ErrorResponse("Status must be 'approved' or 'rejected'", 400),
    );
  }

  const book = await Book.findByIdAndUpdate(
    bookId,
    { status },
    { new: true },
  );
  if (!book) {
    return next(new ErrorResponse("Book not found", 404));
  }

  SuccessResponse(res, 200, book, `Book ${status}`);
});

/**
 * GET /books/pending (admin) — moderation queue, newest first
 */
const listPendingBooks = catchAsync(async (req, res, _next) => {
  const { page = "1", limit = "20" } = req.query;

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 50);

  const [books, total] = await Promise.all([
    Book.find({ status: BookStatus.Pending })
      .populate({ path: "course", select: "title courseCode codePrefix" })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Book.countDocuments({ status: BookStatus.Pending }),
  ]);

  SuccessResponse(res, 200, {
    books,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    },
  });
});

const getBooksByUser = catchAsync(async (req: Request, res, next) => {
  const {
    search,
    courseCode,
    department,
    level,
    semester,
    category,
    sort = "newest",
    page = "1",
    limit = "20",
  } = req.query;

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);

  // Admins see every book; non-admins see only their own uploads.
  const isAdmin = req?.user?.role === Role.Admin;

  const escapeRegex = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const filters: Record<string, unknown>[] = [];

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
  const basePipeline: mongoose.PipelineStage[] = [
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

  const countResult = await Book.aggregate([
    ...basePipeline,
    { $count: "total" },
  ]);
  const total =
    (countResult[0] as { total?: number } | undefined)?.total || 0;

  const BOOK_SORTS: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "title-az": { title: 1 },
    "title-za": { title: -1 },
  };
  const bookSortStage = BOOK_SORTS[String(sort)] ?? BOOK_SORTS.newest;

  const books = await Book.aggregate([
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

  SuccessResponse(res, 200, {
    books,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    },
  });
});

const getAllBooks = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { page = 1, limit = 10, search, category } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string) || 10;

    const {books, pagination} = await getAllBooksService(
      pageNum,
      limitNum,
      search as string,
      category as string,
    );

    SuccessResponse(res, 200, { books, pagination });
  },
);
export { getBooksByCourse, addBook, getBooksByUser, updateBook, deleteBook, getBookById, moderateBook, listPendingBooks, getAllBooks };
