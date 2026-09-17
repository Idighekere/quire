import { ErrorResponse, SuccessResponse, normalizeCourseCode } from "@/common/utils";
import { catchAsync } from "@/middlewares";
import { Book, Course } from "@/models";
import { filterCoursesService, findOrCreateCourseFromCode } from "@/services/course.service";
import { Request } from "express";
import type { PipelineStage } from "mongoose";

const createCourse = catchAsync(async (req: Request, res, next) => {
  const { title, courseCode, departmentShortNames, level, semester } = req.body;

  if (!title || !courseCode || !departmentShortNames) {
    return next(new ErrorResponse("Title, course code and departments are required. Level and semester are derived from the course code.", 400));
  }

  // level/semester in the body are ignored — always derived from the code
  void level;
  void semester;

  try {
    const { course, created } = await findOrCreateCourseFromCode({
      courseCode,
      title,
      departmentShortNames,
      addedBy: req.user._id,
    });

    if (!created) {
      return next(
        new ErrorResponse(`Course '${course.courseCode}' already exists.`, 409),
      );
    }

    SuccessResponse(res, 201, course, "Course created successfully");
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      return next(
        new ErrorResponse("This course code already exists.", 409),
      );
    }
    throw err;
  }
});

const getAllCourse = catchAsync(async (req, res, next) => {
  const { page = "1", limit = "50", search } = req.query;

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);

  const match: Record<string, unknown> = {};
  if (search) {
    const rx = new RegExp(
      String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    match["$or"] = [{ courseCode: rx }, { title: rx }];
  }

  const [courses, total] = await Promise.all([
    Course.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departments",
        },
      },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "course",
          as: "bookCount",
        },
      },
      {
        $project: {
          title: 1,
          courseCode: 1,
          codePrefix: 1,
          departments: { name: 1, shortName: 1 },
          level: 1,
          semester: 1,
          materialCount: { $size: "$bookCount" },
        },
      },
      { $sort: { level: 1, semester: 1, courseCode: 1 } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
    ]),
    Course.countDocuments(match),
  ]);

  SuccessResponse(res, 200, {
    courses,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    },
  });
});

const filterCourses = catchAsync(async (req, res, next) => {
  const { department, level, semester } = req.query;

  const courses = await filterCoursesService(
    department as string,
    semester as string,
    level as string,
  );

  SuccessResponse(res, 200, courses, "success");
});

const getCoursesByUser = catchAsync(async (req: Request, res, next) => {
  const {
    search,
    department,
    level,
    semester,
    sort = "newest",
    page = "1",
    limit = "20",
  } = req.query;

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);

  const escapeRegex = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const filters: Record<string, unknown>[] = [];

  if (typeof search === "string" && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    filters.push({ $or: [{ courseCode: rx }, { title: rx }] });
  }

  if (typeof department === "string" && department.trim()) {
    filters.push({
      "departments.shortName": department.trim().toUpperCase(),
    });
  }

  if (level !== undefined && String(level).trim() !== "") {
    const levelNum = parseInt(String(level), 10);
    if (!Number.isNaN(levelNum)) {
      filters.push({ level: levelNum });
    }
  }

  if (typeof semester === "string" && semester.trim()) {
    filters.push({ semester: semester.trim() });
  }

  const basePipeline: PipelineStage[] = [
    {
      $match: {
        addedBy: req?.user._id,
      },
    },
    {
      $lookup: {
        from: "departments",
        localField: "departments",
        foreignField: "_id",
        as: "departments",
      },
    },
    {
      $lookup: {
        from: "books",
        localField: "_id",
        foreignField: "course",
        as: "bookList",
      },
    },
    // Material count up front so "most materials" can sort on it.
    // Courses carry no timestamps — recency sorts use the time-ordered _id.
    {
      $addFields: {
        booksCount: { $size: "$bookList" },
      },
    },
    ...(filters.length > 0 ? [{ $match: { $and: filters } }] : []),
  ];

  const COURSE_SORTS: Record<string, Record<string, 1 | -1>> = {
    newest: { _id: -1 },
    oldest: { _id: 1 },
    "title-az": { title: 1 },
    "title-za": { title: -1 },
    level: { level: 1, semester: 1, courseCode: 1 },
    "most-books": { booksCount: -1 },
  };
  const sortStage = COURSE_SORTS[String(sort)] ?? COURSE_SORTS.newest;

  const countResult = await Course.aggregate([
    ...basePipeline,
    { $count: "total" },
  ]);
  const total =
    (countResult[0] as { total?: number } | undefined)?.total || 0;

  const courses = await Course.aggregate([
    ...basePipeline,
    { $sort: sortStage },
    { $skip: (pageNum - 1) * limitNum },
    { $limit: limitNum },
    {
      $project: {
        title: 1,
        courseCode: 1,
        codePrefix: 1,
        departments: {
          name: 1,
          shortName: 1,
        },
        level: 1,
        semester: 1,
        booksCount: { $size: "$bookList" },
      },
    },
  ]);

  SuccessResponse(res, 200, {
    courses,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    },
  });
});

const updateCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, departmentShortNames } = req.body;

  const course = await Course.findById(id);
  if (!course) {
    return next(new ErrorResponse("Course not found", 404));
  }

  // Ownership: creator or admin
  const isOwner = String(req.user._id) === String(course.addedBy);
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return next(
      new ErrorResponse("You are not authorized to update this course", 401),
    );
  }

  if (title !== undefined) course.title = title;

  // courseCode is immutable via update (it encodes level/semester).
  // Departments can be reassigned by admins.
  if (departmentShortNames !== undefined) {
    if (!isAdmin) {
      return next(
        new ErrorResponse("Only admins can change course departments", 401),
      );
    }
    const { Department } = await import("@/models");
    const normalized = (departmentShortNames as string[]).map((s) =>
      String(s).trim().toUpperCase(),
    );
    const departments = await Department.find({ shortName: { $in: normalized } });
    if (departments.length !== normalized.length) {
      return next(
        new ErrorResponse("One or more department short names are invalid", 400),
      );
    }
    course.departments = departments.map((d) => d._id) as typeof course.departments;
  }

  await course.save();

  SuccessResponse(res, 200, course, "Course updated successfully");
});

//FIXME - Implementing soft delete
const deleteCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const course = await Course.findById(id);
  if (!course) {
    return next(new ErrorResponse("Course not found", 404));
  }

  const isOwner = String(req.user._id) === String(course.addedBy);
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return next(
      new ErrorResponse("You are not authorized to delete this course", 401),
    );
  }

  // Never orphan books: block deletion while materials reference the course
  const bookCount = await Book.countDocuments({ course: course._id });
  if (bookCount > 0) {
    return next(
      new ErrorResponse(
        `Cannot delete this course: ${bookCount} material(s) are linked to it. Delete or reassign them first.`,
        400,
      ),
    );
  }

  await Course.deleteOne({ _id: id });

  SuccessResponse(res, 200, null, "Course deleted successfully");
});

const lookupCourse = catchAsync(async (req, res, next) => {
  const { courseCode } = req.params;

  if (!courseCode) {
    return next(new ErrorResponse("Course code is required", 400));
  }

  const normalized = normalizeCourseCode(String(courseCode));

  const COURSE_CODE_REGEX = /^[A-Z]{3}[1-5][12][0-9]$/;
  if (!COURSE_CODE_REGEX.test(normalized)) {
    return next(new ErrorResponse("Invalid course code format", 400));
  }

  const levelDigit = parseInt(normalized[3], 10);
  const semesterDigit = parseInt(normalized[4], 10);

  const derived = {
    level: levelDigit * 100,
    semester: semesterDigit === 1 ? "1st" : "2nd",
  };

  const course = await Course.findOne({ courseCode: normalized }).populate({
    path: "departments",
    select: "name shortName",
  });

  if (course) {
    SuccessResponse(res, 200, {
      course: {
        _id: course._id,
        title: course.title,
        courseCode: course.courseCode,
        codePrefix: course.codePrefix,
        departments: course.departments,
        level: course.level,
        semester: course.semester,
      },
      ...derived,
      courseCode: normalized,
      exists: true,
    });
    return;
  }

  SuccessResponse(res, 200, {
    course: null,
    ...derived,
    courseCode: normalized,
    exists: false,
  });
});

export {
  getCoursesByUser,
  getAllCourse,
  updateCourse,
  deleteCourse,
  createCourse,
  filterCourses,
  lookupCourse,
};
