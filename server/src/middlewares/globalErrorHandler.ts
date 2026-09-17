import { ENVIRONMENT } from "@/common/configs"
import ErrorResponse from "@/common/utils/errorResponse"
import { ErrorRequestHandler, NextFunction, Request, Response } from "express"

const productionError = (res: Response, error: any) => {

    if (error.isOperational) {
        res.status(error.statusCode).json({
            message: error.message,
            status: error.status
        })
    } else {

        res.status(500).json({
            status: 'error',
            message: "Something went wrong. Please try again later."
        })
    }

}

const developmentError = (res: Response, error: any) => {


    res.status(error.statusCode).json({
        message: error.message,
        status: error.status,
        stackTRace: error.stack,
        error

    })
}


const castErrorHandler = (err: any) => {
    const errMessage = `Invalid value: ${err.value} for field: ${err.path}`
    return new ErrorResponse(errMessage, 400)
}

const duplicateKeyHandler = (err: any) => {

    const keyValue = err.keyValue || {};
    const field = Object.keys(keyValue)[0];
    const value = field ? keyValue[field] : '';
    const errMessage = field
        ? `${field} '${value}' already exists.`
        : `Duplicate value already exists. Please try another`

    return new ErrorResponse(errMessage, 409)
}

const validationErrorHandler = (err: any) => {
    const firstField = Object.keys(err.errors || {})[0];
    const firstMessage = firstField ? err.errors[firstField]?.message : undefined;
    return new ErrorResponse(
        firstMessage || "Invalid input. Please check your data.",
        400,
    );
}

const JWTtokenErrorHandler = (err: any) => {
    return new ErrorResponse('Invalid token. Please login again!', 401)

}

const tokenExpireErrorHandler = (err: any) => {
    return new ErrorResponse('JWT has expired. Please login again!', 401)


}

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {


    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    if (ENVIRONMENT.APP.ENV == 'development') {
        developmentError(res, err)
    } else if (ENVIRONMENT.APP.ENV == "production") {


        if (err.code == 11000) {
            err = duplicateKeyHandler(err)
        }
        if (err.name == 'CastError') {
            err = castErrorHandler(err)
        }

        if (err.name == "TokenExpireError") {
            err = tokenExpireErrorHandler(err)

        }
        if (err.name == 'ValidationError') {
            err = validationErrorHandler(err)
        }
        if (err.name == 'JWTTokenError') {
            err = JWTtokenErrorHandler(err)
        }

        productionError(res, err)
    }

}
