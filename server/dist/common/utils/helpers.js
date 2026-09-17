"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = exports.buildDriveDownloadUrl = exports.buildDrivePreviewUrl = exports.splitCourseCodePrefix = exports.deriveLevelSemesterFromCourseCode = exports.normalizeCourseCode = exports.clearCookie = exports.generateTokens = exports.getDepartmentShortName = exports.extractDriveFileId = exports.setCookie = exports.hashData = exports.verifyToken = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const configs_1 = require("../configs");
const constants_1 = require("../constants");
const hashPassword = async (password) => {
    return await bcryptjs_1.default.hash(password, 12);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hashedPassword) => {
    return await bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
const hashData = (data, options, secret) => {
    const signOptions = options?.expiresIn ? { expiresIn: options?.expiresIn } : {};
    return jsonwebtoken_1.default.sign({ ...data }, secret ? secret : configs_1.ENVIRONMENT.JWT.ACCESS_KEY, signOptions);
};
exports.hashData = hashData;
const verifyToken = async (token, secret) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, secret, (err, decoded) => {
            if (err) {
                return reject(err);
            }
            resolve(decoded);
        });
    });
};
exports.verifyToken = verifyToken;
const setCookie = (res, name, value, options = {}) => {
    res.cookie(name, value, {
        httpOnly: true,
        secure: configs_1.ENVIRONMENT.APP.ENV == 'production',
        path: "/",
        sameSite: configs_1.ENVIRONMENT.APP.ENV == 'production' ? 'none' : 'lax',
        // partitioned:ENVIRONMENT.APP.ENV=='production',
        ...options
    });
};
exports.setCookie = setCookie;
const clearCookie = (res, name, options = {}) => {
    setCookie(res, name, "", { maxAge: -1, ...options });
};
exports.clearCookie = clearCookie;
const generateTokens = {
    access: (payload, options, _secret = configs_1.ENVIRONMENT.JWT.ACCESS_KEY) => {
        const signOptions = options?.expiresIn ? { expiresIn: options?.expiresIn } : {};
        return jsonwebtoken_1.default.sign(payload, _secret, signOptions);
    },
    refresh: (payload, options, _secret = configs_1.ENVIRONMENT.JWT.REFRESH_KEY) => {
        const signOptions = options?.expiresIn ? { expiresIn: options?.expiresIn } : {};
        return jsonwebtoken_1.default.sign(payload, _secret, signOptions);
    }
};
exports.generateTokens = generateTokens;
const extractDriveFileId = (url) => {
    const regex = /(?:(?:drive|docs)\.google\.com\/(?:a\/[^\/]+\/)?(?:file\/d\/|open\?id=|uc\?id=|thumbnail\?id=|document\/d\/|spreadsheets\/d\/|presentation\/d\/))([a-zA-Z0-9_-]{10,})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};
exports.extractDriveFileId = extractDriveFileId;
/**
 * Normalize a course code: strip ALL whitespace, uppercase.
 * "get 211" → "GET211", "Get211" → "GET211"
 */
const normalizeCourseCode = (code) => {
    if (!code)
        return code;
    // Strip whitespace, uppercase, and drop an optional "UUY-" school prefix
    // ("UUY-CPE313" and "UUY - CPE313" both normalize to "CPE313").
    return code.replace(/\s+/g, '').toUpperCase().replace(/^UUY-/, '');
};
exports.normalizeCourseCode = normalizeCourseCode;
/**
 * Split an optional school prefix (e.g. "UUY-") off a raw course code.
 * Strips whitespace, uppercases, then splits a leading `<SCHOOL_CODE_PREFIX>-`.
 * Returns the prefix (or null) plus the canonical `rest` code.
 * "UUY-CPE313" → { prefix: "UUY", rest: "CPE313" }
 */
const splitCourseCodePrefix = (raw) => {
    const cleaned = (raw || '').replace(/\s+/g, '').toUpperCase();
    const tag = `${constants_1.SCHOOL_CODE_PREFIX}-`;
    if (cleaned.startsWith(tag)) {
        return { prefix: constants_1.SCHOOL_CODE_PREFIX, rest: cleaned.slice(tag.length) };
    }
    return { prefix: null, rest: cleaned };
};
exports.splitCourseCodePrefix = splitCourseCodePrefix;
/**
 * Derive level + semester from a normalized course code.
 * Digit[0] (after 3 letters) = level: 1→100 ... 5→500
 * Digit[1] = semester: 1→'1st', 2→'2nd'
 * Returns null when the code doesn't match the pattern.
 */
const deriveLevelSemesterFromCourseCode = (code) => {
    const normalized = normalizeCourseCode(code);
    const match = normalized.match(/^[A-Z]{3}([1-5])([12])[0-9]$/);
    if (!match)
        return null;
    return {
        level: parseInt(match[1], 10) * 100,
        semester: match[2] === '1' ? '1st' : '2nd',
    };
};
exports.deriveLevelSemesterFromCourseCode = deriveLevelSemesterFromCourseCode;
const buildDrivePreviewUrl = (fileId) => `https://drive.google.com/file/d/${fileId}/preview`;
exports.buildDrivePreviewUrl = buildDrivePreviewUrl;
const buildDriveDownloadUrl = (fileId) => `https://drive.google.com/uc?export=download&id=${fileId}`;
exports.buildDriveDownloadUrl = buildDriveDownloadUrl;
const slugify = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};
exports.slugify = slugify;
const getDepartmentShortName = (name) => {
    if (name.includes('Computer')) {
        return 'CPE';
    }
    else if (name.includes('Agricultural') || name.includes('Agric')) {
        return 'AGE';
    }
    else if (name.includes('Electrical')) {
        return 'ELE';
    }
    else if (name.includes('Mechanical')) {
        return 'MEE';
    }
    else if (name.includes('Petroleum')) {
        return 'PEE';
    }
    else if (name.includes('Food')) {
        return 'FDE';
    }
    else if (name.includes('Civil')) {
        return 'CVE';
    }
    else if (name.includes('Chemical')) {
        return 'CHE';
    }
    else {
        return '';
    }
};
exports.getDepartmentShortName = getDepartmentShortName;
