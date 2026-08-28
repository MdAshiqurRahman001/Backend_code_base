import { z } from 'zod';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';

// Auto-generated from Prisma model: Usersubscription
const createSchema = z.object({
  subscriptionOfferId: z.string({
    required_error: "Subscription Offer Id is required",
    invalid_type_error: "Subscription Offer Id must be a text value"
  }).regex(/^[0-9a-fA-F]{24}$/, "Invalid Subscription Offer Id").optional(),
  paymentId: z.string({
        required_error: "Payment Id is required",
        invalid_type_error: "Payment Id must be a text value"
      }).min(1, "Payment Id is required"),
}).strict();

const updateSchema = z.object({
  paymentId: z.string({
        required_error: "Payment Id is required",
        invalid_type_error: "Payment Id must be a text value"
      }).min(1, "Payment Id is required").optional(),
  endDate: z.coerce.date({
        required_error: "End Date is required",
        invalid_type_error: "Please provide a valid End Date"
      }).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus, {
    errorMap: () => ({ message: "Please select a valid Payment Status" })
  }).optional(),
  status: z.nativeEnum(SubscriptionStatus, {
    errorMap: () => ({ message: "Please select a valid Status" })
  }).optional(),
}).strict();

export const usersubscriptionValidation = {
  createSchema,
  updateSchema,
};