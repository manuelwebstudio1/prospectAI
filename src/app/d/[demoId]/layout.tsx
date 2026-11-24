import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Unofficial ProspectAI demonstration",
  robots: { index: false, follow: false },
};

export default function PublicDemoLayout({ children }: { children: ReactNode }) {
  return children;
}
