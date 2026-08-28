import express from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


import validateRequest from "../../middlewares/validateRequest";
import { authValidation } from "./auth.validation";

const router = express.Router();

router.post("/login", validateRequest(authValidation.createSchema), AuthController.loginUser);

router.post("/logout", AuthController.logoutUser);

router.get("/profile", auth(), AuthController.getMyProfile);

router.put("/change-password", auth(), validateRequest(authValidation.changePasswordValidationSchema), AuthController.changePassword);

router.post('/forgot-password', AuthController.forgotPassword);

router.post('/resend-otp', AuthController.resendOtp);

router.post('/verify-otp', AuthController.verifyOtp);

router.post('/reset-password', AuthController.resetPassword);

/* ===========================================================================================
 ************************************* SOCIAL LOGIN ******************************************
 * =========================================================================================== */

//Google login

// OAuth redirect routes (for web)
router.get("/google", AuthController.getGoogleAuthUrl);

// OAuth callback route
router.get("/google/callback", AuthController.googleCallback);

// Token-based login routes (for mobile apps)
router.post("/google-login", AuthController.googleLogin);

//Facebook login

// OAuth redirect routes (for web)
router.get("/facebook", AuthController.getFacebookAuthUrl);

// OAuth callback route
router.get("/facebook/callback", AuthController.facebookCallback);

// Token-based login routes (for mobile apps)
router.post("/facebook-login", AuthController.facebookLogin);

export const AuthRoutes = router;