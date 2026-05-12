import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { domain, legal_area, question, lead_id } = await req.json();

    if (!domain || !legal_area || !question) {
      return Response.json(
        { error: "domain, legal_area e question são obrigatórios" },
        { status: 400 }
      );
    }

    // Salva a pergunta para análise posterior
    const { error } = await supabase
      .from("faq_suggestions")
      .insert({
        domain,
        legal_area,
        question: question.trim(),
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
