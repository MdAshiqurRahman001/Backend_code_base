export type INotificationFilterRequest = {
    searchTerm?: string | undefined;
    id?: string | undefined;
    createdAt?: string | undefined;
    userId?: string | undefined;
    title?: string | undefined;
    body?: string | undefined;
    data?: string | undefined;
    updatedAt?: string | undefined;
    // boolean
    read?: boolean | undefined;
}

export const BOOLEAN_FIELDS = new Set([
    "read",
]);

export const toBoolean = (v: any) => {
    if (typeof v === "boolean") return v;
    if (typeof v !== "string") return v;

    const val = v.trim().toLowerCase();
    if (val === "true") return true;
    if (val === "false") return false;

    return v;
};

export const notificationSearchAbleFields = ["title", "body", "data"];

export const notificationFilterableFields = [
    "searchTerm",
    "id",
    "createdAt",
    "userId",
    "title",
    "body",
    "data",
    "updatedAt",
    // boolean,
    "read",
];