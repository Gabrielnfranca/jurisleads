import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function evolutionHeaders() {
  return {
    "Content-Type": "application/json",
    "apikey": process.env.EVOLUTION_API_KEY ?? "",
  };
}

function getBaseUrl() {
  return process.env.EVOLUTION_API_URL?.replace(/\/$/, "") ?? "";
}

function getAdmin() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getCtx() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const admin = getAdmin();
  const { data: tenant } = await admin
    .from("tenants")
    .select("slug, nome")
    .eq("user_id", session.user.id)
    .maybeSingle<{ slug: string; nome: string }>();

  if (!tenant) return null;
  return { userId: session.user.id, slug: tenant.slug, nome: tenant.nome };
}

// ─── GET: verifica status da conexão ─────────────────────────────────────────
export async function GET() {
  const base = getBaseUrl();
  if (!base) return NextResponse.json({ status: "not_configured" });

  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const res = await fetch(`${base}/instance/connectionState/${ctx.slug}`, {
      headers: evolutionHeaders(),
    });

    if (res.status === 404) return NextResponse.json({ status: "not_created" });
    if (!res.ok) return NextResponse.json({ status: "error" });

    const data = await res.json();
    const state: string = data?.instance?.state ?? data?.state ?? "unknown";
    return NextResponse.json({ status: state, connected: state === "open" });
  } catch {
    return NextResponse.json({ status: "error" });
  }
}

// ─── POST: connect | disconnect | save_active ────────────────────────────────
export async function POST(req: NextRequest) {
  const base = getBaseUrl();
  if (!base) {
    return NextResponse.json(
      { error: "Servidor de WhatsApp não configurado. Fale com o suporte." },
      { status: 503 }
    );
  }

  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json();
  const action: string = body.action;

  // ── Conectar: cria instância e retorna QR ──
  if (action === "connect") {
    // Cria a instância (ignora se já existir)
    await fetch(`${base}/instance/create`, {
      method: "POST",
      headers: evolutionHeaders(),
      body: JSON.stringify({
        instanceName: ctx.slug,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    }).catch(() => null);

    // Busca o QR Code
    const qrRes = await fetch(`${base}/instance/connect/${ctx.slug}`, {
      headers: evolutionHeaders(),
    });

    if (!qrRes.ok) {
      return NextResponse.json(
        { error: "Não foi possível gerar o QR Code. Tente novamente." },
        { status: 500 }
      );
    }

    const qrData = await qrRes.json();
    const qr: string | null = qrData?.base64 ?? qrData?.qrcode?.base64 ?? null;

    return NextResponse.json({ qr });
  }

  // ── Desconectar ──
  if (action === "disconnect") {
    await fetch(`${base}/instance/delete/${ctx.slug}`, {
      method: "DELETE",
      headers: evolutionHeaders(),
    }).catch(() => null);

    await getAdmin()
      .from("notificacoes_config")
      .upsert({ user_id: ctx.userId, evolution_ativo: false }, { onConflict: "user_id" });

    return NextResponse.json({ ok: true });
  }

  // ── Salvar estado ativo/inativo do robô ──
  if (action === "save_active") {
    const ativo: boolean = !!body.ativo;
    await getAdmin()
      .from("notificacoes_config")
      .upsert({ user_id: ctx.userId, evolution_ativo: ativo }, { onConflict: "user_id" });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
