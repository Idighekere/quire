"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const constants_1 = require("../common/constants");
const utils_1 = require("../common/utils");
const CourseSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    courseCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        match: [constants_1.COURSE_CODE_REGEX, 'Please enter a valid course code (e.g. GET211: 3 letters + level 1-5 + semester 1-2 + digit)']
    },
    codePrefix: {
        type: String,
        uppercase: true,
        trim: true,
        required: false,
        match: [/^[A-Z]+$/, 'School prefix must be letters only']
    },
    driveFolderId: {
        type: String,
        required: false,
        trim: true,
    },
    departments: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'Department',
        // Sync-imported courses start department-less until an admin assigns
        // them. App-side flows still enforce at least one department.
        default: []
    },
    level: {
        type: Number,
        required: [true, "Level is required"],
        enum: [100, 200, 300, 400, 500]
    },
    semester: {
        type: String,
        enum: Object.values(constants_1.Semester),
        required: [true, "Semester is required"]
    },
    addedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});
// Normalize code (strip ALL whitespace, uppercase) and auto-derive
// level + semester from the code before validation runs.
CourseSchema.pre('validate', function (next) {
    const doc = this;
    if (doc.courseCode && typeof doc.courseCode === 'string') {
        doc.courseCode = (0, utils_1.normalizeCourseCode)(doc.courseCode);
        const derived = (0, utils_1.deriveLevelSemesterFromCourseCode)(doc.courseCode);
        if (derived) {
            doc.level = derived.level;
            doc.semester = derived.semester;
        }
    }
    next();
});
CourseSchema.index({ level: 1, semester: 1 });
const Course = (0, mongoose_1.model)('Course', CourseSchema);
exports.default = Course;
