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

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const { slug, session_id, variant, event_name, step } = await req.json();

  if (!slug || !session_id || !variant || !event_name) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!["A", "B"].includes(String(variant))) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const payload = {
    slug: String(slug),
    session_id: String(session_id),
    variant: String(variant),
    event_name: String(event_name),
    step: Number.isFinite(step) ? Number(step) : null,
  };

  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("ativo")
    .eq("slug", payload.slug)
    .maybeSingle<{ ativo: boolean }>();

  if (!tenant?.ativo) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await supabaseAdmin.from("ab_events").insert(payload);

  return NextResponse.json({ ok: true });
}