
import { getCurrentUser } from "@/controllers";
import { optionalAuth } from "@/middlewares";
import express, { Express, Request, Response } from "express";

const userRoutes = express.Router();

// NOTE: optionalAuth (not protectRoute) on purpose. AuthProvider fires this
// on every page load including anonymous visits; a 401 here logs a console
// error in every visitor's browser and dings the PageSpeed console audit.
// Anonymous callers get 200 + null instead — the client treats null as
// logged-out, same as before.
userRoutes.get('/me', optionalAuth, getCurrentUser)
export default userRoutes;
