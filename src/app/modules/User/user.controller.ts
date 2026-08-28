import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";
import { Request, Response } from "express";
import pick from "../../../shared/pick";
import { userFilterableFields } from "./user.utils";

// create user
const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUserIntoDb(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User Registered successfully!",
    data: result,
  });
});

// get all user form db
const getUserList = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
  const result = await userService.getUserList(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieve successfully!",
    data: result,
  });
});


// get user by id
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getUserById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieve successfully!",
    data: result,
  });
});

// Update userProfile form db
const updateProfile = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await userService.updateProfile(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully!",
    data: result,
  });
});

//Soft Delete
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.deleteUser(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully!",
    data: result,
  });
});

// Toggle Block
const toggleBlock = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.toggleBlock(req.params.id, req.body.blockDays);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.action === "BLOCKED" ? "User Blocked successfully!" : "User Unblocked successfully!",
    data: result,
  });
});

// Upload Photo for Websocket
const uploadPhoto = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.uploadPhoto(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Photo uploaded successfully!",
    data: result,
  });
});

//Approve Users
const approveUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.approveUsers(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User approved successfully!",
    data: result,
  });
});

//Reject Users
const rejectUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.rejectUsers(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User rejected successfully!",
    data: result,
  });
});

export const userController = {
  createUser,
  getUserList,
  getUserById,
  updateProfile,
  deleteUser,
  toggleBlock,
  uploadPhoto,
  approveUsers,
  rejectUsers
};
