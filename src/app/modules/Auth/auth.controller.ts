import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { AuthServices } from "./auth.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body);
  res.cookie("token", result.token, { httpOnly: true });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  // Clear the token cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Successfully logged out",
    data: null,
  });
});

//Get user profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.getMyProfile(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User profile retrieved successfully",
    data: result,
  });
});

// Change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password changed successfully",
    data: result,
  });
});

// Forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.forgotPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email!",
    data: result
  })
});

//Resend OTP
const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.resendOtp(req.body.email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email!",
    data: result
  })
});

//Verify Forgot Password Otp
const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.verifyOtp(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Otp verified successfully!",
    data: result
  })
});

//ResetPassword 
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.resetPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password Reset!",
    data: null
  })
});

/* ===========================================================================================
 ************************************* SOCIAL LOGIN ******************************************
 * =========================================================================================== */

//Social Login

// Redirect to Google OAuth
const getGoogleAuthUrl = catchAsync(async (req: Request, res: Response) => {
  const role = req.query.role as UserRole;
  const url = AuthServices.getGoogleAuthUrl(role);
  console.log({ url });
  res.redirect(url);
});

// Google OAuth callback
const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const code = req.query.code;
  const state = req.query.state;

  console.log({ code })
  if (!code || typeof code !== 'string') {
    throw new Error('Authorization code not provided');
  }

  console.log(state);
  if (!state || typeof state !== "string") {
    throw new ApiError(httpStatus.BAD_REQUEST, "OAuth state not provided", "OAUTH_STATE_MISSING");
  }

  const result = await AuthServices.googleCallback(code, state);

  // sendResponse(res, {
  //   statusCode: httpStatus.OK,
  //   success: true,
  //   message: "User logged in successfully",
  //   data: result
  // })

  const frontendUrl = `${process.env.FRONTEND_BASE_URL}/auth/google/callback?token=${result.token}`;
  res.redirect(frontendUrl);
});

// Token-based Google login (for mobile)
const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.googleLogin(req.body.token);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

// Redirect to Facebook OAuth
const getFacebookAuthUrl = catchAsync(async (req: Request, res: Response) => {
  const url = AuthServices.getFacebookAuthUrl();
  res.redirect(url);
});

// Facebook OAuth callback
const facebookCallback = catchAsync(async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    throw new Error('Authorization code not provided');
  }
  const result = await AuthServices.facebookCallback(code);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result
  })
  const frontendUrl = `${process.env.FRONTEND_BASE_URL}/auth/facebook/callback?token=${result.token}`;
  res.redirect(frontendUrl);
});

// Token-based Facebook login (for mobile)
const facebookLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.facebookLogin(req.body.token);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

export const AuthController = {
  loginUser,
  logoutUser,
  getMyProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  resendOtp,
  verifyOtp,

  // Social Login
  getGoogleAuthUrl,
  googleCallback,
  googleLogin,
  getFacebookAuthUrl,
  facebookCallback,
  facebookLogin,
};
