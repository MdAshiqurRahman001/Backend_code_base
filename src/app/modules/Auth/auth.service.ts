import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import * as bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiErrors";
import emailSender from "../../../shared/emailSender";
import { SocialProviderEnum, UserRole, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import crypto from 'crypto';
import axios from "axios";
import { generateOtpEmail, forgetPasswordEmail, resendOtpEmail } from "../../../shared/emailHTML";

// user login
const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData?.email || !userData?.password) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found! with this email " + payload.email,
      "USER_NOT_FOUND"
    );
  }

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect!", "INVALID_PASSWORD");
  }

  if (!userData.emailVerified) {
    const otp = Number(crypto.randomInt(1000, 9999));
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: userData.id },
      data: {
        otp,
        expirationOtp: otpExpiry,
      },
    });

    const html = generateOtpEmail(otp);
    await emailSender(userData.email, html, "OTP Verification");

    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Email not verified. A new OTP has been sent to your email.",
      "EMAIL_NOT_VERIFIED"
    );
  }

  if (userData.status === UserStatus.INACTIVE) {
    await prisma.user.update({
      where: { id: userData.id },
      data: {
        status: UserStatus.ACTIVE,
      },
    });
  }

  await prisma.user.update({
    where: { id: userData.id },
    data: {
      lastLoginAt: new Date(),
    },
  });

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return { userId: userData.id, email: userData.email, emailVerified: userData.emailVerified, role: userData.role, token: accessToken };
};

// get user profile
const getMyProfile = async (userId: string) => {
  const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      userName: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      coverImage: true,
      role: true,
      status: true,
      emailVerified: true,
      isBlocked: true,
      isDeleted: true,
      isApproved: true,
      isProfileComplete: true,
      lat: true,
      lon: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!userProfile) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found", "USER_NOT_FOUND");
  }

  return userProfile;
};

// change password
const changePassword = async (
  userId: string,
  newPassword: string,
  oldPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.password) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found", "USER_NOT_FOUND");
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect old password", "INVALID_OLD_PASSWORD");
  }

  const saltRounds = Number(config.bcrypt_salt_rounds) || 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password changed successfully" };
};

//Forgot Password 
const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findFirstOrThrow({
    where: {
      email: payload.email,
    },
  });

  const otp = Number(crypto.randomInt(1000, 9999));

  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  const html = forgetPasswordEmail(otp);

  await emailSender(userData.email, html, 'Forgot Password OTP',);

  await prisma.user.update({
    where: { id: userData.id },
    data: {
      otp: otp,
      expirationOtp: otpExpires,
    },
  });

  return { message: 'Reset password OTP sent to your email successfully' };
};

//Resend Otp 
const resendOtp = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'This user is not found!', 'USER_NOT_FOUND');
  }

  const otp = Number(crypto.randomInt(1000, 9999));

  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  const html = resendOtpEmail(otp);

  await emailSender(user.email, html, 'Resend OTP');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp: otp,
      expirationOtp: otpExpires,
    },
  });

  return { message: 'OTP resent successfully' };
};

//verify Forgot Password Otp
const verifyOtp = async (payload: {
  email: string;
  otp: number;
}) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'This user is not found!', 'USER_NOT_FOUND');
  }

  if (
    user.otp !== payload.otp ||
    !user.expirationOtp ||
    user.expirationOtp < new Date()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP', 'INVALID_OTP');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      status: 'ACTIVE',
      otp: null,
      expirationOtp: null,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return { message: 'OTP verification successful', Token: accessToken };
};

// reset password
const resetPassword = async (payload: { password: string; email: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'This user is not found!', 'USER_NOT_FOUND');
  }

  if (user.otp !== null || user.expirationOtp !== null) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Please verify your OTP before resetting your password', 'OTP_VERIFICATION_REQUIRED');
  }

  const saltRounds = Number(config.bcrypt_salt_rounds) || 12;
  const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

  await prisma.user.update({
    where: { email: payload.email },
    data: { password: hashedPassword },
  });

  return { message: 'Password reset successfully' };
};

/* ===========================================================================================
 ************************************* SOCIAL LOGIN ******************************************
 * =========================================================================================== */
