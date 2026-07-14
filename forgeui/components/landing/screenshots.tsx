export function Screenshots() {
  return (
    <section className="border-b border-border bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="eyebrow text-fg-subtle">Inside the workspace</p>
          <h2 className="mt-2 text-balance font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Inspector-first, not magic-first.
          </h2>
          <p className="mt-4 text-pretty text-fg-muted">
            Three panels that mirror how you actually work: sources on the
            left, output in the middle, and every detail of the generated
            component on the right.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel
            label="Sidebar"
            title="Layers, tokens, and components"
            description="Browse what came in. Click anything to reveal where it came from in the Figma tree."
          >
            <PanelMockSidebar />
          </Panel>

          <Panel
            label="Preview"
            title="Live, responsive, selectable"
            description="See the generated component render in real-time. Switch viewports without re-rendering."
          >
            <PanelMockPreview />
          </Panel>

          <Panel
            label="Inspector"
            title="Code, classes, and a11y"
            description="Every Tailwind class, every prop, every accessibility note — copy-pasteable, never hidden."
          >
            <PanelMockInspector />
          </Panel>
        </div>
      </div>
    </section>
  );
}

function Panel({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-bg">
      <div className="border-b border-border bg-bg-subtle p-4">
        <p className="eyebrow text-fg-subtle">{label}</p>
        <h3 className="mt-1 font-display text-base font-semibold text-fg">
          {title}
        </h3>
        <p className="mt-1 text-xs text-fg-muted">{description}</p>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

function PanelMockSidebar() {
  const layers = [
    { name: "Hero", depth: 0 },
    { name: "Container", depth: 1 },
    { name: "Title", depth: 2 },
    { name: "Subtitle", depth: 2 },
    { name: "Actions", depth: 2 },
    { name: "Button / Primary", depth: 3, active: true },
    { name: "Button / Secondary", depth: 3 },
    { name: "Hero Image", depth: 1 },
  ];

  return (
    <div className="space-y-px text-[11px]">
      {layers.map((l, i) => (
        <div
          key={i}
          className={
            l.active
              ? "flex items-center rounded bg-bg-subtle px-2 py-1.5 text-fg"
              : "flex items-center px-2 py-1.5 text-fg-muted"
          }
          style={{ paddingLeft: `${0.5 + l.depth * 0.75}rem` }}
        >
          <span className="font-mono">{l.name}</span>
        </div>
      ))}
    </div>
  );
}

function PanelMockPreview() {
  return (
    <div className="bg-dots flex h-full min-h-[200px] items-center justify-center rounded-md border border-border bg-bg p-6">
      <button
        type="button"
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
      >
        Primary action
      </button>
    </div>
  );
}

function PanelMockInspector() {
  return (
    <div className="space-y-3 font-mono text-[11px]">
      <div className="rounded-md border border-border bg-bg-subtle p-2.5">
        <div className="eyebrow mb-1.5 text-fg-subtle">Classes</div>
        <div className="space-y-0.5 leading-relaxed text-fg-muted">
          <div>
            <span className="text-accent">inline-flex</span> items-center
          </div>
          <div>
            <span className="text-accent">rounded-md</span> bg-accent
          </div>
          <div>px-4 py-2 text-sm</div>
          <div>
            <span className="text-accent">font-medium</span> text-accent-fg
          </div>
        </div>
      </div>
      <div className="rounded-md border border-border bg-bg-subtle p-2.5">
        <div className="eyebrow mb-1.5 text-fg-subtle">A11y</div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="text-fg-muted">Contrast 7.2:1 — AAA</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="text-fg-muted">Button has accessible name</span>
        </div>
      </div>
    </div>
  );
}
