import { z } from "zod";

export const PRODUCT_TYPES = ["ANTIQUE", "TEXTILE", "CRAFT"] as const;
export const ProductTypeSchema = z.enum(PRODUCT_TYPES);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const USER_ROLES = ["CUSTOMER", "ARTISAN", "ADMIN"] as const;
export const UserRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;
export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export const MoneySchema = z
  .number()
  .int()
  .nonnegative()
  .describe("Amount in the smallest currency unit (paise for INR)");
export type Money = z.infer<typeof MoneySchema>;

export interface ProductSummaryDTO {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  type: ProductType;
  basePriceMinor: Money;
  currency: string;
  primaryImageUrl?: string;
  artisanName?: string;
}

export interface CategoryDTO {
  slug: string;
  title: string;
  description: string;
}
