import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { placeLabel, type Photo } from "@/content/photos";

// WebGL carousel (+ ogl) is only used on photo sections; keep it out of the main bundle.
const FlexCarousel = lazy(() => import("@/components/FlexCarousel"));

// Each carousel holds a WebGL context, and browsers drop the oldest once ~16
// are live (fewer on iOS). Mounting only near the viewport, and unmounting
// when scrolled away (the carousel's cleanup releases its context), keeps a
// page with many groups down to the 2-3 carousels actually on screen.
const MOUNT_MARGIN = "400px 0px";

/** Full-width FlexCarousel of photos, mounted only while near the viewport. */
export function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [expanded, setExpanded] = useState<Photo | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: MOUNT_MARGIN,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const items = photos.map((photo) => ({
    src: photo.src,
    alt: placeLabel(photo),
    title: placeLabel(photo),
  }));

  return (
    <div ref={ref} className="relative h-[420px] w-full sm:h-[560px]">
      {near && (
        <Suspense fallback={null}>
          <FlexCarousel
            items={items}
            preset="liquid"
            intro="rise"
            cardHeight={0.5}
            gap={12}
            squeeze={0.2}
            // The built-in focus zoom is capped at 1.3x inside the canvas;
            // selecting the centred card opens a viewport-sized viewer instead.
            focusOnClick={false}
            onSelect={(index) => setExpanded(photos[index])}
            captions
            fit="natural"
            radius={0}
            lensWidth={0.74}
            lensHeight={1.18}
            tilt={62}
            roundness={1}
            bend={0.34}
            reach={0.38}
            curl="twist"
            dispersion={0.45}
            liquid={0}
            followCursor={false}
            autoplay={false}
            interval={4}
            // Full-width means the cursor is always over it; capturing the
            // vertical wheel would trap mouse users mid-page.
            captureWheel={false}
          />
        </Suspense>
      )}
      <PhotoViewer photo={expanded} onClose={() => setExpanded(null)} />
    </div>
  );
}

// Native <dialog> gives Esc-to-close, focus trapping and a backdrop for free.
function PhotoViewer({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !photo) return;
    dialog.showModal();
    // A modal dialog doesn't stop the page behind it scrolling; scrolling it
    // would also unmount this carousel (and the dialog) via the observer.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
      if (dialog.open) dialog.close();
    };
  }, [photo]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={() => ref.current?.close()}
      className="m-auto max-h-none max-w-none cursor-zoom-out bg-transparent p-0 backdrop:bg-black/90"
    >
      {photo && (
        <figure className="flex flex-col items-center">
          <img
            src={photo.full}
            alt={placeLabel(photo)}
            className="max-h-[90vh] max-w-[95vw] object-contain"
          />
          <figcaption className="mt-2 font-mono text-xs text-[#a3a3a3]">{placeLabel(photo)}</figcaption>
        </figure>
      )}
    </dialog>
  );
}
