import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAreaTemplate, type LegalAreaType } from "@/lib/legal-area-templates";
import { sanitizeTemplateOverrides } from "@/lib/template-overrides";

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAdmin(req: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseAdmin = getSupabaseAdmin();

  if (!url || !anonKey || !supabaseAdmin || !adminEmail) {
    return null;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user?.email && session.user.email === adminEmail) {
    return session.user;
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;
  if (user.email !== adminEmail) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
  }

  if (!genAI) {
    return NextResponse.json({ error: "GEMINI_API_KEY não configurada." }, { status: 500 });
  }

  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const slug = String(body?.slug || "").trim().toLowerCase();
  const days = Number.isFinite(Number(body?.days)) ? Math.max(3, Math.min(90, Number(body?.days))) : 30;

  if (!slug) {
    return NextResponse.json({ error: "Slug obrigatório." }, { status: 400 });
  }

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .select("slug, area_juridica")
    .eq("slug", slug)
    .maybeSingle<{ slug: string; area_juridica?: LegalAreaType }>();

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 500 });
  }

  if (!tenant) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  const area = (tenant.area_juridica || "trabalhista") as LegalAreaType;
  const baseTemplate = getAreaTemplate(area);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: events } = await supabaseAdmin
    .from("ab_events")
    .select("event_name, step, variant, session_id")
    .eq("slug", slug)
    .gte("created_at", since.toISOString());

  const steps = { 1: new Set<string>(), 2: new Set<string>(), 3: new Set<string>(), 4: new Set<string>(), 5: new Set<string>(), 6: new Set<string>() };
  for (const row of events || []) {
    if (row.event_name !== "step_view") continue;
    const step = Number(row.step || 0) as 1 | 2 | 3 | 4 | 5 | 6;
    if (![1, 2, 3, 4, 5, 6].includes(step)) continue;
    const sid = String(row.session_id || "");
    if (!sid) continue;
    steps[step].add(sid);
  }

  const stepVolumes = [1, 2, 3, 4, 5, 6].map((s) => ({ step: s, sessions: steps[s as 1 | 2 | 3 | 4 | 5 | 6].size }));
  let biggestDrop = { from: 1, to: 2, drop: 0 };
  for (let i = 1; i <= 5; i += 1) {
    const current = stepVolumes[i - 1].sessions;
    const next = stepVolumes[i].sessions;
    const drop = Math.max(0, current - next);
    if (drop > biggestDrop.drop) {
      biggestDrop = { from: i, to: i + 1, drop };
    }
  }

  const { data: questions } = await supabaseAdmin
    .from("faq_suggestions")
    .select("question")
    .eq("domain", slug)
    .order("created_at", { ascending: false })
    .limit(20);

  const topQuestions = (questions || [])
    .map((q) => String((q as { question?: unknown }).question || "").trim())
    .filter(Boolean)
    .slice(0, 12);

  const prompt = `Você é um estrategista de CRO para landing pages jurídicas no Brasil.

Objetivo: criar uma NOVA variação B para aumentar taxa de conclusão do quiz e qualidade do lead.

Contexto:
- Área jurídica: ${area}
- Slug: ${slug}
- Queda mais forte no funil: da etapa ${biggestDrop.from} para ${biggestDrop.to} (queda ${biggestDrop.drop})
- Volumes por etapa: ${JSON.stringify(stepVolumes)}
- Dúvidas reais recentes dos leads: ${JSON.stringify(topQuestions)}

Template atual (resumo):
- Hero badge: ${baseTemplate.heroBadge}
- Hero title: ${baseTemplate.heroTitle}
- Hero subtitle: ${baseTemplate.heroSubtitle}
- Pergunta 1: ${baseTemplate.step1Question}
- Pergunta 2: ${baseTemplate.step2Question}
- Pergunta 3: ${baseTemplate.step3Question}
- Pergunta 5: ${baseTemplate.step5Question}

Regras:
- Linguagem clara, profissional e persuasiva.
- Evitar promessas absolutas de ganho de causa.
- Escrever em português do Brasil.
- Retornar APENAS JSON válido com campos de override (somente os que quiser mudar).
- Não retornar markdown.

Campos permitidos no JSON:
heroBadge, heroTitle, heroSubtitle,
benefitsSectionTitle, benefitsSectionSubtitle,
benefit1Title, benefit1Text, benefit2Title, benefit2Text, benefit3Title, benefit3Text,
step1Question, step1Option1, step1Option2, step1Option3,
step2Question, step2Options,
step3Question, step3Options,
step5Question, step5Options,
faqItems

Estruturas:
- step2Options/step3Options/step5Options: array de objetos {"label":"...", "sublabel":"..."}
- faqItems: array de objetos {"question":"...", "answer":"..."}`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  let parsed: unknown = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {};
  }

  const overrides = sanitizeTemplateOverrides(parsed);

  return NextResponse.json({
    slug,
    days,
    diagnostics: {
      area,
      biggestDrop,
      stepVolumes,
      topQuestions,
      note: "Sugestão baseada em dados internos do funil e dúvidas reais; sem navegação web em tempo real.",
    },
    overrides,
  });
}
