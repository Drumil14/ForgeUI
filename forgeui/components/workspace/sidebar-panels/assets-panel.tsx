"use client";

import { useDesign } from "@/hooks/use-design";
import { IconImage } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Assets panel. Figma assets (images, icons) would be exported via the
 * /images endpoint in a fuller implementation. Here we surface anything
 * the parser detected as an Image kind, plus icons-from-components.
 */
export function AssetsPanel() {
  const { design } = useDesign();
  if (!design) return null;

  const imageAssets = design.components.filter((c) => c.kind === "Image");
  const iconAssets = design.components.filter((c) => c.kind === "Icon");
  const hasAny = imageAssets.length + iconAssets.length > 0;

  if (!hasAny) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<IconImage className="h-5 w-5" />}
          title="No image assets"
          description="This design doesn't reference any bitmap images or standalone icons. Components will still render using inline SVG."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      {imageAssets.length > 0 && (
        <div className="space-y-2">
          <p className="eyebrow text-fg-subtle">
            Images · {imageAssets.length}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {imageAssets.map((a) => (
              <div
                key={a.id}
                className="overflow-hidden rounded-md border border-border bg-bg-subtle"
              >
                <div className="bg-dots flex aspect-square items-center justify-center text-fg-subtle">
                  <IconImage className="h-5 w-5" />
                </div>
                <div className="border-t border-border p-1.5">
                  <p className="truncate text-[10px] text-fg-muted">{a.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {iconAssets.length > 0 && (
        <div className="space-y-2">
          <p className="eyebrow text-fg-subtle">
            Icons · {iconAssets.length}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {iconAssets.map((a) => (
              <div
                key={a.id}
                title={a.name}
                className="flex aspect-square items-center justify-center rounded border border-border bg-bg text-fg-muted"
              >
                <span className="text-[10px]">{a.name.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
