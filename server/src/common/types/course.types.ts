import mongoose from "mongoose";
import { Semester } from "../constants";
import { Require_id } from "mongoose";
import { IUser } from "./user.types";

export interface ICourse extends Document {
    title: string;
    courseCode: string;
    /** Optional school prefix for display (e.g. "UUY" renders as "UUY-CPE313"). */
    codePrefix?: string;
    /** Bound Drive folder ID (set by sync/picker import, or first upload) so uploads resolve by ID. */
    driveFolderId?: string;
    departments: mongoose.Types.ObjectId[];
    /** Derived from courseCode digit[0]: 1→100 ... 5→500. Set automatically, not user-entered. */
    level: number;
    /** Derived from courseCode digit[1]: 1→'1st', 2→'2nd'. Set automatically. */
    semester: Semester;
    addedBy: Require_id<IUser>
}
