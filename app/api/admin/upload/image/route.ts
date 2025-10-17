import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { getSupabaseClient, isSupabaseConfigured, QUIZ_IMAGES_BUCKET } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      throw new BadRequestError(
        "Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment variables."
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "quizzes";

    if (!file) {
      throw new BadRequestError("No file provided");
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new BadRequestError(
        "Invalid file type. Allowed types: JPEG, PNG, GIF, WebP"
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestError("File size must be less than 5MB");
    }

    const supabase = getSupabaseClient();

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${timestamp}-${randomStr}.${fileExt}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(QUIZ_IMAGES_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new BadRequestError(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(QUIZ_IMAGES_BUCKET)
      .getPublicUrl(data.path);

    return successResponse({
      url: urlData.publicUrl,
      path: data.path,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/upload/image - Delete uploaded image
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    if (!isSupabaseConfigured()) {
      throw new BadRequestError("Supabase is not configured");
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      throw new BadRequestError("Image path is required");
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase.storage
      .from(QUIZ_IMAGES_BUCKET)
      .remove([path]);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new BadRequestError(`Delete failed: ${error.message}`);
    }

    return successResponse({ message: "Image deleted successfully" });
  } catch (error) {
    return handleError(error);
  }
}

