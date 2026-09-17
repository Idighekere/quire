import { Course, Department } from "@/models";
import { deriveLevelSemesterFromCourseCode, normalizeCourseCode, splitCourseCodePrefix } from "@/common/utils";
import { COURSE_CODE_REGEX } from "@/common/constants";
import { ErrorResponse } from "@/common/utils";
import mongoose from "mongoose";

export const filterCoursesService = async (
  department: string,
  semester: string,
  level: string,
) => {
  const matchConditions: Record<string, any> = {};

  // if department is provided, filter by department
  if (department) {
    matchConditions["departments.shortName"] = department;
  }

  //if level is provided, filter by level
  if (level) {
    matchConditions["level"] = parseInt(level as string);
  }

  //if semester is provided, filter by semester
  if (semester) {
    matchConditions["semester"] = semester;
  }

  //Require atleasr one filter
  if (Object.keys(matchConditions).length === 0) {
    throw new Error(
      "At least one filter (department, level, semester) must be provided",
    );
  }
  const courses = await Course.aggregate([
    {
      $lookup: {
        from: "departments",
        localField: "departments",
        foreignField: "_id",
        as: "departments",
      },
    },

    // {$unwind:'$departments'},
    {
      $match: matchConditions,
    },
    //Sort by level (ascending) and semester (ascending)
    {
      $sort: { level: 1, semester: 1 },
    },
    {
      $project: {
        title: 1,
        courseCode: 1,
        codePrefix: 1,
        departments: {
          name: 1,
          shortName: 1,
        },
        level: 1,
        semester: 1,
      },
    },
  ]);

  return courses;
};

/**
 * Find a course by code (normalized) or create it on the fly.
 * Level + semester are always derived from the code — never trusted from input.
 * Used by the unified "Add Material" flow so contributors never manage
 * courses as a separate step.
 */
export const findOrCreateCourseFromCode = async (params: {
  courseCode: string;
  title?: string;
  departmentShortNames?: string[] | string;
  addedBy: mongoose.Types.ObjectId | string;
}) => {
  const { title, addedBy } = params;
  const { prefix, rest } = splitCourseCodePrefix(params.courseCode || '');
  const normalizedCode = normalizeCourseCode(rest);

  if (!normalizedCode || !COURSE_CODE_REGEX.test(normalizedCode)) {
    throw new ErrorResponse(
      'Invalid course code. Use the format ABC123 where the 4th digit is the level (1-5) and 5th is the semester (1-2), e.g. GET211',
      400,
    );
  }

  const existing = await Course.findOne({ courseCode: normalizedCode });
  if (existing) {
    if (!existing.codePrefix && prefix) {
      existing.codePrefix = prefix;
      await existing.save();
    }
    return { course: existing, created: false };
  }

  const derived = deriveLevelSemesterFromCourseCode(normalizedCode);
  if (!derived) {
    throw new ErrorResponse('Invalid course code. Could not derive level and semester.', 400);
  }

  if (!title) {
    throw new ErrorResponse(
      'This course does not exist yet. Please provide the course title and department(s) to create it.',
      400,
    );
  }

  // Coerce departmentShortNames: multipart forms deliver a JSON-encoded
  // string, and a miswired checkbox group can deliver a single value or a
  // non-array. Anything that is not a non-empty array gets the friendly 400.
  let departmentsInput: unknown = params.departmentShortNames;
  if (typeof departmentsInput === "string") {
    try {
      departmentsInput = JSON.parse(departmentsInput);
    } catch {
      departmentsInput = [departmentsInput];
    }
    if (typeof departmentsInput === "string") {
      departmentsInput = [departmentsInput];
    }
  }
  if (!Array.isArray(departmentsInput) || departmentsInput.length === 0) {
    throw new ErrorResponse(
      'This course does not exist yet. Please select at least one department offering it.',
      400,
    );
  }

  const normalizedDepts = (departmentsInput as unknown[])
    .map((s: unknown) => String(s).trim().toUpperCase())
    .filter((s) => s.length > 0);

  if (normalizedDepts.length === 0) {
    throw new ErrorResponse(
      'This course does not exist yet. Please select at least one department offering it.',
      400,
    );
  }
  const departments = await Department.find({
    shortName: { $in: normalizedDepts },
  });

  if (departments.length !== normalizedDepts.length) {
    throw new ErrorResponse('One or more department short names are invalid', 400);
  }

  try {
    const course = await Course.create({
      title,
      courseCode: normalizedCode,
      codePrefix: prefix || undefined,
      departments: departments.map((dept) => dept._id),
      level: derived.level,
      semester: derived.semester,
      addedBy,
    });
    return { course, created: true };
  } catch (err: unknown) {
    // Race: two uploads creating the same course at once → reuse the winner
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      const winner = await Course.findOne({ courseCode: normalizedCode });
      if (winner) {
        if (!winner.codePrefix && prefix) {
          winner.codePrefix = prefix;
          await winner.save();
        }
        return { course: winner, created: false };
      }
    }
    throw err;
  }
};
