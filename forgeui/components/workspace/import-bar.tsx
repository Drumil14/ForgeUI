"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconAlert, IconArrowRight } from "@/components/ui/icons";
import { useDesign } from "@/hooks/use-design";
import { useFigmaImport } from "@/hooks/use-figma-import";
import { isValidFigmaUrl } from "@/utils/figma-url";
import { cn } from "@/utils/cn";

export function ImportBar() {
  const { isLoading, error, design } = useDesign();
  const { importFile } = useFigmaImport();
  const [url, setUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!url.trim()) {
      setLocalError("Paste a Figma file URL to import.");
      return;
    }
    if (!isValidFigmaUrl(url.trim())) {
      setLocalError("That doesn't look like a Figma file URL.");
      return;
    }
    await importFile(url.trim());
  };

  const message = localError ?? error?.message ?? null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1.5" noValidate>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <label htmlFor="figma-url" className="sr-only">
            Figma file URL
          </label>
          <input
            id="figma-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (localError) setLocalError(null);
            }}
            placeholder="https://figma.com/design/abc123/My-Design"
            aria-invalid={!!message}
            aria-describedby={message ? "figma-url-error" : undefined}
            disabled={isLoading}
            className={cn(
              "h-9 w-full rounded-md border bg-bg px-3 font-mono text-xs text-fg placeholder:text-fg-subtle",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-accent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              message ? "border-danger/50" : "border-border"
            )}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          loading={isLoading}
          iconRight={!isLoading ? <IconArrowRight className="h-3.5 w-3.5" /> : undefined}
        >
          {design ? "Reimport" : "Import"}
        </Button>
      </div>
      {message && (
        <p
          id="figma-url-error"
          role="alert"
          className="flex items-center gap-1.5 text-xs text-danger"
        >
          <IconAlert className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{message}</span>
        </p>
      )}
    </form>
  );
}
