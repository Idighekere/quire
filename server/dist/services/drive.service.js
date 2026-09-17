"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriveService = void 0;
exports.driveServiceForUser = driveServiceForUser;
exports.driveServiceForAdmin = driveServiceForAdmin;
const googleapis_1 = require("googleapis");
const configs_1 = require("../common/configs");
const constants_1 = require("../common/constants");
const utils_1 = require("../common/utils");
const models_1 = require("../models");
const stream_1 = require("stream");
/**
 * Match a level folder tolerantly: accept "300 Level", "300", "300L".
 * Leading three digits (/^(\d{3})\b/) cover the first two; a trailing
 * L form (/(\d)\s*L\b/i, extended to multi-digit so "300L" resolves)
 * covers hand-made short names. A lone digit ("3L") maps to 300.
 */
function matchesLevelFolder(name, level) {
    const leading = name.match(/^(\d{3})\b/);
    if (leading && parseInt(leading[1], 10) === level)
        return true;
    const lAbbr = name.match(/(\d+)\s*L\b/i);
    if (lAbbr) {
        const digits = lAbbr[1];
        if (digits.length === 1 && parseInt(digits, 10) * 100 === level)
            return true;
        if (parseInt(digits, 10) === level)
            return true;
    }
    return false;
}
/**
 * Match a semester folder tolerantly: names starting with 1st/2nd
 * (case-insensitive), containing first/second, or exactly 1/2.
 */
function matchesSemesterFolder(name, semester) {
    const lower = name.toLowerCase();
    if (semester === "1st") {
        return lower.startsWith("1st") || lower.includes("first") || lower.trim() === "1";
    }
    return lower.startsWith("2nd") || lower.includes("second") || lower.trim() === "2";
}
/**
 * Google Drive service.
 * All Drive access (reads/sync + writes) runs as the library admin's Google
 * account via OAuth (drive.file): the first admin to sign in with Google
 * connects the shared library Drive, and their stored refresh token is
 * reused server-side. This keeps single ownership/quota regardless of who
 * uploads. Use driveServiceForUser()/driveServiceForAdmin() to construct.
 */
