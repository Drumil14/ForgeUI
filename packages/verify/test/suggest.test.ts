import { describe, it, expect } from "vitest";
import { suggestFix } from "@forgeui/verify";
import type { Violation } from "@forgeui/verify";

const base = {
  id: "v1",
  severity: "warning" as const,
  selector: "div.card",
  box: { x: 0, y: 0, width: 100, height: 40 },
};

function v(partial: Partial<Violation>): Violation {
  return { ...base, ...partial } as Violation;
}

describe("suggestFix — deterministic corrections", () => {
  it("spacing maps to css + tailwind scale class", () => {
    const fix = suggestFix(
      v({
        type: "spacing",
        property: "padding-left",
        found: "13px",
        message: "",
        nearestToken: { name: "space-12", value: "12px" },
      }),
    );
    expect(fix.css).toBe("padding-left: 12px;");
    expect(fix.tailwind).toBe("pl-3");
  });

  it("off-grid spacing falls back to an arbitrary value class", () => {
    const fix = suggestFix(
      v({
        type: "spacing",
        property: "gap",
        found: "19px",
        message: "",
        nearestToken: { name: "space-18", value: "18px" },
      }),
    );
    expect(fix.tailwind).toBe("gap-[18px]");
  });

  it("radius maps to the rounded scale", () => {
    const fix = suggestFix(
      v({
        type: "radius",
        property: "border-top-left-radius",
        found: "10px",
        message: "",
        nearestToken: { name: "radius-md", value: "8px" },
      }),
    );
    expect(fix.css).toBe("border-top-left-radius: 8px;");
    expect(fix.tailwind).toBe("rounded-tl-lg");
  });

  it("font-size maps to the type scale", () => {
    const fix = suggestFix(
      v({
        type: "font-size",
        property: "font-size",
        found: "15px",
        message: "",
        nearestToken: { name: "body-2", value: "14px" },
      }),
    );
    expect(fix.css).toBe("font-size: 14px;");
    expect(fix.tailwind).toBe("text-sm");
  });

  it("color suggests the palette hex", () => {
    const fix = suggestFix(
      v({
        type: "color",
        property: "background-color",
        found: "#e8542f",
        message: "",
        nearestToken: { name: "primary-600", value: "#e84e27" },
      }),
    );
    expect(fix.css).toBe("background-color: #e84e27;");
    expect(fix.tailwind).toBe("bg-[#e84e27]");
  });

  it("contrast returns guidance, not a mechanical value", () => {
    const fix = suggestFix(
      v({
        type: "contrast",
        property: "color",
        found: "3.1:1",
        message: "",
        nearestToken: { name: "min 4.5:1", value: "3.1:1" },
      }),
    );
    expect(fix.css).toBeUndefined();
    expect(fix.note).toContain("WCAG");
  });
});
