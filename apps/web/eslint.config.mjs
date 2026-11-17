import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      "public/preview/**", // committed esbuild bundle
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // The sandboxed preview renders data: screenshots and short-lived Figma
      // CDN URLs; next/image adds nothing there.
      "@next/next/no-img-element": "off",
      // App Router: the root layout IS the single document — the pages/_document
      // guidance this rule enforces doesn't apply.
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default config;
