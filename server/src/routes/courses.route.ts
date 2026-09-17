import { protectRoute, restrict } from '@/middlewares';
import { createCourse, deleteCourse, filterCourses, getAllCourse, getCoursesByUser, lookupCourse, updateCourse } from "@/controllers"
import express from "express"
import { Role } from '@/common/constants';

const coursesRoute = express.Router()


coursesRoute.route("/").post(protectRoute,restrict(Role.Admin, Role.Uploader),createCourse).get(filterCourses)
coursesRoute.get('/me',protectRoute,getCoursesByUser)
coursesRoute.get('/lookup/:courseCode', lookupCourse)
coursesRoute.route("/:id").patch(protectRoute, updateCourse).delete(protectRoute, deleteCourse)

export default coursesRoute
