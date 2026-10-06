import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Flag, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useYearbooks } from "@/lib/use-yearbooks";

export const Route = createFileRoute("/scan/$bookId")({
  head: () => ({
    meta: [
      { title: "Scanning — St. Louis Homeroom Archive" },
      { name: "description", content: "Capture yearbook pages one tap at a time." },
      { property: "og:title", content: "Scanning — St. Louis Homeroom Archive" },
      { property: "og:description", content: "Capture yearbook pages one tap at a time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const { bookId } = Route.useParams();
  const { books, capturePage, rescanLastPage, finishBook } = useYearbooks();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === bookId);

  const [popKey, setPopKey] = useState(0);

  useEffect(() => {
    if (!book) {
      navigate({ to: "/registry" });
    }
  }, [book, navigate]);

  if (!book) return null;

  const pageCount = book.pages.length;

  const handleCapture = () => {
    capturePage(book.id);
    setPopKey((k) => k + 1);
  };

  const handleFinish = () => {
    finishBook(book.id);
    navigate({ to: "/complete/$bookId", params: { bookId: book.id } });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-6 pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <Link
          to="/registry"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"
          aria-label="Back to registry"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black tracking-tight text-foreground">
            {book.school}
          </h1>
          <p className="text-sm text-muted-foreground">{book.year} Yearbook</p>
        </div>
      </header>

      <div className="mt-8 flex flex-col items-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Now capturing
        </p>
        <p
          key={popKey}
          className="animate-page-pop mt-1 text-6xl font-black tabular-nums tracking-tight text-primary"
        >
          Page {pageCount + 1}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {pageCount} {pageCount === 1 ? "page" : "pages"} in the stack
        </p>

        <button
          type="button"
          onClick={handleCapture}
          className="mt-8 grid size-40 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xl ring-8 ring-primary/15 transition-transform active:scale-90"
          aria-label="Capture page"
        >
          <Camera className="size-16" />
        </button>

        <div className="mt-8 flex w-full max-w-sm gap-3">
          <button
            type="button"
            onClick={() => rescanLastPage(book.id)}
            disabled={pageCount === 0}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-bold text-card-foreground disabled:opacity-40"
          >
            <Undo2 className="size-4" /> Rescan last page
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={pageCount === 0}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-foreground disabled:opacity-40"
          >
            <Flag className="size-4" /> Finish Book
          </button>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Captured pages
        </p>
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-3">
          {pageCount === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No pages yet — tap the camera button to capture your first page.
            </p>
          ) : (
            book.pages.map((src, i) => (
              <img
                key={`${i}-${src.length}`}
                src={src}
                alt={`Page ${i + 1}`}
                className="animate-thumb-in h-24 w-auto shrink-0 rounded-lg border border-border shadow-sm"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
