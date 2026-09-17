import mongoose from "mongoose";
import { BookCategory, BookStatus } from "../constants";

export interface IBook extends Document {
    title: string;
    /** Legacy full Drive URL (kept for backwards compat, optional when driveFileId present) */
    driveUrl?: string;
    /** Canonical Drive file ID — source of truth for preview/download URLs */
    driveFileId: string;
    course: mongoose.Types.ObjectId;
    category: BookCategory;
    /** Academic session, e.g. "2023/2024" — required for pastQuestion */
    academicSession?: string;
    status: BookStatus;
    uploadedBy?: mongoose.Types.ObjectId;
    /** Metadata from direct uploads */
    fileName?: string;
    mimeType?: string;
    size?: number;
    thumbnail?: string;
    createdAt: Date;
    updatedAt: Date;
}
