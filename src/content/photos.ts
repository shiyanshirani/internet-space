export type Place = {
  city: string;
  country: string;
  /** Folder path `<country>/<city>`, used as the place's URL and grouping key. */
  slug: string;
};

export type Photo = Place & {
  id: string;
  src: string;
  full: string;
};

export type PhotoGroup = Place & {
  photos: Photo[];
};

// vite-imagetools resizes and re-encodes at build time, so originals of any
// size can be dropped into ./photos without bloating the page. Carousel cards
// are a fixed height, so size by height: 800px covers a focused card (~1.3x a
// 280px card) on a 2x display for any aspect ratio.
const sources = import.meta.glob("./photos/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  query: { h: "800", format: "webp" },
  import: "default",
  eager: true,
}) as Record<string, string>;

// Expanded view fills the viewport: longest side 2400px is sharp on 2x
// displays up to ~1200 CSS px. Only fetched when a photo is opened.
const fulls = import.meta.glob("./photos/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  query: { w: "2400", h: "2400", fit: "inside", withoutEnlargement: "true", format: "webp" },
  import: "default",
  eager: true,
}) as Record<string, string>;

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Location comes from the folder, not EXIF GPS: edited or exported photos
// lose GPS, and folders are explicit. Layout: photos/<country>/<city>/<file>.
function parsePath(path: string): (Place & { id: string }) | null {
  const parts = path.split("/");
  if (parts.length !== 5) {
    console.warn(`Skipping ${path}: photos must live in photos/<country>/<city>/`);
    return null;
  }
  const [, , country, city, file] = parts;
  const slug = `${country}/${city}`;
  return { id: `${slug}/${file}`, slug, city: titleCase(city), country: titleCase(country) };
}

export function placeLabel({ city, country }: Place): string {
  return city === country ? city : `${city}, ${country}`;
}

export const photos: Photo[] = Object.keys(sources)
  .flatMap((path) => {
    const place = parsePath(path);
    return place ? [{ ...place, src: sources[path], full: fulls[path] }] : [];
  })
  .sort((a, b) => a.id.localeCompare(b.id));

export const photoGroups: PhotoGroup[] = photos.reduce<PhotoGroup[]>((groups, photo) => {
  const last = groups[groups.length - 1];
  if (last?.slug === photo.slug) {
    last.photos.push(photo);
  } else {
    groups.push({ city: photo.city, country: photo.country, slug: photo.slug, photos: [photo] });
  }
  return groups;
}, []);

export function getPhotoGroup(slug: string): PhotoGroup | undefined {
  return photoGroups.find((group) => group.slug === slug);
}
