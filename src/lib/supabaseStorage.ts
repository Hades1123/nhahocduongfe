import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = import.meta.env.VITE_BUCKET_NAME;

/**
 * Upload file lên Supabase Storage.
 * @param file File cần upload
 * @param folder Thư mục con trong bucket (vd: "before", "after")
 * @returns Public URL của file đã upload
 */
export async function uploadExamImage(
  file: File,
  folder: "upper" | "lower"
): Promise<{ publicUrl: string; uploadedAt: string }> {
  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File không phải là ảnh. Vui lòng chọn file JPG, PNG, GIF hoặc WebP.");
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(
      `Ảnh quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Vui lòng chọn ảnh dưới 10MB.`
    );
  }

  // Tạo tên file ngẫu nhiên để tránh trùng lặp
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueName = uuidv4();
  const fileName = `${folder}/${uniqueName}.${ext}`;

  console.log(
    `Uploading to bucket "${BUCKET_NAME}": ${fileName} (${(file.size / 1024).toFixed(1)}KB)`
  );

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    // Lỗi bucket không tồn tại
    if (
      error.message.includes("not found") ||
      error.message.includes("does not exist") ||
      error.message.includes("bucket")
    ) {
      throw new Error(
        `Không tìm thấy bucket "${BUCKET_NAME}" trong Supabase Storage.\n\n` +
        `Vui lòng tạo bucket trong Supabase Dashboard:\n` +
        `1. Vào Storage → New Bucket\n` +
        `2. Đặt tên: "${BUCKET_NAME}"\n` +
        `3. Chọn "Public bucket"\n` +
        `4. Bấm "Create bucket"\n` +
        `5. Vào SQL Editor chạy RLS policies`
      );
    }

    // Lỗi RLS / 403 / Unauthorized
    if (
      error.message.includes("row-level security") ||
      error.message.includes("policy") ||
      error.message.includes("403") ||
      error.message.includes("Unauthorized")
    ) {
      throw new Error(
        `Lỗi RLS Policy trên bucket "${BUCKET_NAME}": ${error.message}\n\n` +
        `Cách sửa: Vào Supabase Dashboard → SQL Editor, chạy:\n\n` +
        `CREATE POLICY "Allow insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = '${BUCKET_NAME}');\n` +
        `CREATE POLICY "Allow select" ON storage.objects FOR SELECT USING (bucket_id = '${BUCKET_NAME}');\n` +
        `CREATE POLICY "Allow delete" ON storage.objects FOR DELETE USING (bucket_id = '${BUCKET_NAME}');\n`
      );
    }

    // Lỗi trùng file
    if (error.message.includes("duplicate")) {
      throw new Error("File đã tồn tại. Vui lòng thử lại.");
    }

    throw new Error(`Upload thất bại: ${error.message}`);
  }

  console.log("Upload thành công:", data);

  // Lấy public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  const uploadedAt = new Date().toISOString();

  console.log("🔗 Public URL:", urlData.publicUrl);

  return {
    publicUrl: urlData.publicUrl,
    uploadedAt,
  };
}

/**
 * Xóa file trên Supabase Storage theo public URL.
 * @param publicUrl Public URL của file cần xóa
 */
export async function deleteExamImage(publicUrl: string): Promise<void> {
  // Trích xuất path từ public URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.findIndex((p) => p === BUCKET_NAME);

    if (bucketIndex === -1) {
      console.warn("Không thể trích xuất path từ URL:", publicUrl);
      return;
    }

    const filePath = pathParts.slice(bucketIndex + 1).join("/");
    console.log(`Deleting from bucket "${BUCKET_NAME}": ${filePath}`);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new Error(`Xóa file thất bại: ${error.message}`);
    }

    console.log("Đã xóa file:", filePath);
  } catch (err: any) {
    if (err.message?.includes("Xóa file thất bại")) throw err;
    console.warn("Không thể parse URL để xóa:", publicUrl, err);
  }
}
