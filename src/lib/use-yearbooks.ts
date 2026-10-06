import { useCallback, useState } from "react";
import {
  loadYearbooks,
  saveYearbooks,
  makePageImage,
  type Yearbook,
} from "./yearbooks";

export function useYearbooks() {
  const [books, setBooks] = useState<Yearbook[]>(() => loadYearbooks());

  const update = useCallback((fn: (books: Yearbook[]) => Yearbook[]) => {
    setBooks((prev) => {
      const next = fn(prev);
      saveYearbooks(next);
      return next;
    });
  }, []);

  const claimBook = useCallback(
    (id: string) => {
      update((books) =>
        books.map((b) => (b.id === id ? { ...b, status: "in-progress" } : b)),
      );
    },
    [update],
  );

  const capturePage = useCallback(
    (id: string) => {
      update((books) =>
        books.map((b) =>
          b.id === id
            ? { ...b, pages: [...b.pages, makePageImage(b, b.pages.length + 1)] }
            : b,
        ),
      );
    },
    [update],
  );

  const rescanLastPage = useCallback(
    (id: string) => {
      update((books) =>
        books.map((b) => {
          if (b.id !== id || b.pages.length === 0) return b;
          const pages = b.pages.slice(0, -1);
          pages.push(makePageImage(b, pages.length + 1));
          return { ...b, pages };
        }),
      );
    },
    [update],
  );

  const recapturePages = useCallback(
    (id: string, pageIndexes: number[]) => {
      update((books) =>
        books.map((b) => {
          if (b.id !== id || pageIndexes.length === 0) return b;
          const indexSet = new Set(pageIndexes);
          const pages = b.pages.map((src, i) =>
            indexSet.has(i) ? makePageImage(b, i + 1) : src,
          );
          return { ...b, pages };
        }),
      );
    },
    [update],
  );

  const finishBook = useCallback(
    (id: string) => {
      update((books) =>
        books.map((b) => (b.id === id ? { ...b, status: "done" } : b)),
      );
    },
    [update],
  );

  const resetBook = useCallback(
    (id: string) => {
      update((books) =>
        books.map((b) =>
          b.id === id ? { ...b, status: "unclaimed", pages: [] } : b,
        ),
      );
    },
    [update],
  );

  return {
    books,
    claimBook,
    capturePage,
    rescanLastPage,
    recapturePages,
    finishBook,
    resetBook,
  };
}
