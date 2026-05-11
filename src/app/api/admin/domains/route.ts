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

async function addDomainToVercel(domain: string) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) return { ok: false, error: "VERCEL_TOKEN ou VERCEL_PROJECT_ID não configurados." };

  const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Domínio já cadastrado não é erro crítico
    if (data.error?.code === "domain_already_in_use" || data.error?.code === "domain_already_exists") {
      return { ok: true, already: true };
    }
    return { ok: false, error: data.error?.message || "Erro ao adicionar domínio na Vercel." };
  }

  return { ok: true, data };
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, dominio } = await req.json();

  if (!tenantId || !dominio) {
    return NextResponse.json({ error: "tenantId e dominio são obrigatórios." }, { status: 400 });
  }

  // Valida formato básico do domínio
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(dominio)) {
    return NextResponse.json({ error: "Formato de domínio inválido." }, { status: 400 });
  }

  // Salva no banco
  const { error: dbError } = await supabaseAdmin
    .from("tenants")
    .update({ dominio_customizado: dominio })
    .eq("id", tenantId);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Tenta adicionar na Vercel
  const vercelResult = await addDomainToVercel(dominio);

  if (!vercelResult.ok) {
    return NextResponse.json(
      { 
        saved: true, 
        vercel: false, 
        warning: vercelResult.error 
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ saved: true, vercel: true, already: vercelResult.already ?? false });
}
