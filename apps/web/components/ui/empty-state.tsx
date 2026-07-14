import { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-8 text-center",
        className
      )}
    >
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-subtle text-fg-muted">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-fg">{title}</h3>
        {description && (
          <p className="text-xs text-fg-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
