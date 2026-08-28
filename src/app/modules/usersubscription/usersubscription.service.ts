import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { PaymentStatus, Prisma, SubscriptionStatus, UserStatus } from "@prisma/client";
import { addMonths, IUsersubscriptionFilterRequest, NUMBER_FIELDS, toNumber, usersubscriptionSearchAbleFields } from "./usersubscription.utils";

// create Usersubscription
const createUsersubscription = async (subscriptionOfferId: string, userId: string, data: any) => {
  const subscriptionOffer = await prisma.subscriptionoffer.findUnique({
    where: { id: subscriptionOfferId },
  });

  if (!subscriptionOffer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subscription offer not found", "SUBSCRIPTION_OFFER_NOT_FOUND");
  }

  if (subscriptionOffer.isDeleted || subscriptionOffer.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Subscription offer is not available", "SUBSCRIPTION_OFFER_UNAVAILABLE");
  }

  // 🛑 Check if user already has an active subscription
  const existingSubscription = await prisma.usersubscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gte: new Date() },
    },
  });

  if (existingSubscription) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You already have an Active subscription. Please wait until it expires or Cancel your current subscription to subscribe to a new plan.",
      "SUBSCRIPTION_ALREADY_ACTIVE"
    );
  }

  const monthsToAdd = 1;
  const startDate = new Date();
  const endDate = addMonths(startDate, monthsToAdd);
  const duration = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const result = await prisma.usersubscription.create({
    data: {
      userId,
      subscriptionOfferId,
      paymentId: data.paymentId,
      startDate,
      endDate,
      duration,
      paymentStatus: PaymentStatus.PAID,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User subscription not created", "SUBSCRIPTION_CREATION_FAILED");
  }

  return result;
};

// get all Usersubscription
const getUsersubscriptionList = async (
  options: IPaginationOptions,
  filters: IUsersubscriptionFilterRequest
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.UsersubscriptionWhereInput[] = [];
  const rangeConditions: Record<string, { gte?: number; lte?: number }> = {};

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...usersubscriptionSearchAbleFields.map((field) => ({
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

  const whereConditions: Prisma.UsersubscriptionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.usersubscription.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.usersubscription.count({ where: whereConditions });

  return {
    meta: { total, page, limit },
    data: result,
  };
};

// get Usersubscription by user id
const getUsersubscriptionByUserId = async (userId: string) => {
  return prisma.usersubscription.findMany({
    where: { userId, status: SubscriptionStatus.ACTIVE },
    include: { subscriptionOffer: true },
    orderBy: { createdAt: "desc" },
  });
};

// update Usersubscription
const updateUsersubscription = async (id: string, data: any) => {

  const existingUsersubscription = await prisma.usersubscription.findUnique({ where: { id } });

  if (!existingUsersubscription) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Usersubscription not found', 'SUBSCRIPTION_NOT_FOUND');
  }

  const result = await prisma.usersubscription.update({
    where: { id },
    data
  });

  return result;
};

// delete Usersubscription
const cancelUsersubscription = async (id: string, userId: string) => {
  const existingSubscription = await prisma.usersubscription.findFirst({
    where: { id, userId },
  });

  if (!existingSubscription) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Usersubscription not found', 'SUBSCRIPTION_NOT_FOUND_FOR_USER');
  }

  if (existingSubscription.status !== SubscriptionStatus.ACTIVE) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only active subscriptions can be cancelled', 'SUBSCRIPTION_NOT_ACTIVE');
  }

  const result = await prisma.usersubscription.update({
    where: {
      id,
    },
    data: {
      status: SubscriptionStatus.CANCELLED,
      paymentStatus: PaymentStatus.CANCELLED,
      endDate: new Date(),
    }
  });

  return result;
};

export const usersubscriptionService = {
  createUsersubscription,
  getUsersubscriptionList,
  getUsersubscriptionByUserId,
  updateUsersubscription,
  cancelUsersubscription,
};