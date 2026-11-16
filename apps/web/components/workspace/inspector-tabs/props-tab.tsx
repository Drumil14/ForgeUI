"use client";

import { useDesign } from "@/hooks/use-design";
import { controlForPropType, samplePropsFor } from "@/lib/preview/sample-props";
import { Button } from "@/components/ui/button";
import type { ComponentProp, GeneratedComponent } from "@/types";

interface PropsTabProps {
  component: GeneratedComponent;
}

/**
 * Live prop editor. Edits are applied to the sandboxed preview immediately —
 * the preview renders the actual generated component with these props.
 */
function PropControl({
  component,
  prop,
}: {
  component: GeneratedComponent;
  prop: ComponentProp;
}) {
  const { propsOverrides, setPropOverride } = useDesign();
  const control = controlForPropType(prop.type);
  const overrides = propsOverrides[component.id] ?? {};
  const sample = samplePropsFor(component);
  const current =
    prop.name in overrides
      ? overrides[prop.name]
      : sample[prop.name] ??
        (prop.defaultValue ? prop.defaultValue.replace(/^"|"$/g, "") : undefined);

  const inputId = `prop-${component.id}-${prop.name}`;

  if (control.kind === "enum") {
    return (
      <select
        id={inputId}
        value={String(current ?? control.options[0])}
        onChange={(e) => setPropOverride(component.id, prop.name, e.target.value)}
        className="h-7 w-full rounded border border-border bg-bg px-2 font-mono text-[11px] text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {control.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (control.kind === "boolean") {
    return (
      <input
        id={inputId}
        type="checkbox"
        checked={Boolean(current)}
        onChange={(e) =>
          setPropOverride(component.id, prop.name, e.target.checked)
        }
        className="h-4 w-4 accent-[rgb(var(--accent))]"
      />
    );
  }

  if (control.kind === "string") {
    return (
      <input
        id={inputId}
        type="text"
        value={typeof current === "string" ? current : ""}
        placeholder={typeof sample[prop.name] === "string" ? String(sample[prop.name]) : ""}
        onChange={(e) => setPropOverride(component.id, prop.name, e.target.value)}
        className="h-7 w-full rounded border border-border bg-bg px-2 text-[11px] text-fg placeholder:text-fg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      />
    );
  }

  return (
    <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
      structured — edit in code
    </code>
  );
}

export function PropsTab({ component }: PropsTabProps) {
  const { propsOverrides, resetPropOverrides } = useDesign();
  const hasOverrides = Boolean(propsOverrides[component.id]);

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="eyebrow text-fg-subtle">Props</p>
          <p className="text-xs text-fg-muted">
            Edit values to re-render the preview — it runs the actual generated
            component with these props.
          </p>
        </div>
        {hasOverrides && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resetPropOverrides(component.id)}
          >
            Reset
          </Button>
        )}
      </div>

      {component.props.length === 0 ? (
        <p className="text-xs text-fg-subtle">This component takes no props.</p>
      ) : (
        <ul className="space-y-2">
          {component.props.map((p) => (
            <li
              key={p.name}
              className="rounded-md border border-border bg-bg p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`prop-${component.id}-${p.name}`}
                  className="font-mono text-[11px] font-medium text-fg"
                >
                  {p.name}
                </label>
                <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
                  {p.type.length > 36 ? `${p.type.slice(0, 36)}…` : p.type}
                </code>
              </div>
              <p className="mb-1.5 mt-0.5 text-[11px] text-fg-muted">
                {p.description}
              </p>
              <PropControl component={component} prop={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
