export interface IDepartment extends Document {
    name: string;
    logo: string;
    association: string;
    shortName: string;
    /** URL slug, e.g. "civil-engineering" */
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}
