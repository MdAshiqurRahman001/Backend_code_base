import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

import { usersubscriptionController } from './usersubscription.controller';

import validateRequest from "../../middlewares/validateRequest";
import { usersubscriptionValidation } from "./usersubscription.validation";

const router = express.Router();

router.post('/', auth(), validateRequest(usersubscriptionValidation.createSchema), usersubscriptionController.createUsersubscription);
router.post('/:id', auth(), validateRequest(usersubscriptionValidation.createSchema), usersubscriptionController.createUsersubscription);

router.get('/', auth(), usersubscriptionController.getUsersubscriptionList);

router.get('/get/by/userId', auth(), usersubscriptionController.getUsersubscriptionByUserId);

router.put('/:id', auth(), validateRequest(usersubscriptionValidation.updateSchema), usersubscriptionController.updateUsersubscription);

router.put('/cancel/:id', auth(), usersubscriptionController.cancelUsersubscription);

export const usersubscriptionRoutes = router;