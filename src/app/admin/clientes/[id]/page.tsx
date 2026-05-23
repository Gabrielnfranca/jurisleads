"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  Info,
  Link2,
  MessageCircle,
  Save,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import type { Lead } from "@/types";

interface Tenant {
  id: string;
  slug: string;
  nome: string;
  email: string;
  whatsapp: string;
  area_juridica: string;
  cor_primaria: string;
  ativo: boolean;
  dominio_customizado?: string;
  created_at: string;
}

interface AbVariantMetrics {
  started: number;
  completed: number;
  quente: number;
  morno: number;
  frio: number;
  completionRate: number;
  steps: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
}

interface AbMetricsResponse {
  variants: {
    A: AbVariantMetrics;
    B: AbVariantMetrics;
  };
}

const QUIZ_STEPS: Array<{ key: 1 | 2 | 3 | 4 | 5 | 6; label: string }> = [
  { key: 1, label: "Pergunta 1" },
  { key: 2, label: "Pergunta 2" },
  { key: 3, label: "Pergunta 3" },
  { key: 4, label: "Pergunta 4" },
  { key: 5, label: "Pergunta 5" },
  { key: 6, label: "Contato final" },
];

type DateRange = "day" | "week" | "month";

type TabId = "configuracoes" | "links" | "leads";

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em analise",
  atendimento: "Em atendimento",
  fechado: "Fechado",
};

const SCORE_STYLES: Record<string, string> = {
  Quente: "bg-red-100 text-red-700",
  Morno: "bg-amber-100 text-amber-700",
  Frio: "bg-blue-100 text-blue-600",
};

const AREAS = [
  { value: "trabalhista", label: "Trabalhista" },
  { value: "previdenciario", label: "Previdenciario" },
  { value: "consumidor", label: "Consumidor" },
  { value: "familia", label: "Familia" },
  { value: "criminal", label: "Criminal" },
  { value: "tributario", label: "Tributario" },
  { value: "imobiliario", label: "Imobiliario" },
  { value: "civil", label: "Civil Geral" },
];

const RANGE_OPTIONS: Array<{ id: DateRange; label: string; days: number }> = [
  { id: "day", label: "Hoje", days: 1 },
  { id: "week", label: "7 dias", days: 7 },
  { id: "month", label: "30 dias", days: 30 },
];

