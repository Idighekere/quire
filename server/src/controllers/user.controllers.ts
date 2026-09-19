import { ErrorResponse, SuccessResponse } from "@/common/utils";
import { catchAsync } from "@/middlewares";
import { User } from "@/models";
import { Request } from "express";

const getCurrentUser = catchAsync(async (req:Request, res, next) => {

    // Anonymous (optionalAuth left req.user unset) — 200 + null, not 401.
    // Lets the SPA boot logged-out without a console error.
    if (!req['user']) {
        return SuccessResponse(res, 200, null, "No active session")
    }

    const user = await User.findById(req['user']._id)

    if (!user) {
        return next(new ErrorResponse("User not found", 404))
    }

    user.password = undefined

    SuccessResponse(res, 200, user, "User found successfully")

})


export { getCurrentUser }
