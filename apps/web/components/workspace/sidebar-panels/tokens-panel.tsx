"use client";

import { useDesign } from "@/hooks/use-design";
import { useCopy } from "@/hooks/use-copy";
import { IconCheck, IconCopy } from "@/components/ui/icons";
import { weightToTailwind } from "@/utils/tailwind-map";
import { cn } from "@/utils/cn";

function CopyButton({ value, label }: { value: string; label: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      aria-label={`Copy ${label}`}
      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-fg-subtle hover:bg-bg-subtle hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {copied ? (
        <IconCheck className="h-3 w-3 text-success" />
      ) : (
        <IconCopy className="h-3 w-3" />
      )}
    </button>
  );
}

export function TokensPanel() {
  const { design } = useDesign();
  if (!design) return null;
  const { tokens } = design;

  return (
    <div className="space-y-6 p-4">
      {/* Colors */}
      <section className="space-y-2">
        <p className="eyebrow text-fg-subtle">
          Colors · {tokens.colors.length}
        </p>
        <ul className="space-y-1">
          {tokens.colors.map((c) => (
            <li
              key={c.name}
              className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-bg-subtle"
            >
              <span
                aria-hidden="true"
                className="h-5 w-5 flex-shrink-0 rounded border border-border"
                style={{ backgroundColor: c.hex }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-fg">
                  {c.name}
                </p>
                <p className="font-mono text-[10px] uppercase text-fg-subtle">
                  {c.hex}
                </p>
              </div>
              <CopyButton value={c.hex} label={c.name} />
            </li>
          ))}
        </ul>
      </section>

      {/* Typography */}
      <section className="space-y-2">
        <p className="eyebrow text-fg-subtle">
          Typography · {tokens.typography.length}
        </p>
        <ul className="space-y-1.5">
          {tokens.typography.map((t) => (
            <li
              key={t.name}
              className="flex items-center justify-between gap-2 rounded border border-border bg-bg p-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-fg">
                  {t.name}
                </p>
                <p className="font-mono text-[10px] text-fg-subtle">
                  {Math.round(t.fontSize)}px · {weightToTailwind(t.fontWeight)} · {t.fontFamily}
                </p>
              </div>
              <CopyButton
                value={`${t.fontSize}px ${t.fontWeight} ${t.fontFamily}`}
                label={t.name}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Spacing */}
      <section className="space-y-2">
        <p className="eyebrow text-fg-subtle">
          Spacing · {tokens.spacing.length}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tokens.spacing.map((s) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1.5 rounded border border-border bg-bg px-2 py-1 font-mono text-[10px] text-fg-muted"
              title={`Used ${s.usage}× in the design`}
            >
              <span className="text-fg-subtle">{s.name}</span>
              <span className="text-fg">{Math.round(s.value)}px</span>
            </span>
          ))}
        </div>
      </section>

      {/* Radii */}
      {tokens.radii.length > 0 && (
        <section className="space-y-2">
          <p className="eyebrow text-fg-subtle">
            Border radius · {tokens.radii.length}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {tokens.radii.map((r) => (
              <div
                key={r.name}
                className="flex items-center gap-2 rounded border border-border bg-bg p-2"
              >
                <span
                  aria-hidden="true"
                  className="h-6 w-6 flex-shrink-0 border border-border bg-bg-subtle"
                  style={{ borderRadius: `${r.value}px` }}
                />
                <div className="min-w-0">
                  <p className="truncate text-xs text-fg">{r.name}</p>
                  <p className="font-mono text-[10px] text-fg-subtle">
                    {r.value}px
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shadows */}
      {tokens.shadows.length > 0 && (
        <section className="space-y-2">
          <p className="eyebrow text-fg-subtle">
            Shadows · {tokens.shadows.length}
          </p>
          <ul className="space-y-1.5">
            {tokens.shadows.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between gap-2 rounded border border-border bg-bg p-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 flex-shrink-0 rounded bg-bg-elevated"
                    style={{ boxShadow: s.value }}
                  />
                  <p className="text-xs text-fg">{s.name}</p>
                </div>
                <CopyButton value={s.value} label={s.name} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
