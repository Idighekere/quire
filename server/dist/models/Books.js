"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../common/constants");
const utils_1 = require("../common/utils");
const mongoose_1 = require("mongoose");
const bookSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "The book title is required"]
    },
    driveUrl: {
        type: String,
        required: false,
        validate: {
            validator: function (v) {
                if (!v)
                    return true;
                return v.includes("drive.google.com");
            },
            message: "Invalid Google Drive link"
        },
    },
    driveFileId: {
        type: String,
        required: [true, "Google Drive file reference is required"],
        index: true,
    },
    course: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    category: {
        type: String,
        enum: Object.values(constants_1.BookCategory),
        default: constants_1.BookCategory.TextBook
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
            message: "Academic session must be in the format YYYY/YYYY (e.g. 2023/2024)"
        }
    },
    status: {
        type: String,
        enum: Object.values(constants_1.BookStatus),
        default: constants_1.BookStatus.Approved,
    },
    uploadedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    fileName: {
        type: String,
        required: false,
    },
    mimeType: {
        type: String,
        required: false,
    },
    size: {
        type: Number,
        required: false,
    },
    thumbnail: {
        type: String,
        required: false,
    },
}, { timestamps: true });
// Require academicSession for past questions
bookSchema.pre('validate', function (next) {
    const doc = this;
    if (doc.category === constants_1.BookCategory.PastQuestion && !doc.academicSession) {
        return next(new Error('Academic session (e.g. 2023/2024) is required for past questions'));
    }
    // Backfill driveFileId from legacy driveUrl when only a link was provided
    if (!doc.driveFileId && doc.driveUrl) {
        const fileId = (0, utils_1.extractDriveFileId)(doc.driveUrl);
        if (fileId) {
            doc.driveFileId = fileId;
        }
    }
    next();
});
bookSchema.virtual("previewUrl").get(function () {
    const fileId = this.driveFileId || (0, utils_1.extractDriveFileId)(this.driveUrl || '');
    if (!fileId)
        return null;
    return (0, utils_1.buildDrivePreviewUrl)(fileId);
});
bookSchema.virtual("downloadUrl").get(function () {
    const fileId = this.driveFileId || (0, utils_1.extractDriveFileId)(this.driveUrl || '');
    if (!fileId)
        return null;
    return (0, utils_1.buildDriveDownloadUrl)(fileId);
});
bookSchema.index({ course: 1, status: 1, category: 1, createdAt: -1 });
bookSchema.index({ title: 'text' });
const Book = (0, mongoose_1.model)('Book', bookSchema);
exports.default = Book;
