import { ENVIRONMENT } from "@/common/configs";
import { clearCookie, comparePassword, ErrorResponse, generateTokens, hashData, hashPassword, setCookie, SuccessResponse } from "@/common/utils";
import { catchAsync } from "@/middlewares";
import { User } from "@/models";
import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { google } from "googleapis";


const login =catchAsync(async (req:Request,res:Response,next:NextFunction):Promise<void>=>{

    const {password,email}=req.body

    if(!email||!password){
        return next(new ErrorResponse("Incomplete login data",400))
    }

    const user=await User.findOne({email}).select("+password")

    if(!user){
        return next(new ErrorResponse("Invalid credentials",401))
    }

    const isPasswordMatching= await comparePassword(password,user!.password as string)

    if(!isPasswordMatching){
        return next(new ErrorResponse("Invalid credentials",401))
    }


    const accessToken= generateTokens.access(
        {id:user._id.toString()},{expiresIn:Number(ENVIRONMENT?.JWT?.EXPIRES_IN?.ACCESS)})

    setCookie(res,"accessToken",accessToken,{maxAge:15*60*1000}) //15 minutes



    const refreshToken =  generateTokens.refresh(
        { id: user._id.toString() },
        { expiresIn: Number(ENVIRONMENT.JWT.EXPIRES_IN.REFRESH!) },
        ENVIRONMENT.JWT.REFRESH_KEY!,
    );

    setCookie(res, 'refreshToken', refreshToken, {
        maxAge: 30*24 * 60 * 60 * 1000, // 30 days
    })

    user.refreshToken = refreshToken;
    await user.save();


    user.refreshToken=undefined
    user.password=undefined

    const responseData={
        user,
        accessToken
    }

    //FIXME - handle response properly
    SuccessResponse(res,200,responseData,"Login successful")

})


const register = catchAsync(async (req, res, next) => {

    const {email,name,password}=req.body

    if(!email||!password||!name){
        return next(new ErrorResponse("Incomplete signup data",400))
    }

    const userExists=await User.findOne({email})

    if(userExists){
        return next(new ErrorResponse("Email already exist",409))
    }

    const hashedPassword= await hashPassword(password)

    const newUser=await User.create({email,name,password:hashedPassword})

    SuccessResponse(res,201,{email,name,role:newUser.role},"User created successfully")

})



const logout = catchAsync(async (req:Request, res, next) => {

    const {user} = req
    if(!user){
        return next(new ErrorResponse("You are not logged in",404))
    }

    await User.findByIdAndUpdate(user._id,{$unset:{refreshToken:1}}) // unset will remove the refreshToken field

    clearCookie(res,"refreshToken")
    clearCookie(res,"accessToken")

    SuccessResponse(res, 200, null, 'Logout successful');

})



//TODO - Implement forgot and reset passord functionality
const forgotPassword = catchAsync(async (req, res, next) => {


})

const resetPassword = catchAsync(async (req, res, next) => {


})

const GOOGLE_OAUTH_SCOPES = ["email", "profile"];
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

// Accepts only bare origins like "https://app.example.com" (scheme + host
// + optional port, no path). Returns null for anything else.
const normalizeOrigin = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim().replace(/\/+$/, "");
    if (!/^https?:\/\/[^/]+$/i.test(trimmed)) return null;
    return trimmed;
}

const isAllowedOrigin = (origin: string): boolean => {
    return ENVIRONMENT.APP.ALLOWED_ORIGINS.includes(origin);
}

const isGoogleOAuthConfigured = (): boolean => {
    return Boolean(
        ENVIRONMENT.GOOGLE.CLIENT_ID &&
        ENVIRONMENT.GOOGLE.CLIENT_SECRET &&
        ENVIRONMENT.GOOGLE.REDIRECT_URI,
    );
}

const buildGoogleOAuthClient = () => {
    return new google.auth.OAuth2(
        ENVIRONMENT.GOOGLE.CLIENT_ID,
        ENVIRONMENT.GOOGLE.CLIENT_SECRET,
        ENVIRONMENT.GOOGLE.REDIRECT_URI,
    );
}

// GET /api/v1/auth/google[?redirect=<origin>][&drive=1] — redirect the
// browser to Google's consent screen. An optional `redirect` origin is bound
// into the OAuth state so multi-frontend setups return to the requesting
// frontend. It must exactly match FRONTEND_ORIGINS or it is ignored.
// `?drive=1` requests the Drive scope (admin-only, one-time connection so
// uploads run as the library account); regular sign-ins get email+profile
// only and no offline access. The drive flag is encoded in the state so the
// callback can read back which flow it was.
const googleAuthStart = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!isGoogleOAuthConfigured()) {
        return next(new ErrorResponse("Google sign-in is not configured on this server", 500));
    }

    const requestedOrigin = normalizeOrigin(req.query.redirect);
    const safeReturnTo = requestedOrigin && isAllowedOrigin(requestedOrigin)
        ? requestedOrigin
        : null;

    const wantDrive = req.query.drive === "1" || req.query.drive === "true";

    const stateToken = crypto.randomBytes(16).toString("hex");
    setCookie(res, "oauth_state", stateToken, { maxAge: 10 * 60 * 1000 });

    // State shape: "<token>" | "<token>.<drive|encodedReturnTo>" |
    // "<token>.drive.<encodedReturnTo>". The token is verified against the
    // oauth_state cookie in the callback; the rest is parsed there.
    const stateParts = [stateToken];
    if (wantDrive) {
        stateParts.push("drive");
    }
    if (safeReturnTo) {
        stateParts.push(encodeURIComponent(safeReturnTo));
    }
    const state = stateParts.join(".");

    const authUrlOptions: Record<string, unknown> = {
        scope: wantDrive ? [...GOOGLE_OAUTH_SCOPES, GOOGLE_DRIVE_SCOPE] : GOOGLE_OAUTH_SCOPES,
        state,
        prompt: "select_account",
    };
    if (wantDrive) {
        authUrlOptions.access_type = "offline";
    }

    const authUrl = buildGoogleOAuthClient().generateAuthUrl(authUrlOptions as never);

    res.redirect(authUrl);
})

