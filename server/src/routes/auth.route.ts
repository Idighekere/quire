import { protectRoute, restrict } from '@/middlewares';
import { Role } from '@/common/constants';
import { disconnectGoogleConnection, getGoogleConnectionStatus, googleAuthCallback, googleAuthStart, login, logout, register } from "@/controllers";
import express from "express";

const authRoutes= express.Router();

authRoutes.post('/login', login).post("/register",register).post("/logout",protectRoute,logout)
authRoutes.get('/google', googleAuthStart).get('/google/callback', googleAuthCallback)
authRoutes.get('/google/status', protectRoute, restrict(Role.Admin), getGoogleConnectionStatus)
authRoutes.delete('/google/connection', protectRoute, disconnectGoogleConnection)
// .post('/refresh-token',refreshToken);

export default authRoutes;
