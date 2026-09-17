import mongoose from "mongoose";
import { BookCategory, RequestStatus } from "../constants";

export interface IMaterialRequest extends Document {
    course?: mongoose.Types.ObjectId;
    /** Normalized course code as typed by the requester (e.g. "GET301") */
    courseCode: string;
    category: BookCategory;
    academicSession?: string;
    requestedBy?: mongoose.Types.ObjectId;
    /** For anonymous (no-login) requests */
    requesterName?: string;
    requesterLevel?: number;
    status: RequestStatus;
    upvotes: mongoose.Types.ObjectId[];
    anonymousUpvoteCount: number;
    fulfilledBy?: mongoose.Types.ObjectId;
    fulfilledBook?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
