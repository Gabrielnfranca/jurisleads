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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const { data: tenant, error } = await supabaseAdmin
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("slug", tenant.slug)
    .order("created_at", { ascending: false });

  return NextResponse.json({ tenant, leads: leads || [] });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const { slug, nome, whatsapp, area_juridica, cor_primaria, ativo, dominio_customizado } =
    await req.json();

  const dominioNormalizado = typeof dominio_customizado === "string"
    ? dominio_customizado
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "")
    : "";

  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "").trim().toLowerCase().replace(/^www\./, "");

  // Validar slug se fornecido
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug inválido. Use apenas letras minúsculas, números e hífens." },
      { status: 400 }
    );
  }

  if (dominioNormalizado && (!dominioNormalizado.includes(".") || !/^[a-z0-9.-]+$/.test(dominioNormalizado))) {
    return NextResponse.json(
      { error: "Domínio customizado inválido. Use host completo, por exemplo: lp.cliente.com.br" },
      { status: 400 }
    );
  }

  if (dominioNormalizado && rootDomain && (dominioNormalizado === rootDomain || dominioNormalizado.endsWith(`.${rootDomain}`))) {
    return NextResponse.json(
      { error: "Domínio da plataforma não pode ser usado como CNAME de cliente." },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {
    nome,
    whatsapp,
    area_juridica,
    cor_primaria,
    ativo,
    dominio_customizado: dominioNormalizado || null,
  };
  if (slug) {
    updateData.slug = slug;
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .select("user_id, slug")
    .eq("id", id)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cleanupErrors: string[] = [];

  const { error: leadDeleteError } = await supabaseAdmin
    .from("leads")
    .delete()
    .eq("slug", tenant.slug);

  if (leadDeleteError) {
    cleanupErrors.push(`Erro ao excluir leads: ${leadDeleteError.message}`);
  }

  if (tenant.user_id) {
    const { error: configDeleteError } = await supabaseAdmin
      .from("notificacoes_config")
      .delete()
      .eq("user_id", tenant.user_id);

    if (configDeleteError) {
      cleanupErrors.push(`Erro ao excluir configurações: ${configDeleteError.message}`);
    }
  }

  const { error: tenantDeleteError } = await supabaseAdmin
    .from("tenants")
    .delete()
    .eq("id", id);

  if (tenantDeleteError) {
    cleanupErrors.push(`Erro ao excluir tenant: ${tenantDeleteError.message}`);
  }

  if (tenant.user_id) {
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(tenant.user_id);
    if (authDeleteError) {
      cleanupErrors.push(`Erro ao excluir usuário: ${authDeleteError.message}`);
    }
  }

  if (cleanupErrors.length > 0) {
    return NextResponse.json(
      { error: cleanupErrors.join(" | ") },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
