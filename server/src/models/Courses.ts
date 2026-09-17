import { Schema, model, Document } from 'mongoose';
import { ICourse } from '@/common/types/course.types';
import { COURSE_CODE_REGEX, Semester } from '@/common/constants';
import { deriveLevelSemesterFromCourseCode, normalizeCourseCode } from '@/common/utils';

const CourseSchema = new Schema<ICourse>({
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
        match: [COURSE_CODE_REGEX, 'Please enter a valid course code (e.g. GET211: 3 letters + level 1-5 + semester 1-2 + digit)']
    },
    codePrefix: {
        type: String,
        uppercase: true,
        trim: true,
        required: false,
        match: [/^[A-Z]+$/, 'School prefix must be letters only']
    },
    departments: {
        type: [Schema.Types.ObjectId],
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
        enum: Object.values(Semester),
        required: [true, "Semester is required"]
    },
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// Normalize code (strip ALL whitespace, uppercase) and auto-derive
// level + semester from the code before validation runs.
CourseSchema.pre('validate', function (next) {
    const doc = this as ICourse;
    if (doc.courseCode && typeof doc.courseCode === 'string') {
        doc.courseCode = normalizeCourseCode(doc.courseCode);
        const derived = deriveLevelSemesterFromCourseCode(doc.courseCode);
        if (derived) {
            doc.level = derived.level;
            doc.semester = derived.semester as ICourse['semester'];
        }
    }
    next();
});

CourseSchema.index({ level: 1, semester: 1 });

const Course = model<ICourse>('Course', CourseSchema);

export default Course
