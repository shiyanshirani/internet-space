import { visit } from "unist-util-visit";
import type { Image, Link, Parent, Root } from "mdast";

const IAL_PATTERN = /^\{:\s*([^}]+)\}/;
const ATTR_PATTERN = /([\w-]+)\s*=\s*"([^"]*)"/g;

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of raw.matchAll(ATTR_PATTERN)) {
    const [, key, value] = match;
    attrs[key] = value;
  }
  return attrs;
}

/**
 * Kramdown (Jekyll's markdown engine) lets you tag a link/image with an
 * Inline Attribute List right after it, e.g. `[text](url){:target="_blank"}`.
 * That's Kramdown-only syntax — CommonMark/GFM (what remark implements)
 * has no equivalent, so remark-gfm was rendering it as literal trailing
 * text instead of an attribute.
 *
 * This plugin recognizes that exact pattern immediately following a link
 * or image, turns it into real hast properties (so remark-rehype emits
 * actual HTML attributes), and removes the marker text — so posts written
 * the same way they always were on Jekyll keep working unchanged.
 */
export function remarkKramdownIal() {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (index === undefined || !parent) return;
      if (node.type !== "link" && node.type !== "image") return;

      const target = node as Link | Image;
      const siblings = (parent as Parent).children;
      const next = siblings[index + 1];
      if (!next || next.type !== "text") return;

      const match = IAL_PATTERN.exec(next.value);
      if (!match) return;

      const attrs = parseAttributes(match[1]);
      if (Object.keys(attrs).length === 0) return;

      // target="_blank" without rel="noopener noreferrer" lets the opened
      // page reach back via window.opener (reverse tabnabbing) — close
      // that gap here so every post gets it for free.
      if (attrs.target === "_blank" && !attrs.rel) {
        attrs.rel = "noopener noreferrer";
      }

      target.data ??= {};
      target.data.hProperties = { ...(target.data.hProperties as object), ...attrs };

      next.value = next.value.slice(match[0].length);
      if (next.value === "") {
        siblings.splice(index + 1, 1);
      }
    });
  };
}
