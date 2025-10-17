# Cover Image Upload - Complete Guide

## ✅ Cover Image Feature Complete!

Add beautiful cover images to your quizzes with support for both URL input and file upload to Supabase storage.

---

## 🎯 Features

### Dual Input Methods

**Method 1: File Upload**
- ✅ Drag & drop or click to upload
- ✅ Automatic upload to Supabase storage
- ✅ Public URL generated automatically
- ✅ Supports: JPEG, PNG, GIF, WebP
- ✅ Max file size: 5MB

**Method 2: URL Input**
- ✅ Paste image URL directly
- ✅ Use images from external sources
- ✅ No storage used

### Image Management
- ✅ Live preview of uploaded/URL image
- ✅ Remove image with one click
- ✅ Update URL after upload
- ✅ Validation (type, size)

---

## 🔧 Setup

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Note your project URL and keys

### 2. Create Storage Bucket

1. In Supabase Dashboard → Storage
2. Create new bucket: `quiz-images`
3. Set bucket to **Public**
4. Configure policies:

```sql
-- Allow admins to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quiz-images');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'quiz-images');

-- Allow admins to delete
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'quiz-images');
```

### 3. Add Environment Variables

Add to your `.env` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Where to find:**
- URL: Supabase Dashboard → Settings → API → Project URL
- Anon Key: Supabase Dashboard → Settings → API → anon public
- Service Role: Supabase Dashboard → Settings → API → service_role (keep secret!)

### 4. Restart Server

```bash
npm run dev
```

---

## 📋 How to Use

### Adding Cover Image to Quiz

#### Option 1: Upload File

1. Go to Quiz Edit page
2. Find "Cover Image" section (in Basic Information)
3. Click the upload area or drag image
4. Image uploads automatically
5. Preview appears instantly
6. Click "Save Changes" to save quiz

#### Option 2: Enter URL

1. Go to Quiz Edit page
2. Find "Cover Image" section
3. Enter image URL in the input field
4. Preview appears when valid URL
5. Click "Save Changes" to save quiz

### Removing Cover Image

1. Click the X button on the image preview
2. Image is removed from form
3. Click "Save Changes" to update quiz

### Updating Image

**If using upload:**
- Click X to remove current image
- Upload new image

**If using URL:**
- Just edit the URL field directly
- Preview updates in real-time

---

## 🎨 UI Components

### Upload Area (No Image)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                  📤 Upload                      │
│              Click to upload                    │
│       PNG, JPG, GIF, WebP (max 5MB)            │
│                                                 │
└─────────────────────────────────────────────────┘
                      Or
┌─────────────────────────────────────────────────┐
│ Enter Image URL                                 │
│ [https://example.com/image.jpg         ]       │
└─────────────────────────────────────────────────┘
```

### Image Preview (With Image)

```
┌─────────────────────────────────────────────────┐
│                                             [X] │
│                                                 │
│            [Cover Image Preview]                │
│                                                 │
└─────────────────────────────────────────────────┘
Or update URL directly:
[https://supabase.co/storage/quiz-images/...jpg ]
```

---

## 🔌 API Integration

### Upload Endpoint

```
POST /api/admin/upload/image
```

**Request:**
```
FormData {
  file: File,
  folder: "quizzes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://...supabase.co/storage/v1/object/public/quiz-images/...",
    "path": "quizzes/1234567890-abc123.jpg",
    "fileName": "my-image.jpg",
    "size": 245678,
    "type": "image/jpeg"
  }
}
```

### Delete Endpoint

```
DELETE /api/admin/upload/image?path=quizzes/1234567890-abc123.jpg
```

---

## 📊 Database Schema

The `descriptionImageUrl` field already exists in the Quiz model:

```prisma
model Quiz {
  id                  String   @id @default(cuid())
  title               String
  slug                String   @unique
  description         String?  @db.Text
  descriptionImageUrl String?  // ← Cover image URL
  // ... other fields
}
```

---

## 🔒 Security Features

### File Validation

**Type Check:**
- Only allows: JPEG, PNG, GIF, WebP
- Rejects: SVG, BMP, TIFF, etc.

**Size Check:**
- Maximum: 5MB
- Prevents large file uploads
- Protects storage quota

**Admin Only:**
- Requires admin authentication
- Non-admins cannot upload

### Storage Security

**Supabase Storage:**
- Files stored in public bucket
- URLs are public (for quiz display)
- Upload requires authentication
- Delete requires authentication

**File Naming:**
- Timestamp + random string
- Prevents collisions
- Organized by folder

---

## 💡 Best Practices

### Image Guidelines

**Recommended:**
- ✅ Aspect ratio: 16:9 or 4:3
- ✅ Resolution: 1200x675px or higher
- ✅ Format: WebP (best compression) or JPEG
- ✅ Size: < 500KB for optimal loading
- ✅ Relevant to quiz content

**Avoid:**
- ❌ Very large files (>2MB)
- ❌ Low resolution images (<800px wide)
- ❌ Irrelevant stock photos
- ❌ Text-heavy images (hard to read when scaled)

### URL vs Upload

**Use URL when:**
- Image already hosted elsewhere
- Using CDN images
- Temporary images
- Testing

**Use Upload when:**
- Original images
- Long-term storage needed
- Control over hosting
- Production use

---

## 🎨 Display

### Where Cover Images Appear

1. **Quiz Cards** (Browse page)
   - Thumbnail at top of card
   - Attracts attention
   - Improves engagement

2. **Quiz Detail Page**
   - Hero image at top
   - Sets visual context
   - Professional appearance

3. **Social Sharing**
   - Open Graph image
   - Twitter card image
   - Better social media previews

---

## 🔍 Troubleshooting

### "Supabase is not configured"

**Solution:**
1. Add environment variables to `.env`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
2. Restart dev server
3. Try again

### Upload Fails

**Possible Causes:**
- File too large (>5MB)
- Wrong file type
- Supabase bucket doesn't exist
- Incorrect bucket permissions

**Solutions:**
- Compress image before upload
- Convert to JPEG/PNG/WebP
- Create `quiz-images` bucket in Supabase
- Check storage policies

### Image Doesn't Display

**Possible Causes:**
- Invalid URL
- Image deleted from Supabase
- CORS issues
- Private bucket

**Solutions:**
- Verify URL is accessible
- Re-upload image
- Check bucket is set to Public
- Verify storage policies

---

## 📂 File Structure

**Created Files:**
- `lib/supabase.ts` - Supabase client utility
- `app/api/admin/upload/image/route.ts` - Upload API

**Updated Files:**
- `app/admin/quizzes/[id]/edit/page.tsx` - Added cover image section
- `app/admin/quizzes/new/page.tsx` - Added cover image section (to be added)

---

## 🚀 Future Enhancements

Possible additions:
- Image cropping tool
- Multiple image sizes (thumbnail, medium, large)
- Image optimization on upload
- Gallery/library of uploaded images
- Bulk image upload
- Drag & drop anywhere in form

---

## ✅ Feature Status

**Completed:**
- ✅ Supabase storage integration
- ✅ Upload API endpoint
- ✅ Delete API endpoint
- ✅ File validation
- ✅ Cover image UI in edit page
- ✅ URL input option
- ✅ Image preview
- ✅ Remove image function

**To Add:**
- ⏳ Cover image in new quiz page (coming soon)
- ⏳ Image optimization
- ⏳ Cropping tool

---

## 🎉 Ready to Use!

The cover image upload feature is now available in the Quiz Edit page!

**Next Steps:**
1. Set up Supabase project and bucket
2. Add environment variables
3. Restart server
4. Start adding beautiful cover images to your quizzes!


