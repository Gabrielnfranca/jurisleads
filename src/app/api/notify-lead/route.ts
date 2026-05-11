import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Lead } from "@/types";

interface NotificacaoConfig {
  user_id: string;
  telegram_ativo: boolean;
  telegram_token: string | null;
  telegram_chat_id: string | null;
  email_ativo: boolean;
  resend_api_key: string | null;
  resend_email: string | null;
}

interface TenantOwner {
  user_id: string;
  ativo: boolean;
}

// Cliente admin (service role) para leitura segura das configs
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

// ─── Telegram ────────────────────────────────────────────────────────────────
async function enviarTelegram(token: string, chatId: string, texto: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: "Markdown" }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.description ?? "Erro ao enviar Telegram");
  }
}

// ─── Email via Resend ─────────────────────────────────────────────────────────
async function enviarEmail(apiKey: string, destino: string, lead: Partial<Lead> | null, isTeste: boolean) {
  const assunto = isTeste
    ? "✅ Teste de notificação — JurisLeads"
    : `🔥 Novo Lead: ${lead?.nome ?? ""}`;

  const html = isTeste
    ? `<h2>Tudo certo!</h2><p>Suas notificações por e-mail estão configuradas corretamente no <strong>JurisLeads</strong>.</p>`
    : `
      <div style="font-family:sans-serif;max-width:480px">
        <h2 style="color:#1d4ed8">📩 Novo Lead - JurisLeads</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;text-transform:uppercase">Nome</td><td style="font-weight:700">${lead?.nome}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;text-transform:uppercase">Telefone</td><td>${lead?.telefone}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;text-transform:uppercase">Score IA</td><td><strong style="color:${lead?.ia_score === 'Quente' ? '#ea580c' : lead?.ia_score === 'Morno' ? '#d97706' : '#64748b'}">${lead?.ia_score}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;text-transform:uppercase">Situação</td><td>${lead?.situacao ?? '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;text-transform:uppercase">Motivo</td><td>${lead?.motivo ?? '—'}</td></tr>
          ${lead?.resumo ? `<tr><td colspan="2" style="padding-top:12px;font-style:italic;color:#475569">${lead.resumo}</td></tr>` : ''}
        </table>
        <a href="https://wa.me/55${lead?.telefone?.replace(/\D/g, '')}" style="display:inline-block;margin-top:16px;background:#25d366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700">
          Responder no WhatsApp
        </a>
      </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "JurisLeads <onboarding@resend.dev>",
      to: [destino],
      subject: assunto,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.message ?? "Erro ao enviar e-mail");
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Modo teste (chamado pela página de configurações) ──
    if (body.tipo === "teste") {
      const session = await getSessionFromCookies();
      if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const { canal, config } = body as {
        canal: "telegram" | "email";
        config: { telegram_token: string; telegram_chat_id: string; resend_api_key: string; resend_email: string };
      };

      if (canal === "telegram") {
        await enviarTelegram(
          config.telegram_token,
          config.telegram_chat_id,
          "✅ *Teste JurisLeads*\n\nSuas notificações por Telegram estão funcionando perfeitamente\\!"
        );
        return NextResponse.json({ message: "Mensagem de teste enviada no Telegram!" });
      }

      if (canal === "email") {
        await enviarEmail(config.resend_api_key, config.resend_email, null, true);
        return NextResponse.json({ message: "E-mail de teste enviado com sucesso!" });
      }

      return NextResponse.json({ message: "Canal inválido." }, { status: 400 });
    }

    // ── Modo webhook (chamado pelo Supabase) ──
    // O Supabase envia { type: "INSERT", record: {...} }
    const lead = (body.record ?? body) as Lead;
    if (!lead?.id || !lead.slug) {
      return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Opcional: valida segredo do webhook quando configurado em produção.
    const webhookSecret = process.env.NOTIFY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = req.headers.get("x-webhook-secret");
      if (providedSecret !== webhookSecret) {
        return NextResponse.json({ message: "Unauthorized webhook." }, { status: 401 });
      }
    }

    // Resolve o owner do tenant para evitar envio cruzado entre escritórios.
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("user_id, ativo")
      .eq("slug", lead.slug)
      .single<TenantOwner>();

    if (tenantError || !tenant) {
      return NextResponse.json({ message: "Tenant não encontrado para este lead." }, { status: 404 });
    }

    if (!tenant.ativo) {
      return NextResponse.json({ message: "Tenant inativo. Notificação ignorada." }, { status: 200 });
    }

    // Busca apenas a configuração do dono do tenant do lead.
    const { data: config, error: configError } = await supabase
      .from("notificacoes_config")
      .select("user_id, telegram_ativo, telegram_token, telegram_chat_id, email_ativo, resend_api_key, resend_email")
      .eq("user_id", tenant.user_id)
      .maybeSingle<NotificacaoConfig>();

    if (configError) {
      return NextResponse.json({ message: "Erro ao carregar configuração de notificação." }, { status: 500 });
    }

    if (!config) {
      return NextResponse.json({ message: "Sem configuração de notificação para este tenant." }, { status: 200 });
    }

    const scoreEmoji: Record<string, string> = { Quente: "🔥", Morno: "🌡️", Frio: "❄️" };
    const textoTelegram = `📩 *Novo Lead — JurisLeads*\n\n👤 *Nome:* ${lead.nome}\n📱 *Telefone:* ${lead.telefone}\n${scoreEmoji[lead.ia_score] ?? ""} *Score IA:* ${lead.ia_score}\n📋 *Situação:* ${lead.situacao ?? "—"}\n💬 *Motivo:* ${lead.motivo ?? "—"}${lead.resumo ? `\n\n_${lead.resumo}_` : ""}\n\n👉 [Responder no WhatsApp](https://wa.me/55${lead.telefone.replace(/\D/g, "")})`;

    const erros: string[] = [];

    if (config.telegram_ativo && config.telegram_token && config.telegram_chat_id) {
      try {
        await enviarTelegram(config.telegram_token, config.telegram_chat_id, textoTelegram);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erro desconhecido";
        erros.push(`Telegram: ${message}`);
      }
    }

    if (config.email_ativo && config.resend_api_key && config.resend_email) {
      try {
        await enviarEmail(config.resend_api_key, config.resend_email, lead, false);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erro desconhecido";
        erros.push(`Email: ${message}`);
      }
    }

    return NextResponse.json({
      message: erros.length ? `Parcial: ${erros.join(", ")}` : "Notificações enviadas!",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    console.error("[notify-lead]", err);
    return NextResponse.json({ message }, { status: 500 });
  }
}
