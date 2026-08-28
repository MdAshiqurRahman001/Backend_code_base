export type IUsersubscriptionFilterRequest = {
    searchTerm?: string | undefined;
    id?: string | undefined;
    createdAt?: string | undefined;
    userId?: string | undefined;
    subscriptionOfferId?: string | undefined;
    paymentId?: string | undefined;
    paymentStatus?: string | undefined;
    status?: string | undefined;
    duration?: number | undefined;
    durationMin?: number | undefined;
    durationMax?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    updatedAt?: string | undefined;
}

export const NUMBER_FIELDS = new Set([
    "duration",
]);

export const toNumber = (v: any) => {
    if (typeof v === "number") return v;
    if (typeof v !== "string") return v;

    const parsed = Number(v);
    return Number.isNaN(parsed) ? v : parsed;
};

export const usersubscriptionSearchAbleFields = [];

export const usersubscriptionFilterableFields = [
    "searchTerm",
    "id",
    "createdAt",
    "userId",
    "subscriptionOfferId",
    "paymentId",
    "paymentStatus",
    "status",
    "duration",
    "durationMin",
    "durationMax",
    "startDate",
    "endDate",
    "updatedAt",
];

export const addMonths = (date: Date, months: number): Date => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const target = new Date(year, month + months, day);
  if (target.getMonth() !== (month + months) % 12) {
    return new Date(year, month + months + 1, 0);
  }
  return target;
};