import { OAuth2Client } from "google-auth-library";
import { ALLOWED_GOOGLE_ROLES, signState, verifyState } from "../../../helpars/googleLoginUtils";

const googleClient = new OAuth2Client(
  config.google_client_id,
  config.google_client_secret,
  config.google_callback_url
);

// Generate Google OAuth URL
const getGoogleAuthUrl = (role: UserRole) => {
  if (!ALLOWED_GOOGLE_ROLES.includes(role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid role. Allowed roles: ${ALLOWED_GOOGLE_ROLES.join(", ")}`,
      "INVALID_ROLE"
    );
  }

  const state = signState({
    role,
    nonce: crypto.randomUUID(),
  });

  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
    state,
  });

  return url;
};

// Handle Google OAuth callback
const googleCallback = async (code: string, state: string) => {

  let roleFromState: UserRole;

  try {
    const decoded = verifyState(state);
    roleFromState = decoded.role;
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid/expired OAuth state", "INVALID_OAUTH_STATE");
  }

  const { tokens } = await googleClient.getToken(code);
  googleClient.setCredentials(tokens);

  if (!tokens.id_token) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Google login failed (missing id_token)", "GOOGLE_MISSING_ID_TOKEN");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Google login failed", "GOOGLE_MISSING_EMAIL");
  }

  const { sub, email, name, picture } = payload;

  let socialAccount = await prisma.socialAccount.findUnique({
    where: {
      provider_providerId: {
        provider: SocialProviderEnum.GOOGLE,
        providerId: sub,
      },
    },
  });

  let user = null as any;

  if (socialAccount) {
    user = await prisma.user.findUnique({
      where: { id: socialAccount.userId },
    });

    if (!user) {
      await prisma.socialAccount.delete({ where: { id: socialAccount.id } });
      socialAccount = null;
    }
  }

  if (!socialAccount) {

    user = await prisma.user.findUnique({ where: { email } });

    if (!user) {

      // const isUser = roleFromState === "USER";

      user = await prisma.user.create({
        data: {
          email,
          fullName: name ?? null,
          profileImage: picture ?? null,
          isSocialLogin: true,
          emailVerified: true,
          role: roleFromState,

          // // Auto-complete + Auto-approve
          // isProfileComplete: isUser ? true : false,
          // isApproved: isUser ? true : false,
        },
      });
    }
    // ✅ if user exists by email, DO NOT overwrite role using state (avoid escalation)

    // link social account
    socialAccount = await prisma.socialAccount.create({
      data: {
        provider: SocialProviderEnum.GOOGLE,
        providerId: sub,
        userId: user.id,
      },
    });
  }

  // final guarantee: load user if still null
  if (!user) {
    user = await prisma.user.findUnique({ where: { id: socialAccount.userId } });
    if (!user) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "User not found after social login", "SOCIAL_LOGIN_USER_NOT_FOUND");
    }
  }

  // update lastLoginAt (optional but useful)
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return { user, token };
};

// Token-based Google login (for mobile apps)
const googleLogin = async (token: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: config.google_client_id,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Google login failed", "GOOGLE_LOGIN_FAILED");
  }

  const { sub, email, name, picture } = payload;

  let socialAccount = await prisma.socialAccount.findUnique({
    where: {
      provider_providerId: {
        provider: "GOOGLE",
        providerId: sub,
      },
    },
    include: { user: true },
  });

  let user;

  if (!socialAccount) {
    user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: name,
          profileImage: picture,
          isSocialLogin: true,
          emailVerified: true,
        },
      });
    }

    socialAccount = await prisma.socialAccount.create({
      data: {
        provider: "GOOGLE",
        providerId: sub,
        userId: user.id,
      },
      include: { user: true },
    });
  }

  const jwtToken = jwtHelpers.generateToken(
    {
      id: socialAccount.user.id,
      email: socialAccount.user.email as string,
      role: socialAccount.user.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    user: socialAccount.user,
    token: jwtToken,
  };
};

// Generate Facebook OAuth URL
const getFacebookAuthUrl = () => {
  const fbAppId = config.facebook_app_id;
  const redirectUri = `${config.facebook_callback_url}`;
  const scope = 'email,public_profile';

  return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
};

// Handle Facebook OAuth callback
const facebookCallback = async (code: string) => {
  const fbAppId = `${config.facebook_app_id}`;
  const fbAppSecret = `${config.facebook_app_secret}`;
  const redirectUri = `${config.facebook_callback_url}`;

  // Exchange code for access token
  const tokenResponse = await axios.get(
    `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${fbAppSecret}&code=${code}`
  );

  const accessToken = tokenResponse.data.access_token;

  // Get user info
  let fbRes;
  try {
    fbRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`,
    );
  } catch (error: any) {
    console.error("Facebook API Error:", error.response?.data || error.message);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error.response?.data?.error?.message || "Invalid Facebook access token",
      "FACEBOOK_LOGIN_FAILED"
    );
  }

  const { id, email, name, picture } = fbRes.data;
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Facebook login failed", "FACEBOOK_MISSING_ID");
  }

  if (!email) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Email is required. Please grant email permission.",
      "FACEBOOK_EMAIL_REQUIRED"
    );
  }

  let socialAccount = await prisma.socialAccount.findUnique({
    where: {
      provider_providerId: {
        provider: "FACEBOOK",
        providerId: id,
      },
    },
    include: { user: true },
  });

  let user;

  if (!socialAccount) {
    user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: name,
          profileImage: picture?.data?.url,
          isSocialLogin: true,
          emailVerified: true,
        },
      });
    } else {
      if (user.isSocialLogin === false) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Please login with email and password",
          "SOCIAL_LOGIN_CONFLICT"
        );
      }
    }

    socialAccount = await prisma.socialAccount.create({
      data: {
        provider: "FACEBOOK",
        providerId: id,
        userId: user.id,
      },
      include: { user: true },
    });
  } else {
    user = socialAccount.user;
  }

  const jwtToken = jwtHelpers.generateToken(
    {
      id: socialAccount.user.id,
      email: socialAccount.user.email as string,
      role: socialAccount.user.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    token: jwtToken,
    user: user,
  };
};

