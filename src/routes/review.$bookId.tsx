import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckSquare, RotateCcw, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { useYearbooks } from "@/lib/use-yearbooks";

export const Route = createFileRoute("/review/$bookId")({
  head: () => ({
    meta: [
      { title: "Review Pages — St. Louis Homeroom Archive" },
      {
        name: "description",
        content: "Review captured pages and recapture any that need it.",
      },
      { property: "og:title", content: "Review Pages — St. Louis Homeroom Archive" },
      {
        property: "og:description",
        content: "Review captured pages and recapture any that need it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { bookId } = Route.useParams();
  const { books } = useYearbooks();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === bookId);

  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!book) {
      navigate({ to: "/registry" });
    }
  }, [book, navigate]);

  if (!book) return null;

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleRecapture = () => {
    if (selected.size === 0) return;
    const ordered = Array.from(selected).sort((a, b) => a - b);
    navigate({
      to: "/scan/$bookId",
      params: { bookId: book.id },
      search: { recapture: ordered.join(",") },
    });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-28 pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <Link
          to="/complete/$bookId"
          params={{ bookId: book.id }}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"
          aria-label="Back to book complete"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black tracking-tight text-foreground">
            {book.school}
          </h1>
          <p className="text-sm text-muted-foreground">
            {book.year} — {book.pages.length}{" "}
            {book.pages.length === 1 ? "page" : "pages"}
          </p>
        </div>
      </header>

      <p className="mt-4 text-sm text-muted-foreground">
        Tap any pages that look blurry, skewed, or wrong, then recapture them.
      </p>

      {book.pages.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No pages captured for this book yet.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {book.pages.map((src, i) => {
            const isSelected = selected.has(i);
            return (
              <button
                key={`${i}-${src.length}`}
                type="button"
                onClick={() => toggle(i)}
                className={`relative overflow-hidden rounded-xl border-2 text-left shadow-sm transition-transform active:scale-95 ${
                  isSelected ? "border-primary" : "border-border"
                }`}
                aria-pressed={isSelected}
                aria-label={`Page ${i + 1}${isSelected ? ", selected" : ""}`}
              >
                <img
                  src={src}
                  alt={`Page ${i + 1}`}
                  className="aspect-[612/792] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-foreground/70 px-2 py-1">
                  <span className="text-xs font-bold text-background">
                    Pg {i + 1}
                  </span>
                  {isSelected ? (
                    <CheckSquare className="size-4 text-background" />
                  ) : (
                    <Square className="size-4 text-background/70" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-2xl border-t border-border bg-background/95 px-4 py-4 backdrop-blur">
        <button
          type="button"
          onClick={handleRecapture}
          disabled={selected.size === 0}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-xl transition-transform active:scale-95 disabled:opacity-40"
        >
          <RotateCcw className="size-5" />
          {selected.size === 0
            ? "Select pages to recapture"
            : `Start recapture (${selected.size} ${selected.size === 1 ? "page" : "pages"})`}
        </button>
      </div>
    </div>
  );
}
