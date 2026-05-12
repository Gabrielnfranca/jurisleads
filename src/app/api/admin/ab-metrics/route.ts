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

type Variant = "A" | "B";

function initVariantMetrics() {
  return {
    A: { started: 0, completed: 0, quente: 0, morno: 0, frio: 0, steps: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    B: { started: 0, completed: 0, quente: 0, morno: 0, frio: 0, steps: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
  };
}

function buildSetupRequiredResponse(slug: string, days: number) {
  const metrics = initVariantMetrics();
  return {
    slug,
    days,
    setupRequired: true,
    message: "A/B test ainda não foi inicializado no banco. Execute a migration migration-add-ab-events.sql no Supabase.",
    variants: {
      A: { ...metrics.A, completionRate: 0 },
      B: { ...metrics.B, completionRate: 0 },
    },
  };
}

export async function GET(req: NextRequest) {
  if (!process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "ADMIN_EMAIL não configurado." }, { status: 500 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
  }

  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = (req.nextUrl.searchParams.get("slug") || "").trim();
  const days = Number.parseInt(req.nextUrl.searchParams.get("days") || "7", 10);

  if (!slug) {
    return NextResponse.json({ error: "Slug obrigatório" }, { status: 400 });
  }

  const since = new Date();
  since.setDate(since.getDate() - (Number.isFinite(days) ? Math.max(1, Math.min(days, 90)) : 7));

  const { data: rows, error } = await supabaseAdmin
    .from("ab_events")
    .select("variant, event_name, step, ia_score, session_id")
    .eq("slug", slug)
    .gte("created_at", since.toISOString());

  if (error) {
    if (error.message?.includes("public.ab_events")) {
      return NextResponse.json(
        buildSetupRequiredResponse(slug, Number.isFinite(days) ? days : 7)
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const metrics = initVariantMetrics();
  const startedSessions = { A: new Set<string>(), B: new Set<string>() };
  const completedSessions = { A: new Set<string>(), B: new Set<string>() };
  const stepSessions = {
    A: { 1: new Set<string>(), 2: new Set<string>(), 3: new Set<string>(), 4: new Set<string>(), 5: new Set<string>() },
    B: { 1: new Set<string>(), 2: new Set<string>(), 3: new Set<string>(), 4: new Set<string>(), 5: new Set<string>() },
  };

  for (const row of rows || []) {
    const variant = row.variant as Variant;
    if (variant !== "A" && variant !== "B") continue;

    const sessionId = String(row.session_id || "");
    const step = Number(row.step || 0) as 1 | 2 | 3 | 4 | 5;

    if (row.event_name === "started" && sessionId) {
      startedSessions[variant].add(sessionId);
    }

    if (row.event_name === "step_view" && sessionId && [1, 2, 3, 4, 5].includes(step)) {
      stepSessions[variant][step].add(sessionId);
    }

    if (row.event_name === "submitted" && sessionId) {
      completedSessions[variant].add(sessionId);
      if (row.ia_score === "Quente") metrics[variant].quente += 1;
      if (row.ia_score === "Morno") metrics[variant].morno += 1;
      if (row.ia_score === "Frio") metrics[variant].frio += 1;
    }
  }

  for (const variant of ["A", "B"] as Variant[]) {
    metrics[variant].started = startedSessions[variant].size;
    metrics[variant].completed = completedSessions[variant].size;
    metrics[variant].steps[1] = stepSessions[variant][1].size;
    metrics[variant].steps[2] = stepSessions[variant][2].size;
    metrics[variant].steps[3] = stepSessions[variant][3].size;
    metrics[variant].steps[4] = stepSessions[variant][4].size;
    metrics[variant].steps[5] = stepSessions[variant][5].size;
  }

  const response = {
    slug,
    days: Number.isFinite(days) ? days : 7,
    variants: {
      A: {
        ...metrics.A,
        completionRate: metrics.A.started > 0 ? Number(((metrics.A.completed / metrics.A.started) * 100).toFixed(2)) : 0,
      },
      B: {
        ...metrics.B,
        completionRate: metrics.B.started > 0 ? Number(((metrics.B.completed / metrics.B.started) * 100).toFixed(2)) : 0,
      },
    },
  };

  return NextResponse.json(response);
}