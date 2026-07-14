/**
 * Tiny zero-dependency terminal UI helpers: ANSI colors, a spinner that no-ops
 * when stdout isn't a TTY, symbols, and a simple aligned table.
 */

const useColor =
  process.stdout.isTTY && process.env.NO_COLOR === undefined && process.env.FORCE_COLOR !== "0";

function wrap(open: number, close: number) {
  return (s: string | number) => (useColor ? `[${open}m${s}[${close}m` : String(s));
}

export const color = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
  orange: (s: string | number) => (useColor ? `[38;5;208m${s}[39m` : String(s)),
};

export const symbols = {
  tick: useColor ? color.green("✓") : "OK",
  cross: useColor ? color.red("✗") : "X",
  warn: useColor ? color.yellow("▲") : "!",
  info: useColor ? color.blue("•") : "-",
  arrow: color.gray("→"),
};

export function severitySymbol(sev: "error" | "warning" | "info"): string {
  return sev === "error" ? symbols.cross : sev === "warning" ? symbols.warn : symbols.info;
}

/** A spinner that gracefully degrades to a single log line off-TTY. */
export class Spinner {
  private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private i = 0;
  private timer: NodeJS.Timeout | null = null;
  private text = "";

  start(text: string): this {
    this.text = text;
    if (!process.stdout.isTTY) {
      process.stdout.write(`${color.gray("…")} ${text}\n`);
      return this;
    }
    this.timer = setInterval(() => {
      const f = color.orange(this.frames[(this.i = (this.i + 1) % this.frames.length)]);
      process.stdout.write(`\r${f} ${this.text}   `);
    }, 80);
    return this;
  }

  update(text: string): void {
    this.text = text;
  }

  private stop(mark: string, text: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (process.stdout.isTTY) process.stdout.write("\r[K");
    process.stdout.write(`${mark} ${text}\n`);
  }

  succeed(text = this.text): void {
    this.stop(symbols.tick, text);
  }
  fail(text = this.text): void {
    this.stop(symbols.cross, text);
  }
  info(text = this.text): void {
    this.stop(symbols.info, text);
  }
}

/** Render a compact left-aligned table with a dim header rule. */
export function table(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(stripLen(h), ...rows.map((r) => stripLen(r[i] ?? ""))),
  );
  const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - stripLen(s)));
  const line = (cells: string[]) =>
    "  " + cells.map((c, i) => pad(c, widths[i])).join("  ").trimEnd();

  const out: string[] = [];
  out.push(line(headers.map((h) => color.bold(h))));
  out.push("  " + color.gray(widths.map((w) => "─".repeat(w)).join("  ")));
  for (const r of rows) out.push(line(r));
  return out.join("\n");
}

/** Visible length ignoring ANSI escape codes, for alignment. */
function stripLen(s: string): number {
  return s.replace(/\[[0-9;]*m/g, "").length;
}
