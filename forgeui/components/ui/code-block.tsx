"use client";

import { useCopy } from "@/hooks/use-copy";
import { IconCheck, IconCopy } from "@/components/ui/icons";
import { cn } from "@/utils/cn";
import { useMemo } from "react";

interface CodeBlockProps {
  code: string;
  language?: "tsx" | "ts" | "css" | "json" | "html";
  filename?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  className?: string;
}

// Simple regex-based tokenizer. Not perfect but good enough for display.
function tokenize(code: string, language: string): Array<{ type: string; value: string }> {
  if (language === "json") {
    return tokenizeJson(code);
  }
  if (language === "css") {
    return tokenizeCss(code);
  }
  return tokenizeTs(code);
}

const TS_KEYWORDS = new Set([
  "import", "export", "from", "default", "const", "let", "var", "function", "return",
  "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "new",
  "this", "typeof", "instanceof", "in", "of", "class", "extends", "implements",
  "interface", "type", "enum", "namespace", "as", "is", "void", "null", "undefined",
  "true", "false", "async", "await", "try", "catch", "finally", "throw", "yield",
  "static", "public", "private", "protected", "readonly", "abstract",
]);

const TS_BUILTINS = new Set([
  "string", "number", "boolean", "any", "unknown", "never", "object", "Array",
  "Promise", "Record", "Partial", "Required", "Readonly", "ReactNode", "ReactElement",
  "FC", "useState", "useEffect", "useRef", "useMemo", "useCallback", "useContext",
  "forwardRef", "React",
]);

function tokenizeTs(code: string): Array<{ type: string; value: string }> {
  const tokens: Array<{ type: string; value: string }> = [];
  // Order matters
  const re =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(<\/?[A-Z][A-Za-z0-9]*|<\/?[a-z][A-Za-z0-9-]*)|(\b[A-Za-z_$][A-Za-z0-9_$]*\b)|([{}()[\];,.<>=+\-*/%!&|?:])|(\s+)|([\s\S])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m[1] !== undefined) tokens.push({ type: "comment", value: m[1] });
    else if (m[2] !== undefined) tokens.push({ type: "string", value: m[2] });
    else if (m[3] !== undefined) tokens.push({ type: "number", value: m[3] });
    else if (m[4] !== undefined) tokens.push({ type: "tag", value: m[4] });
    else if (m[5] !== undefined) {
      const word = m[5];
      if (TS_KEYWORDS.has(word)) tokens.push({ type: "keyword", value: word });
      else if (TS_BUILTINS.has(word)) tokens.push({ type: "builtin", value: word });
      else tokens.push({ type: "ident", value: word });
    }
    else if (m[6] !== undefined) tokens.push({ type: "punct", value: m[6] });
    else if (m[7] !== undefined) tokens.push({ type: "ws", value: m[7] });
    else tokens.push({ type: "text", value: m[8] });
  }
  return tokens;
}

function tokenizeJson(code: string): Array<{ type: string; value: string }> {
  const tokens: Array<{ type: string; value: string }> = [];
  const re = /("(?:[^"\\]|\\.)*"\s*:)|("(?:[^"\\]|\\.)*")|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?)|([{}[\],:])|(\s+)|([\s\S])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m[1] !== undefined) tokens.push({ type: "key", value: m[1] });
    else if (m[2] !== undefined) tokens.push({ type: "string", value: m[2] });
    else if (m[3] !== undefined) tokens.push({ type: "keyword", value: m[3] });
    else if (m[4] !== undefined) tokens.push({ type: "number", value: m[4] });
    else if (m[5] !== undefined) tokens.push({ type: "punct", value: m[5] });
    else if (m[6] !== undefined) tokens.push({ type: "ws", value: m[6] });
    else tokens.push({ type: "text", value: m[7] });
  }
  return tokens;
}

function tokenizeCss(code: string): Array<{ type: string; value: string }> {
  const tokens: Array<{ type: string; value: string }> = [];
  const re = /(\/\*[\s\S]*?\*\/)|(--[A-Za-z0-9-]+)|(#[0-9A-Fa-f]{3,8}\b)|(\b\d+(?:\.\d+)?(?:px|rem|em|%|s|ms|deg)?\b)|([.#]?[A-Za-z-][A-Za-z0-9_-]*)|([{}();:,])|(\s+)|([\s\S])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m[1] !== undefined) tokens.push({ type: "comment", value: m[1] });
    else if (m[2] !== undefined) tokens.push({ type: "builtin", value: m[2] });
    else if (m[3] !== undefined) tokens.push({ type: "number", value: m[3] });
    else if (m[4] !== undefined) tokens.push({ type: "number", value: m[4] });
    else if (m[5] !== undefined) tokens.push({ type: "ident", value: m[5] });
    else if (m[6] !== undefined) tokens.push({ type: "punct", value: m[6] });
    else if (m[7] !== undefined) tokens.push({ type: "ws", value: m[7] });
    else tokens.push({ type: "text", value: m[8] });
  }
  return tokens;
}

const TOKEN_CLASSES: Record<string, string> = {
  comment: "text-fg-subtle italic",
  string: "text-success",
  number: "text-accent",
  keyword: "text-accent font-medium",
  builtin: "text-accent",
  tag: "text-accent",
  ident: "text-fg",
  punct: "text-fg-muted",
  key: "text-accent",
  ws: "",
  text: "text-fg",
};

export function CodeBlock({
  code,
  language = "tsx",
  filename,
  showLineNumbers = true,
  maxHeight = "100%",
  className,
}: CodeBlockProps) {
  const { copied, copy } = useCopy();

  const lines = useMemo(() => {
    const tokens = tokenize(code, language);
    // Build line array of token spans
    const out: Array<Array<{ type: string; value: string }>> = [[]];
    for (const tok of tokens) {
      const parts = tok.value.split("\n");
      parts.forEach((part, i) => {
        if (i > 0) out.push([]);
        if (part.length > 0) {
          out[out.length - 1].push({ type: tok.type, value: part });
        }
      });
    }
    return out;
  }, [code, language]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-md border border-border bg-bg-subtle",
        className
      )}
    >
      {(filename || true) && (
        <div className="flex items-center justify-between border-b border-border bg-bg px-3 py-2">
          <span className="font-mono text-xs text-fg-muted">
            {filename ?? language}
          </span>
          <button
            type="button"
            onClick={() => copy(code)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-fg-muted",
              "transition-colors hover:bg-bg-subtle hover:text-fg",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            )}
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <IconCheck className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <IconCopy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      )}
      <div
        className="scrollbar-thin overflow-auto"
        style={{ maxHeight }}
      >
        <pre className="p-4 font-mono text-[12.5px] leading-relaxed">
          <code className="block">
            {lines.map((tokens, lineIdx) => (
              <div key={lineIdx} className="flex">
                {showLineNumbers && (
                  <span
                    aria-hidden="true"
                    className="mr-4 inline-block w-8 flex-shrink-0 select-none text-right text-fg-subtle"
                  >
                    {lineIdx + 1}
                  </span>
                )}
                <span className="flex-1 whitespace-pre">
                  {tokens.length === 0 ? (
                    <span>&nbsp;</span>
                  ) : (
                    tokens.map((t, i) => (
                      <span key={i} className={TOKEN_CLASSES[t.type] ?? ""}>
                        {t.value}
                      </span>
                    ))
                  )}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
