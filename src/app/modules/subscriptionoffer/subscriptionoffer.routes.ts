import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

import { subscriptionofferController } from './subscriptionoffer.controller';

import validateRequest from "../../middlewares/validateRequest";
import { subscriptionofferValidation } from "./subscriptionoffer.validation";

const router = express.Router();

router.post('/', auth(UserRole.ADMIN), validateRequest(subscriptionofferValidation.createSchema), subscriptionofferController.createSubscriptionoffer);

router.get('/', auth(), subscriptionofferController.getSubscriptionofferList);

router.get('/get/by/userId', auth(), subscriptionofferController.getSubscriptionofferByUserId);

router.put('/:id', auth(UserRole.ADMIN), validateRequest(subscriptionofferValidation.updateSchema), subscriptionofferController.updateSubscriptionoffer);

router.delete('/:id', auth(UserRole.ADMIN), subscriptionofferController.deleteSubscriptionoffer);

export const subscriptionofferRoutes = router;