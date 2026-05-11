import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  // Cliente server-side com service_role — nunca exposto ao browser
  return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const { slug, nome, telefone, situacao, motivo, tempo, provas } = await req.json();

  const missingFields = [
    ["situacao", situacao],
    ["motivo", motivo],
    ["tempo", tempo],
    ["nome", nome],
    ["telefone", telefone],
  ].filter(([, value]) => !String(value ?? "").trim()).map(([field]) => field);

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Dados incompletos: ${missingFields.join(", ")}` },
      { status: 400 }
    );
  }

  if (!slug) {
    return NextResponse.json({ error: "Tenant não informado" }, { status: 400 });
  }

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .select("slug, ativo")
    .eq("slug", slug)
    .maybeSingle<{ slug: string; ativo: boolean }>();

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 500 });
  }

  if (!tenant || !tenant.ativo) {
    return NextResponse.json({ error: "Página de captação indisponível para este escritório" }, { status: 404 });
  }

  const prompt = `Você é um assistente jurídico especialista em direito trabalhista brasileiro.

Analise o caso abaixo e responda APENAS com JSON válido, sem markdown, sem texto fora do JSON.

Dados do lead:
- Situação empregatícia: ${situacao}
- Problema principal: ${motivo}
- Tempo de vínculo: ${tempo}
- Provas disponíveis: ${provas || "Não informado"}

Critérios de qualificação:
- Quente: alto potencial de indenização (ex: demissão sem justa causa + tempo longo, acidente de trabalho, assédio moral, rescisão não paga)
- Morno: potencial moderado (ex: horas extras, irregularidades trabalhistas menores)
- Frio: baixo potencial ou situação com poucos direitos a reclamar

Responda EXATAMENTE neste formato JSON:
{
  "ia_score": "Quente" ou "Morno" ou "Frio",
  "resumo": "Uma frase direta sobre o caso, máximo 120 caracteres",
  "chance_exito": número inteiro de 0 a 100 representando percentual de chance de êxito judicial,
  "valor_estimado": "faixa estimada do valor da causa no formato R$ X.000 – R$ Y.000",
  "pontos_fortes": ["ponto jurídico relevante 1", "ponto jurídico relevante 2", "ponto jurídico relevante 3"]
}`;

  let ia_score = "Morno";
  let resumo = "";
  let chance_exito = "60";
  let valor_estimado = "A calcular";
  let pontos_fortes = "[]";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const validScores = ["Quente", "Morno", "Frio"];
      ia_score = validScores.includes(parsed.ia_score) ? parsed.ia_score : "Morno";
      resumo = typeof parsed.resumo === "string" ? parsed.resumo.slice(0, 200) : "";
      chance_exito = parsed.chance_exito != null
        ? String(Math.min(99, Math.max(1, parseInt(String(parsed.chance_exito)) || 60)))
        : "60";
      valor_estimado = typeof parsed.valor_estimado === "string" ? parsed.valor_estimado : "A calcular";
      pontos_fortes = Array.isArray(parsed.pontos_fortes)
        ? JSON.stringify(parsed.pontos_fortes.slice(0, 4).map((p: unknown) => String(p)))
        : "[]";
    }
  } catch (err) {
    console.error("[qualificar] Erro Gemini:", err);
    const isQuente = situacao.includes("Demitido") && (motivo.includes("Acidente") || motivo.includes("Assédio") || tempo.includes("5 anos"));
    const isMorno = situacao.includes("Demitido") || motivo.includes("Rescisão") || motivo.includes("horas extras");
    ia_score = isQuente ? "Quente" : isMorno ? "Morno" : "Frio";
    chance_exito = isQuente ? "75" : isMorno ? "55" : "30";
    valor_estimado = "A calcular";
    resumo = "Análise automática — revisão manual recomendada.";
    pontos_fortes = JSON.stringify(["Irregularidades identificadas no relato", "Caso encaminhado para análise jurídica"]);
  }

  const { error } = await supabaseAdmin.from("leads").insert({
    slug,
    nome,
    telefone,
    situacao,
    motivo,
    tempo,
    provas: provas || "",
    ia_score,
    resumo,
    chance_exito,
    valor_estimado,
    pontos_fortes,
    status: "novo",
  });

  if (error) {
    console.error("[qualificar] Erro Supabase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let pontosFortesParsed: string[] = [];
  try { pontosFortesParsed = JSON.parse(pontos_fortes); } catch { /* noop */ }

  return NextResponse.json({ ia_score, resumo, chance_exito, valor_estimado, pontos_fortes: pontosFortesParsed, ok: true });
}

