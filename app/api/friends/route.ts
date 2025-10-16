import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError, NotFoundError } from "@/lib/errors";
import { z } from "zod";
import {
  type FriendListFilters,
  buildFriendWhereClause,
  buildReceivedFriendRequestsWhereClause,
  friendInclude,
} from "@/lib/dto/friend-filters.dto";
import { calculatePagination, buildPaginationResult } from "@/lib/dto/quiz-filters.dto";
import { FriendStatus } from "@prisma/client";
import { createNotification } from "@/lib/services/notification.service";

const friendRequestSchema = z.object({
  friendEmail: z.string().email("Valid email required"),
});

// GET /api/friends - List friends and friend requests
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || "friends"; // friends, sent, received

    const filters: FriendListFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as FriendStatus) || undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const { skip, take } = calculatePagination(filters.page!, filters.limit!);

    let where: any;
    let include: any;

    if (type === "received") {
      // Friend requests received by this user
      where = buildReceivedFriendRequestsWhereClause(user.id, filters);
      include = friendInclude;
    } else if (type === "sent") {
      // Friend requests sent by this user (pending only)
      where = {
        userId: user.id,
        status: FriendStatus.PENDING,
      };
      if (filters.search) {
        where.friend = {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        };
      }
      include = friendInclude;
    } else {
      // Accepted friends only
      where = {
        userId: user.id,
        status: FriendStatus.ACCEPTED,
      };
      if (filters.search) {
        where.friend = {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        };
      }
      include = friendInclude;
    }

    const [friendships, total] = await Promise.all([
      prisma.friend.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: filters.sortOrder },
        include,
      }),
      prisma.friend.count({ where }),
    ]);

    return successResponse({
      friendships,
      pagination: buildPaginationResult(filters.page!, filters.limit!, total),
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/friends - Send friend request
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { friendEmail } = friendRequestSchema.parse(body);

    // Cannot friend yourself
    if (friendEmail === user.email) {
      throw new BadRequestError("You cannot send a friend request to yourself");
    }

    // Find friend by email
    const friend = await prisma.user.findUnique({
      where: { email: friendEmail },
    });

    if (!friend) {
      throw new NotFoundError("User with that email not found");
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: friend.id },
          { userId: friend.id, friendId: user.id },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendStatus.ACCEPTED) {
        throw new BadRequestError("You are already friends with this user");
      } else if (existingFriendship.status === FriendStatus.PENDING) {
        throw new BadRequestError("A friend request is already pending");
      } else {
        throw new BadRequestError("Cannot send friend request at this time");
      }
    }

    // Create friend request
    const friendship = await prisma.friend.create({
      data: {
        userId: user.id,
        friendId: friend.id,
        status: FriendStatus.PENDING,
      },
      include: friendInclude,
    });

    // Create notification for friend request
    await createNotification(friend.id, "FRIEND_REQUEST", {
      fromUserId: user.id,
      fromUserName: user.name || user.email,
      friendshipId: friendship.id,
    });

    return successResponse(
      { friendship, message: "Friend request sent successfully" },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

