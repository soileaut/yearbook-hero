import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { jsPDF } from "jspdf";
import { ArrowLeft, Download, ImageIcon, PartyPopper, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useYearbooks } from "@/lib/use-yearbooks";

export const Route = createFileRoute("/complete/$bookId")({
  head: () => ({
    meta: [
      { title: "Book Complete — St. Louis Homeroom Archive" },
      { name: "description", content: "Yearbook scanned and ready to download as a PDF." },
      { property: "og:title", content: "Book Complete — St. Louis Homeroom Archive" },
      { property: "og:description", content: "Yearbook scanned and ready to download as a PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompletePage,
});

function CompletePage() {
  const { bookId } = Route.useParams();
  const { books } = useYearbooks();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === bookId);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!book) {
      navigate({ to: "/registry" });
    }
  }, [book, navigate]);

  if (!book) return null;

  const handleDownload = () => {
    if (book.pages.length === 0) return;
    setDownloading(true);
    try {
      const pdf = new jsPDF({ unit: "pt", format: "letter" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      book.pages.forEach((src, i) => {
        if (i > 0) pdf.addPage("letter", "portrait");
        // Fit the image within the page preserving its aspect ratio (like
        // "contain", not "stretch") so pages of differing shapes don't come
        // out distorted. White-fill first so the gutters read as page, not
        // as a hole.
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageW, pageH, "F");
        const { width: imgW, height: imgH } = pdf.getImageProperties(src);
        const scale = Math.min(pageW / imgW, pageH / imgH);
        const w = imgW * scale;
        const h = imgH * scale;
        const x = (pageW - w) / 2;
        const y = (pageH - h) / 2;
        pdf.addImage(src, "JPEG", x, y, w, h);
      });
      const slug = `${book.school.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${book.year}`;
      pdf.save(`${slug}-yearbook.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="grid size-20 place-items-center rounded-3xl bg-accent shadow-lg">
        <PartyPopper className="size-10 text-accent-foreground" />
      </div>
      <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground">
        Book complete!
      </h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        <span className="font-bold text-foreground">{book.school} {book.year}</span>{" "}
        is safely in the archive — {book.pages.length}{" "}
        {book.pages.length === 1 ? "page" : "pages"} captured.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || book.pages.length === 0}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-xl transition-transform active:scale-95 disabled:opacity-50"
        >
          <Download className="size-5" />
          {downloading ? "Building PDF…" : "Download PDF"}
        </button>
        <Link
          to="/review/$bookId"
          params={{ bookId: book.id }}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-base font-bold text-card-foreground"
        >
          <ImageIcon className="size-5" /> Review Pages
        </Link>
        <Link
          to="/registry"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-base font-bold text-card-foreground"
        >
          <Plus className="size-5" /> Scan Another
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-1.5 pt-2 text-sm font-semibold text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> Back to start
        </Link>
      </div>
    </div>
  );
}
