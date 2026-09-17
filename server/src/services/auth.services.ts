import { Require_id } from 'mongoose';
import { ENVIRONMENT } from "@/common/configs";
import { AuthenticateResult, IUser } from "@/common/types";
import { ErrorResponse, generateTokens, verifyToken } from "@/common/utils";
import { User } from "@/models";



const authenticate = async ({ accessToken, refreshToken }: { accessToken?: string; refreshToken?: string }) => {

    const isProd = ENVIRONMENT?.APP.ENV === "production"

    if (!refreshToken) {

        throw new ErrorResponse(`${isProd ? "Unauthorized" : "No refresh token provided"}`, 401)
    }


    /**
     * Verify user after token validation
     */
    const verifyUser = async (userId: any): Promise<IUser> => {

        //TODO - Handle caching
        const user = (await User.findById(userId).select(
            '+refreshToken'
        ) as Require_id<IUser>);

        // checking if the refresh token provided matches what's in the db

        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }

        if (user.refreshToken !== refreshToken) {
            throw new ErrorResponse('Invalid token. Please log in again!', 401);
        }

        return user;
    }

    /**
 * Refresh access token using refresh token
 */

    const refreshAccessToken = async (): Promise<AuthenticateResult> => {
        if (!refreshToken) {
            throw new ErrorResponse('No refresh token provided', 401);
        }
        try {

            // Verify the refresh token
            const decoded = await verifyToken(refreshToken, ENVIRONMENT.JWT.REFRESH_KEY!);

            // Verify and get user
            const user = await verifyUser(decoded?.id as string);


            // Generate new access token
            const newAccessToken = generateTokens.access({ id: user._id.toString() },{ "expiresIn": Number(ENVIRONMENT.JWT.EXPIRES_IN.ACCESS) });

            return {
                currentUser: user,
                accessToken: newAccessToken,
            };


        } catch (error) {
            if (!(error instanceof ErrorResponse)) {
                throw new ErrorResponse('Session expired, please log in again', 401);
            }
            throw error;


    }
    }

    if (!accessToken) {
        return refreshAccessToken();
    }

    try {
        // Verify the access token
        const decoded = await verifyToken(
            accessToken,
            ENVIRONMENT.JWT.ACCESS_KEY
        );

        // Verify and get user
        const user = await verifyUser(decoded?.id);

        return { currentUser: user };
    } catch (error) {
        // If access token is invalid or expired, try to refresh it
        if (error instanceof ErrorResponse || error instanceof Error) {
            return refreshAccessToken();
        }

        // Handle unexpected errors
        throw new ErrorResponse('Authentication failed', 401);
    }


}


export {authenticate}
