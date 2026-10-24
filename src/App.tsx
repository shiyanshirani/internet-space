import { useLayoutEffect, type ReactNode } from "react";
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
import { remarkKramdownIal } from "@/content/remark-kramdown-ial";
import { CodeBlock } from "@/content/code-block";
import { photoGroups, photos, placeLabel } from "@/content/photos";
import LineSidebar from "@/components/LineSidebar";
import { PhotoCarousel } from "@/components/PhotoCarousel";

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
        <Route path="/:slug" element={<PostPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
function Column({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-2xl px-6">{children}</div>;
}

function HomePage() {
  const navigate = useNavigate();

  return (
    <main>
      <Column>
        <h1 className="text-base font-bold text-[#e5e5e5]">Shiyan Shirani</h1>
        <p className="mt-2 max-w-prose text-sm leading-6 text-[#a3a3a3]">
          Backend-leaning engineer. No hero animation, no gradients — just the writing.
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

      {photoGroups.map((group) => (
        <section key={`${group.country}/${group.city}`} className="mt-10">
          <Column>
            <h2 className="text-xs uppercase tracking-wide text-[#6b6b6b]">
              # {placeLabel(group)}
              <span className="ml-2 normal-case">({group.photos.length})</span>
            </h2>
          </Column>
          <div className="mt-4">
            <PhotoCarousel photos={group.photos} />
          </div>
        </section>
      ))}
    </main>
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
          <time>{post.date}</time>
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
