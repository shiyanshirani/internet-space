import type { ComponentPropsWithoutRef } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import vscDarkPlus from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus";

// Only the languages the posts actually fence code with — registering the
// full Prism language set would bloat the bundle for no benefit.
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("python", python);

const LANGUAGE_ALIASES: Record<string, string> = {
  python3: "python",
  sh: "bash",
  shell: "bash",
};

/**
 * react-markdown's `code` renderer for both fenced blocks (has a
 * `language-xxx` className) and inline code (no className). Fenced blocks
 * get real syntax highlighting; inline code falls back to the plain
 * `.prose-post code` styling in index.css.
 */
export function CodeBlock({ className, children }: ComponentPropsWithoutRef<"code">) {
  const match = /language-(\w+)/.exec(className ?? "");

  if (!match) {
    return <code className={className}>{children}</code>;
  }

  const language = LANGUAGE_ALIASES[match[1]] ?? match[1];

  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      PreTag="div"
      customStyle={{ background: "transparent", margin: 0, padding: 0 }}
      codeTagProps={{ style: { fontFamily: "inherit", background: "transparent" } }}
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
}
