import { ACADEMIC_SESSION_REGEX, BookCategory, BookStatus } from '@/common/constants';
import { IBook } from '@/common/types';
import { buildDriveDownloadUrl, buildDrivePreviewUrl, extractDriveFileId } from '@/common/utils';
import { Schema, model, Document } from 'mongoose';


const bookSchema = new Schema<IBook>({
    title: {
        type: String,
        required: [true, "The book title is required"]
    },
    driveUrl: {
        type: String,
        required: false,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
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
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    category: {
        type: String,
        enum: Object.values(BookCategory),
        default: BookCategory.TextBook
    },
    academicSession: {
        type: String,
        required: false,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return ACADEMIC_SESSION_REGEX.test(v);
            },
            message: "Academic session must be in the format YYYY/YYYY (e.g. 2023/2024)"
        }
    },
    status: {
        type: String,
        enum: Object.values(BookStatus),
        default: BookStatus.Approved,
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
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
    const doc = this as IBook;
    if (doc.category === BookCategory.PastQuestion && !doc.academicSession) {
        return next(new Error('Academic session (e.g. 2023/2024) is required for past questions'));
    }
    // Backfill driveFileId from legacy driveUrl when only a link was provided
    if (!doc.driveFileId && doc.driveUrl) {
        const fileId = extractDriveFileId(doc.driveUrl);
        if (fileId) {
            doc.driveFileId = fileId;
        }
    }
    next();
});

bookSchema.virtual("previewUrl").get(function () {
    const fileId = (this as IBook).driveFileId || extractDriveFileId((this as IBook).driveUrl || '');
    if (!fileId) return null;
    return buildDrivePreviewUrl(fileId);
});

bookSchema.virtual("downloadUrl").get(function () {
    const fileId = (this as IBook).driveFileId || extractDriveFileId((this as IBook).driveUrl || '');
    if (!fileId) return null;
    return buildDriveDownloadUrl(fileId);

});

bookSchema.index({ course: 1, status: 1, category: 1, createdAt: -1 });
bookSchema.index({ title: 'text' });

const Book = model<IBook>('Book', bookSchema);

export default Book;
