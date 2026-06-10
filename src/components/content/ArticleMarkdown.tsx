import Link from "next/link";
import type { ReactNode } from "react";
import { CodeBlock } from "@/components/plays/CodeBlock";

type InlineNode = ReactNode;

function isExternalUrl(href: string) {
  return /^https?:\/\//i.test(href);
}

function parseInline(text: string): InlineNode[] {
  const out: InlineNode[] = [];
  let i = 0;

  const pushText = (s: string) => {
    if (s) out.push(s);
  };

  while (i < text.length) {
    const rest = text.slice(i);

    const codeStart = rest.indexOf("`");
    const linkStart = rest.indexOf("[");
    const boldStart = rest.indexOf("**");
    const italicStart = rest.indexOf("*");

    const candidates = [
      codeStart >= 0 ? i + codeStart : Infinity,
      linkStart >= 0 ? i + linkStart : Infinity,
      boldStart >= 0 ? i + boldStart : Infinity,
      italicStart >= 0 ? i + italicStart : Infinity,
    ];
    const next = Math.min(...candidates);

    if (!Number.isFinite(next) || next === Infinity) {
      pushText(text.slice(i));
      break;
    }

    if (next > i) {
      pushText(text.slice(i, next));
      i = next;
      continue;
    }

    // Inline code: `code`
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i + 1) {
        const code = text.slice(i + 1, end);
        out.push(
          <code
            key={`code-${i}`}
            className="rounded bg-ink/5 px-1 py-0.5 font-mono text-[0.92em] text-ink"
          >
            {code}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }

    // Link: [text](href)
    if (text[i] === "[") {
      const closeBracket = text.indexOf("]", i + 1);
      const openParen = closeBracket >= 0 ? text[closeBracket + 1] : "";
      if (closeBracket >= 0 && openParen === "(") {
        const closeParen = text.indexOf(")", closeBracket + 2);
        if (closeParen >= 0) {
          const label = text.slice(i + 1, closeBracket);
          const href = text.slice(closeBracket + 2, closeParen).trim();
          if (href) {
            out.push(
              isExternalUrl(href) ? (
                // eslint-disable-next-line @next/next/no-html-link-for-pages
                <a
                  key={`a-${i}`}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold text-ink hover:underline"
                >
                  {label || href}
                </a>
              ) : (
                <Link
                  key={`l-${i}`}
                  href={href}
                  className="font-semibold text-ink hover:underline"
                >
                  {label || href}
                </Link>
              ),
            );
            i = closeParen + 1;
            continue;
          }
        }
      }
    }

    // Bold: **text**
    if (text.slice(i, i + 2) === "**") {
      const end = text.indexOf("**", i + 2);
      if (end > i + 2) {
        const inner = text.slice(i + 2, end);
        out.push(
          <strong key={`b-${i}`} className="font-semibold text-ink">
            {inner}
          </strong>,
        );
        i = end + 2;
        continue;
      }
    }

    // Italic: *text* (avoid matching **)
    if (text[i] === "*" && text[i + 1] !== "*") {
      const end = text.indexOf("*", i + 1);
      if (end > i + 1) {
        const inner = text.slice(i + 1, end);
        out.push(
          <em key={`i-${i}`} className="italic text-ink">
            {inner}
          </em>,
        );
        i = end + 1;
        continue;
      }
    }

    // Fallback: emit the current character as text
    pushText(text[i]);
    i += 1;
  }

  return out;
}

type Block =
  | { type: "h"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; lang: string; code: string };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let paragraph: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let inCode: { lang: string; lines: string[] } | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "p", lines: paragraph });
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    blocks.push({ type: list.type, items: list.items });
    list = null;
  };

  const flushCode = () => {
    if (!inCode) return;
    blocks.push({
      type: "code",
      lang: inCode.lang || "text",
      code: inCode.lines.join("\n").replace(/\n+$/, ""),
    });
    inCode = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "  ");

    const fence = /^```(\S*)\s*$/.exec(line);
    if (fence) {
      flushParagraph();
      flushList();
      if (inCode) {
        flushCode();
      } else {
        inCode = { lang: fence[1] || "text", lines: [] };
      }
      continue;
    }

    if (inCode) {
      inCode.lines.push(rawLine);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({ type: "h", level, text: heading[2].trim() });
      continue;
    }

    const ul = /^-\s+(.+)$/.exec(trimmed);
    if (ul) {
      flushParagraph();
      if (!list || list.type !== "ul") list = { type: "ul", items: [] };
      list.items.push(ul[1]);
      continue;
    }

    const ol = /^(\d+)\.\s+(.+)$/.exec(trimmed);
    if (ol) {
      flushParagraph();
      if (!list || list.type !== "ol") list = { type: "ol", items: [] };
      list.items.push(ol[2]);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushCode();
  flushList();
  flushParagraph();

  return blocks;
}

function Heading({
  level,
  children,
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
}) {
  const Tag = (`h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6");
  const className =
    level === 1
      ? "text-xl font-semibold tracking-tight"
      : level === 2
        ? "text-lg font-semibold tracking-tight"
        : level === 3
          ? "text-base font-semibold tracking-tight"
          : "text-sm font-semibold tracking-tight";
  return <Tag className={className}>{children}</Tag>;
}

export function ArticleMarkdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);

  return (
    <div className="space-y-4 text-sm leading-7 text-ink">
      {blocks.map((b, idx) => {
        if (b.type === "h") {
          return (
            <Heading key={`h-${idx}`} level={b.level}>
              {parseInline(b.text)}
            </Heading>
          );
        }

        if (b.type === "code") {
          return (
            <div key={`c-${idx}`} className="pt-1">
              <CodeBlock language={b.lang} code={b.code} />
            </div>
          );
        }

        if (b.type === "ul") {
          return (
            <ul key={`ul-${idx}`} className="list-disc space-y-1 pl-5">
              {b.items.map((it, i) => (
                <li key={`uli-${idx}-${i}`}>{parseInline(it)}</li>
              ))}
            </ul>
          );
        }

        if (b.type === "ol") {
          return (
            <ol key={`ol-${idx}`} className="list-decimal space-y-1 pl-5">
              {b.items.map((it, i) => (
                <li key={`oli-${idx}-${i}`}>{parseInline(it)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`p-${idx}`} className="whitespace-pre-wrap">
            {parseInline(b.lines.join(" "))}
          </p>
        );
      })}
    </div>
  );
}