// Token-based Facebook login (for mobile apps)
const facebookLogin = async (token: string) => {
  let fbRes;
  try {
    fbRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
    );
  } catch (error: any) {
    console.error("Facebook API Error:", error.response?.data || error.message);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error.response?.data?.error?.message || "Invalid Facebook access token",
      "FACEBOOK_TOKEN_INVALID"
    );
  }

  const { id, email, name, picture } = fbRes.data;
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Facebook login failed", "FACEBOOK_MISSING_ID_TOKEN");
  }

  if (!email) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Email is required. Please grant email permission.",
      "FACEBOOK_EMAIL_REQUIRED_TOKEN"
    );
  }

  let socialAccount = await prisma.socialAccount.findUnique({
    where: {
      provider_providerId: {
        provider: "FACEBOOK",
        providerId: id,
      },
    },
    include: { user: true },
  });

  let user;

  if (!socialAccount) {
    user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: name,
          profileImage: picture?.data?.url,
          isSocialLogin: true,
          emailVerified: true,
        },
      });
    } else {
      if (user.isSocialLogin === false) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Please login with email and password",
          "SOCIAL_LOGIN_CONFLICT_TOKEN"
        );
      }
    }

    socialAccount = await prisma.socialAccount.create({
      data: {
        provider: "FACEBOOK",
        providerId: id,
        userId: user.id,
      },
      include: { user: true },
    });
  } else {
    user = socialAccount.user;
  }

  const jwtToken = jwtHelpers.generateToken(
    {
      id: socialAccount.user.id,
      email: socialAccount.user.email as string,
      role: socialAccount.user.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    token: jwtToken,
    user: user,
  };
};

export const AuthServices = {
  loginUser,
  getMyProfile,
  changePassword,
  forgotPassword,
  resendOtp,
  verifyOtp,
  resetPassword,

  // Social Login
  getGoogleAuthUrl,
  googleCallback,
  googleLogin,
  getFacebookAuthUrl,
  facebookCallback,
  facebookLogin,
};
