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
    return NextResponse.json({ overrides: {} }, { status: 200 });
  }

  const slug = (req.nextUrl.searchParams.get("slug") || "").trim().toLowerCase();
  const variant = (req.nextUrl.searchParams.get("variant") || "A").trim().toUpperCase();

  if (!slug || !["A", "B"].includes(variant)) {
    return NextResponse.json({ overrides: {} }, { status: 200 });
  }

  const { data } = await supabaseAdmin
    .from("landing_template_variants")
    .select("overrides")
    .eq("slug", slug)
    .eq("variant", variant)
    .maybeSingle<{ overrides: Record<string, unknown> | null }>();

  return NextResponse.json({ overrides: data?.overrides || {} }, { status: 200 });
}
