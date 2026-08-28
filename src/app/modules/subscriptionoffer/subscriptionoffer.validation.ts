import { z } from 'zod';
import { Prisma, UserStatus } from '@prisma/client';

// Auto-generated from Prisma model: Subscriptionoffer
const createSchema = z.object({
  planName: z.string({
        required_error: "Plan Name is required",
        invalid_type_error: "Plan Name must be a text value"
      }).min(1, "Plan Name is required"),
  planType: z.string({
        required_error: "Plan Type is required",
        invalid_type_error: "Plan Type must be a text value"
      }).min(1, "Plan Type is required"),
  facilities: z.array(z.string({
        required_error: "Facilities is required",
        invalid_type_error: "Facilities must be a text value"
      }), {
      required_error: "Facilities is required",
      invalid_type_error: "Facilities must be an array"
    }).optional(),
  price: z.number({
        required_error: "Price is required",
        invalid_type_error: "Price must be a number"
      }),
  duration: z.number({
        required_error: "Duration is required",
        invalid_type_error: "Duration must be a number"
      }).int("Duration must be an integer"),
  details: z.string({
        required_error: "Details is required",
        invalid_type_error: "Details must be a text value"
      }).optional(),
  status: z.nativeEnum(UserStatus, {
    errorMap: () => ({ message: "Please select a valid Status" })
  }).optional(),
  isDeleted: z.boolean({
        required_error: "Is Deleted is required",
        invalid_type_error: "Is Deleted must be true/false"
      }).optional(),
}).strict();

const updateSchema = z.object({
  planName: z.string({
        required_error: "Plan Name is required",
        invalid_type_error: "Plan Name must be a text value"
      }).min(1, "Plan Name is required").optional(),
  planType: z.string({
        required_error: "Plan Type is required",
        invalid_type_error: "Plan Type must be a text value"
      }).min(1, "Plan Type is required").optional(),
  facilities: z.array(z.string({
        required_error: "Facilities is required",
        invalid_type_error: "Facilities must be a text value"
      }), {
      required_error: "Facilities is required",
      invalid_type_error: "Facilities must be an array"
    }).optional(),
  price: z.number({
        required_error: "Price is required",
        invalid_type_error: "Price must be a number"
      }).optional(),
  duration: z.number({
        required_error: "Duration is required",
        invalid_type_error: "Duration must be a number"
      }).int("Duration must be an integer").optional(),
  details: z.string({
        required_error: "Details is required",
        invalid_type_error: "Details must be a text value"
      }).optional(),
  status: z.nativeEnum(UserStatus, {
    errorMap: () => ({ message: "Please select a valid Status" })
  }).optional(),
  isDeleted: z.boolean({
        required_error: "Is Deleted is required",
        invalid_type_error: "Is Deleted must be true/false"
      }).optional(),
}).strict();

export const subscriptionofferValidation = {
  createSchema,
  updateSchema,
};