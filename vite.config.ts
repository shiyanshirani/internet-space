import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { imagetools } from "vite-imagetools";
import { fileURLToPath, URL } from "node:url";
import { rssFeed } from "./feed-plugin";

// Absolute origin the site is deployed to; RSS requires absolute links.
const SITE_URL = "https://shiyanshirani.github.io";

export default defineConfig({
  plugins: [
    react(),
    // The default filter is case-sensitive, so phone exports like IMG_1234.JPG
    // would bypass resizing and ship as originals with GPS EXIF intact.
    imagetools({ include: /^[^?]+\.(avif|gif|heif|jpeg|jpg|png|tiff|webp)(\?.*)?$/i }),
    rssFeed({
      siteUrl: SITE_URL,
      postsDir: fileURLToPath(new URL("./src/content/posts", import.meta.url)),
      title: "Shiyan Shirani",
      description: "A small space on the internet for travel photos and writing about the things I love.",
      author: "Shiyan Shirani",
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
