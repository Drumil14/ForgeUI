"use client";

import { useDesign } from "@/hooks/use-design";
import { IconImage } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Assets discovered by the parser: bitmap-filled nodes and vectors/icons.
 * When the import ran server-side with a Figma API key, each asset carries a
 * short-lived CDN render URL (PNG for bitmaps, SVG for vectors) from the
 * Figma Images API; fixture imports show labeled placeholders instead.
 */
export function AssetsPanel() {
  const { design } = useDesign();
  if (!design) return null;

  const images = design.assets.filter((a) => a.kind === "image");
  const vectors = design.assets.filter((a) => a.kind === "vector");
  const hasAny = images.length + vectors.length > 0;
  const hasUrls = design.assets.some((a) => a.url);

  if (!hasAny) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<IconImage className="h-5 w-5" />}
          title="No exportable assets"
          description="This design has no bitmap images or standalone vectors. Generated components use inline markup and tokens."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      {!hasUrls && (
        <p className="rounded-md border border-border bg-bg-subtle p-2.5 text-[11px] leading-snug text-fg-muted">
          Previews come from the Figma Images API during a live import (server
          API key required). This design was loaded from a local fixture, so
          assets are listed without renders.
        </p>
      )}

      {images.length > 0 && (
        <div className="space-y-2">
          <p className="eyebrow text-fg-subtle">Images · {images.length}</p>
          <div className="grid grid-cols-2 gap-2">
            {images.map((a) => (
              <div
                key={a.nodeId}
                className="overflow-hidden rounded-md border border-border bg-bg-subtle"
              >
                {a.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.url}
                    alt={a.name}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="bg-dots flex aspect-square items-center justify-center text-fg-subtle">
                    <IconImage className="h-5 w-5" />
                  </div>
                )}
                <div className="border-t border-border p-1.5">
                  <p className="truncate text-[10px] text-fg-muted">{a.name}</p>
                  {a.width && a.height && (
                    <p className="font-mono text-[9px] text-fg-subtle">
                      {Math.round(a.width)}×{Math.round(a.height)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vectors.length > 0 && (
        <div className="space-y-2">
          <p className="eyebrow text-fg-subtle">Vectors · {vectors.length}</p>
          <div className="grid grid-cols-4 gap-1.5">
            {vectors.map((a) => (
              <div
                key={a.nodeId}
                title={a.name}
                className="flex aspect-square items-center justify-center overflow-hidden rounded border border-border bg-bg p-1 text-fg-muted"
              >
                {a.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.url}
                    alt={a.name}
                    loading="lazy"
                    className="max-h-full max-w-full"
                  />
                ) : (
                  <span className="text-[10px]">{a.name.slice(0, 3)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
