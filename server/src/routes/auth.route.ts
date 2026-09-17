import { protectRoute } from '@/middlewares';
import { googleAuthCallback, googleAuthStart, login, logout, register } from "@/controllers";
import express from "express";

const authRoutes= express.Router();

authRoutes.post('/login', login).post("/register",register).post("/logout",protectRoute,logout)
authRoutes.get('/google', googleAuthStart).get('/google/callback', googleAuthCallback)
// .post('/refresh-token',refreshToken);

export default authRoutes;
