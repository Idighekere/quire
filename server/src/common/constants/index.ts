

export enum Role {
    Admin = 'admin',
    Uploader = 'uploader'
}

export enum Semester {
    First = '1st',
    Second = '2nd'
}

export enum BookCategory {
    LectureNote="lectureNote",
    PastQuestion="pastQuestion",
    TextBook="textBook"
}

export enum BookStatus {
    Approved = 'approved',
    Pending = 'pending',
    Rejected = 'rejected'
}

export enum RequestStatus {
    Open = 'open',
    InProgress = 'inProgress',
    Fulfilled = 'fulfilled',
    Expired = 'expired'
}

// Course code pattern: 3 letters + level digit (1-5) + semester digit (1-2) + serial digit
// e.g. GET211 → 200 Level, 1st Semester
export const COURSE_CODE_REGEX = /^[A-Z]{3}[1-5][12][0-9]$/;

// School prefix shown on course codes (e.g. "UUY-CPE313").
// The canonical courseCode stays prefix-free ("CPE313"); the prefix is
// stored separately on the course for display.
export const SCHOOL_CODE_PREFIX = "UUY";

// Academic session format: "2023/2024"
export const ACADEMIC_SESSION_REGEX = /^\d{4}\/\d{4}$/;

// Direct upload cap: 15 MB
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
