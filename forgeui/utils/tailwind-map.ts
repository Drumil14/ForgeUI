/**
 * Map raw pixel values from Figma onto Tailwind's spacing scale.
 * Tailwind's default scale is multiples of 0.25rem (4px), so 16px ≈ "4".
 * We snap to the nearest scale step and fall back to an arbitrary value when
 * the design is far enough off-grid to warrant it.
 */

const TAILWIND_SPACING = [
  0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80,
  96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 288, 320, 384,
];

const TAILWIND_SPACING_KEYS: Record<number, string> = {
  0: "0",
  1: "px",
  2: "0.5",
  4: "1",
  6: "1.5",
  8: "2",
  10: "2.5",
  12: "3",
  14: "3.5",
  16: "4",
  20: "5",
  24: "6",
  28: "7",
  32: "8",
  36: "9",
  40: "10",
  44: "11",
  48: "12",
  56: "14",
  64: "16",
  80: "20",
  96: "24",
  112: "28",
  128: "32",
  144: "36",
  160: "40",
  176: "44",
  192: "48",
  208: "52",
  224: "56",
  240: "60",
  256: "64",
  288: "72",
  320: "80",
  384: "96",
};

export function pxToTailwindSpacing(px: number): string {
  if (px === 0) return "0";
  const nearest = TAILWIND_SPACING.reduce((a, b) =>
    Math.abs(b - px) < Math.abs(a - px) ? b : a,
  );
  if (Math.abs(nearest - px) <= 1) {
    return TAILWIND_SPACING_KEYS[nearest] ?? `[${px}px]`;
  }
  return `[${Math.round(px)}px]`;
}

export function pxToTailwindRadius(px: number): string {
  if (px === 0) return "rounded-none";
  if (px <= 2) return "rounded-sm";
  if (px <= 4) return "rounded";
  if (px <= 6) return "rounded-md";
  if (px <= 8) return "rounded-lg";
  if (px <= 12) return "rounded-xl";
  if (px <= 16) return "rounded-2xl";
  if (px <= 24) return "rounded-3xl";
  if (px >= 999) return "rounded-full";
  return `rounded-[${Math.round(px)}px]`;
}

export function pxToTailwindFontSize(px: number): string {
  if (px <= 11) return "text-2xs";
  if (px <= 12) return "text-xs";
  if (px <= 14) return "text-sm";
  if (px <= 16) return "text-base";
  if (px <= 18) return "text-lg";
  if (px <= 20) return "text-xl";
  if (px <= 24) return "text-2xl";
  if (px <= 30) return "text-3xl";
  if (px <= 36) return "text-4xl";
  if (px <= 48) return "text-5xl";
  if (px <= 60) return "text-6xl";
  if (px <= 72) return "text-7xl";
  return `text-[${Math.round(px)}px]`;
}

export function weightToTailwind(weight: number): string {
  const map: Record<number, string> = {
    100: "font-thin",
    200: "font-extralight",
    300: "font-light",
    400: "font-normal",
    500: "font-medium",
    600: "font-semibold",
    700: "font-bold",
    800: "font-extrabold",
    900: "font-black",
  };
  const nearest = [100, 200, 300, 400, 500, 600, 700, 800, 900].reduce((a, b) =>
    Math.abs(b - weight) < Math.abs(a - weight) ? b : a,
  );
  return map[nearest] ?? "font-normal";
}
