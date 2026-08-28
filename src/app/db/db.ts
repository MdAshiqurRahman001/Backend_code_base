import { UserRole } from "@prisma/client";
import prisma from "../../shared/prisma";
import * as bcrypt from "bcrypt";
import config from "../../config";

export const initiateSuperAdmin = async () => {
  const hashedPassword = await bcrypt.hash('12345678', Number(config.bcrypt_salt_rounds))
  const payload: any = {
    fullName: "Super Admin",
    email: "admin@gmail.com",
    password: hashedPassword,
    role: UserRole.ADMIN,
    emailVerified: true,
    status: "ACTIVE",
    isApproved: true,
    isProfileComplete: true,
  };

  const isExistUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isExistUser) {
    return isExistUser.id
  }

  if (!isExistUser) {
    const admin = await prisma.user.create({
      data: payload,
      select: {
        id: true
      }
    });
    return admin.id
  }
};
