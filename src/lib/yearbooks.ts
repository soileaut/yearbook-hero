export type YearbookStatus = "unclaimed" | "in-progress" | "done";

export interface Yearbook {
  id: string;
  school: string;
  year: number;
  status: YearbookStatus;
  pages: string[]; // data-URL page images captured during scanning
}

const STORAGE_KEY = "slha-yearbooks-v1";

const MOCK_BOOKS: Yearbook[] = [
  { id: "roosevelt-1968", school: "Roosevelt High School", year: 1968, status: "unclaimed", pages: [] },
  { id: "beaumont-1974", school: "Beaumont High School", year: 1974, status: "unclaimed", pages: [] },
  { id: "sumner-1959", school: "Sumner High School", year: 1959, status: "unclaimed", pages: [] },
  { id: "soldan-1982", school: "Soldan High School", year: 1982, status: "unclaimed", pages: [] },
  { id: "vashon-1971", school: "Vashon High School", year: 1971, status: "unclaimed", pages: [] },
  { id: "mcKinley-1965", school: "McKinley High School", year: 1965, status: "unclaimed", pages: [] },
  { id: "cleveland-1953", school: "Cleveland High School", year: 1953, status: "unclaimed", pages: [] },
  { id: "southwest-1977", school: "Southwest High School", year: 1977, status: "unclaimed", pages: [] },
  { id: "central-1912", school: "Central High School", year: 1912, status: "done", pages: [] },
];

export function loadYearbooks(): Yearbook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Yearbook[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fall through to mock data
  }
  return MOCK_BOOKS.map((b) => ({ ...b, pages: [...b.pages] }));
}

export function saveYearbooks(books: Yearbook[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

const MAX_DIMENSION = 1600; // longest edge, px — keeps real phone photos from
// bloating localStorage; still plenty sharp for an on-screen thumbnail/PDF demo
const JPEG_QUALITY = 0.72;

// US Letter portrait ratio (matches the PDF page size in complete.$bookId.tsx).
// Every captured page is center-cropped to this ratio so pages come out a
// consistent shape regardless of how the photo was framed — a stand-in for
// the real auto-edge-detection a production capture flow would do.
const TARGET_ASPECT = 612 / 792;

/**
 * Center-crop a drawable source (an <img> or a live <video> frame) to
 * TARGET_ASPECT, downscale so its longest edge is at most MAX_DIMENSION, and
 * return a JPEG data URL. Shared by the file-picker fallback path and the
 * live in-browser camera path below, so both produce identically-shaped
 * pages regardless of how the source photo/frame was framed.
 */
function cropAndEncode(
  source: CanvasImageSource,
  srcWidth: number,
  srcHeight: number,
): string {
  const srcAspect = srcWidth / srcHeight;
  let cropW = srcWidth;
  let cropH = srcHeight;
  let cropX = 0;
  let cropY = 0;
  if (srcAspect > TARGET_ASPECT) {
    // source is relatively wider than the target page — crop the sides
    cropW = srcHeight * TARGET_ASPECT;
    cropX = (srcWidth - cropW) / 2;
  } else {
    // source is relatively taller than the target page — crop top/bottom
    cropH = srcWidth / TARGET_ASPECT;
    cropY = (srcHeight - cropH) / 2;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(cropW, cropH));
  const outW = Math.round(cropW * scale);
  const outH = Math.round(cropH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }
  ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

/**
 * Load an image File (from a picked file, used as a fallback when live
 * camera access isn't available), center-crop it to a fixed page aspect
 * ratio, downscale, re-encode as JPEG, and return a data URL.
 *
 * Two things this solves:
 * 1. Storage size — without downscaling, full-resolution phone photos would
 *    quickly exceed localStorage's quota after just a few pages.
 * 2. Visual consistency — without the crop, pages captured at different
 *    zoom/framing come out different shapes, which looks inconsistent and
 *    distorts when placed into the PDF.
 */
export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        resolve(cropAndEncode(img, img.width, img.height));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to process image"));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load captured image"));
    };
    img.src = objectUrl;
  });
}

/**
 * Capture the current frame of a live <video> element (from getUserMedia),
 * cropped/scaled/encoded the same way as compressImageFile. Used by the
 * in-browser camera capture flow.
 */
export function captureVideoFrame(video: HTMLVideoElement): string {
  return cropAndEncode(video, video.videoWidth, video.videoHeight);
}
