import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ScanLine } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "St. Louis Homeroom Archive — Save our yearbooks" },
      {
        name: "description",
        content:
          "Volunteer-powered yearbook scanning for St. Louis schools. Claim a book, scan the pages, preserve the memories.",
      },
      { property: "og:title", content: "St. Louis Homeroom Archive" },
      {
        property: "og:description",
        content:
          "Volunteer-powered yearbook scanning for St. Louis schools. Claim a book, scan the pages, preserve the memories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 grid size-20 place-items-center rounded-3xl bg-primary shadow-lg">
        <BookOpen className="size-10 text-primary-foreground" />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
        Volunteer Scanning Crew
      </p>
      <h1 className="mt-3 max-w-md text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
        St. Louis Homeroom Archive
      </h1>
      <p className="mt-4 max-w-sm text-base text-muted-foreground">
        Rescue St. Louis yearbooks, one page at a time — before the memories
        fade.
      </p>
      <Link
        to="/registry"
        className="mt-10 inline-flex h-16 items-center gap-3 rounded-2xl bg-primary px-10 text-lg font-bold text-primary-foreground shadow-xl transition-transform active:scale-95"
      >
        <ScanLine className="size-6" />
        Start Scanning
      </Link>

      <p className="mt-10 max-w-xs text-xs leading-relaxed text-muted-foreground">
        This is an early demo, not the production archive. This link isn't
        private — please don't capture real names, personal information, or
        anything sensitive while testing.
      </p>
    </div>
  );
}
