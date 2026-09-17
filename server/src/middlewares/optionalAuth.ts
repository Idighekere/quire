import { ErrorResponse, SuccessResponse } from "@/common/utils";
import { catchAsync } from "./catchAsync";
import { Request, Response, NextFunction } from "express";
import { authenticate } from "@/services";

/**
 * Attaches req.user when valid auth cookies are present,
 * but never rejects anonymous callers. Used by public
 * endpoints (e.g. material requests) that personalize
 * when possible.
 */
const optionalAuth = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return next();
    }

    try {
      const { currentUser } = await authenticate({ accessToken, refreshToken });
      req["user"] = currentUser;
    } catch {
      // Anonymous — leave req.user unset
    }

    next();
  },
);

export { optionalAuth };
