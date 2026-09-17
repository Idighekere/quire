import { TokenPayload } from './../types/auth.types';
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken"
import { ENVIRONMENT } from "../configs";
import { SCHOOL_CODE_PREFIX } from "../constants";
import { CookieOptions, Response } from "express";


const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 12);
}


const comparePassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
}


const hashData = (data: {
    id?: string;
    token?: string;
}, options: SignOptions, secret?: any) => {


    const signOptions = options?.expiresIn ? { expiresIn: options?.expiresIn } : {}

    return jwt.sign({ ...data },
        secret ? secret : ENVIRONMENT.JWT.ACCESS_KEY, signOptions)
}

const verifyToken = async <T=TokenPayload>(token: string, secret: string): Promise<TokenPayload> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err:any, decoded:any) => {
            if (err) {
                return reject(err);
            }
            resolve(decoded as TokenPayload);
        });
    });
}

const setCookie = (res: Response, name: string, value: string, options: CookieOptions = {}) => {

    res.cookie(name, value, {
        httpOnly: true,
        secure: ENVIRONMENT.APP.ENV == 'production',
        path: "/",
        sameSite: ENVIRONMENT.APP.ENV == 'production' ? 'none' : 'lax',
        // partitioned:ENVIRONMENT.APP.ENV=='production',
        ...options

    })

}


const clearCookie = (res: Response, name: string, options: CookieOptions = {}) => {
    setCookie(res, name, "", { maxAge: -1, ...options })
}

const generateTokens = {

    access: (payload: TokenPayload, options?: SignOptions, _secret: any = ENVIRONMENT.JWT.ACCESS_KEY) => {

        const signOptions = options?.expiresIn ? { expiresIn: options?.expiresIn } : {}

        return jwt.sign(payload, _secret, signOptions)
    },

    refresh: (payload: TokenPayload, options?: SignOptions, _secret: any = ENVIRONMENT.JWT.REFRESH_KEY,) => {

        const signOptions = options?.expiresIn ? { expiresIn: options?.expiresIn } : {}

        return jwt.sign(payload, _secret, signOptions)
    }
}

const extractDriveFileId = (url: string) => {
    const regex = /(?:(?:drive|docs)\.google\.com\/(?:a\/[^\/]+\/)?(?:file\/d\/|open\?id=|uc\?id=|thumbnail\?id=|document\/d\/|spreadsheets\/d\/|presentation\/d\/))([a-zA-Z0-9_-]{10,})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

/**
 * Normalize a course code: strip ALL whitespace, uppercase.
 * "get 211" → "GET211", "Get211" → "GET211"
 */
const normalizeCourseCode = (code: string): string => {
    if (!code) return code;
    // Strip whitespace, uppercase, and drop an optional "UUY-" school prefix
    // ("UUY-CPE313" and "UUY - CPE313" both normalize to "CPE313").
    return code.replace(/\s+/g, '').toUpperCase().replace(/^UUY-/, '');
};

/**
 * Split an optional school prefix (e.g. "UUY-") off a raw course code.
 * Strips whitespace, uppercases, then splits a leading `<SCHOOL_CODE_PREFIX>-`.
 * Returns the prefix (or null) plus the canonical `rest` code.
 * "UUY-CPE313" → { prefix: "UUY", rest: "CPE313" }
 */
const splitCourseCodePrefix = (raw: string): { prefix: string | null; rest: string } => {
    const cleaned = (raw || '').replace(/\s+/g, '').toUpperCase();
    const tag = `${SCHOOL_CODE_PREFIX}-`;
    if (cleaned.startsWith(tag)) {
        return { prefix: SCHOOL_CODE_PREFIX, rest: cleaned.slice(tag.length) };
    }
    return { prefix: null, rest: cleaned };
};

/**
 * Derive level + semester from a normalized course code.
 * Digit[0] (after 3 letters) = level: 1→100 ... 5→500
 * Digit[1] = semester: 1→'1st', 2→'2nd'
 * Returns null when the code doesn't match the pattern.
 */
const deriveLevelSemesterFromCourseCode = (
    code: string,
): { level: number; semester: '1st' | '2nd' } | null => {
    const normalized = normalizeCourseCode(code);
    const match = normalized.match(/^[A-Z]{3}([1-5])([12])[0-9]$/);
    if (!match) return null;
    return {
        level: parseInt(match[1], 10) * 100,
        semester: match[2] === '1' ? '1st' : '2nd',
    };
};

const buildDrivePreviewUrl = (fileId: string) =>
    `https://drive.google.com/file/d/${fileId}/preview`;

const buildDriveDownloadUrl = (fileId: string) =>
    `https://drive.google.com/uc?export=download&id=${fileId}`;

const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};


const getDepartmentShortName = (name: string) => {


    if (name.includes('Computer')) {
        return 'CPE'
    } else if (name.includes('Agricultural') || name.includes('Agric')) {
        return 'AGE'
    } else if (name.includes('Electrical')) {
        return 'ELE'
    }
    else if (name.includes('Mechanical')) {
        return 'MEE'
    } else if (name.includes('Petroleum')) {
        return 'PEE'
    } else if (name.includes('Food')) {
        return 'FDE'
    } else if (name.includes('Civil')) {
        return 'CVE'
    } else if (name.includes('Chemical')) {
        return 'CHE'

    } else {
        return ''
    }

}


export { hashPassword, comparePassword, verifyToken, hashData, setCookie, extractDriveFileId, getDepartmentShortName, generateTokens, clearCookie, normalizeCourseCode, deriveLevelSemesterFromCourseCode, splitCourseCodePrefix, buildDrivePreviewUrl, buildDriveDownloadUrl, slugify }
