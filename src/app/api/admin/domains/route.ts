import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
  const supabase = createServerClient(
    url,
    anonKey,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

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

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function isValidDomain(value: string) {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(value);
}

async function addDomainToVercel(domain: string) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) return { ok: false, error: "VERCEL_TOKEN ou VERCEL_PROJECT_ID não configurados." };

  const url = new URL(`https://api.vercel.com/v9/projects/${projectId}/domains`);
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Domínio já cadastrado não é erro crítico
    if (data.error?.code === "domain_already_in_use" || data.error?.code === "domain_already_exists") {
      return { ok: true, already: true };
    }
    const errCode = data.error?.code ? ` (${data.error.code})` : "";
    return { ok: false, error: `${data.error?.message || "Erro ao adicionar domínio na Vercel."}${errCode}` };
  }

  return { ok: true, data };
}

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "ADMIN_EMAIL não configurado." }, { status: 500 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, dominio } = await req.json();

  if (!tenantId || !dominio) {
    return NextResponse.json({ error: "tenantId e dominio são obrigatórios." }, { status: 400 });
  }

  const dominioNormalizado = normalizeDomain(dominio);

  // Valida formato básico do domínio
  if (!isValidDomain(dominioNormalizado)) {
    return NextResponse.json({ error: "Formato de domínio inválido." }, { status: 400 });
  }

  // Salva no banco
  const { error: dbError } = await supabaseAdmin
    .from("tenants")
    .update({ dominio_customizado: dominioNormalizado })
    .eq("id", tenantId);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Tenta adicionar na Vercel
  const vercelResult = await addDomainToVercel(dominioNormalizado);

  if (!vercelResult.ok) {
    return NextResponse.json(
      { 
        saved: true, 
        vercel: false, 
        warning: vercelResult.error,
        dominio: dominioNormalizado,
        dns_hint: "Configure CNAME para cname.vercel-dns.com ou siga as instruções da Vercel." 
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ saved: true, vercel: true, already: vercelResult.already ?? false, dominio: dominioNormalizado });
}
