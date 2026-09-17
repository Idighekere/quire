import { google, drive_v3 } from "googleapis";
import { ENVIRONMENT } from "@/common/configs";
import { Role } from "@/common/constants";
import { ErrorResponse, normalizeCourseCode } from "@/common/utils";
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
 * Match a level folder tolerantly: accept "300 Level", "300", "300L".
 * Leading three digits (/^(\d{3})\b/) cover the first two; a trailing
 * L form (/(\d)\s*L\b/i, extended to multi-digit so "300L" resolves)
 * covers hand-made short names. A lone digit ("3L") maps to 300.
 */
function matchesLevelFolder(name: string, level: number): boolean {
  const leading = name.match(/^(\d{3})\b/);
  if (leading && parseInt(leading[1], 10) === level) return true;
  const lAbbr = name.match(/(\d+)\s*L\b/i);
  if (lAbbr) {
    const digits = lAbbr[1];
    if (digits.length === 1 && parseInt(digits, 10) * 100 === level) return true;
    if (parseInt(digits, 10) === level) return true;
  }
  return false;
}

/**
 * Match a semester folder tolerantly: names starting with 1st/2nd
 * (case-insensitive), containing first/second, or exactly 1/2.
 */
function matchesSemesterFolder(name: string, semester: string): boolean {
  const lower = name.toLowerCase();
  if (semester === "1st") {
    return lower.startsWith("1st") || lower.includes("first") || lower.trim() === "1";
  }
  return lower.startsWith("2nd") || lower.includes("second") || lower.trim() === "2";
}

export interface DriveAboutResult {
  email: string;
  displayName: string;
  rootFolderId: string;
  childFolderCount: number;
  childFileCount: number;
  childNames: string[];
}

/**
 * Google Drive service.
 * Reads (sync walk, debug) run as the library service account, which sees
 * every file inside the shared master folder by folder ACL. Writes (uploads)
 * run as the connected admin's Google account via OAuth (drive.file) so the
 * free-Gmail service account never hits a storage-quota 403. User-scoped
 * flows (contributor pickers) reuse per-user OAuth tokens. Use
 * driveServiceForServiceAccount()/driveServiceForAdmin()/driveServiceForUser()
 * to construct.
 */
export class DriveService {
  private drive: drive_v3.Drive;
  private authClient: drive_v3.Options["auth"];
  private rootFolderId: string;

  constructor(auth: drive_v3.Options["auth"], rootFolderId?: string) {
    this.drive = google.drive({ version: "v3", auth });
    this.authClient = auth;
    this.rootFolderId = rootFolderId ?? ENVIRONMENT.DRIVE.ROOT_FOLDER_ID;
  }

  /**
   * Mint a short-lived access token for the connected admin account.
   * Handed to the browser for the Google Picker only: the picker proves
   * the admin selected each file, and that selection grants the app
   * per-file access under drive.file. The token itself carries no extra
   * scope and expires on its own.
   */
  async getAccessToken(): Promise<string> {
    const client = this.authClient as InstanceType<typeof google.auth.OAuth2>;
    const { token } = await client.getAccessToken();
    if (!token) {
      throw new ErrorResponse(
        "Could not mint a Drive access token. Reconnect Google Drive and try again.",
        503,
      );
    }
    return token;
  }

  /**
   * Fetch one file's metadata by ID. Works for picker-selected files
   * (selection grants per-file access under drive.file). Throws the
   * Drive 404/403 when the file was never granted to the app.
   */
  async getFile(fileId: string): Promise<drive_v3.Schema$File> {
    const res = await this.drive.files.get({
      fileId,
      fields: "id, name, mimeType, parents, size",
      supportsAllDrives: true,
    });
    return res.data;
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
   * Resolve/create the Level/Semester/Course folder path tolerantly so
   * hand-made Drive folders (e.g. "300L", "GET 311 - Eng. Maths III")
   * are reused instead of creating duplicate canonical folders.
   * Lists child folders of each parent via listChildren, matches in
   * memory (first match wins), and falls back to findOrCreateFolder
   * with the canonical name when nothing matches.
   */
  async ensureCoursePath(
    level: number,
    semester: string,
    courseCode: string,
    courseTitle: string,
  ): Promise<string> {
    // Level: accept "300 Level", "300L", "300".
    const { folders: levelFolders } = await this.listChildren(this.rootFolderId);
    const levelMatch = levelFolders.find((folder) =>
      matchesLevelFolder(folder.name ?? "", level),
    );
    const levelId =
      levelMatch?.id ??
      (await this.findOrCreateFolder(`${level} Level`, this.rootFolderId));

    // Semester: names starting with 1st/2nd (case-insensitive),
    // containing first/second, or exactly 1/2.
    const canonicalSemester = semester === "1st" ? "1st Semester" : "2nd Semester";
    const { folders: semesterFolders } = await this.listChildren(levelId);
    const semesterMatch = semesterFolders.find((folder) =>
      matchesSemesterFolder(folder.name ?? "", semester),
    );
    const semesterId =
      semesterMatch?.id ??
      (await this.findOrCreateFolder(canonicalSemester, levelId));

    // Course: compare the part before the first -/–/— normalized
    // with normalizeCourseCode against the normalized target code.
    const normalizedTarget = normalizeCourseCode(courseCode);
    const { folders: courseFolders } = await this.listChildren(semesterId);
    const courseMatch = courseFolders.find((folder) => {
      const name = folder.name ?? "";
      const separatorIndex = name.search(/[-–—]/);
      const codePart = separatorIndex === -1 ? name : name.slice(0, separatorIndex);
      return normalizeCourseCode(codePart) === normalizedTarget;
    });
    const courseId =
      courseMatch?.id ??
      (await this.findOrCreateFolder(`${courseCode} - ${courseTitle}`, semesterId));

    return courseId;
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
   * Identify which Google account and root folder the server actually uses.
   * Returns the connected account plus a summary of the root's direct children.
   */
  async about(): Promise<DriveAboutResult> {
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
 * Build a DriveService bound to the library service account. Scoped to
 * drive.readonly on purpose (even when the folder share grants Editor) so
 * the sync walk can never write. Sees everything inside the shared master
 * folder by folder ACL — hand-dropped files included — and nothing else.
 * Throws 503 when the SA credentials are not configured.
 */
export function driveServiceForServiceAccount(): DriveService {
  const email = ENVIRONMENT.DRIVE.SERVICE_ACCOUNT_EMAIL;
  // .env stores the PEM with literal \n escapes; the JWT client needs real newlines.
  const privateKey = (ENVIRONMENT.DRIVE.SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  );
  if (!email || !privateKey) {
    throw new ErrorResponse(
      "Library service account is not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
      503,
    );
  }
  const jwtClient = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return new DriveService(jwtClient, ENVIRONMENT.DRIVE.ROOT_FOLDER_ID);
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