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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { nome, whatsapp, area_juridica, cor_primaria, ativo, dominio_customizado } =
    await req.json();

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .update({ nome, whatsapp, area_juridica, cor_primaria, ativo, dominio_customizado })
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
