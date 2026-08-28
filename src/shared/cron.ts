import cron from "node-cron";
import prisma from "./prisma";

export const startCrons = () => {

    // 🔹 Automatically set users inactive if not logged in for 3 months
    const updateUserStatus = async () => {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        await prisma.user.updateMany({
            where: {
                lastLoginAt: {
                    lt: threeMonthsAgo,
                },
                status: "ACTIVE",
            },
            data: {
                status: "INACTIVE",
            },
        });
    };

    // 🔹 Reactivate suspended users
    const reactivateSuspendedUsers = async () => {
        const now = new Date();

        await prisma.user.updateMany({
            where: {
                status: "SUSPENDED",
                suspendedUntil: {
                    lte: now,
                },
            },
            data: {
                status: "ACTIVE",
                suspendedUntil: null,
            },
        });
    };

    // 🔹 Expire subscriptions when finished
    const expireFinishedSubscriptions = async () => {
        const now = new Date();

        const expired = await prisma.usersubscription.updateMany({
            where: {
                status: "ACTIVE",
                endDate: { lt: now },
            },
            data: {
                status: "EXPIRED",
            },
        });
        return expired;
    };

    // Run immediately on startup
    updateUserStatus().catch((e) => console.error("Cron updateUserStatus failed:", e));
    reactivateSuspendedUsers().catch((e) => console.error("Cron reactivateSuspendedUsers failed:", e));
    expireFinishedSubscriptions().catch((e) => console.error("Cron expireFinishedSubscriptions failed:", e));

    // Run every day at midnight
    cron.schedule("0 0 * * *", async () => {
        try { await updateUserStatus(); } catch (e) { console.error("Cron updateUserStatus failed:", e); }
    });
    cron.schedule("0 0 * * *", async () => {
        try { await reactivateSuspendedUsers(); } catch (e) { console.error("Cron reactivateSuspendedUsers failed:", e); }
    });
    cron.schedule("0 0 * * *", async () => {
        try { await expireFinishedSubscriptions(); } catch (e) { console.error("Cron expireFinishedSubscriptions failed:", e); }
    });

    console.log("⏰ Cron jobs started");
};
