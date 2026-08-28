import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import * as bcrypt from "bcrypt";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { Prisma, User, UserRole } from "@prisma/client";
import config from "../../../config";
import httpStatus from "http-status";
import { Request } from "express";
import { fileUploader } from "../../../helpars/fileUploader";
import { Secret } from "jsonwebtoken";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { generateUsername } from "../../../helpars/generateUsername";
import crypto from 'crypto';
import { accountRejectedEmail, generateOtpEmail } from "../../../shared/emailHTML";
import emailSender from "../../../shared/emailSender";
import { BOOLEAN_FIELDS, IUserFilterRequest, NUMBER_FIELDS, toBoolean, toNumber, userSearchAbleFields } from "./user.utils";

// Create a new user in the database.
const createUserIntoDb = async (data: any) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    if (existingUser.email === data.email) {
      throw new ApiError(
        400,
        `User with this email ${data.email} already exists`,
        "EMAIL_ALREADY_EXISTS"
      );
    }
  }

  const otp = Number(crypto.randomInt(1000, 9999));
  const expirationOtp = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  const hashedPassword: string = await bcrypt.hash(
    data.password,
    Number(config.bcrypt_salt_rounds)
  );

  const uniqueUsername = await generateUsername(data.fullName);

  const result = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      role: data.role,
      lat: data.lat,
      lon: data.lon,
      password: hashedPassword,
      userName: uniqueUsername,
      otp: otp,
      expirationOtp: expirationOtp
    },
  });

  // const token = jwtHelpers.generateToken(
  //   {
  //     id: result.id,
  //     email: result.email,
  //     role: result.role,
  //   },
  //   config.jwt.jwt_secret as Secret,
  //   config.jwt.expires_in as string
  // );

  const html = generateOtpEmail(otp);
  await emailSender(data.email, html, 'OTP Verification');
  return { message: "An OTP has been sent to your email. Please verify your account.", result };
};

//Reterive all users from the database also searcing and filetering
const getUserList = async (
  filters: IUserFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.UserWhereInput[] = [];

  andConditions.push({
    isDeleted: false,
  });

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...userSearchAbleFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
      ],
    });
  }

  if (Object.keys(filterData).length) {
    Object.keys(filterData).forEach((key) => {
      let value = (filterData as any)[key];
      if (value === "" || value === null || value === undefined) return;
      if (["createdAt", "updatedAt"].includes(key) && value) {
        const start = new Date(value);
        start.setHours(0, 0, 0, 0);
        const end = new Date(value);
        end.setHours(23, 59, 59, 999);
        andConditions.push({
          [key]: {
            gte: start.toISOString(),
            lte: end.toISOString(),
          },
        });
        return;
      }

      if (BOOLEAN_FIELDS.has(key)) {
        value = toBoolean(value);
        andConditions.push({ [key]: value });
        return;
      }

      if (NUMBER_FIELDS.has(key)) {
        value = toNumber(value);
        andConditions.push({ [key]: value });
        return;
      }

      if (key === "status") {
        const statuses = Array.isArray(value) ? value : [value];
        andConditions.push({
          status: { in: statuses },
        });
        return;
      }

      andConditions.push({ [key]: value });
    });
  }

  const whereConditons: Prisma.UserWhereInput = { AND: andConditions };

  const result = await prisma.user.findMany({
    skip,
    take: limit,
    where: whereConditons,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
          [options.sortBy]: options.sortOrder,
        }
        : {
          createdAt: "desc",
        },
  });

  const total = await prisma.user.count({
    where: whereConditons,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// Get user by id
const getUserById = async (id: string) => {

  const result = await prisma.user.findUnique({
    where: { id },
  });

  return result;
};

// update profile by user own profile uisng token
const updateProfile = async (req: any) => {
  const file = req.file;
  const data = req.body;
  let image = "";

  const existingUser = await prisma.user.findFirst({
    where: {
      id: req.user.id,
    },
  });

  if (!existingUser) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  if (file) {
    image = (await fileUploader.uploadToCloudinary(file)).Location;
  }

  const result = await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      fullName: data.fullName ?? existingUser.fullName,
      email: data.email ?? existingUser.email,
      phoneNumber: data.phoneNumber ?? existingUser.phoneNumber,
      profileImage: image ?? existingUser.profileImage,
      lat: data.lat ?? existingUser.lat,
      lon: data.lon ?? existingUser.lon,
    },
  });

  return result;
};

//Soft Delete
const deleteUser = async (id: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id },
      select: { email: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return tx.user.update({
      where: { id },
      data: {
        email: `deleted_${id}@deleted.local`,
        password: "DELETED",
        isDeleted: true,
        emailVerified: false,
        status: "DELETED",
      },
    });
  });

  return result;
};

// Temporarily block
const toggleBlock = async (
  userId: string,
  blockDays: number
) => {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new Error("User not found");
    }

    if (profile.isBlocked) {
      await tx.user.update({
        where: { id: userId },
        data: {
          isBlocked: false,
          status: "ACTIVE",
          suspendedUntil: null,
        },
      });

      return {
        action: "UNBLOCKED",
      };

    } else {

      const suspendedUntil = new Date(
        Date.now() + blockDays * 24 * 60 * 60 * 1000
      );

      await tx.user.update({
        where: { id: userId },
        data: {
          isBlocked: true,
          status: "SUSPENDED",
          suspendedUntil,
          fcmToken: null,
        },
      });

      return {
        action: "BLOCKED",
        blockedForDays: blockDays,
      };
    }
  });
};

// Upload photo
const uploadPhoto = async (req: any) => {
  const file = req.file;

  let imageUrl;

  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No file uploaded", "NO_FILE_UPLOADED");
  }

  const uploadResult = await fileUploader.uploadToCloudinary(file);
  imageUrl = uploadResult.Location;

  return imageUrl;
}

// Approve Owner
const approveUsers = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'This user is not found!', 'USER_NOT_FOUND');
  }

  const result = await prisma.user.update({
    where: { id },
    data: {
      status: "ACTIVE",
      isApproved: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: id,
      title: 'Account Approved',
      body: 'Your account has been approved by admin.',
    },
  });

  return result;
}

// Reject Owner
const rejectUsers = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'This user is not found!', 'USER_NOT_FOUND');
  }

  const html = accountRejectedEmail(user.fullName ?? 'User');
  emailSender(user.email, html, 'Application Rejected').catch(() => null);

  const result = await prisma.user.update({
    where: { id },
    data: {
      status: "REJECTED",
      email: `deleted_${id}@deleted.local`,
      password: "DELETED",
      isDeleted: true,
      emailVerified: false,
      isApproved: false,
      otp: null,
      expirationOtp: null
    },
  });

  return result;
}

export const userService = {
  createUserIntoDb,
  getUserList,
  getUserById,
  updateProfile,
  deleteUser,
  toggleBlock,
  uploadPhoto,
  approveUsers,
  rejectUsers
};
