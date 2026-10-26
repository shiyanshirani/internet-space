import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { placeLabel, type Photo } from "@/content/photos";
import { PhotoViewer } from "@/components/PhotoViewer";

// WebGL carousel (+ ogl) is only used on photo sections; keep it out of the main bundle.
const FlexCarousel = lazy(() => import("@/components/FlexCarousel"));

// Each carousel holds a WebGL context, and browsers drop the oldest once ~16
// are live (fewer on iOS). Mounting only near the viewport, and unmounting
// when scrolled away (the carousel's cleanup releases its context), keeps a
// page with many groups down to the 2-3 carousels actually on screen.
const MOUNT_MARGIN = "400px 0px";

const TILT = 62;
const BEND = 0.34;

type PhotoCarouselProps = {
  photos: Photo[];
  /** Flip the curl upside down, so stacked carousels can alternate into a zig-zag. */
  mirrored?: boolean;
};

/** Full-width FlexCarousel of photos, mounted only while near the viewport. */
export function PhotoCarousel({ photos, mirrored = false }: PhotoCarouselProps) {
  // Negating both the lens angle and the bend reflects the warp across the
  // horizontal axis without touching the vendored shader.
  const flip = mirrored ? -1 : 1;

  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

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
            // The built-in focus zoom is capped at 1.3x inside the canvas, so
            // any card click (or Enter on the centred card) opens the
            // viewport-sized viewer instead.
            focusOnClick={false}
            onItemClick={setExpanded}
            onSelect={setExpanded}
            captions
            fit="natural"
            radius={0}
            lensWidth={0.74}
            lensHeight={1.18}
            tilt={TILT * flip}
            roundness={1}
            bend={BEND * flip}
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
      <PhotoViewer
        photos={photos}
        index={expanded}
        onIndexChange={setExpanded}
        onClose={() => setExpanded(null)}
      />
    </div>
  );
}
