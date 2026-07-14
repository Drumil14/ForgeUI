import { cn } from "@/utils/cn";
import { ReactNode } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const TONE_STYLES: Record<BadgeTone, string> = {
  neutral: "bg-bg-subtle text-fg-muted border-border",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  info: "bg-bg-subtle text-fg-muted border-border",
  accent: "bg-accent/10 text-accent border-accent/30",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE_STYLES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
