"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../common/constants");
const utils_1 = require("../common/utils");
const mongoose_1 = require("mongoose");
const MaterialRequestSchema = new mongoose_1.Schema({
    course: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Course',
        required: false,
    },
    courseCode: {
        type: String,
        required: [true, 'Course code is required'],
        uppercase: true,
        trim: true,
    },
    category: {
        type: String,
        enum: Object.values(constants_1.BookCategory),
        default: constants_1.BookCategory.TextBook,
    },
    academicSession: {
        type: String,
        required: false,
        validate: {
            validator: function (v) {
                if (!v)
                    return true;
                return constants_1.ACADEMIC_SESSION_REGEX.test(v);
            },
            message: 'Academic session must be in the format YYYY/YYYY (e.g. 2023/2024)',
        },
    },
    requestedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    requesterName: {
        type: String,
        required: false,
        trim: true,
    },
    requesterLevel: {
        type: Number,
        required: false,
        enum: [100, 200, 300, 400, 500],
    },
    status: {
        type: String,
        enum: Object.values(constants_1.RequestStatus),
        default: constants_1.RequestStatus.Open,
    },
    upvotes: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
    },
    anonymousUpvoteCount: {
        type: Number,
        default: 0,
    },
    fulfilledBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    fulfilledBook: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Book',
        required: false,
    },
}, { timestamps: true });
MaterialRequestSchema.pre('validate', function (next) {
    const doc = this;
    if (doc.courseCode && typeof doc.courseCode === 'string') {
        doc.courseCode = (0, utils_1.normalizeCourseCode)(doc.courseCode);
    }
    next();
});
MaterialRequestSchema.index({ status: 1, createdAt: -1 });
MaterialRequestSchema.index({ courseCode: 1, status: 1 });
const MaterialRequest = (0, mongoose_1.model)('MaterialRequest', MaterialRequestSchema);
exports.default = MaterialRequest;
