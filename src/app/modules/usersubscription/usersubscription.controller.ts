import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { usersubscriptionService } from './usersubscription.service';
import { Request, Response } from 'express';
import pick from '../../../shared/pick';
import { usersubscriptionFilterableFields } from './usersubscription.utils';

// create Usersubscription
const createUsersubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await usersubscriptionService.createUsersubscription(req.params.id, req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Usersubscription created successfully',
    data: result,
  });
});

// get all Usersubscription
const getUsersubscriptionList = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, usersubscriptionFilterableFields);
  const result = await usersubscriptionService.getUsersubscriptionList(options, filters);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Usersubscription list retrieved successfully',
    data: result,
  });
});

// get Usersubscription by userId
const getUsersubscriptionByUserId = catchAsync(async (req: Request, res: Response) => {
  const result = await usersubscriptionService.getUsersubscriptionByUserId(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Usersubscription details retrieved successfully',
    data: result,
  });
});

// update Usersubscription
const updateUsersubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await usersubscriptionService.updateUsersubscription(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Usersubscription updated successfully',
    data: result,
  });
});

// delete Usersubscription
const cancelUsersubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await usersubscriptionService.cancelUsersubscription(req.params.id, req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Usersubscription cancelled successfully',
    data: result,
  });
});

export const usersubscriptionController = {
  createUsersubscription,
  getUsersubscriptionList,
  getUsersubscriptionByUserId,
  updateUsersubscription,
  cancelUsersubscription,
};