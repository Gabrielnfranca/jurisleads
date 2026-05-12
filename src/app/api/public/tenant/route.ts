import { createClient } from "@supabase/supabase-js";
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

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 500 }
    );
  }

  const slug = req.nextUrl.searchParams.get("slug")?.trim().toLowerCase();
  const domain = req.nextUrl.searchParams.get("domain")?.trim().toLowerCase();

  if (!slug && !domain) {
    return NextResponse.json(
      { error: "Informe slug ou domain." },
      { status: 400 }
    );
  }

  let query = supabaseAdmin
    .from("tenants")
    .select("slug, nome, whatsapp, cor_primaria, area_juridica, ativo");

  if (slug) {
    query = query.eq("slug", slug);
  } else if (domain) {
    query = query.eq("dominio_customizado", domain);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Tenant não encontrado." }, { status: 404 });
  }

  return NextResponse.json(data);
}