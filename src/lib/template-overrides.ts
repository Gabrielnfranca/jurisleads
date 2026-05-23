import type { AreaTemplate } from "@/lib/legal-area-templates";

type OptionItem = { label: string; sublabel: string };
type FaqItem = { question: string; answer: string };
type TextOverrideKey =
  | "heroBadge"
  | "heroTitle"
  | "heroSubtitle"
  | "benefitsSectionTitle"
  | "benefitsSectionSubtitle"
  | "specialization"
  | "benefit1Title"
  | "benefit1Text"
  | "benefit2Title"
  | "benefit2Text"
  | "benefit3Title"
  | "benefit3Text"
  | "step1Question"
  | "step1Option1"
  | "step1Option2"
  | "step1Option3"
  | "step2Question"
  | "step3Question"
  | "step4Question"
  | "step5Question";

const TEXT_FIELDS: TextOverrideKey[] = [
  "heroBadge",
  "heroTitle",
  "heroSubtitle",
  "benefitsSectionTitle",
  "benefitsSectionSubtitle",
  "specialization",
  "benefit1Title",
  "benefit1Text",
  "benefit2Title",
  "benefit2Text",
  "benefit3Title",
  "benefit3Text",
  "step1Question",
  "step1Option1",
  "step1Option2",
  "step1Option3",
  "step2Question",
  "step3Question",
  "step4Question",
  "step5Question",
];

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ").slice(0, maxLength);
  return cleaned || null;
}

function sanitizeOptions(items: unknown, maxItems = 6): OptionItem[] | undefined {
  if (!Array.isArray(items)) return undefined;
  const safe = items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = ((item as { label?: unknown }).label as string) || "";
      const sublabel = ((item as { sublabel?: unknown }).sublabel as string) || "";
      /* 
       We allow partially empty fields while drafting to avoid the UI "eating"
       the row before the user starts typing. Blank validations are looser for the draft.
      */
      return { 
        label: label.substring(0, 120), 
        sublabel: sublabel.substring(0, 180) 
      };
    })
    .filter(Boolean) as OptionItem[];
  return safe.length ? safe.slice(0, maxItems) : undefined;
}

function sanitizeFaq(items: unknown, maxItems = 8): FaqItem[] | undefined {
  if (!Array.isArray(items)) return undefined;
  const safe = items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const question = ((item as { question?: unknown }).question as string) || "";
      const answer = ((item as { answer?: unknown }).answer as string) || "";
      return { 
        question: question.substring(0, 180), 
        answer: answer.substring(0, 450) 
      };
    })
    .filter(Boolean) as FaqItem[];
  return safe.length ? safe.slice(0, maxItems) : undefined;
}

export function sanitizeTemplateOverrides(raw: unknown): Partial<AreaTemplate> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const input = raw as Record<string, unknown>;
  const output: Partial<AreaTemplate> = {};

  for (const field of TEXT_FIELDS) {
    const cleaned = cleanText(input[field], 260);
    if (cleaned) {
      output[field] = cleaned;
    }
  }

  const step2Options = sanitizeOptions(input.step2Options);
  if (step2Options) output.step2Options = step2Options;

  const step3Options = sanitizeOptions(input.step3Options, 5);
  if (step3Options) output.step3Options = step3Options;

  const step5Options = sanitizeOptions(input.step5Options);
  if (step5Options) output.step5Options = step5Options;

  const faqItems = sanitizeFaq(input.faqItems);
  if (faqItems) output.faqItems = faqItems;

  return output;
}

export function applyTemplateOverrides(baseTemplate: AreaTemplate, overrides: Partial<AreaTemplate> | null | undefined): AreaTemplate {
  if (!overrides) return baseTemplate;
  return {
    ...baseTemplate,
    ...overrides,
    step2Options: overrides.step2Options || baseTemplate.step2Options,
    step3Options: overrides.step3Options || baseTemplate.step3Options,
    step5Options: overrides.step5Options || baseTemplate.step5Options,
    faqItems: overrides.faqItems || baseTemplate.faqItems,
  };
}
