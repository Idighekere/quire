export type IEnvironment = {
    APP: {
        PORT: number;
        ENV: string
        CLIENT: string
        /** Exact origins allowed for CORS + OAuth return redirects. */
        ALLOWED_ORIGINS: string[]
    },
    DB: {
        URI: string
    },
    JWT: {
        ACCESS_KEY: string
        REFRESH_KEY: string
        EXPIRES_IN: {
            ACCESS:string
            REFRESH: string

        }
    },
    DRIVE: {
        ROOT_FOLDER_ID: string
    },
    GOOGLE: {
        CLIENT_ID: string
        CLIENT_SECRET: string
        REDIRECT_URI: string
    }
}
