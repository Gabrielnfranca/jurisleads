import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";

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

  // Aceita pergunta com mais contexto (duas palavras) ou final em interrogação.
  if (!/\s/.test(question) && !question.endsWith("?")) return false;

  return true;
}

export async function POST(req: Request) {
  try {
    const rateLimit = checkRateLimit(req, "faq-suggest", 6, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Muitas sugestões enviadas. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { domain, legal_area, question, lead_id } = await req.json();
    const normalizedQuestion = normalizeQuestion(question);

    if (!domain || !legal_area || !normalizedQuestion) {
      return Response.json(
        { error: "domain, legal_area e question são obrigatórios" },
        { status: 400 }
      );
    }

    if (!isLikelyValidFaqQuestion(normalizedQuestion)) {
      return Response.json(
        { error: "Pergunta inválida para FAQ dinâmica" },
        { status: 422 }
      );
    }

    // Salva a pergunta para análise posterior
    const { error } = await supabase
      .from("faq_suggestions")
      .insert({
        domain,
        legal_area,
        question: normalizedQuestion,
        lead_id,
        created_at: new Date(),
        vote_count: 1,
      });

    if (error) {
      console.error("Erro ao salvar pergunta:", error);
      return Response.json(
        { error: "Erro ao salvar pergunta" },
        { status: 500 }
      );
    }

    return Response.json({ success: true, message: "Pergunta salva com sucesso" });
  } catch (err) {
    console.error("Erro na rota:", err);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
