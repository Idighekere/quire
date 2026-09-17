"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_UPLOAD_BYTES = exports.ACADEMIC_SESSION_REGEX = exports.SCHOOL_CODE_PREFIX = exports.COURSE_CODE_REGEX = exports.RequestStatus = exports.BookStatus = exports.BookCategory = exports.Semester = exports.Role = void 0;
var Role;
(function (Role) {
    Role["Admin"] = "admin";
    Role["Uploader"] = "uploader";
})(Role || (exports.Role = Role = {}));
var Semester;
(function (Semester) {
    Semester["First"] = "1st";
    Semester["Second"] = "2nd";
})(Semester || (exports.Semester = Semester = {}));
var BookCategory;
(function (BookCategory) {
    BookCategory["LectureNote"] = "lectureNote";
    BookCategory["PastQuestion"] = "pastQuestion";
    BookCategory["TextBook"] = "textBook";
})(BookCategory || (exports.BookCategory = BookCategory = {}));
var BookStatus;
(function (BookStatus) {
    BookStatus["Approved"] = "approved";
    BookStatus["Pending"] = "pending";
    BookStatus["Rejected"] = "rejected";
})(BookStatus || (exports.BookStatus = BookStatus = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["Open"] = "open";
    RequestStatus["InProgress"] = "inProgress";
    RequestStatus["Fulfilled"] = "fulfilled";
    RequestStatus["Expired"] = "expired";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
// Course code pattern: 3 letters + level digit (1-5) + semester digit (1-2) + serial digit
// e.g. GET211 → 200 Level, 1st Semester
exports.COURSE_CODE_REGEX = /^[A-Z]{3}[1-5][12][0-9]$/;
// School prefix shown on course codes (e.g. "UUY-CPE313").
// The canonical courseCode stays prefix-free ("CPE313"); the prefix is
// stored separately on the course for display.
exports.SCHOOL_CODE_PREFIX = "UUY";
// Academic session format: "2023/2024"
exports.ACADEMIC_SESSION_REGEX = /^\d{4}\/\d{4}$/;
// Direct upload cap: 15 MB
exports.MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
