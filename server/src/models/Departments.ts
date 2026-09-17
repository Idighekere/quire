import { IDepartment } from '@/common/types';
import { getDepartmentShortName, slugify } from '@/common/utils';
import mongoose, { Schema, Document } from 'mongoose';

const DepartmentSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (name: string) {
                return !(name.includes('engineering'))
            },
            message: "Department name must be in full"
        }
    },
    logo: {
        type: String,
        // required: true,
        default: ""
    },
    association: {
        type: String,
        default: ""
    },
    shortName: {
        type: String,
        default: "", uppercase: true,
        trim: true,
        unique: true,
        match: [/^[A-Z]{2,3}$/, 'Please enter a valid short name'],
    },
    slug: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
    }
},
    { timestamps: true }
);

// Auto-fill shortName + slug from name when not provided
DepartmentSchema.pre('validate', function (next) {
    const doc = this as unknown as IDepartment;
    if (doc.name && !doc.slug) {
        doc.slug = slugify(doc.name);
    }
    if (doc.name && !doc.shortName) {
        doc.shortName = getDepartmentShortName(doc.name);
    }
    if (doc.shortName && typeof doc.shortName === 'string') {
        doc.shortName = doc.shortName.trim().toUpperCase();
    }
    next();
});


const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);

export default Department;
