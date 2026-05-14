import type { ReactNode } from "react";

const HERO_TITLE_PATTERN = /^(.*)<span className="([^"]+)">([^<]+)<\/span>(.*)$/;

function isSafeClassName(value: string) {
  return /^[a-zA-Z0-9\s:_\-\/().%\[\]]+$/.test(value);
}

export function renderHeroTitle(title: string): ReactNode {
  const match = title.match(HERO_TITLE_PATTERN);

  if (!match) {
    return title;
  }

  const before = match[1];
  const className = isSafeClassName(match[2]) ? match[2] : "";
  const highlight = match[3];
  const after = match[4];

  return (
    <>
      {before}
      <span className={className}>{highlight}</span>
      {after}
    </>
  );
}