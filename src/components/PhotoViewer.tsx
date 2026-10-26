import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { placeLabel, type Photo } from "@/content/photos";

type PhotoViewerProps = {
  photos: Photo[];
  /** Index into `photos` of the photo shown; null keeps the viewer closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

/**
 * Viewport-sized photo viewer with previous/next (buttons and arrow keys),
 * wrapping at the ends. Native <dialog> gives Esc-to-close, focus trapping
 * and a backdrop for free.
 */
export function PhotoViewer({ photos, index, onIndexChange, onClose }: PhotoViewerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const isOpen = index !== null;
  const photo = isOpen ? photos[index] : null;
  const counter = isOpen && photos.length > 1 ? ` · ${index + 1} / ${photos.length}` : "";

  // Keyed on open/closed, not the index, so stepping between photos doesn't
  // re-run showModal or the scroll lock.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !isOpen) return;
    dialog.showModal();
    // A modal dialog doesn't stop the page behind it scrolling; scrolling it
    // could also unmount the carousel that owns this viewer.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
      if (dialog.open) dialog.close();
    };
  }, [isOpen]);

  // Warm the cache for the neighbours so stepping is instant.
  useEffect(() => {
    if (index === null || photos.length < 2) return;
    for (const offset of [-1, 1]) {
      new Image().src = photos[(index + offset + photos.length) % photos.length].full;
    }
  }, [index, photos]);

  const step = (offset: number) => {
    if (index === null) return;
    onIndexChange((index + offset + photos.length) % photos.length);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  };

  const navButton = (offset: number, label: string, glyph: string) => (
    <button
      type="button"
      aria-label={label}
      onClick={(e: MouseEvent) => {
        e.stopPropagation();
        step(offset);
      }}
      className={`fixed top-1/2 ${offset < 0 ? "left-2 sm:left-6" : "right-2 sm:right-6"} -translate-y-1/2 cursor-pointer rounded-full bg-black/40 px-4 py-3 text-2xl leading-none text-[#d4d4d4] backdrop-blur transition hover:bg-black/70 hover:text-white`}
    >
      {glyph}
    </button>
  );

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      onClick={() => ref.current?.close()}
      className="m-auto max-h-none max-w-none cursor-zoom-out bg-transparent p-0 backdrop:bg-black/90"
    >
      {photo && (
        <>
          <figure className="flex flex-col items-center">
            <img
              key={photo.id}
              src={photo.full}
              alt={placeLabel(photo)}
              className="max-h-[90vh] max-w-[95vw] object-contain"
            />
            <figcaption className="mt-2 font-mono text-xs text-[#a3a3a3]">
              {placeLabel(photo)}
              {counter}
            </figcaption>
          </figure>
          {photos.length > 1 && (
            <>
              {navButton(-1, "Previous photo", "‹")}
              {navButton(1, "Next photo", "›")}
            </>
          )}
        </>
      )}
    </dialog>
  );
}
