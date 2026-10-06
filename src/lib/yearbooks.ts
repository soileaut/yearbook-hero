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

const ACCENT_COLORS = ["#0b3d2e", "#7a2e2e", "#2e4a7a", "#7a6a2e", "#5a2e7a"];

/** Render a placeholder scanned page as a data URL using a canvas. Each call
 * picks a random accent color and timestamp so a recaptured page is visibly
 * different from the one it replaced, even though it's still mock content. */
export function makePageImage(book: Yearbook, pageNumber: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = 612;
  canvas.height = 792; // letter ratio
  const ctx = canvas.getContext("2d")!;
  const accent: string =
    ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)] ?? "#0b3d2e";

  // paper
  ctx.fillStyle = "#fdfdf8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // border frame
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  // header
  ctx.fillStyle = accent;
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(book.school, canvas.width / 2, 110);
  ctx.font = "600 26px system-ui, sans-serif";
  ctx.fillText(String(book.year), canvas.width / 2, 152);

  // timestamp, placed near the top (clear of the bottom status bar overlay
  // shown in the Review screen's thumbnail grid) so it's always visible
  ctx.fillStyle = "#8a8f8a";
  ctx.font = "500 16px system-ui, sans-serif";
  ctx.fillText(`captured ${new Date().toLocaleTimeString()}`, canvas.width / 2, 185);

  // faux content lines
  ctx.strokeStyle = "#c9cec9";
  ctx.lineWidth = 3;
  for (let y = 220; y < 620; y += 36) {
    const inset = 70 + ((y * 7) % 60);
    ctx.beginPath();
    ctx.moveTo(inset, y);
    ctx.lineTo(canvas.width - inset, y);
    ctx.stroke();
  }

  // big page number
  ctx.fillStyle = accent;
  ctx.font = "bold 96px system-ui, sans-serif";
  ctx.fillText(`Page ${pageNumber}`, canvas.width / 2, 700);

  return canvas.toDataURL("image/jpeg", 0.85);
}
