import express from "express";
import { userController } from "./user.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpars/fileUploader";
import { generateSupportMessageEmail } from "../../../shared/emailHTML";
import emailSender from "../../../shared/emailSender";
import config from "../../../config";
import { userValidation } from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

// *!register user
router.post("/", validateRequest(userValidation.createSchema), userController.createUser);

// Get all  user
router.get("/", userController.getUserList);

// Get user by id
router.get("/:id", userController.getUserById);

// Update user's own Profile
router.put("/profile", auth(), fileUploader.uploadSingle, validateRequest(userValidation.updateSchema), userController.updateProfile);

//Delete user
router.delete("/delete/:id", auth(), userController.deleteUser);

//Toggle Block
router.put("/toggle-block/:id", auth(), userController.toggleBlock);

// Support - USer message to admin
router.post("/support/message", async (req, res) => {
    try {
        const { email, name, phone, message } = req.body;

        if (!email || !name || !phone || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const html = generateSupportMessageEmail({
            email,
            name,
            phone,
            message,
        });

        await emailSender(`${config.emailSender.email}`, html, "Support Message From User");

        res.json({ success: true, message: "Message sent to admin" });
    } catch (error) {
        res.status(500).json({ error: "Failed to send message" });
    }
});

// Upload photo
router.post("/upload-photo", fileUploader.uploadSingle, auth(), userController.uploadPhoto);

// Approve Users
router.put("/approve-users/:id", auth(UserRole.ADMIN), userController.approveUsers);

// Reject Users
router.put("/reject-users/:id", auth(UserRole.ADMIN), userController.rejectUsers);

export const userRoutes = router;