class DriveService {
    drive;
    rootFolderId;
    constructor(auth, rootFolderId) {
        this.drive = googleapis_1.google.drive({ version: "v3", auth });
        this.rootFolderId = rootFolderId ?? configs_1.ENVIRONMENT.DRIVE.ROOT_FOLDER_ID;
    }
    /**
     * Ensure a folder path exists, creating intermediate folders as needed.
     * Path segments are folder names, e.g. ["200 Level", "1st Semester", "GET211 - Strength of Materials"]
     */
    async ensureFolderPath(pathSegments) {
        let currentParentId = this.rootFolderId;
        for (const segment of pathSegments) {
            currentParentId = await this.findOrCreateFolder(segment, currentParentId);
        }
        return currentParentId;
    }
    /**
     * Resolve/create the Level/Semester/Course folder path tolerantly so
     * hand-made Drive folders (e.g. "300L", "GET 311 - Eng. Maths III")
     * are reused instead of creating duplicate canonical folders.
     * Lists child folders of each parent via listChildren, matches in
     * memory (first match wins), and falls back to findOrCreateFolder
     * with the canonical name when nothing matches.
     */
    async ensureCoursePath(level, semester, courseCode, courseTitle) {
        // Level: accept "300 Level", "300L", "300".
        const { folders: levelFolders } = await this.listChildren(this.rootFolderId);
        const levelMatch = levelFolders.find((folder) => matchesLevelFolder(folder.name ?? "", level));
        const levelId = levelMatch?.id ??
            (await this.findOrCreateFolder(`${level} Level`, this.rootFolderId));
        // Semester: names starting with 1st/2nd (case-insensitive),
        // containing first/second, or exactly 1/2.
        const canonicalSemester = semester === "1st" ? "1st Semester" : "2nd Semester";
        const { folders: semesterFolders } = await this.listChildren(levelId);
        const semesterMatch = semesterFolders.find((folder) => matchesSemesterFolder(folder.name ?? "", semester));
        const semesterId = semesterMatch?.id ??
            (await this.findOrCreateFolder(canonicalSemester, levelId));
        // Course: compare the part before the first -/–/— normalized
        // with normalizeCourseCode against the normalized target code.
        const normalizedTarget = (0, utils_1.normalizeCourseCode)(courseCode);
        const { folders: courseFolders } = await this.listChildren(semesterId);
        const courseMatch = courseFolders.find((folder) => {
            const name = folder.name ?? "";
            const separatorIndex = name.search(/[-–—]/);
            const codePart = separatorIndex === -1 ? name : name.slice(0, separatorIndex);
            return (0, utils_1.normalizeCourseCode)(codePart) === normalizedTarget;
        });
        const courseId = courseMatch?.id ??
            (await this.findOrCreateFolder(`${courseCode} - ${courseTitle}`, semesterId));
        return courseId;
    }
    /**
     * Find a folder by name within a parent, or create it.
     */
    async findOrCreateFolder(name, parentId) {
        const escapedName = name.replace(/'/g, "\\'");
        const query = [
            `name = '${escapedName}'`,
            `mimeType = 'application/vnd.google-apps.folder'`,
            `'${parentId}' in parents`,
            "trashed = false",
        ].join(" and ");
        const res = await this.drive.files.list({
            q: query,
            fields: "files(id, name)",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });
        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id;
        }
        // Create folder
        const createRes = await this.drive.files.create({
            requestBody: {
                name,
                mimeType: "application/vnd.google-apps.folder",
                parents: [parentId],
            },
            fields: "id",
            supportsAllDrives: true,
        });
        return createRes.data.id;
    }
    /**
     * Upload a file to a specific folder.
     * Returns the file ID and links.
     */
    async uploadFile(fileBuffer, fileName, mimeType, folderId) {
        const fileMetadata = {
            name: fileName,
            parents: [folderId],
        };
        const media = {
            mimeType,
            body: stream_1.Readable.from(fileBuffer),
        };
        const res = await this.drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: "id, webViewLink, webContentLink",
            supportsAllDrives: true,
        });
        return {
            fileId: res.data.id,
            webViewLink: res.data.webViewLink,
            webContentLink: res.data.webContentLink,
        };
    }
    /**
     * List a folder's direct children (files + folders), with pagination.
     */
    async listChildren(parentId) {
        const files = [];
        const folders = [];
        let pageToken;
        const query = `'${parentId}' in parents and trashed = false`;
        do {
            const res = await this.drive.files.list({
                q: query,
                fields: "nextPageToken, files(id, name, mimeType, parents, size, createdTime, modifiedTime)",
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
                pageSize: 1000,
                pageToken,
            });
            const items = res.data.files || [];
            for (const item of items) {
                if (item.mimeType === "application/vnd.google-apps.folder") {
                    folders.push(item);
                }
                else {
                    files.push(item);
                }
            }
            pageToken = res.data.nextPageToken || undefined;
        } while (pageToken);
        return { files, folders };
    }
    /**
     * List all files recursively under the root folder (for sync).
     */
    async listAllFiles() {
        const allFiles = [];
        let pageToken;
        const query = `'${this.rootFolderId}' in parents and trashed = false`;
        do {
            const res = await this.drive.files.list({
                q: query,
                fields: "nextPageToken, files(id, name, mimeType, parents, size, createdTime, modifiedTime)",
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
                pageSize: 1000,
                pageToken,
            });
            if (res.data.files) {
                allFiles.push(...res.data.files);
            }
            pageToken = res.data.nextPageToken || undefined;
        } while (pageToken);
        return allFiles;
    }
    /**
     * Get folder hierarchy for a file (to determine course/level/semester from path).
     */
    async getFilePath(fileId) {
        const path = [];
        let currentId = fileId;
        while (currentId && currentId !== this.rootFolderId) {
            const res = await this.drive.files.get({
                fileId: currentId,
                fields: "id, name, parents",
                supportsAllDrives: true,
            });
            path.unshift(res.data.name);
            currentId = res.data.parents?.[0];
        }
        return path;
    }
    /**
     * Identify which Google account and root folder the server actually uses.
     * Returns the connected account plus a summary of the root's direct children.
     */
    async about() {
        const aboutRes = await this.drive.about.get({
            fields: "user(emailAddress,displayName)",
        });
        const { files, folders } = await this.listChildren(this.rootFolderId);
        const childNames = [...folders, ...files]
            .map((item) => item.name ?? "")
            .filter((name) => name.length > 0)
            .slice(0, 20);
        return {
            email: aboutRes.data.user?.emailAddress ?? "",
            displayName: aboutRes.data.user?.displayName ?? "",
            rootFolderId: this.rootFolderId,
            childFolderCount: folders.length,
            childFileCount: files.length,
            childNames,
        };
    }
    /**
     * Share a file publicly (anyone with the link can read).
     */
    async sharePublic(fileId) {
        await this.drive.permissions.create({
            fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
            supportsAllDrives: true,
        });
    }
}
exports.DriveService = DriveService;
/**
 * Build a DriveService bound to a user's Google OAuth refresh token.
 * googleapis refreshes access tokens automatically from the refresh token.
 */
function driveServiceForUser(refreshToken) {
    const oauthClient = new googleapis_1.google.auth.OAuth2(configs_1.ENVIRONMENT.GOOGLE.CLIENT_ID, configs_1.ENVIRONMENT.GOOGLE.CLIENT_SECRET, configs_1.ENVIRONMENT.GOOGLE.REDIRECT_URI);
    oauthClient.setCredentials({ refresh_token: refreshToken });
    return new DriveService(oauthClient, configs_1.ENVIRONMENT.DRIVE.ROOT_FOLDER_ID);
}
/**
 * Build a DriveService bound to the library admin's Google OAuth refresh
 * token. Finds the first admin with a stored token and reuses it so all
 * uploads share one Drive ownership/quota.
 * Throws 503 when no admin has connected Google yet.
 */
async function driveServiceForAdmin() {
    const admin = await models_1.User.findOne({
        role: constants_1.Role.Admin,
        googleRefreshToken: { $exists: true, $ne: null },
    }).select("+googleRefreshToken");
    if (!admin?.googleRefreshToken) {
        throw new utils_1.ErrorResponse("Library Google Drive is not connected. An admin must sign in with Google first.", 503);
    }
    return driveServiceForUser(admin.googleRefreshToken);
}
