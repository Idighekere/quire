import { Role } from "../constants";

export interface IUser extends Document {
    _id?:any;
    name: string;
    email: string;
    refreshToken:string|undefined;
    googleRefreshToken: string|undefined;
    role: Role;
    password: string|undefined;
    createdAt: Date;
    updatedAt: Date;
}
