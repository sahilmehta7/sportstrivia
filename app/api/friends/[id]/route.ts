import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, ForbiddenError, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import { FriendStatus } from "@prisma/client";
import { createNotification } from "@/lib/services/notification.service";

const friendActionSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

// GET /api/friends/[id] - Get friendship details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const friendship = await prisma.friend.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            currentStreak: true,
            longestStreak: true,
          },
        },
      },
    });

    if (!friendship) {
      throw new NotFoundError("Friendship not found");
    }

    // Verify user is part of this friendship
    if (friendship.userId !== user.id && friendship.friendId !== user.id) {
      throw new ForbiddenError("You do not have access to this friendship");
    }

    return successResponse({ friendship });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/friends/[id] - Accept or decline friend request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { action } = friendActionSchema.parse(body);

    const friendship = await prisma.friend.findUnique({
      where: { id },
      include: {
        user: true,
        friend: true,
      },
    });

    if (!friendship) {
      throw new NotFoundError("Friend request not found");
    }

    // Only the friend (recipient) can accept/decline
    if (friendship.friendId !== user.id) {
      throw new ForbiddenError("Only the request recipient can accept or decline");
    }

    if (friendship.status !== FriendStatus.PENDING) {
      throw new BadRequestError("This friend request has already been processed");
    }

    if (action === "accept") {
      // Accept friend request
      const updatedFriendship = await prisma.friend.update({
        where: { id },
        data: { status: FriendStatus.ACCEPTED },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          friend: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      // Create notification for requester
      await createNotification(friendship.userId, "FRIEND_ACCEPTED", {
        byUserId: user.id,
        byUserName: user.name || user.email,
        friendshipId: friendship.id,
      });

      return successResponse({
        friendship: updatedFriendship,
        message: "Friend request accepted",
      });
    } else {
      // Decline friend request - delete it
      await prisma.friend.delete({
        where: { id },
      });

      return successResponse({
        message: "Friend request declined",
      });
    }
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/friends/[id] - Remove friend
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const friendship = await prisma.friend.findUnique({
      where: { id },
    });

    if (!friendship) {
      throw new NotFoundError("Friendship not found");
    }

    // Only participants can remove friendship
    if (friendship.userId !== user.id && friendship.friendId !== user.id) {
      throw new ForbiddenError("You do not have access to this friendship");
    }

    await prisma.friend.delete({
      where: { id },
    });

    return successResponse({ message: "Friend removed successfully" });
  } catch (error) {
    return handleError(error);
  }
}

