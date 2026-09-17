"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookupCourse = exports.filterCourses = exports.createCourse = exports.deleteCourse = exports.updateCourse = exports.getAllCourse = exports.getCoursesByUser = void 0;
const utils_1 = require("../common/utils");
const middlewares_1 = require("../middlewares");
const models_1 = require("../models");
const course_service_1 = require("../services/course.service");
const createCourse = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { title, courseCode, departmentShortNames, level, semester } = req.body;
    if (!title || !courseCode || !departmentShortNames) {
        return next(new utils_1.ErrorResponse("Title, course code and departments are required. Level and semester are derived from the course code.", 400));
    }
    // level/semester in the body are ignored — always derived from the code
    void level;
    void semester;
    try {
        const { course, created } = await (0, course_service_1.findOrCreateCourseFromCode)({
            courseCode,
            title,
            departmentShortNames,
            addedBy: req.user._id,
        });
        if (!created) {
            return next(new utils_1.ErrorResponse(`Course '${course.courseCode}' already exists.`, 409));
        }
        (0, utils_1.SuccessResponse)(res, 201, course, "Course created successfully");
    }
    catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
            return next(new utils_1.ErrorResponse("This course code already exists.", 409));
        }
        throw err;
    }
});
exports.createCourse = createCourse;
const getAllCourse = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { page = "1", limit = "50", search } = req.query;
    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
    const match = {};
    if (search) {
        const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        match["$or"] = [{ courseCode: rx }, { title: rx }];
    }
    const [courses, total] = await Promise.all([
        models_1.Course.aggregate([
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
        models_1.Course.countDocuments(match),
    ]);
    (0, utils_1.SuccessResponse)(res, 200, {
        courses,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
        },
    });
});
exports.getAllCourse = getAllCourse;
const filterCourses = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { department, level, semester } = req.query;
    const courses = await (0, course_service_1.filterCoursesService)(department, semester, level);
    (0, utils_1.SuccessResponse)(res, 200, courses, "success");
});
exports.filterCourses = filterCourses;
const getCoursesByUser = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { search, department, level, semester, sort = "newest", page = "1", limit = "20", } = req.query;
    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filters = [];
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
    const basePipeline = [
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
    const COURSE_SORTS = {
        newest: { _id: -1 },
        oldest: { _id: 1 },
        "title-az": { title: 1 },
        "title-za": { title: -1 },
        level: { level: 1, semester: 1, courseCode: 1 },
        "most-books": { booksCount: -1 },
    };
    const sortStage = COURSE_SORTS[String(sort)] ?? COURSE_SORTS.newest;
    const countResult = await models_1.Course.aggregate([
        ...basePipeline,
        { $count: "total" },
    ]);
    const total = countResult[0]?.total || 0;
    const courses = await models_1.Course.aggregate([
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
    (0, utils_1.SuccessResponse)(res, 200, {
        courses,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
        },
    });
});
exports.getCoursesByUser = getCoursesByUser;
const updateCourse = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const { title, departmentShortNames } = req.body;
    const course = await models_1.Course.findById(id);
    if (!course) {
        return next(new utils_1.ErrorResponse("Course not found", 404));
    }
    // Ownership: creator or admin
    const isOwner = String(req.user._id) === String(course.addedBy);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
        return next(new utils_1.ErrorResponse("You are not authorized to update this course", 401));
    }
    if (title !== undefined)
        course.title = title;
    // courseCode is immutable via update (it encodes level/semester).
    // Departments can be reassigned by admins.
    if (departmentShortNames !== undefined) {
        if (!isAdmin) {
            return next(new utils_1.ErrorResponse("Only admins can change course departments", 401));
        }
        const { Department } = await Promise.resolve().then(() => __importStar(require("../models")));
        const normalized = departmentShortNames.map((s) => String(s).trim().toUpperCase());
        const departments = await Department.find({ shortName: { $in: normalized } });
        if (departments.length !== normalized.length) {
            return next(new utils_1.ErrorResponse("One or more department short names are invalid", 400));
        }
        course.departments = departments.map((d) => d._id);
    }
    await course.save();
    (0, utils_1.SuccessResponse)(res, 200, course, "Course updated successfully");
});
exports.updateCourse = updateCourse;
//FIXME - Implementing soft delete
const deleteCourse = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const course = await models_1.Course.findById(id);
    if (!course) {
        return next(new utils_1.ErrorResponse("Course not found", 404));
    }
    const isOwner = String(req.user._id) === String(course.addedBy);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
        return next(new utils_1.ErrorResponse("You are not authorized to delete this course", 401));
    }
    // Never orphan books: block deletion while materials reference the course
    const bookCount = await models_1.Book.countDocuments({ course: course._id });
    if (bookCount > 0) {
        return next(new utils_1.ErrorResponse(`Cannot delete this course: ${bookCount} material(s) are linked to it. Delete or reassign them first.`, 400));
    }
    await models_1.Course.deleteOne({ _id: id });
    (0, utils_1.SuccessResponse)(res, 200, null, "Course deleted successfully");
});
exports.deleteCourse = deleteCourse;
const lookupCourse = (0, middlewares_1.catchAsync)(async (req, res, next) => {
    const { courseCode } = req.params;
    if (!courseCode) {
        return next(new utils_1.ErrorResponse("Course code is required", 400));
    }
    const normalized = (0, utils_1.normalizeCourseCode)(String(courseCode));
    const COURSE_CODE_REGEX = /^[A-Z]{3}[1-5][12][0-9]$/;
    if (!COURSE_CODE_REGEX.test(normalized)) {
        return next(new utils_1.ErrorResponse("Invalid course code format", 400));
    }
    const levelDigit = parseInt(normalized[3], 10);
    const semesterDigit = parseInt(normalized[4], 10);
    const derived = {
        level: levelDigit * 100,
        semester: semesterDigit === 1 ? "1st" : "2nd",
    };
    const course = await models_1.Course.findOne({ courseCode: normalized }).populate({
        path: "departments",
        select: "name shortName",
    });
    if (course) {
        (0, utils_1.SuccessResponse)(res, 200, {
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
    (0, utils_1.SuccessResponse)(res, 200, {
        course: null,
        ...derived,
        courseCode: normalized,
        exists: false,
    });
});
exports.lookupCourse = lookupCourse;
