import type { ReactNode } from "react";

export function renderHeroTitle(title: string): ReactNode {
  if (!title) return "";
  // Return the title as plain string, no markdown or html interpretation
  return title;
}
