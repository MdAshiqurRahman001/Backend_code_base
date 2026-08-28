import express from "express";
import { userRoutes } from "../modules/User/user.route";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { NotificationRoutes } from "../modules/notification/notification.routes";
import { subscriptionofferRoutes } from "../modules/subscriptionoffer/subscriptionoffer.routes";
import { usersubscriptionRoutes } from "../modules/usersubscription/usersubscription.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },

  {
    path: "/auth",
    route: AuthRoutes,
  },

  {
    path: "/notifications",
    route: NotificationRoutes,
  },

  {
    path: "/subscriptionoffers",
    route: subscriptionofferRoutes,
  },

  {
    path: "/usersubscriptions",
    route: usersubscriptionRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;