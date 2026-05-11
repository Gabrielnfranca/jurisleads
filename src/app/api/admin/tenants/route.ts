import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function requireAdmin(req: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user?.email && (!adminEmail || session.user.email === adminEmail)) {
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
  if (adminEmail && user.email !== adminEmail) return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tenants, error } = await supabaseAdmin
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Contar leads por slug
  const { data: leadRows } = await supabaseAdmin.from("leads").select("slug");
  const counts: Record<string, number> = {};
  (leadRows || []).forEach((l: { slug: string }) => {
    counts[l.slug] = (counts[l.slug] || 0) + 1;
  });

  // Contar leads de hoje por slug
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const { data: leadsHoje } = await supabaseAdmin
    .from("leads")
    .select("slug")
    .gte("created_at", hoje.toISOString());
  const countsHoje: Record<string, number> = {};
  (leadsHoje || []).forEach((l: { slug: string }) => {
    countsHoje[l.slug] = (countsHoje[l.slug] || 0) + 1;
  });

  const result = (tenants || []).map((t: Record<string, unknown>) => ({
    ...t,
    leads_total: counts[t.slug as string] || 0,
    leads_hoje: countsHoje[t.slug as string] || 0,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nome, slug, email, senha, whatsapp, area_juridica, cor_primaria } = await req.json();

  if (!nome || !slug || !email || !senha || !whatsapp) {
    return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug inválido. Use apenas letras minúsculas, números e hífens." },
      { status: 400 }
    );
  }

  // Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Inserir tenant
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .insert({
      slug,
      nome,
      whatsapp,
      email,
      cor_primaria: cor_primaria || "#2563eb",
      area_juridica: area_juridica || "trabalhista",
      user_id: authData.user.id,
      ativo: true,
    })
    .select()
    .single();

  if (tenantError) {
    // Rollback do usuário criado
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: tenantError.message }, { status: 500 });
  }

  return NextResponse.json(tenant, { status: 201 });
}
