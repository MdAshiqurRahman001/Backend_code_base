import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { Prisma, UserRole } from "@prisma/client";
import { BOOLEAN_FIELDS, ISubscriptionofferFilterRequest, NUMBER_FIELDS, subscriptionofferSearchAbleFields, toBoolean, toNumber } from "./subscriptionoffer.utils";

// create Subscriptionoffer
const createSubscriptionoffer = async (data: any, userId: string) => {

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: UserRole.ADMIN,
      isDeleted: false,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');
  }

  const result = await prisma.subscriptionoffer.create({
    data: {
      createdBy: userId,
      planName: data.planName,
      planType: data.planType,
      facilities: data.facilities,
      details: data.details,
      price: data.price,
      duration: data.duration
    }
  });

  return result;
};

// get all Subscriptionoffer
const getSubscriptionofferList = async (
  options: IPaginationOptions,
  filters: ISubscriptionofferFilterRequest
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.SubscriptionofferWhereInput[] = [];
  const rangeConditions: Record<string, { gte?: number; lte?: number }> = {};

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...subscriptionofferSearchAbleFields.map((field) => ({
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
      if (BOOLEAN_FIELDS.has(key)) {
        value = toBoolean(value);
        andConditions.push({ [key]: value });
        return;
      }
      if (key.endsWith("Min")) {
        const baseField = key.replace(/Min$/, "");
        value = toNumber(value);
        if (NUMBER_FIELDS.has(baseField)) {
          rangeConditions[baseField] = {
            ...(rangeConditions[baseField] || {}),
            gte: value,
          };
        }
        return;
      }

      if (key.endsWith("Max")) {
        const baseField = key.replace(/Max$/, "");
        value = toNumber(value);
        if (NUMBER_FIELDS.has(baseField)) {
          rangeConditions[baseField] = {
            ...(rangeConditions[baseField] || {}),
            lte: value,
          };
        }
        return;
      }

      if (NUMBER_FIELDS.has(key)) {
        value = toNumber(value);
        andConditions.push({ [key]: value });
        return;
      }

      if (["createdAt"].includes(key) && value) {
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

      // if (key === "status") {
      //   const statuses = Array.isArray(value) ? value : [value];
      //   andConditions.push({
      //     status: { in: statuses },
      //   });
      //   return;
      // }

      andConditions.push({ [key]: value });
    });
  }
  Object.keys(rangeConditions).forEach((field) => {
    andConditions.push({
      [field]: rangeConditions[field],
    });
  });

  const whereConditions: Prisma.SubscriptionofferWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.subscriptionoffer.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.subscriptionoffer.count({ where: whereConditions });

  return {
    meta: { total, page, limit },
    data: result,
  };
};

// get Subscriptionoffer by user id
const getSubscriptionofferByUserId = async (userId: string) => {

  const result = await prisma.subscriptionoffer.findMany({ where: { createdBy: userId } });

  return result;
};

// update Subscriptionoffer
const updateSubscriptionoffer = async (id: string, data: any) => {

  const existingSubscriptionoffer = await prisma.subscriptionoffer.findUnique({ where: { id } });

  if (!existingSubscriptionoffer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscriptionoffer not found or access denied', 'SUBSCRIPTION_OFFER_NOT_FOUND');
  }

  const result = await prisma.subscriptionoffer.update({
    where: { id },
    data: {
      planName: data.planName ?? existingSubscriptionoffer.planName,
      planType: data.planType ?? existingSubscriptionoffer.planType,
      facilities: data.facilities ?? existingSubscriptionoffer.facilities,
      details: data.details ?? existingSubscriptionoffer.details,
      price: data.price ?? existingSubscriptionoffer.price,
      duration: data.duration ?? existingSubscriptionoffer.duration
    }
  });

  return result;
};

// delete Subscriptionoffer
const deleteSubscriptionoffer = async (id: string) => {

  const result = await prisma.subscriptionoffer.delete({ where: { id } });

  return result;
};

export const subscriptionofferService = {
  createSubscriptionoffer,
  getSubscriptionofferList,
  getSubscriptionofferByUserId,
  updateSubscriptionoffer,
  deleteSubscriptionoffer,
};