"use client";

import { useDesign } from "@/hooks/use-design";
import { useCopy } from "@/hooks/use-copy";
import { Button } from "@/components/ui/button";
import {
  IconCheck,
  IconCode,
  IconCopy,
  IconDownload,
  IconPackage,
  IconPalette,
} from "@/components/ui/icons";
import {
  downloadBlob,
  exportComponentFile,
  exportLibrary,
} from "@/lib/exporter/library";
import {
  tokensToCss,
  tokensToJson,
  tokensToTailwindTheme,
} from "@/lib/exporter/tokens";
import type { GeneratedComponent } from "@/types";
import type { ReactNode } from "react";

interface ExportTabProps {
  component: GeneratedComponent;
}

interface ActionRowProps {
  title: string;
  description: string;
  icon: ReactNode;
  primary?: { label: string; onClick: () => void; loading?: boolean };
  secondary?: { label: string; onClick: () => void; copiedLabel?: string };
}

function CopyAction({
  label,
  onClick,
  copiedLabel = "Copied",
}: {
  label: string;
  onClick: () => boolean;
  copiedLabel?: string;
}) {
  const { copied, copy } = useCopy();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        copy("");
        onClick();
        copy("done");
      }}
      iconLeft={
        copied ? (
          <IconCheck className="h-3.5 w-3.5 text-success" />
        ) : (
          <IconCopy className="h-3.5 w-3.5" />
        )
      }
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}

function ActionRow({ title, description, icon, primary, secondary }: ActionRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-bg p-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-bg-subtle text-fg-muted">
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-semibold text-fg">{title}</p>
        <p className="text-[11px] text-fg-muted">{description}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        {secondary && <CopyButtonWrapper {...secondary} />}
        {primary && (
          <Button
            variant="primary"
            size="sm"
            onClick={primary.onClick}
            iconLeft={<IconDownload className="h-3.5 w-3.5" />}
          >
            {primary.label}
          </Button>
        )}
      </div>
    </div>
  );
}

function CopyButtonWrapper({
  label,
  onClick,
  copiedLabel = "Copied",
}: {
  label: string;
  onClick: () => void;
  copiedLabel?: string;
}) {
  const { copied, copy } = useCopy();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        onClick();
        copy("done"); // triggers the copied flag for visual feedback
      }}
      iconLeft={
        copied ? (
          <IconCheck className="h-3.5 w-3.5 text-success" />
        ) : (
          <IconCopy className="h-3.5 w-3.5" />
        )
      }
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}

export function ExportTab({ component }: ExportTabProps) {
  const { design } = useDesign();
  if (!design) return null;

  // Use clipboard API directly for these
  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const handleDownloadComponent = () => {
    const { filename, content } = exportComponentFile(component);
    downloadBlob(filename, content, "text/plain;charset=utf-8");
  };

  const handleDownloadTokensCss = () => {
    downloadBlob(
      "design-tokens.css",
      tokensToCss(design.tokens),
      "text/css;charset=utf-8"
    );
  };

  const handleDownloadTokensJson = () => {
    downloadBlob(
      "tokens.json",
      tokensToJson(design.tokens),
      "application/json;charset=utf-8"
    );
  };

  const handleDownloadTailwind = () => {
    downloadBlob(
      "tailwind.theme.ts",
      tokensToTailwindTheme(design.tokens),
      "text/typescript;charset=utf-8"
    );
  };

  const handleDownloadLibrary = () => {
    downloadBlob(
      `${design.fileName.replace(/[^a-z0-9-]/gi, "-")}-library.tsx`,
      exportLibrary(design),
      "text/plain;charset=utf-8"
    );
  };

  return (
    <div className="space-y-4 p-3">
      <div className="space-y-1">
        <p className="eyebrow text-fg-subtle">Export</p>
        <p className="text-xs text-fg-muted">
          Copy individual pieces or download the whole library. Everything is
          generated client-side.
        </p>
      </div>

      <div className="space-y-2">
        <ActionRow
          icon={<IconCode className="h-4 w-4" />}
          title="React component"
          description={`${component.name}.tsx — semantic, accessible, Tailwind-styled.`}
          primary={{ label: "Download", onClick: handleDownloadComponent }}
          secondary={{
            label: "Copy",
            onClick: () => copyToClipboard(component.source),
          }}
        />
        <ActionRow
          icon={<IconCode className="h-4 w-4" />}
          title="Tailwind classes"
          description="Just the utility classes for this component's root element."
          secondary={{
            label: "Copy",
            onClick: () => copyToClipboard(component.classes),
          }}
        />
      </div>

      <div className="space-y-2">
        <p className="eyebrow text-fg-subtle">Tokens</p>
        <ActionRow
          icon={<IconPalette className="h-4 w-4" />}
          title="CSS variables"
          description="A drop-in :root block of design tokens for any framework."
          primary={{ label: "Download", onClick: handleDownloadTokensCss }}
          secondary={{
            label: "Copy",
            onClick: () => copyToClipboard(tokensToCss(design.tokens)),
          }}
        />
        <ActionRow
          icon={<IconPalette className="h-4 w-4" />}
          title="Tailwind theme"
          description="The same tokens shaped as a Tailwind theme.extend object."
          primary={{ label: "Download", onClick: handleDownloadTailwind }}
        />
        <ActionRow
          icon={<IconPalette className="h-4 w-4" />}
          title="JSON tokens"
          description="Style Dictionary–compatible structured token export."
          primary={{ label: "Download", onClick: handleDownloadTokensJson }}
        />
      </div>

      <div className="space-y-2">
        <p className="eyebrow text-fg-subtle">Bundle</p>
        <ActionRow
          icon={<IconPackage className="h-4 w-4" />}
          title="Component library"
          description={`${design.components.length} components + tokens, in one file.`}
          primary={{ label: "Download all", onClick: handleDownloadLibrary }}
        />
      </div>
    </div>
  );
}
