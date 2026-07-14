"use client";

import type { GeneratedComponent } from "@/types";

interface PropsTabProps {
  component: GeneratedComponent;
}

export function PropsTab({ component }: PropsTabProps) {
  return (
    <div className="space-y-3 p-3">
      <div className="space-y-1">
        <p className="eyebrow text-fg-subtle">Props</p>
        <p className="text-xs text-fg-muted">
          Inferred from the component kind and structure. Each prop maps to a
          typed argument in the generated TSX.
        </p>
      </div>

      {component.props.length === 0 ? (
        <p className="text-xs text-fg-subtle">
          This component takes no props.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-subtle">
              <tr>
                <th className="px-3 py-2 font-medium text-fg-muted">Name</th>
                <th className="px-3 py-2 font-medium text-fg-muted">Type</th>
                <th className="px-3 py-2 font-medium text-fg-muted">Default</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {component.props.map((p) => (
                <tr key={p.name} className="bg-bg">
                  <td className="px-3 py-2 align-top">
                    <p className="font-mono text-[11px] font-medium text-fg">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-fg-muted">
                      {p.description}
                    </p>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
                      {p.type}
                    </code>
                  </td>
                  <td className="px-3 py-2 align-top font-mono text-[11px] text-fg-subtle">
                    {p.defaultValue ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
