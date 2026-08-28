import jwt from "jsonwebtoken";
import config from "../config";
import { UserRole } from "@prisma/client";

export type GoogleState = { role: UserRole; nonce: string };

export const ALLOWED_GOOGLE_ROLES: UserRole[] = ["USER"];

export const signState = (payload: GoogleState) =>
    jwt.sign(payload, config.jwt.jwt_secret as string, { expiresIn: "10m" });

export const verifyState = (state: string): GoogleState =>
    jwt.verify(state, config.jwt.jwt_secret as string) as GoogleState;