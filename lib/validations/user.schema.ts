import { z } from "zod";
import { UserRole } from "@prisma/client";

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
  favoriteTeams: z.array(z.string()).optional(),
  image: z.string().url().optional(),
});

export const userRoleUpdateSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateSchema>;

