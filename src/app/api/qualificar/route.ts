import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getAreaTemplate, type LegalAreaType } from "@/lib/legal-area-templates";

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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildFallbackClassification(params: {
  area: LegalAreaType;
  situacao: string;
  motivo: string;
  tempo: string;
  provas: string;
}) {
  const { area, situacao, motivo, tempo, provas } = params;
  const fullText = normalizeText(`${situacao} ${motivo} ${tempo} ${provas}`);

  let score = 45;

  if (normalizeText(provas).trim() && !normalizeText(provas).includes("nao informado")) {
    score += 15;
  }

  if (/mais de 5|3 a 5|varios anos|longo/.test(fullText)) {
    score += 8;
  }

  const hotSignals: Record<LegalAreaType, string[]> = {
    trabalhista: ["assedio", "acidente", "fgts", "demitido", "rescis"],
    previdenciario: ["inss", "aposentadoria", "beneficio", "negado", "cnis"],
    consumidor: ["cobranca indevida", "produto com defeito", "servico nao", "fraude"],
    familia: ["pensao", "guarda", "divisao de bens", "visita", "heranca"],
    criminal: ["preso", "prisao", "investig", "acus", "habeas"],
    tributario: ["multa", "auto de infracao", "receita", "tribut", "imposto"],
    imobiliario: ["despejo", "inquilino", "aluguel", "invas", "condominio"],
    civil: ["contrato", "indenizacao", "divida", "dano moral", "responsabilidade"],
  };

  const areaMatches = hotSignals[area].filter((signal) => fullText.includes(signal)).length;
  score += Math.min(20, areaMatches * 6);

  if (/nao sei|sem prova|nenhuma prova/.test(fullText)) {
    score -= 10;
  }

  score = Math.max(15, Math.min(95, score));

  const ia_score = score >= 70 ? "Quente" : score >= 50 ? "Morno" : "Frio";
  const chance_exito = String(score);

  const valor_estimado =
    score >= 70 ? "R$ 15.000 - R$ 60.000" : score >= 50 ? "R$ 6.000 - R$ 25.000" : "R$ 2.000 - R$ 12.000";

  return {
    ia_score,
    chance_exito,
    valor_estimado,
    resumo: `Caso classificado como ${ia_score} para ${area}. Recomendado aprofundar análise jurídica.`,
    pontos_fortes: JSON.stringify([
      "Triagem inicial concluída com sinais de viabilidade",
      "Dados essenciais coletados no formulário",
      "Caso pronto para revisão técnica do advogado",
    ]),
  };
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const { slug, nome, telefone, situacao, motivo, tempo, provas, ab_variant, ab_session_id } = await req.json();

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
    .select("slug, ativo, area_juridica")
    .eq("slug", slug)
    .maybeSingle<{ slug: string; ativo: boolean; area_juridica?: LegalAreaType }>();

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 500 });
  }

  if (!tenant || !tenant.ativo) {
    return NextResponse.json({ error: "Página de captação indisponível para este escritório" }, { status: 404 });
  }

  const area = (tenant.area_juridica || "trabalhista") as LegalAreaType;
  const areaTemplate = getAreaTemplate(area);

  const prompt = `Você é um assistente jurídico especialista em direito ${area} brasileiro.

Analise o caso abaixo e responda APENAS com JSON válido, sem markdown, sem texto fora do JSON.

Dados do lead:
- ${areaTemplate.step1Question}: ${situacao}
- ${areaTemplate.step2Question}: ${motivo}
- ${areaTemplate.step3Question}: ${tempo}
- Provas disponíveis: ${provas || "Não informado"}

Regras de qualificação:
- Avalie coerência jurídica com a área ${area}, evitando critérios exclusivos de outras áreas.
- Quente: alta chance de êxito com sinais fortes e boa prova.
- Morno: chance moderada, requer validação documental adicional.
- Frio: baixa chance inicial ou falta de elementos mínimos.
- chance_exito deve ser inteiro entre 15 e 95.

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
    const fallback = buildFallbackClassification({
      area,
      situacao: String(situacao || ""),
      motivo: String(motivo || ""),
      tempo: String(tempo || ""),
      provas: String(provas || ""),
    });
    ia_score = fallback.ia_score;
    chance_exito = fallback.chance_exito;
    valor_estimado = fallback.valor_estimado;
    resumo = fallback.resumo;
    pontos_fortes = fallback.pontos_fortes;
  }

  const { data: lead, error } = await supabaseAdmin.from("leads").insert({
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
  }).select("id").single();

  if (error) {
    console.error("[qualificar] Erro Supabase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (["A", "B"].includes(String(ab_variant)) && String(ab_session_id || "").trim()) {
    await supabaseAdmin.from("ab_events").insert({
      slug,
      session_id: String(ab_session_id),
      variant: String(ab_variant),
      event_name: "submitted",
      step: 5,
      ia_score,
      lead_id: lead?.id,
    });
  }

  let pontosFortesParsed: string[] = [];
  try { pontosFortesParsed = JSON.parse(pontos_fortes); } catch { /* noop */ }

  return NextResponse.json({ ia_score, resumo, chance_exito, valor_estimado, pontos_fortes: pontosFortesParsed, ok: true });
}

