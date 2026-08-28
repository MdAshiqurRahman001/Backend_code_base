export type IUserFilterRequest = {
    searchTerm?: string | undefined;
    id?: string | undefined;
    createdAt?: string | undefined;
    fullName?: string | undefined;
    userName?: string | undefined;
    email?: string | undefined;
    phoneNumber?: string | undefined;
    role?: string | undefined;
    status?: string | undefined;
    lat?: number | undefined;
    lon?: number | undefined;
    updatedAt?: string | undefined;

    // boolean
    isSocialLogin?: boolean | undefined;
    emailVerified?: boolean | undefined;
    isBlocked?: boolean | undefined;
    isDeleted?: boolean | undefined;
    isApproved?: boolean | undefined;
    isProfileComplete?: boolean | undefined;
}

export const BOOLEAN_FIELDS = new Set([
    "isSocialLogin",
    "emailVerified",
    "isBlocked",
    "isDeleted",
    "isApproved",
    "isProfileComplete",
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
    "lat",
    "lon",
]);

export const toNumber = (v: any) => {
    if (typeof v === "number") return v;
    if (typeof v !== "string") return v;

    const parsed = Number(v);
    return Number.isNaN(parsed) ? v : parsed;
};

export const userSearchAbleFields = ["fullName", "userName", "email", "phoneNumber"];

export const userFilterableFields = [
    "searchTerm",
    "id",
    "createdAt",
    "fullName",
    "userName",
    "email",
    "phoneNumber",
    "password",
    "role",
    "status",
    "lat",
    "lon",
    "updatedAt",
    
    // boolean,
    "isSocialLogin",
    "emailVerified",
    "isBlocked",
    "isDeleted",
    "isApproved",
    "isProfileComplete",
];