"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBooksService = void 0;
const models_1 = require("../models");
const getAllBooksService = async (page, limit, search, category) => {
    const skip = (page - 1) * limit;
    const matchConditions = {};
    // filter by category if provided
    if (category) {
        matchConditions["category"] = category;
    }
    const pipeline = [
        {
            $lookup: {
                from: "courses",
                localField: "course",
                foreignField: "_id",
                as: "course",
            },
        },
        {
            $unwind: "$course",
        },
        // Public listing: only approved materials ($nin keeps legacy books w/o status)
        {
            $match: { status: { $nin: ["pending", "rejected"] } },
        },
    ];
    //add search condition if provided
    if (search) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: search, $options: "i" } },
                    { "course.title": { $regex: search, $options: "i" } },
                    { "course.courseCode": { $regex: search, $options: "i" } },
                ],
            },
        });
    }
    if (category) {
        pipeline.push({
            $match: { category },
        });
    }
    //get total count for pagination meetadata
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await models_1.Book.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    pipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }, {
        $project: {
            title: 1,
            driveUrl: 1,
            driveFileId: 1,
            previewUrl: 1,
            category: 1,
            academicSession: 1,
            status: 1,
            createdAt: 1,
            course: {
                title: 1,
                courseCode: 1,
                codePrefix: 1,
            },
        },
    });
    const books = await models_1.Book.aggregate(pipeline);
    return {
        books,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
        },
    };
};
exports.getAllBooksService = getAllBooksService;
