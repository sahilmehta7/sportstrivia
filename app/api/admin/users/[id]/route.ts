import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  bio: z.string().max(500).optional(),
  favoriteTeams: z.array(z.string()).optional(),
});

// GET /api/admin/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            quizAttempts: true,
            reviews: true,
            friends: true,
            badges: true,
            topicStats: true,
          },
        },
        quizAttempts: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        topicStats: {
          orderBy: { successRate: "desc" },
          take: 5,
          include: {
            topic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return successResponse({ user });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const validatedData = userUpdateSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    // Check email uniqueness if changing email
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        throw new BadRequestError("Email already in use");
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            quizAttempts: true,
            reviews: true,
            friends: true,
            badges: true,
          },
        },
      },
    });

    return successResponse({ user, message: "User updated successfully" });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Prevent deleting the last admin
    if (user.role === UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN },
      });

      if (adminCount <= 1) {
        throw new BadRequestError("Cannot delete the last admin user");
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return successResponse({ message: "User deleted successfully" });
  } catch (error) {
    return handleError(error);
  }
}

