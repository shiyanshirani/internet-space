import { useLayoutEffect, useState, type ReactNode } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
  useParams,
} from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPost, posts } from "@/content/posts";
import { formatPostDate } from "@/content/post-parser";
import { remarkKramdownIal } from "@/content/remark-kramdown-ial";
import { CodeBlock } from "@/content/code-block";
import {
  getPhotoGroup,
  photoGroups,
  photos,
  placeLabel,
  type PhotoGroup,
} from "@/content/photos";
import LineSidebar from "@/components/LineSidebar";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { PhotoViewer } from "@/components/PhotoViewer";

// Every carousel photo is a live WebGL texture (~3 MB of GPU memory each),
// so the home page shows a capped selection; /photos has the rest.
const HOME_PHOTO_COUNT = 12;

const homePhotos = photos.slice(0, HOME_PHOTO_COUNT);

/**
 * No motion, no gradients, system monospace. Every post gets the same
 * plain treatment, sorted by date.
 */
export function App() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] py-12 font-mono text-[#d4d4d4]">
      <ScrollToTop />
      <Column>
        <header className="mb-12 border-b border-[#262626] pb-4">
          <Link to="/" className="text-sm text-[#e5e5e5] hover:underline">
            shiyan@shirani:~$
          </Link>
        </header>
      </Column>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/photos" element={<PhotosPage />} />
        <Route path="/photos/:country/:city" element={<PlacePage />} />
        <Route path="/:slug" element={<PostPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Column>
        <footer className="mt-16 border-t border-[#262626] pt-4">
          {/* Plain <a>: feed.xml is a static file, not a client-side route. */}
          <a href="/feed.xml" className="text-xs text-[#6b6b6b] hover:text-[#a3a3a3] hover:underline">
            rss
          </a>
        </footer>
      </Column>
    </div>
  );
}

// BrowserRouter keeps the old scroll offset across client-side navigations.
// Reset only on PUSH/REPLACE: on POP (back/forward) the browser restores the
// previous position itself, and resetting would lose your place in the list.
function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType !== "POP") window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
}

// The reading column lives in each page, not the shell, so a page can break
// out to full viewport width (e.g. the home carousel) without 100vw hacks.
function Column({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto px-6 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>{children}</div>;
}

function HomePage() {
  const navigate = useNavigate();

  return (
    <main>
      <Column>
        <p className="max-w-prose text-sm leading-6 text-[#a3a3a3]">
          A small space of mine on the internet, where I keep posting photos from my travels
          and writing about the things I love.
        </p>
      </Column>

      {homePhotos.length > 0 && (
        <section className="mt-10">
          <Column>
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs uppercase tracking-wide text-[#6b6b6b]"># photos</h2>
              <Link to="/photos" className="text-xs text-[#6b6b6b] hover:text-[#a3a3a3] hover:underline">
                see all &rarr;
              </Link>
            </div>
          </Column>
          <div className="mt-4">
            <PhotoCarousel photos={homePhotos} />
          </div>
        </section>
      )}

      <Column>
        <h2 className="mt-10 text-xs uppercase tracking-wide text-[#6b6b6b]"># posts</h2>
        <LineSidebar
          className="mt-4"
          items={posts.map((post) => post.title)}
          accentColor="#A855F7"
          textColor="#c4c4c4"
          markerColor="#6c6c6c"
          showIndex
          showMarker
          proximityRadius={40}
          maxShift={30}
          falloff="smooth"
          markerLength={60}
          markerGap={0}
          tickScale={0.5}
          scaleTick
          itemGap={20}
          fontSize={1.1}
          smoothing={100}
          defaultActive={null}
          onItemClick={(index) => navigate(`/${posts[index].slug}`)}
        />
      </Column>
    </main>
  );
}

function PhotosPage() {
  return (
    <main>
      <Column>
        <Link to="/" className="text-xs text-[#6b6b6b] hover:text-[#a3a3a3] hover:underline">
          &larr; back
        </Link>
        <h1 className="mt-4 text-lg font-bold text-[#e5e5e5]">Photos</h1>
      </Column>

      {photoGroups.map((group, index) => (
        <section key={group.slug} className="mt-12">
          <Column>
            <Link to={`/photos/${group.slug}`} className="group inline-block">
              <PlaceHeading group={group} as="h2" linked />
            </Link>
          </Column>
          <div className="mt-4">
            <PhotoCarousel photos={group.photos} mirrored={index % 2 === 1} />
          </div>
        </section>
      ))}
    </main>
  );
}

function PlacePage() {
  const { country, city } = useParams();
  const group = getPhotoGroup(`${country}/${city}`);
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!group) {
    return <Navigate to="/photos" replace />;
  }

  return (
    <main>
      <Column>
        <Link to="/photos" className="text-xs text-[#6b6b6b] hover:text-[#a3a3a3] hover:underline">
          &larr; all photos
        </Link>
        <div className="mt-6">
          <PlaceHeading group={group} as="h1" />
        </div>
      </Column>
      {/* Text stays in the reading column; only the grid widens for the photos. */}
      <Column wide>
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {group.photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setExpanded(index)}
              className="group aspect-square cursor-zoom-in overflow-hidden rounded-sm bg-[#141414]"
            >
              <img
                src={photo.src}
                alt={placeLabel(photo)}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-90"
              />
            </button>
          ))}
        </div>
      </Column>
      <PhotoViewer
        photos={group.photos}
        index={expanded}
        onIndexChange={setExpanded}
        onClose={() => setExpanded(null)}
      />
    </main>
  );
}

type PlaceHeadingProps = {
  group: PhotoGroup;
  as: "h1" | "h2";
  /** Show the hover arrow; set when the heading sits inside a link. */
  linked?: boolean;
};

// "City, Country" as the headline, with the photo count as a small
// spaced-out kicker.
function PlaceHeading({ group, as: Heading, linked = false }: PlaceHeadingProps) {
  const count = `${group.photos.length} ${group.photos.length === 1 ? "photo" : "photos"}`;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#6b6b6b]">{count}</p>
      <Heading className="mt-1 flex items-baseline gap-3 text-2xl font-bold tracking-tight text-[#e5e5e5]">
        {placeLabel(group)}
        {linked && (
          <span
            aria-hidden="true"
            className="text-base font-normal text-[#6b6b6b] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#a3a3a3]"
          >
            &rarr;
          </span>
        )}
      </Heading>
    </div>
  );
}

function PostPage() {
  const { slug } = useParams();
  const post = slug ? getPost(slug) : undefined;

  if (!post) {
    return <Navigate to="/" replace />;
  }

  return (
    <Column>
      <main>
        <Link to="/" className="text-xs text-[#6b6b6b] hover:text-[#a3a3a3] hover:underline">
          &larr; back
        </Link>

        <h1 className="mt-4 text-lg font-bold text-[#e5e5e5]">{post.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6b6b6b]">
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>

        <article className="prose-post mt-8 text-sm leading-7 text-[#c4c4c4]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkKramdownIal]}
            components={{ code: CodeBlock }}
          >
            {post.body}
          </ReactMarkdown>
        </article>
      </main>
    </Column>
  );
}
