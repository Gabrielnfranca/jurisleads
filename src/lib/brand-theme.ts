const HEX_COLOR_REGEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

type Rgb = { r: number; g: number; b: number };

const FALLBACK_BRAND_COLOR = "#2563eb";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function expandHex(hex: string): string {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return clean
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toLowerCase();
  }
  return clean.toLowerCase();
}

function hexToRgb(hex: string): Rgb {
  const expanded = expandHex(hex);
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mix(base: Rgb, target: Rgb, ratio: number): Rgb {
  const weight = clamp(ratio, 0, 1);
  return {
    r: base.r + (target.r - base.r) * weight,
    g: base.g + (target.g - base.g) * weight,
    b: base.b + (target.b - base.b) * weight,
  };
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value.trim());
}

export function normalizeBrandColor(value: unknown, fallback = FALLBACK_BRAND_COLOR): string {
  if (!isHexColor(value)) return fallback;
  const normalized = `#${expandHex(value)}`;
  return normalized;
}

export function buildBrandThemeVars(value: unknown): Record<string, string> {
  const baseHex = normalizeBrandColor(value);
  const baseRgb = hexToRgb(baseHex);

  const dark900 = rgbToHex(mix(baseRgb, { r: 0, g: 0, b: 0 }, 0.36));
  const dark700 = rgbToHex(mix(baseRgb, { r: 0, g: 0, b: 0 }, 0.18));
  const light500 = rgbToHex(mix(baseRgb, { r: 255, g: 255, b: 255 }, 0.08));
  const light300 = rgbToHex(mix(baseRgb, { r: 255, g: 255, b: 255 }, 0.62));
  const light200 = rgbToHex(mix(baseRgb, { r: 255, g: 255, b: 255 }, 0.76));
  const light100 = rgbToHex(mix(baseRgb, { r: 255, g: 255, b: 255 }, 0.88));
  const light50 = rgbToHex(mix(baseRgb, { r: 255, g: 255, b: 255 }, 0.94));

  return {
    "--brand-900": dark900,
    "--brand-700": dark700,
    "--brand-600": baseHex,
    "--brand-500": light500,
    "--brand-300": light300,
    "--brand-200": light200,
    "--brand-100": light100,
    "--brand-50": light50,
    "--brand-50-80": withAlpha(light50, 0.82),
    "--brand-50-50": withAlpha(light50, 0.5),
    "--brand-shadow": withAlpha(baseHex, 0.3),
    "--brand-shadow-soft": withAlpha(baseHex, 0.2),
    "--brand-ring": withAlpha(baseHex, 0.22),
  };
}
