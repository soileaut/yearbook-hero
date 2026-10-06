import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ChevronRight, Timer } from "lucide-react";
import { useYearbooks } from "@/lib/use-yearbooks";
import type { YearbookStatus } from "@/lib/yearbooks";

export const Route = createFileRoute("/registry")({
  head: () => ({
    meta: [
      { title: "Missing Yearbooks Registry — St. Louis Homeroom Archive" },
      {
        name: "description",
        content:
          "Browse the registry of missing St. Louis yearbooks. Claim an unclaimed book and start scanning.",
      },
      { property: "og:title", content: "Missing Yearbooks Registry" },
      {
        property: "og:description",
        content:
          "Browse the registry of missing St. Louis yearbooks. Claim an unclaimed book and start scanning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegistryPage,
});

function StatusBadge({ status }: { status: YearbookStatus }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
        <CheckCircle2 className="size-3.5" /> Done
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
        <Timer className="size-3.5" /> In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
      Unclaimed
    </span>
  );
}

function RegistryPage() {
  const { books, claimBook } = useYearbooks();
  const navigate = useNavigate();

  const doneCount = books.filter((b) => b.status === "done").length;

  const handleTap = (id: string, status: YearbookStatus) => {
    if (status === "done") {
      navigate({ to: "/complete/$bookId", params: { bookId: id } });
      return;
    }
    if (status === "unclaimed") claimBook(id);
    navigate({ to: "/scan/$bookId", params: { bookId: id } });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-12 pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <Link
          to="/"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"
          aria-label="Back to home"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black tracking-tight text-foreground">
            Missing Yearbooks
          </h1>
          <p className="text-sm text-muted-foreground">
            {doneCount} of {books.length} books rescued
          </p>
        </div>
      </header>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(doneCount / books.length) * 100}%` }}
        />
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {books.map((book) => {
          return (
            <li key={book.id}>
              <button
                type="button"
                onClick={() => handleTap(book.id, book.status)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-transform active:scale-[0.98]"
              >
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-lg font-black text-primary">
                  ’{String(book.year).slice(2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-card-foreground">
                    {book.school}
                  </p>
                  <p className="text-sm text-muted-foreground">{book.year}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={book.status} />
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
