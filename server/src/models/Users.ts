import { Role } from '@/common/constants';
import { IUser } from '@/common/types';
import { Document, Schema, model } from 'mongoose';
import isEmail from 'validator/lib/isEmail.js'

const UserSchema = new Schema({

    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: [true, 'Email already exist'],
        trim: true,
        validate:[isEmail,"Enter a valid email"]
    },
    role: {
        type: String,
        enum: [Role.Admin, Role.Uploader],
        default: Role.Uploader
    },
    password: {
        type: String,
        min: [8, 'Password must be at least 8 characters'],
        select: false
    },
    refreshToken: {
        type: String,
        select: false
    },
    googleRefreshToken: {
        type: String,
        select: false
    }
})

const User = model<IUser>('User', UserSchema);
export default User
