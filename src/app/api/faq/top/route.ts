import { createClient } from "@supabase/supabase-js";

// Importar templates padrão como fallback
import { AREA_TEMPLATES } from "@/lib/legal-area-templates";

const MAX_FAQ_ITEMS = 6;

function normalizeQuestion(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function isLikelyValidFaqQuestion(question: string) {
  if (question.length < 10 || question.length > 180) return false;
  if (!/[a-zA-ZÀ-ÿ]/.test(question)) return false;
  if (!/[aeiouáéíóúâêôãõà]/i.test(question)) return false;

  const lettersOnly = question.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (lettersOnly.length < 8) return false;

  const uniqueLetters = new Set(lettersOnly.toLowerCase()).size;
  if (uniqueLetters < 4) return false;

  if (!/\s/.test(question) && !question.endsWith("?")) return false;

  return true;
}

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(req.url);
    const legal_area = searchParams.get("legal_area");
    const domain = searchParams.get("domain");

    if (!legal_area || !domain) {
      return Response.json(
        { error: "legal_area e domain são obrigatórios" },
        { status: 400 }
      );
    }

    // Busca perguntas mais votadas dos últimos 30 dias
    const { data: suggestions, error } = await supabase
      .from("faq_suggestions")
      .select("question, vote_count")
      .eq("legal_area", legal_area)
      .eq("domain", domain)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("vote_count", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Erro ao buscar sugestões:", error);
      // Retorna FAQ padrão se houver erro
      const template = AREA_TEMPLATES[legal_area as keyof typeof AREA_TEMPLATES];
      return Response.json({
        faqItems: template?.faqItems || [],
        source: "default",
      });
    }

    const validSuggestions = (suggestions || [])
      .map((s: { question: string; vote_count: number }) => ({
        ...s,
        question: normalizeQuestion(s.question),
      }))
      .filter((s: { question: string }) => isLikelyValidFaqQuestion(s.question));

    // Se há menos de 6 perguntas, adiciona as padrão
    let faqItems = validSuggestions
      .slice(0, MAX_FAQ_ITEMS)
      .map((s: { question: string; vote_count: number }, i: number) => ({
        question: s.question,
        answer: `Resposta baseada em dúvidas frequentes de clientes. (${i + 1})`, // Placeholder para IA gerar
      }));

    // Se não tem 6, completa com as padrão
    const template = AREA_TEMPLATES[legal_area as keyof typeof AREA_TEMPLATES];
    if (faqItems.length < MAX_FAQ_ITEMS && template?.faqItems) {
      const defaultItems = template.faqItems.slice(0, MAX_FAQ_ITEMS - faqItems.length);
      faqItems = [...faqItems, ...defaultItems];
    }

    return Response.json({
      faqItems: faqItems.slice(0, MAX_FAQ_ITEMS),
      source: validSuggestions.length > 0 ? "ai_generated" : "default",
      suggestion_count: validSuggestions.length,
    });
  } catch (err) {
    console.error("Erro na rota:", err);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
