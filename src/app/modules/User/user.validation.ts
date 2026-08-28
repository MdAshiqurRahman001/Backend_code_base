import { z } from 'zod';
import { Prisma, UserRole, UserStatus } from '@prisma/client';

// Auto-generated from Prisma model: User
const createSchema = z.object({
  fullName: z.string({
    required_error: "Full Name is required",
    invalid_type_error: "Full Name must be a text value"
  }).optional(),
  userName: z.string({
    required_error: "User Name is required",
    invalid_type_error: "User Name must be a text value"
  }).optional(),
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a text value"
  }).min(1, "Email is required"),
  phoneNumber: z.string({
    required_error: "Phone Number is required",
    invalid_type_error: "Phone Number must be a text value"
  }).optional(),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a text value"
  }).optional(),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Please select a valid Role" })
  }).optional(),
  lat: z.number({
    required_error: "Lat is required",
    invalid_type_error: "Lat must be a number"
  }).optional(),
  lon: z.number({
    required_error: "Lon is required",
    invalid_type_error: "Lon must be a number"
  }).optional(),
}).strict();

const updateSchema = z.object({
  fullName: z.string({
    required_error: "Full Name is required",
    invalid_type_error: "Full Name must be a text value"
  }).optional(),
  userName: z.string({
    required_error: "User Name is required",
    invalid_type_error: "User Name must be a text value"
  }).optional(),
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a text value"
  }).min(1, "Email is required").optional(),
  phoneNumber: z.string({
    required_error: "Phone Number is required",
    invalid_type_error: "Phone Number must be a text value"
  }).optional(),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a text value"
  }).optional(),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Please select a valid Role" })
  }).optional(),
  lat: z.number({
    required_error: "Lat is required",
    invalid_type_error: "Lat must be a number"
  }).optional(),
  lon: z.number({
    required_error: "Lon is required",
    invalid_type_error: "Lon must be a number"
  }).optional(),
}).strict();

export const userValidation = {
  createSchema,
  updateSchema,
};