// GET /api/v1/auth/google/callback — Google redirects here with ?code=…&state=….
// Exchanges the code, finds-or-creates the user by email, sets the same
// session cookies as password login, then redirects to the frontend.
const googleAuthCallback = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const defaultOrigin = ENVIRONMENT.APP.CLIENT || "/";
    const { code, state } = req.query;

    // Resolve the return origin BEFORE any failure redirect: state is
    // "<token>" or "<token>[.drive][.<encodedReturnTo>]". The token must
    // match the oauth_state cookie, and the origin must be allowlisted —
    // otherwise everything falls back to FRONTEND_URL. The optional "drive"
    // segment marks the admin Drive-connection flow (regular sign-ins omit
    // it, keeping backward compatibility with previously issued states).
    let returnOrigin = defaultOrigin;
    let stateToken: string | null = null;
    if (typeof state === "string") {
        const segments = state.split(".");
        stateToken = segments[0] || null;
        const rest = segments.slice(1);
        if (rest[0] === "drive") {
            rest.shift();
        }
        if (rest.length > 0) {
            try {
                const candidate = normalizeOrigin(decodeURIComponent(rest.join(".")));
                if (candidate && isAllowedOrigin(candidate)) {
                    returnOrigin = candidate;
                }
            } catch {
                // keep the default origin
            }
        }
    }

    const fail = (code: string): void => {
        res.redirect(`${returnOrigin}/auth/login?error=${code}`);
    };

    if (!isGoogleOAuthConfigured()) {
        fail("google_not_configured");
        return;
    }

    if (typeof code !== "string" || !code) {
        fail("google_failed");
        return;
    }
    if (!stateToken || stateToken !== req.cookies?.oauth_state) {
        fail("google_failed");
        return;
    }
    clearCookie(res, "oauth_state");

    try {
        const oauthClient = buildGoogleOAuthClient();
        const { tokens } = await oauthClient.getToken(code);
        oauthClient.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
        const { data } = await oauth2.userinfo.get();

        const email = data.email?.toLowerCase().trim();
        if (!email || data.verified_email !== true) {
            fail("google_no_email");
            return;
        }

        const name = data.name?.trim() || email.split("@")[0];

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ email, name });
        }

        if (tokens.refresh_token) {
            user.googleRefreshToken = tokens.refresh_token;
        }

        const accessToken = generateTokens.access(
            { id: user._id.toString() }, { expiresIn: Number(ENVIRONMENT?.JWT?.EXPIRES_IN?.ACCESS) });

        setCookie(res, "accessToken", accessToken, { maxAge: 15 * 60 * 1000 });

        const refreshToken = generateTokens.refresh(
            { id: user._id.toString() },
            { expiresIn: Number(ENVIRONMENT.JWT.EXPIRES_IN.REFRESH!) },
            ENVIRONMENT.JWT.REFRESH_KEY!,
        );

        setCookie(res, 'refreshToken', refreshToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
        })

        user.refreshToken = refreshToken;
        await user.save();

        res.redirect(`${returnOrigin}/dashboard`);
    } catch {
        fail("google_failed");
    }
})

// GET /api/v1/auth/google/status (admin) — whether any admin has a stored
// Google Drive refresh token.
const getGoogleConnectionStatus = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const connectedUser = await User.exists({
        googleRefreshToken: { $exists: true, $ne: null },
    });

    SuccessResponse(res, 200, { connected: Boolean(connectedUser) }, "Drive connection status");
})

// DELETE /api/v1/auth/google/connection — clears the CALLER's own stored
// Google Drive refresh token.
const disconnectGoogleConnection = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const callerId = req.user?._id;
    if (!callerId) {
        return next(new ErrorResponse("You are not logged in", 404));
    }

    const dbUser = await User.findById(callerId);
    if (!dbUser) {
        return next(new ErrorResponse("User not found", 404));
    }

    dbUser.googleRefreshToken = undefined;
    await dbUser.save();

    SuccessResponse(res, 200, { connected: false }, "Google Drive disconnected");
})

export {login,logout,register,forgotPassword,resetPassword,googleAuthStart,googleAuthCallback,getGoogleConnectionStatus,disconnectGoogleConnection,}
