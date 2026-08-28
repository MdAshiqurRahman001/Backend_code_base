import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { subscriptionofferService } from './subscriptionoffer.service';
import { Request, Response } from 'express';
import pick from '../../../shared/pick';
import { subscriptionofferFilterableFields } from './subscriptionoffer.utils';

// create Subscriptionoffer
const createSubscriptionoffer = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionofferService.createSubscriptionoffer(req.body, req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscriptionoffer created successfully',
    data: result,
  });
});

// get all Subscriptionoffer
const getSubscriptionofferList = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, subscriptionofferFilterableFields);
  const result = await subscriptionofferService.getSubscriptionofferList(options, filters);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscriptionoffer list retrieved successfully',
    data: result,
  });
});

// get Subscriptionoffer by userId
const getSubscriptionofferByUserId = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionofferService.getSubscriptionofferByUserId(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscriptionoffer details retrieved successfully',
    data: result,
  });
});

// update Subscriptionoffer
const updateSubscriptionoffer = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionofferService.updateSubscriptionoffer(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscriptionoffer updated successfully',
    data: result,
  });
});

// delete Subscriptionoffer
const deleteSubscriptionoffer = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionofferService.deleteSubscriptionoffer(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscriptionoffer deleted successfully',
    data: result,
  });
});

export const subscriptionofferController = {
  createSubscriptionoffer,
  getSubscriptionofferList,
  getSubscriptionofferByUserId,
  updateSubscriptionoffer,
  deleteSubscriptionoffer,
};