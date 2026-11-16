import type { Metadata } from "next";
import { VerifyWorkbench } from "@/components/verify/verify-workbench";

export const metadata: Metadata = {
  title: "Verify — ForgeUI",
  description:
    "Inspect design-token verification reports: token drift, contrast failures, and deterministic fix suggestions.",
};

export default function VerifyPage() {
  return <VerifyWorkbench />;
}
