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
