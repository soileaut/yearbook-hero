import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Flag, Loader2, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useYearbooks } from "@/lib/use-yearbooks";
import { captureVideoFrame, compressImageFile } from "@/lib/yearbooks";

const scanSearchSchema = z.object({
  // comma-separated page indexes (0-based) queued for recapture, e.g. "2,5,6"
  recapture: z.string().optional(),
});

export const Route = createFileRoute("/scan/$bookId")({
  validateSearch: scanSearchSchema,
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
  const search = Route.useSearch();
  const { books, capturePage, recapturePages, finishBook } = useYearbooks();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === bookId);

  const [popKey, setPopKey] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live in-browser camera (getUserMedia). Falls back to the hidden file
  // input below if camera access isn't available/granted (e.g. desktop
  // testing without a webcam, or a denied permission prompt).
  const [cameraState, setCameraState] = useState<"starting" | "ready" | "unavailable">(
    "starting",
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Some mobile browsers/webviews don't reliably honor the autoPlay
          // attribute alone, especially inside an embedded preview iframe.
          videoRef.current.play().catch(() => {
            // Autoplay can be blocked without user interaction in some
            // contexts; the video element stays attached and playable once
            // the user taps something, so this isn't fatal.
          });
        }
        setCameraState("ready");
      } catch {
        if (active) setCameraState("unavailable");
      }
    }

    start();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Queue of 0-based page indexes being recaptured, in the order selected.
  // Consumed one at a time as the camera button is tapped.
  const recaptureQueue = useMemo(
    () =>
      search.recapture
        ? search.recapture
            .split(",")
            .map((n) => Number.parseInt(n, 10))
            .filter((n) => Number.isInteger(n))
        : [],
    [search.recapture],
  );
  const [remaining, setRemaining] = useState(recaptureQueue);
  const isRecapture = recaptureQueue.length > 0;

  // Set when "Rescan last page" is tapped mid-session: waits for the next
  // camera tap to replace that one page, then returns to normal capture —
  // unlike the queue above, this never navigates away from this screen.
  const [localRescanIndex, setLocalRescanIndex] = useState<number | null>(null);
  const isLocalRescan = !isRecapture && localRescanIndex !== null;

  useEffect(() => {
    if (!book) {
      navigate({ to: "/registry" });
    }
  }, [book, navigate]);

  if (!book) return null;

  const pageCount = book.pages.length;
  const currentTargetIndex = remaining[0];

  // Shared by both capture paths (live camera frame or file-picker fallback)
  // — routes the freshly captured image to whichever mode is active:
  // queue-based recapture, local single-page rescan, or a normal new page.
  const processCapturedImage = (imageSrc: string) => {
    if (isRecapture) {
      if (currentTargetIndex === undefined) return;
      recapturePages(book.id, [currentTargetIndex], imageSrc);
      setPopKey((k) => k + 1);
      const next = remaining.slice(1);
      setRemaining(next);
      if (next.length === 0) {
        toast.success(
          `Recaptured ${recaptureQueue.length} ${recaptureQueue.length === 1 ? "page" : "pages"}`,
        );
        navigate({ to: "/review/$bookId", params: { bookId: book.id } });
      }
      return;
    }
    if (isLocalRescan && localRescanIndex !== null) {
      recapturePages(book.id, [localRescanIndex], imageSrc);
      setPopKey((k) => k + 1);
      setLocalRescanIndex(null);
      toast.success(`Page ${localRescanIndex + 1} rescanned`);
      return;
    }
    capturePage(book.id, imageSrc);
    setPopKey((k) => k + 1);
  };

  // Camera button: grab a frame from the live preview if it's running,
  // otherwise fall back to the hidden file input (which on a phone browser
  // still launches the native camera via capture="environment").
  const handleCapture = () => {
    if (cameraState === "ready" && videoRef.current) {
      setIsProcessing(true);
      try {
        const imageSrc = captureVideoFrame(videoRef.current);
        processCapturedImage(imageSrc);
      } catch {
        toast.error("Couldn't capture that frame — try again.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset immediately so selecting/retaking the same shot again still fires
    // onChange next time (mobile browsers won't re-fire for an unchanged value).
    e.target.value = "";
    if (!file) return;

    setIsProcessing(true);
    try {
      const imageSrc = await compressImageFile(file);
      processCapturedImage(imageSrc);
    } catch {
      toast.error("Couldn't process that photo — try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRescanLastPage = () => {
    if (pageCount === 0) return;
    setLocalRescanIndex(pageCount - 1);
  };

  const handleFinish = () => {
    finishBook(book.id);
    navigate({ to: "/complete/$bookId", params: { bookId: book.id } });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-6 pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        {isRecapture ? (
          <Link
            to="/review/$bookId"
            params={{ bookId: book.id }}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"
            aria-label="Back to review"
          >
            <ArrowLeft className="size-5" />
          </Link>
        ) : (
          <Link
            to="/registry"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"
            aria-label="Back to registry"
          >
            <ArrowLeft className="size-5" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black tracking-tight text-foreground">
            {book.school}
          </h1>
          <p className="text-sm text-muted-foreground">{book.year} Yearbook</p>
        </div>
      </header>

      <div className="mt-8 flex flex-col items-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
          {isRecapture || isLocalRescan ? "Recapturing" : "Now capturing"}
        </p>
        <p
          key={popKey}
          className="animate-page-pop mt-1 text-6xl font-black tabular-nums tracking-tight text-primary"
        >
          Page{" "}
          {isRecapture
            ? (currentTargetIndex ?? 0) + 1
            : isLocalRescan
              ? (localRescanIndex ?? 0) + 1
              : pageCount + 1}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRecapture
            ? `${remaining.length} of ${recaptureQueue.length} selected pages left to recapture`
            : isLocalRescan
              ? "Tap the camera button to retake this page"
              : `${pageCount} ${pageCount === 1 ? "page" : "pages"} in the stack`}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelected}
          className="hidden"
        />

        <div
          className="relative mt-6 w-full max-w-[220px] overflow-hidden rounded-2xl bg-black shadow-lg"
          style={{ aspectRatio: "612 / 792" }}
        >
          {/* Always mounted (never conditionally rendered) so the ref exists
              before getUserMedia resolves — otherwise the stream has nothing
              to attach to and the preview silently stays blank. */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${
              cameraState === "ready" ? "" : "opacity-0"
            }`}
          />
          {cameraState === "ready" && (
            // Alignment guide: box-shadow spread darkens everything outside
            // this frame, showing where to position the page.
            <div
              className="pointer-events-none absolute inset-3 rounded-md border-2 border-dashed border-white/80"
              style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }}
            />
          )}
          {cameraState === "starting" && (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs font-semibold text-white/70">
              Starting camera…
            </div>
          )}
          {cameraState === "unavailable" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-xs font-semibold text-white/70">
              <Camera className="size-6" />
              Camera unavailable — tap below to choose a photo instead.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleCapture}
          disabled={isProcessing}
          className="mt-6 grid size-40 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xl ring-8 ring-primary/15 transition-transform active:scale-90 disabled:opacity-60"
          aria-label="Capture page"
        >
          {isProcessing ? (
            <Loader2 className="size-16 animate-spin" />
          ) : (
            <Camera className="size-16" />
          )}
        </button>

        {!isRecapture && !isLocalRescan && (
          <div className="mt-8 flex w-full max-w-sm gap-3">
            <button
              type="button"
              onClick={handleRescanLastPage}
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
        )}

        {isLocalRescan && (
          <button
            type="button"
            onClick={() => setLocalRescanIndex(null)}
            className="mt-8 inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-bold text-card-foreground"
          >
            <X className="size-4" /> Cancel — back to next new page
          </button>
        )}
      </div>

      <div className="mt-auto pt-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Captured pages {!isRecapture && pageCount > 0 && "— tap a page to rescan it"}
        </p>
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-3">
          {pageCount === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No pages yet — tap the camera button to capture your first page.
            </p>
          ) : (
            book.pages.map((src, i) => {
              const isTarget = isLocalRescan && localRescanIndex === i;
              return (
                <button
                  key={`${i}-${src.length}`}
                  type="button"
                  onClick={() => !isRecapture && setLocalRescanIndex(i)}
                  disabled={isRecapture}
                  aria-label={`Rescan page ${i + 1}`}
                  className={`animate-thumb-in relative h-24 w-auto shrink-0 overflow-hidden rounded-lg border-2 shadow-sm transition-transform disabled:cursor-default ${
                    isTarget
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-border"
                  } ${!isRecapture ? "active:scale-95" : ""}`}
                >
                  <img
                    src={src}
                    alt={`Page ${i + 1}`}
                    className="h-24 w-auto shrink-0"
                  />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
