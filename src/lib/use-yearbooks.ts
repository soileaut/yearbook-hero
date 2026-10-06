import { useCallback, useState } from "react";
import { loadYearbooks, saveYearbooks, type Yearbook } from "./yearbooks";

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

  /** Append a newly captured (and already compressed) page image to a book. */
  const capturePage = useCallback(
    (id: string, imageSrc: string) => {
      update((books) =>
        books.map((b) =>
          b.id === id ? { ...b, pages: [...b.pages, imageSrc] } : b,
        ),
      );
    },
    [update],
  );

  /** Replace the pages at the given 0-based indexes with a newly captured
   * image. In practice this is always called with a single index at a time
   * (one camera tap = one replaced page), but the array signature is kept
   * in case batch replacement is ever useful. */
  const recapturePages = useCallback(
    (id: string, pageIndexes: number[], imageSrc: string) => {
      update((books) =>
        books.map((b) => {
          if (b.id !== id || pageIndexes.length === 0) return b;
          const indexSet = new Set(pageIndexes);
          const pages = b.pages.map((src, i) => (indexSet.has(i) ? imageSrc : src));
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
    recapturePages,
    finishBook,
    resetBook,
  };
}
