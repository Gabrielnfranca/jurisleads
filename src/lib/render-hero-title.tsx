import type { ReactNode } from "react";

const HERO_TITLE_SPAN_PATTERN = /^(.*)<span.*?>([^<]+)<\/span>(.*)$/i;
const HERO_TITLE_MARKDOWN_PATTERN = /^(.*?)\*(.+?)\*(.*)$/;

export function renderHeroTitle(title: string): ReactNode {
  // Se for o formato antigo de HTML (para nÃ£o quebrar quem jÃ¡ estÃ¡ salvo com span)
  const spanMatch = title.match(HERO_TITLE_SPAN_PATTERN);
  if (spanMatch) {
    const before = spanMatch[1];
    const highlight = spanMatch[2];
    const after = spanMatch[3];

    return (
      <>
        {before}
        <span style={{ color: "var(--brand-solid)" }}>{highlight}</span>
        {after}
      </>
    );
  }

  // Se for o formato novo e simples com asteriscos (*destaque*)
  const mdMatch = title.match(HERO_TITLE_MARKDOWN_PATTERN);
  if (mdMatch) {
    const before = mdMatch[1];
    const highlight = mdMatch[2];
    const after = mdMatch[3];

    return (
      <>
        {before}
        <span style={{ color: "var(--brand-solid)" }}>{highlight}</span>
        {after}
      </>
    );
  }

  return title;
}
