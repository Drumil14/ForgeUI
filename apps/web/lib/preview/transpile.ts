import { transform } from "sucrase";

/**
 * Transpile a generated component's TSX source to CommonJS JS for the
 * sandboxed preview runtime. This is the exact source the user exports — the
 * preview executes it rather than approximating it, so preview and export
 * cannot disagree.
 */
export interface TranspileResult {
  ok: boolean;
  code: string;
  error?: string;
}

export function transpileComponent(source: string): TranspileResult {
  try {
    const { code } = transform(source, {
      transforms: ["typescript", "jsx", "imports"],
      production: true,
    });
    return { ok: true, code };
  } catch (err) {
    return { ok: false, code: "", error: (err as Error).message };
  }
}
