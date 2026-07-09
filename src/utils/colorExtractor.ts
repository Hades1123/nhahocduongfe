/**
 * colorExtractor.ts — CONTROLLER: Color extraction utilities.
 *
 * Two extraction methods are provided:
 *
 * 1. extractColorsFromUrl(url)
 *    Parses a Color Hunt URL (e.g. https://colorhunt.co/palette/1b4332d8f3dc52b788b7e4c7)
 *    The palette ID is the last URL path segment. Color Hunt encodes 4 colors as
 *    consecutive 6-character hex strings within that 24-character slug.
 *    This approach requires NO fetch/CORS — it's pure string parsing.
 *
 * 2. extractColorsFromImage(file)
 *    Draws the image onto an off-screen <canvas>, samples the pixel data,
 *    and uses a simplified median-cut quantization to find 4 dominant colors.
 *    No external libraries needed — uses only the browser Canvas API.
 */

// ─── URL Extraction ───────────────────────────────────────────────────────────

/**
 * Parse 4 hex colors from a Color Hunt palette URL.
 *
 * Color Hunt URL format:
 *   https://colorhunt.co/palette/<24-char-slug>
 *   e.g.  https://colorhunt.co/palette/1b4332d8f3dc52b788b7e4c7
 *         ↑ 4 colors: #1b4332, #d8f3dc, #52b788, #b7e4c7
 *
 * @param url - Full Color Hunt palette URL
 * @returns Array of 4 hex color strings (with # prefix), or throws on invalid URL
 */
export function extractColorsFromUrl(url: string): string[] {
  // Trim whitespace before processing
  const trimmed = url.trim();

  // Validate it looks like a Color Hunt URL
  if (!trimmed.includes("colorhunt.co/palette/")) {
    throw new Error(
      "URL không hợp lệ. Vui lòng nhập URL từ colorhunt.co/palette/..."
    );
  }

  // Extract the path segment after /palette/
  // Handle trailing slashes and query strings
  const match = trimmed.match(/colorhunt\.co\/palette\/([a-f0-9]{24})/i);

  if (!match || !match[1]) {
    throw new Error(
      "Không thể đọc mã màu từ URL. Đảm bảo URL có dạng: colorhunt.co/palette/xxxxxxxxxxxxxxxxxxxxxxxx (24 ký tự hex)"
    );
  }

  const slug = match[1].toLowerCase();

  // Split the 24-char slug into 4 × 6-char hex codes
  const colors: string[] = [];
  for (let i = 0; i < 24; i += 6) {
    colors.push("#" + slug.slice(i, i + 6));
  }

  if (colors.length !== 4) {
    throw new Error("Không đủ 4 màu từ URL này.");
  }

  return colors;
}

// ─── Image Extraction ─────────────────────────────────────────────────────────

/** RGB color triple */
type RGB = [number, number, number];

/**
 * Extract 4 dominant colors from an image File using canvas sampling
 * and a simplified median-cut quantization algorithm.
 *
 * Algorithm overview:
 *   1. Draw the image onto a 100×100 canvas (downscaled for performance)
 *   2. Read all pixel RGBA values
 *   3. Filter out near-transparent pixels (alpha < 128)
 *   4. Apply median-cut: repeatedly split the color space along the
 *      axis with the largest range, until we have 4 buckets
 *   5. Return the average (centroid) color of each bucket
 *
 * @param file - An image File (JPEG, PNG, WebP, etc.)
 * @returns Promise resolving to array of 4 hex color strings
 */
