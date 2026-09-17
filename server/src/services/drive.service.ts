import { google, drive_v3 } from "googleapis";
import { ENVIRONMENT } from "@/common/configs";
import { Role } from "@/common/constants";
import { ErrorResponse } from "@/common/utils";
import { User } from "@/models";
import { Readable } from "stream";

export interface DriveFileResult {
  fileId: string;
  webViewLink: string;
  webContentLink: string;
}

export interface DriveFolderResult {
  folderId: string;
}

/**
 * Google Drive service.
 * All Drive access (reads/sync + writes) runs as the library admin's Google
 * account via OAuth (drive.file): the first admin to sign in with Google
 * connects the shared library Drive, and their stored refresh token is
 * reused server-side. This keeps single ownership/quota regardless of who
 * uploads. Use driveServiceForUser()/driveServiceForAdmin() to construct.
 */
export class DriveService {
  private drive: drive_v3.Drive;
  private rootFolderId: string;

  constructor(auth: drive_v3.Options["auth"], rootFolderId?: string) {
    this.drive = google.drive({ version: "v3", auth });
    this.rootFolderId = rootFolderId ?? ENVIRONMENT.DRIVE.ROOT_FOLDER_ID;
  }

  /**
   * Ensure a folder path exists, creating intermediate folders as needed.
   * Path segments are folder names, e.g. ["200 Level", "1st Semester", "GET211 - Strength of Materials"]
   */
  async ensureFolderPath(pathSegments: string[]): Promise<string> {
    let currentParentId = this.rootFolderId;

    for (const segment of pathSegments) {
      currentParentId = await this.findOrCreateFolder(segment, currentParentId);
    }

    return currentParentId;
  }

  /**
   * Find a folder by name within a parent, or create it.
   */
  private async findOrCreateFolder(name: string, parentId: string): Promise<string> {
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
      return res.data.files[0].id!;
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

    return createRes.data.id!;
  }

  /**
   * Upload a file to a specific folder.
   * Returns the file ID and links.
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId: string,
  ): Promise<DriveFileResult> {
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType,
      body: Readable.from(fileBuffer),
    };

    const res = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink, webContentLink",
      supportsAllDrives: true,
    });

    return {
      fileId: res.data.id!,
      webViewLink: res.data.webViewLink!,
      webContentLink: res.data.webContentLink!,
    };
  }

  /**
   * List a folder's direct children (files + folders), with pagination.
   */
  async listChildren(
    parentId: string,
  ): Promise<{ files: drive_v3.Schema$File[]; folders: drive_v3.Schema$File[] }> {
    const files: drive_v3.Schema$File[] = [];
    const folders: drive_v3.Schema$File[] = [];
    let pageToken: string | undefined;

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
        } else {
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
  async listAllFiles(): Promise<drive_v3.Schema$File[]> {
    const allFiles: drive_v3.Schema$File[] = [];
    let pageToken: string | undefined;

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
  async getFilePath(fileId: string): Promise<string[]> {
    const path: string[] = [];
    let currentId: string | undefined = fileId;

    while (currentId && currentId !== this.rootFolderId) {
      const res: { data: drive_v3.Schema$File } = await this.drive.files.get({
        fileId: currentId,
        fields: "id, name, parents",
        supportsAllDrives: true,
      });

      path.unshift(res.data.name!);
      currentId = res.data.parents?.[0];
    }

    return path;
  }

  /**
   * Share a file publicly (anyone with the link can read).
   */
  async sharePublic(fileId: string): Promise<void> {
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

/**
 * Build a DriveService bound to a user's Google OAuth refresh token.
 * googleapis refreshes access tokens automatically from the refresh token.
 */
export function driveServiceForUser(refreshToken: string): DriveService {
  const oauthClient = new google.auth.OAuth2(
    ENVIRONMENT.GOOGLE.CLIENT_ID,
    ENVIRONMENT.GOOGLE.CLIENT_SECRET,
    ENVIRONMENT.GOOGLE.REDIRECT_URI,
  );
  oauthClient.setCredentials({ refresh_token: refreshToken });
  return new DriveService(oauthClient, ENVIRONMENT.DRIVE.ROOT_FOLDER_ID);
}

/**
 * Build a DriveService bound to the library admin's Google OAuth refresh
 * token. Finds the first admin with a stored token and reuses it so all
 * uploads share one Drive ownership/quota.
 * Throws 503 when no admin has connected Google yet.
 */
export async function driveServiceForAdmin(): Promise<DriveService> {
  const admin = await User.findOne({
    role: Role.Admin,
    googleRefreshToken: { $exists: true, $ne: null },
  }).select("+googleRefreshToken");

  if (!admin?.googleRefreshToken) {
    throw new ErrorResponse(
      "Library Google Drive is not connected. An admin must sign in with Google first.",
      503,
    );
  }

  return driveServiceForUser(admin.googleRefreshToken);
}