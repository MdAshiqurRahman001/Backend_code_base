import { NextFunction, Request, Response } from "express";

import { JwtPayload, Secret } from "jsonwebtoken";
import config from "../../config";

import httpStatus from "http-status";
import ApiError from "../../errors/ApiErrors";
import { jwtHelpers } from "../../helpars/jwtHelpers";
import prisma from "../../shared/prisma";

const optionalAuth = (...roles: string[]) => {
    return async (
        req: Request & { user?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const token = req.headers.authorization;

            if (!token) {
                req.user = null;
                return next();
            }

            const verifiedUser = jwtHelpers.verifyToken(
                token,
                config.jwt.jwt_secret as Secret
            );
            const { id, role, iat } = verifiedUser;

            const user = await prisma.user.findUnique({
                where: {
                    id: id,
                },
            });

            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, "User not found!", "USER_NOT_FOUND");
            }

            if (user.status === "SUSPENDED") {
                const now = new Date();
                if (user.suspendedUntil && now < new Date(user.suspendedUntil)) {
                    throw new ApiError(403, `Account suspended until ${user.suspendedUntil}`, "ACCOUNT_SUSPENDED");
                }

                // Auto-reactivate after suspension ends
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        status: "ACTIVE",
                        suspendedUntil: null,
                    },
                });
            }

            if (user.status === "BLOCKED") {
                throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked!", "ACCOUNT_BLOCKED");
            }

            req.user = verifiedUser as JwtPayload;

            if (roles.length && !roles.includes(verifiedUser.role)) {
                throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!", "FORBIDDEN");
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};

export default optionalAuth;