import { ACADEMIC_SESSION_REGEX, BookCategory, RequestStatus } from '@/common/constants';
import { IMaterialRequest } from '@/common/types';
import { normalizeCourseCode } from '@/common/utils';
import { Schema, model } from 'mongoose';

const MaterialRequestSchema = new Schema<IMaterialRequest>({
    course: {
        type: Schema.Types.ObjectId,
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
        enum: Object.values(BookCategory),
        default: BookCategory.TextBook,
    },
    academicSession: {
        type: String,
        required: false,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return ACADEMIC_SESSION_REGEX.test(v);
            },
            message: 'Academic session must be in the format YYYY/YYYY (e.g. 2023/2024)',
        },
    },
    requestedBy: {
        type: Schema.Types.ObjectId,
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
        enum: Object.values(RequestStatus),
        default: RequestStatus.Open,
    },
    upvotes: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        default: [],
    },
    anonymousUpvoteCount: {
        type: Number,
        default: 0,
    },
    fulfilledBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    fulfilledBook: {
        type: Schema.Types.ObjectId,
        ref: 'Book',
        required: false,
    },
}, { timestamps: true });

MaterialRequestSchema.pre('validate', function (next) {
    const doc = this as IMaterialRequest;
    if (doc.courseCode && typeof doc.courseCode === 'string') {
        doc.courseCode = normalizeCourseCode(doc.courseCode);
    }
    next();
});

MaterialRequestSchema.index({ status: 1, createdAt: -1 });
MaterialRequestSchema.index({ courseCode: 1, status: 1 });

const MaterialRequest = model<IMaterialRequest>('MaterialRequest', MaterialRequestSchema);

export default MaterialRequest;