export function extractColorsFromImage(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      reject(new Error("File phải là ảnh (JPEG, PNG, WebP, ...)"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // ── Step 1: Draw image onto small canvas ──────────────────────────
          // 100×100 is enough for color analysis and is fast to process
          const SIZE = 100;
          const canvas = document.createElement("canvas");
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Không thể tạo canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, SIZE, SIZE);

          // ── Step 2: Read pixel data ───────────────────────────────────────
          const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
          const pixels = imageData.data; // flat RGBA array: [R,G,B,A, R,G,B,A, ...]

          // ── Step 3: Collect valid (opaque) pixels ─────────────────────────
          const rgbPixels: RGB[] = [];
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            // Skip near-transparent pixels to avoid white/clear backgrounds
            if (a >= 128) {
              rgbPixels.push([r, g, b]);
            }
          }

          if (rgbPixels.length === 0) {
            reject(new Error("Ảnh không có pixel hợp lệ."));
            return;
          }

          // ── Step 4: Median-cut quantization ───────────────────────────────
          const palette = medianCut(rgbPixels, 4);

          // ── Step 5: Convert RGB to hex strings ────────────────────────────
          const hexColors = palette.map(rgbToHex);
          resolve(hexColors);
        } catch (err) {
          reject(
            new Error("Lỗi xử lý ảnh: " + (err as Error).message)
          );
        }
      };

      img.onerror = () => reject(new Error("Không thể tải ảnh."));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Không thể đọc file."));
    reader.readAsDataURL(file);
  });
}

// ─── Median-Cut Algorithm ─────────────────────────────────────────────────────

/**
 * Median-cut color quantization.
 *
 * Recursively splits the pixel set into buckets by cutting along the color
 * channel with the greatest range. Returns `count` representative colors.
 *
 * @param pixels - Array of RGB pixel values
 * @param count  - Desired number of output colors (should be a power of 2)
 * @returns Array of `count` RGB values representing dominant colors
 */
function medianCut(pixels: RGB[], count: number): RGB[] {
  // Base case: return the centroid of this pixel set
  if (count <= 1 || pixels.length === 0) {
    return [centroid(pixels)];
  }

  // Find the channel (R, G, or B) with the maximum range in this bucket
  const channel = dominantChannel(pixels);

  // Sort pixels along that channel
  const sorted = [...pixels].sort((a, b) => a[channel] - b[channel]);

  // Split at the median
  const mid = Math.floor(sorted.length / 2);
  const left = sorted.slice(0, mid);
  const right = sorted.slice(mid);

  const half = Math.floor(count / 2);

  // Recurse into both halves — split remaining count proportionally
  return [
    ...medianCut(left, half),
    ...medianCut(right, count - half),
  ];
}

/**
 * Find the RGB channel index (0=R, 1=G, 2=B) with the greatest value range.
 * This is the axis along which we should split the bucket for best results.
 */
function dominantChannel(pixels: RGB[]): 0 | 1 | 2 {
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;

  for (const [r, g, b] of pixels) {
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (g < minG) minG = g;
    if (g > maxG) maxG = g;
    if (b < minB) minB = b;
    if (b > maxB) maxB = b;
  }

  const rRange = maxR - minR;
  const gRange = maxG - minG;
  const bRange = maxB - minB;

  if (rRange >= gRange && rRange >= bRange) return 0;
  if (gRange >= rRange && gRange >= bRange) return 1;
  return 2;
}

/**
 * Compute the average RGB value (centroid) of a set of pixels.
 * This gives the "representative color" for a bucket.
 */
function centroid(pixels: RGB[]): RGB {
  if (pixels.length === 0) return [128, 128, 128]; // fallback gray

  let sumR = 0, sumG = 0, sumB = 0;
  for (const [r, g, b] of pixels) {
    sumR += r;
    sumG += g;
    sumB += b;
  }
  const n = pixels.length;
  return [Math.round(sumR / n), Math.round(sumG / n), Math.round(sumB / n)];
}

// ─── Helper: RGB → Hex ────────────────────────────────────────────────────────

/**
 * Convert an RGB triple to a CSS hex color string.
 * e.g. [255, 128, 0] → "#ff8000"
 */
function rgbToHex([r, g, b]: RGB): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

// ─── Helper: Validate hex ─────────────────────────────────────────────────────

/**
 * Check if a string is a valid CSS hex color (with # prefix).
 */
export function isValidHex(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}