function normalizeHost(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export default function ClienteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState<Partial<Tenant>>({});
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [abMetrics, setAbMetrics] = useState<AbMetricsResponse | null>(null);
  const [abMetricsMessage, setAbMetricsMessage] = useState<string | null>(null);
  const [variantDraft, setVariantDraft] = useState<string>("{}");
  const [variantStatus, setVariantStatus] = useState<string | null>(null);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [variantSaving, setVariantSaving] = useState(false);
  const [variantSuggesting, setVariantSuggesting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("leads");
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [leadPage, setLeadPage] = useState(1);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://jurisleads.vercel.app";

  const pageSize = 15;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/admin/login");
        return;
      }

      const res = await fetch(`/api/admin/tenants/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        router.push("/admin");
        return;
      }

      const data = await res.json();
      if (cancelled) return;

      setTenant(data.tenant);
      setForm({
        slug: data.tenant.slug || "captacao",
        nome: data.tenant.nome,
        whatsapp: data.tenant.whatsapp,
        area_juridica: data.tenant.area_juridica,
        cor_primaria: data.tenant.cor_primaria,
        ativo: data.tenant.ativo,
        dominio_customizado: data.tenant.dominio_customizado || "",
      });
      setLeads(Array.isArray(data.leads) ? data.leads : []);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, router, supabase]);

  useEffect(() => {
    let cancelled = false;

    const loadAbMetrics = async () => {
      if (!tenant?.slug) return;

      const days = RANGE_OPTIONS.find((item) => item.id === dateRange)?.days || 7;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      try {
        const abRes = await fetch(`/api/admin/ab-metrics?slug=${encodeURIComponent(tenant.slug)}&days=${days}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!abRes.ok) {
          if (!cancelled) {
            setAbMetrics(null);
            setAbMetricsMessage("Nao foi possivel carregar metricas A/B neste momento.");
          }
          return;
        }

        const abData = await abRes.json();
        if (cancelled) return;

        if (abData?.setupRequired) {
          setAbMetrics(null);
          setAbMetricsMessage(abData?.message || "A/B test ainda nao inicializado no banco.");
          return;
        }

        setAbMetrics(abData);
        setAbMetricsMessage(null);
      } catch {
        if (!cancelled) {
          setAbMetrics(null);
          setAbMetricsMessage("Nao foi possivel carregar metricas A/B neste momento.");
        }
      }
    };

    loadAbMetrics();

    return () => {
      cancelled = true;
    };
  }, [dateRange, supabase, tenant?.slug]);

  useEffect(() => {
    let cancelled = false;

    const loadVariantDraft = async () => {
      if (!tenant?.slug) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      try {
        const res = await fetch(`/api/admin/landing-variants?slug=${encodeURIComponent(tenant.slug)}&variant=B`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) return;

        const payload = await res.json();
        if (cancelled) return;

        const safe = payload?.overrides && typeof payload.overrides === "object" ? payload.overrides : {};
        setVariantDraft(JSON.stringify(safe, null, 2));
      } catch {
        // noop
      }
    };

    void loadVariantDraft();

    return () => {
      cancelled = true;
    };
  }, [supabase, tenant?.slug]);

  const setField = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleSuggestVariant = async () => {
    if (!tenant?.slug) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/admin/login");
      return;
    }

    const days = RANGE_OPTIONS.find((item) => item.id === dateRange)?.days || 7;

    setVariantSuggesting(true);
    setVariantError(null);
    setVariantStatus(null);

    try {
      const res = await fetch("/api/admin/landing-variants/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ slug: tenant.slug, days }),
      });

      const payload = await res.json();

      if (!res.ok) {
        setVariantError(payload?.error || "Nao foi possivel gerar sugestao.");
        return;
      }

      const safe = payload?.overrides && typeof payload.overrides === "object" ? payload.overrides : {};
      setVariantDraft(JSON.stringify(safe, null, 2));
      setVariantStatus("Sugestao da IA carregada. Revise e clique em Publicar variante B.");
    } catch {
      setVariantError("Nao foi possivel gerar sugestao agora.");
    } finally {
      setVariantSuggesting(false);
    }
  };

  const handleSaveVariant = async () => {
    if (!tenant?.slug) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/admin/login");
      return;
    }

    let parsed: unknown = {};
    try {
      parsed = variantDraft.trim() ? JSON.parse(variantDraft) : {};
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setVariantError("O JSON deve ser um objeto.");
        return;
      }
    } catch {
      setVariantError("JSON invalido. Revise antes de salvar.");
      return;
    }

    setVariantSaving(true);
    setVariantError(null);
    setVariantStatus(null);

    try {
      const res = await fetch("/api/admin/landing-variants", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          slug: tenant.slug,
          variant: "B",
          source: "admin",
          overrides: parsed,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        setVariantError(payload?.error || "Nao foi possivel salvar variante B.");
        return;
      }

      const safe = payload?.overrides && typeof payload.overrides === "object" ? payload.overrides : {};
      setVariantDraft(JSON.stringify(safe, null, 2));
      setVariantStatus("Variante B publicada com sucesso.");
    } catch {
      setVariantError("Nao foi possivel salvar variante B.");
    } finally {
      setVariantSaving(false);
    }
  };

  const platformHost = normalizeHost(baseUrl).replace(/^www\./, "");

  const isReservedPlatformHost = (value: string) => {
    const host = normalizeHost(value).replace(/^www\./, "");
    if (!host) return false;
    return host === platformHost || host.endsWith(`.${platformHost}`);
  };

  const isValidCustomHost = (value: string) => {
    if (!value) return false;
    if (!value.includes(".")) return false;
    if (!/^[a-z0-9.-]+$/.test(value)) return false;
    if (isReservedPlatformHost(value)) return false;
    return true;
  };

  const slugAtual = (form.slug || tenant?.slug || "captacao")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  const dominioCustomAtual = normalizeHost((form.dominio_customizado || "").toString());
  const dominioCustomErro = !dominioCustomAtual
    ? null
    : isReservedPlatformHost(dominioCustomAtual)
    ? "Dominio da plataforma nao pode ser usado como CNAME de cliente."
    : !isValidCustomHost(dominioCustomAtual)
    ? `Dominio invalido. Exemplo: ${slugAtual}.cliente.com.br`
    : null;

  const dominioCustomValido = !dominioCustomErro;

  const landingUrl = dominioCustomAtual && dominioCustomValido
    ? `https://${dominioCustomAtual}`
    : `${baseUrl}/${slugAtual}`;

  const withQuery = (url: string, key: string, value: string) => {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${key}=${encodeURIComponent(value)}`;
  };

  const landingUrlA = withQuery(landingUrl, "ab", "A");
  const landingUrlB = withQuery(landingUrl, "ab", "B");
  const quickTestPair = `${landingUrlA}  |  ${landingUrlB}`;

  const crmUrl = `${baseUrl}/login`;
  const cnameTarget = "cname.vercel-dns.com";

  const selectedRangeDays = RANGE_OPTIONS.find((item) => item.id === dateRange)?.days || 7;

  const filteredLeads = useMemo(() => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    if (dateRange === "week") {
      since.setDate(since.getDate() - 6);
    }

    if (dateRange === "month") {
      since.setDate(since.getDate() - 29);
    }

    return leads.filter((lead) => new Date(lead.created_at) >= since);
  }, [dateRange, leads]);

  const leadStats = useMemo(() => {
    return {
      total: filteredLeads.length,
      quente: filteredLeads.filter((lead) => lead.ia_score === "Quente").length,
      morno: filteredLeads.filter((lead) => lead.ia_score === "Morno").length,
      frio: filteredLeads.filter((lead) => lead.ia_score === "Frio").length,
    };
  }, [filteredLeads]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));

  const pagedLeads = useMemo(() => {
    const start = (leadPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, leadPage]);

  const buildPayload = () => {
    const slugNormalizado = (form.slug || tenant?.slug || "captacao")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");

    const dominioNormalizado = normalizeHost((form.dominio_customizado || "").toString());

    return {
      ...form,
      slug: slugNormalizado,
      dominio_customizado: dominioNormalizado,
    };
  };

  const handleSave = async () => {
    if (!tenant) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/admin/login");
      return;
    }

    if (dominioCustomAtual && !dominioCustomValido) {
      setSaveError(dominioCustomErro || "Dominio customizado invalido.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    const res = await fetch(`/api/admin/tenants/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(buildPayload()),
    });

    setSaving(false);

    if (!res.ok) {
      let msg = "Erro ao salvar alteracoes.";
      try {
        const err = await res.json();
        msg = err?.error || msg;
      } catch {
        // noop
      }
      setSaveError(msg);
      return;
    }

    const updated = await res.json();
    setTenant(updated);
    setForm((prev) => ({ ...prev, ...updated, dominio_customizado: updated?.dominio_customizado || "" }));
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1800);
  };

  const handleDelete = async () => {
    if (!tenant) return;

    const ok = confirm(`Excluir o cliente \"${tenant.nome}\" e todos os dados dele?`);
    if (!ok) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/admin/login");
      return;
    }

    setDeletando(true);
    await fetch(`/api/admin/tenants/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    router.push("/admin");
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Carregando cliente...</p>
      </div>
    );
  }

  if (!tenant) return null;

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <header className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cliente</p>
              <h1 className="text-2xl font-black text-slate-900 mt-1">{tenant.nome}</h1>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className={`px-2 py-1 rounded-full font-semibold ${form.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {form.ativo ? "Ativo" : "Inativo"}
                </span>
                <span className="font-mono text-slate-500">/{slugAtual}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => window.open(landingUrl, "_blank", "noopener,noreferrer")}
                variant="outline"
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Abrir landing
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
                {salvo ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? "Salvando..." : salvo ? "Salvo" : "Salvar"}
              </Button>
            </div>
          </div>
        </header>

        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex gap-1 overflow-x-auto">
          {[
            { id: "leads" as const, label: "Leads e A/B", icon: Users },
            { id: "links" as const, label: "Links e Entrega", icon: Globe },
            { id: "configuracoes" as const, label: "Configuracoes", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "configuracoes" && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm max-w-3xl space-y-5">
            <h2 className="text-lg font-black text-slate-900">Configuracoes do cliente</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={form.nome || ""} onChange={(e) => setField("nome", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={form.slug || ""}
                  onChange={(e) => setField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Area juridica</Label>
                <select
                  value={form.area_juridica || ""}
                  onChange={(e) => setField("area_juridica", e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-400"
                >
                  {AREAS.map((area) => (
                    <option key={area.value} value={area.value}>
                      {area.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp || ""} onChange={(e) => setField("whatsapp", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Dominio customizado</Label>
              <Input
                value={form.dominio_customizado || ""}
                onChange={(e) => setField("dominio_customizado", normalizeHost(e.target.value))}
                placeholder={`${slugAtual}.cliente.com.br`}
                className="font-mono"
              />
              {dominioCustomErro && <p className="text-xs text-red-600">{dominioCustomErro}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Cor primaria</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.cor_primaria || "#2563eb"}
                  onChange={(e) => setField("cor_primaria", e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-200"
                />
                <Input
                  value={form.cor_primaria || ""}
                  onChange={(e) => setField("cor_primaria", e.target.value)}
                  className="w-40 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm font-black text-slate-900">Laboratorio A/B (IA)</p>
              <p className="text-xs text-slate-600">
                Gere uma sugestao de copy/perguntas para a variante B com base no funil real e publique sem editar codigo.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handleSuggestVariant} disabled={variantSuggesting}>
                  {variantSuggesting ? "Gerando sugestao..." : "Gerar sugestao com IA"}
                </Button>
                <Button type="button" className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveVariant} disabled={variantSaving}>
                  {variantSaving ? "Publicando..." : "Publicar variante B"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setVariantDraft("{}")}>
                  Limpar rascunho
                </Button>
              </div>

              <textarea
                value={variantDraft}
                onChange={(e) => setVariantDraft(e.target.value)}
                className="w-full min-h-56 rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800"
                spellCheck={false}
              />

              {variantStatus && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {variantStatus}
                </p>
              )}

              {variantError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {variantError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status da captacao</Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold w-fit ${
                    form.ativo ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {form.ativo ? "Landing ativa" : "Landing suspensa"}
                </span>

                <p className="text-xs text-slate-500 flex-1">
                  Quando suspensa, a landing mostra aviso de pagina cancelada e bloqueia novos leads.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  className={form.ativo ? "text-amber-700 border-amber-200 hover:bg-amber-50" : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"}
                  onClick={() => setField("ativo", !form.ativo)}
                >
                  {form.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {saveError}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar alteracoes"}
              </Button>

              <Button
                onClick={handleDelete}
                disabled={deletando}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deletando ? "Excluindo..." : "Excluir cliente"}
              </Button>
            </div>
          </section>
        )}

        {activeTab === "links" && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900">Links principais</h2>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Landing</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <p className="text-sm text-slate-700 font-mono truncate flex-1">{landingUrl}</p>
                  <button onClick={() => copyToClipboard(landingUrl, "landing")} className="p-1 rounded hover:bg-slate-200">
                    {copiedField === "landing" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CRM</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <p className="text-sm text-slate-700 font-mono truncate flex-1">{crmUrl}</p>
                  <button onClick={() => copyToClipboard(crmUrl, "crm")} className="p-1 rounded hover:bg-slate-200">
                    {copiedField === "crm" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Teste A/B pronto para campanha</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <p className="text-sm text-slate-700 font-mono truncate flex-1">{landingUrlA}</p>
                    <button onClick={() => copyToClipboard(landingUrlA, "landingA")} className="p-1 rounded hover:bg-slate-200">
                      {copiedField === "landingA" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <p className="text-sm text-slate-700 font-mono truncate flex-1">{landingUrlB}</p>
                    <button onClick={() => copyToClipboard(landingUrlB, "landingB")} className="p-1 rounded hover:bg-slate-200">
                      {copiedField === "landingB" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => window.open(landingUrlA, "_blank", "noopener,noreferrer")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg"
                  >
                    <ExternalLink className="w-4 h-4" /> Abrir variante A
                  </button>
                  <button
                    onClick={() => window.open(landingUrlB, "_blank", "noopener,noreferrer")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg"
                  >
                    <ExternalLink className="w-4 h-4" /> Abrir variante B
                  </button>
                  <button
                    onClick={() => copyToClipboard(quickTestPair, "landingPair")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg"
                  >
                    <Copy className="w-4 h-4" /> {copiedField === "landingPair" ? "Par copiado" : "Copiar par A/B"}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                  <p className="font-semibold">Como usar no tráfego:</p>
                  <p>1) Crie dois anúncios com a mesma segmentação.</p>
                  <p>2) Use o link com <span className="font-mono">?ab=A</span> no anúncio A e <span className="font-mono">?ab=B</span> no anúncio B.</p>
                  <p>3) Compare na aba Leads e A/B qual converte melhor e em qual etapa houve maior abandono.</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email do cliente</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <p className="text-sm text-slate-700 font-mono truncate flex-1">{tenant.email}</p>
                  <button onClick={() => copyToClipboard(tenant.email, "email")} className="p-1 rounded hover:bg-slate-200">
                    {copiedField === "email" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>
            </article>

            <article className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900">Configuracao de dominio</h2>

              <div className="bg-slate-900 rounded-xl p-4 space-y-3 font-mono text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Tipo</span>
                  <span className="text-white">CNAME</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Nome</span>
                  <span className="text-amber-300">{slugAtual}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Destino</span>
                  <span className="text-emerald-300 break-all">{cnameTarget}</span>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(cnameTarget, "cname")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg"
              >
                <Link2 className="w-4 h-4" />
                {copiedField === "cname" ? "Destino copiado" : "Copiar destino CNAME"}
              </button>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Depois de criar o CNAME no DNS do cliente, informe o dominio completo em
                  &quot;Dominio customizado&quot; e salve.
                </p>
              </div>
            </article>
          </section>
        )}

        {activeTab === "leads" && (
          <section className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Leads por periodo</h2>
                <p className="text-sm text-slate-500">
                  Filtre por dia, semana ou mes para acompanhar volume e qualidade.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {RANGE_OPTIONS.map((option) => {
                  const active = dateRange === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        setDateRange(option.id);
                        setLeadPage(1);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: `Leads (${selectedRangeDays}d)`, value: leadStats.total },
                { label: "Quente", value: leadStats.quente },
                { label: "Morno", value: leadStats.morno },
                { label: "Frio", value: leadStats.frio },
              ].map((item) => (
                <article key={item.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-2xl font-black text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                </article>
              ))}
            </div>

            {abMetricsMessage && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                {abMetricsMessage}
              </div>
            )}

            {abMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wide">Variante A</p>
                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    <p>Iniciados: <span className="font-bold text-slate-900">{abMetrics.variants.A.started}</span></p>
                    <p>Concluidos: <span className="font-bold text-slate-900">{abMetrics.variants.A.completed}</span></p>
                    <p>Taxa: <span className="font-bold text-blue-700">{abMetrics.variants.A.completionRate}%</span></p>
                    <p className="text-xs text-slate-500">Quente/Morno/Frio: {abMetrics.variants.A.quente}/{abMetrics.variants.A.morno}/{abMetrics.variants.A.frio}</p>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3 space-y-1">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Avanço por etapa</p>
                    {QUIZ_STEPS.map((step) => {
                      const totalStarted = Math.max(1, abMetrics.variants.A.started);
                      const progressed = abMetrics.variants.A.steps[step.key] || 0;
                      const percent = Math.round((progressed / totalStarted) * 100);
                      return (
                        <p key={`A-${step.key}`} className="text-xs text-slate-600">
                          {step.label}: <span className="font-semibold text-slate-900">{progressed}</span> ({percent}%)
                        </p>
                      );
                    })}
                  </div>
                </article>

                <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wide">Variante B</p>
                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    <p>Iniciados: <span className="font-bold text-slate-900">{abMetrics.variants.B.started}</span></p>
                    <p>Concluidos: <span className="font-bold text-slate-900">{abMetrics.variants.B.completed}</span></p>
                    <p>Taxa: <span className="font-bold text-blue-700">{abMetrics.variants.B.completionRate}%</span></p>
                    <p className="text-xs text-slate-500">Quente/Morno/Frio: {abMetrics.variants.B.quente}/{abMetrics.variants.B.morno}/{abMetrics.variants.B.frio}</p>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3 space-y-1">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Avanço por etapa</p>
                    {QUIZ_STEPS.map((step) => {
                      const totalStarted = Math.max(1, abMetrics.variants.B.started);
                      const progressed = abMetrics.variants.B.steps[step.key] || 0;
                      const percent = Math.round((progressed / totalStarted) * 100);
                      return (
                        <p key={`B-${step.key}`} className="text-xs text-slate-600">
                          {step.label}: <span className="font-semibold text-slate-900">{progressed}</span> ({percent}%)
                        </p>
                      );
                    })}
                  </div>
                </article>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900">Lista de leads</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Exibindo {pagedLeads.length} de {filteredLeads.length} leads no periodo
                  </p>
                </div>
              </div>

              {filteredLeads.length === 0 ? (
                <div className="py-16 text-center text-slate-400">Nenhum lead encontrado nesse periodo.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-left">
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Data</th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Lead</th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Telefone</th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Score</th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Status</th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Acao</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedLeads.map((lead) => {
                        const scoreStyle = SCORE_STYLES[lead.ia_score as string] || "bg-slate-100 text-slate-600";
                        const whatsappUrl = `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(
                          `Ola ${lead.nome}, vi seu contato no sistema.`
                        )}`;

                        return (
                          <tr key={lead.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 text-xs text-slate-500">{formatDate(lead.created_at)}</td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">{lead.nome}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{lead.telefone}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${scoreStyle}`}>
                                {lead.ia_score === "Quente" && <Flame className="w-3 h-3" />}
                                {lead.ia_score}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {STATUS_LABELS[lead.status] || lead.status}
                            </td>
                            <td className="px-4 py-3">
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredLeads.length > pageSize && (
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                  <p className="text-slate-500">Pagina {leadPage} de {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLeadPage((prev) => Math.max(1, prev - 1))}
                      disabled={leadPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setLeadPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={leadPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                    >
                      Proxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
