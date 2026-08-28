// Notification.controller: Module file for the Notification.controller functionality.
import { notificationService } from './notification.service';
import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import pick from '../../../shared/pick';

const sendNotificationToUser = catchAsync(async (req: Request, res: Response) => {
  await notificationService.sendNotification(req.body.title, req.body.body, req.body.userId, req.body.deviceToken);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification sent successfully',
    data: null,
  });
});

const getAllNotificationsController = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const notifications = await notificationService.getAllNotifications(options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All notifications fetched successfully',
    data: notifications,
  });
});

const getNotificationByUserIdController = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const notifications = await notificationService.getNotificationByUserId(req.user.id, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications fetched successfully',
    data: notifications,
  });
});

const getAllUnreadNotificationsByUser = catchAsync(async (req: Request, res: Response) => {
  const notifications = await notificationService.getAllUnreadNotificationsByUser(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unread notifications fetched successfully',
    data: notifications,
  });
});

const readNotificationByUserIdController = catchAsync(async (req: Request, res: Response) => {
  const notifications = await notificationService.readNotificationByUserId(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications marked as read successfully',
    data: notifications,
  });
});

const sendNotificationToGroup = catchAsync(async (req: Request, res: Response) => {
  const result = await notificationService.sendNotificationToGroup(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification sent successfully',
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await notificationService.deleteNotification(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification deleted successfully',
    data: result,
  });
});

export const NotificationController = {
  sendNotificationToUser,
  getAllNotificationsController,
  getNotificationByUserIdController,
  getAllUnreadNotificationsByUser,
  readNotificationByUserIdController,
  sendNotificationToGroup,
  deleteNotification
};
