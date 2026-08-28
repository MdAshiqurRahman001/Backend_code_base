export type ISubscriptionofferFilterRequest = {
    searchTerm?: string | undefined;
    id?: string | undefined;
    createdAt?: string | undefined;
    createdBy?: string | undefined;
    planName?: string | undefined;
    planType?: string | undefined;
    details?: string | undefined;
    status?: string | undefined;
    price?: number | undefined;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
    duration?: number | undefined;
    durationMin?: number | undefined;
    durationMax?: number | undefined;
    updatedAt?: string | undefined;
    // boolean
    isDeleted?: boolean | undefined;
}

export const BOOLEAN_FIELDS = new Set([
    "isDeleted",
]);

export const toBoolean = (v: any) => {
    if (typeof v === "boolean") return v;
    if (typeof v !== "string") return v;

    const val = v.trim().toLowerCase();
    if (val === "true") return true;
    if (val === "false") return false;

    return v;
};

export const NUMBER_FIELDS = new Set([
    "price",
    "duration",
]);

export const toNumber = (v: any) => {
    if (typeof v === "number") return v;
    if (typeof v !== "string") return v;

    const parsed = Number(v);
    return Number.isNaN(parsed) ? v : parsed;
};

export const subscriptionofferSearchAbleFields = ["planName", "planType", "details"];

export const subscriptionofferFilterableFields = [
    "searchTerm",
    "id",
    "createdAt",
    "createdBy",
    "planName",
    "planType",
    "details",
    "status",
    "price",
    "priceMin",
    "priceMax",
    "duration",
    "durationMin",
    "durationMax",
    "updatedAt",
    // boolean,
    "isDeleted",
];