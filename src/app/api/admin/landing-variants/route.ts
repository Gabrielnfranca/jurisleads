import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeTemplateOverrides } from "@/lib/template-overrides";

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

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
  }

  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = (req.nextUrl.searchParams.get("slug") || "").trim().toLowerCase();
  const variant = (req.nextUrl.searchParams.get("variant") || "B").trim().toUpperCase();

  if (!slug || !["A", "B"].includes(variant)) {
    return NextResponse.json({ error: "Slug e variante válidos são obrigatórios." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("landing_template_variants")
    .select("slug, variant, overrides, source, updated_at")
    .eq("slug", slug)
    .eq("variant", variant)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    slug,
    variant,
    overrides: data?.overrides || {},
    source: data?.source || "manual",
    updated_at: data?.updated_at || null,
  });
}

export async function PUT(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
  }

  const user = await requireAdmin(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const slug = String(body?.slug || "").trim().toLowerCase();
  const variant = String(body?.variant || "B").trim().toUpperCase();
  const source = String(body?.source || "manual").slice(0, 32);

  if (!slug || !["A", "B"].includes(variant)) {
    return NextResponse.json({ error: "Slug e variante válidos são obrigatórios." }, { status: 400 });
  }

  const overrides = sanitizeTemplateOverrides(body?.overrides || {});

  const { data, error } = await supabaseAdmin
    .from("landing_template_variants")
    .upsert(
      {
        slug,
        variant,
        overrides,
        source,
        updated_by: user.email || null,
      },
      { onConflict: "slug,variant" }
    )
    .select("slug, variant, overrides, source, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
