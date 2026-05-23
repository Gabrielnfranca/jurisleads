"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { getAreaTemplateByVariant, type LegalAreaType } from "@/lib/legal-area-templates";
import { applyTemplateOverrides, sanitizeTemplateOverrides } from "@/lib/template-overrides";
import { buildBrandThemeVars } from "@/lib/brand-theme";
import { renderHeroTitle } from "@/lib/render-hero-title";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Eye,
  Flame,
  Globe,
  Palette,
  Info,
  Link2,
  MessageCircle,
  MessageCircleQuestion,
  Save,
  Settings,
  Trash2,
  Users,
  Plus,
  HelpCircle,
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
  const [previewVariant, setPreviewVariant] = useState<"A" | "B">("A");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<"textos" | "quiz" | "faq">("textos");
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

  const areaAtual = (form.area_juridica || tenant?.area_juridica || "trabalhista") as LegalAreaType;
  const templatePreviewA = useMemo(() => getAreaTemplateByVariant(areaAtual, "A"), [areaAtual]);

  const parsedVariantDraft = useMemo(() => {
    if (!variantDraft.trim()) return { data: {}, error: null as string | null };
    try {
      const raw = JSON.parse(variantDraft);
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return { data: {}, error: "JSON deve ser um objeto." };
      }
      return { data: sanitizeTemplateOverrides(raw), error: null as string | null };
    } catch {
      return { data: {}, error: "JSON inválido para preview." };
    }
  }, [variantDraft]);

  const templatePreviewB = useMemo(
    () => applyTemplateOverrides(getAreaTemplateByVariant(areaAtual, "B"), parsedVariantDraft.data),
    [areaAtual, parsedVariantDraft.data]
  );
  const editableTemplate = templatePreviewB;
  const previewTemplate = previewVariant === "A" ? templatePreviewA : templatePreviewB;
  const previewTheme = useMemo(() => buildBrandThemeVars(form.cor_primaria || tenant?.cor_primaria), [form.cor_primaria, tenant?.cor_primaria]);

  const setDraftValue = (updater: (draft: Record<string, unknown>) => Record<string, unknown>) => {
    try {
      const current = variantDraft.trim() ? JSON.parse(variantDraft) : {};
      const safeCurrent = current && typeof current === "object" && !Array.isArray(current) ? (current as Record<string, unknown>) : {};
      const next = updater({ ...safeCurrent });
      setVariantDraft(JSON.stringify(next, null, 2));
      setVariantError(null);
    } catch {
      const next = updater({});
      setVariantDraft(JSON.stringify(next, null, 2));
      setVariantError(null);
    }
  };

  const setDraftText = (key: string, value: string) => {
    setDraftValue((draft) => ({ ...draft, [key]: value }));
  };

  const getFallbackOptions = (section: "step2Options" | "step5Options") => {
    const source = editableTemplate[section];
    if (!Array.isArray(source)) return [];
    return source.map((item) => ({
      label: typeof item?.label === "string" ? item.label : "",
      sublabel: typeof item?.sublabel === "string" ? item.sublabel : "",
    }));
  };

  const setDraftOption = (section: "step2Options" | "step5Options", index: number, key: "label" | "sublabel", value: string) => {
    setDraftValue((draft) => {
      const current = Array.isArray(draft[section])
        ? [...(draft[section] as Array<Record<string, unknown>>)]
        : (getFallbackOptions(section) as Array<Record<string, unknown>>);
      while (current.length <= index) current.push({ label: "", sublabel: "" });
      current[index] = { ...current[index], [key]: value };
      return { ...draft, [section]: current };
    });
  };

  const addDraftOption = (section: "step2Options" | "step3Options" | "step5Options") => {
    setDraftValue((draft) => {
      const current = Array.isArray(draft[section])
        ? [...(draft[section] as Array<Record<string, unknown>>)]
        : (getFallbackOptions(section as "step2Options" | "step5Options") as Array<Record<string, unknown>>);
      current.push({ label: "Nova Opção", sublabel: "Descrição da opção" });
      return { ...draft, [section]: current };
    });
  };

  const removeDraftOption = (section: "step2Options" | "step5Options", index: number) => {
    setDraftValue((draft) => {
      const current = Array.isArray(draft[section])
        ? [...(draft[section] as Array<Record<string, unknown>>)]
        : (getFallbackOptions(section) as Array<Record<string, unknown>>);
      if (index < 0 || index >= current.length) return draft;
      current.splice(index, 1);
      return { ...draft, [section]: current };
    });
  };

  const setDraftFaqItem = (index: number, key: "question" | "answer", value: string) => {
    setDraftValue((draft) => {
      const fallback = Array.isArray(editableTemplate.faqItems)
        ? editableTemplate.faqItems.map((item) => ({ question: item.question, answer: item.answer }))
        : [];
      const current = Array.isArray(draft.faqItems)
        ? [...(draft.faqItems as Array<Record<string, unknown>>)]
        : [...fallback];
      while (current.length <= index) current.push({ question: "", answer: "" });
      current[index] = { ...current[index], [key]: value };
      return { ...draft, faqItems: current };
    });
  };

  const addDraftFaqItem = () => {
    setDraftValue((draft) => {
      const fallback = Array.isArray(editableTemplate.faqItems)
        ? editableTemplate.faqItems.map((item) => ({ question: item.question, answer: item.answer }))
        : [];
      const current = Array.isArray(draft.faqItems)
        ? [...(draft.faqItems as Array<Record<string, unknown>>)]
        : [...fallback];
      current.push({ question: "Nova Pergunta?", answer: "Resposta da pergunta..." });
      return { ...draft, faqItems: current };
    });
  };

  const removeDraftFaqItem = (index: number) => {
    setDraftValue((draft) => {
      const fallback = Array.isArray(editableTemplate.faqItems)
        ? editableTemplate.faqItems.map((item) => ({ question: item.question, answer: item.answer }))
        : [];
      const current = Array.isArray(draft.faqItems)
        ? [...(draft.faqItems as Array<Record<string, unknown>>)]
        : [...fallback];
      if (index < 0 || index >= current.length) return draft;
      current.splice(index, 1);
      return { ...draft, faqItems: current };
    });
  };

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

            <div className="space-y-3 rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm font-black text-slate-900">Laboratorio A/B (IA)</p>
              <p className="text-xs text-slate-600">
                Gere uma sugestao de copy/perguntas para a variante B com base no funil real e publique sem editar codigo.
              </p>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handleSuggestVariant} disabled={variantSuggesting}>
                    {variantSuggesting ? "Gerando sugestao..." : "Gerar sugestao com IA"}
                  </Button>
                  <Button type="button" className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveVariant} disabled={variantSaving}>
                    {variantSaving ? "Publicando..." : "Publicar variante B"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setVariantDraft("{}")}>Limpar rascunho</Button>
                  <Button type="button" variant="outline" onClick={() => setActiveTab("links")}>Abrir preview em Links e Entrega</Button>
                </div>

                <textarea
                  value={variantDraft}
                  onChange={(e) => setVariantDraft(e.target.value)}
                  className="w-full min-h-56 rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800"
                  spellCheck={false}
                />
              </div>

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

              <div className="pt-4 mt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">Links de Campanhas A/B</h3>
                  <button
                    onClick={() => copyToClipboard(quickTestPair, "landingPair")}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" /> {copiedField === "landingPair" ? "Par copiado!" : "Copiar par A/B"}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs">
                          A
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Controle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setPreviewVariant("A"); setPreviewModalOpen(true); }}
                          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <span className="w-px h-3 bg-blue-200 rounded-full"></span>
                        <button 
                          onClick={() => window.open(landingUrlA, "_blank", "noopener,noreferrer")}
                          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Abrir no browser
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white border border-blue-200/60 rounded-lg px-3 py-2 shadow-sm">
                      <p className="text-sm text-slate-600 font-mono truncate flex-1">{landingUrlA}</p>
                      <button onClick={() => copyToClipboard(landingUrlA, "landingA")} className="p-1.5 rounded-md hover:bg-blue-100 transition-colors cursor-pointer">
                        {copiedField === "landingA" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-violet-50/50 border border-violet-200 rounded-xl p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 text-white font-black text-xs">
                          B
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1">
                          Teste <Flame className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setPreviewVariant("B"); setPreviewModalOpen(true); }}
                          className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <span className="w-px h-3 bg-violet-200 rounded-full"></span>
                        <button 
                          onClick={() => window.open(landingUrlB, "_blank", "noopener,noreferrer")}
                          className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Abrir no browser
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white border border-violet-200/60 rounded-lg px-3 py-2 shadow-sm">
                      <p className="text-sm text-slate-600 font-mono truncate flex-1">{landingUrlB}</p>
                      <button onClick={() => copyToClipboard(landingUrlB, "landingB")} className="p-1.5 rounded-md hover:bg-violet-100 transition-colors cursor-pointer">
                        {copiedField === "landingB" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-violet-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex gap-3 mt-2">
                  <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm text-slate-600">
                    <p className="font-bold text-slate-700">Dica de tráfego</p>
                    <p className="leading-relaxed">Crie anúncios idênticos apontando cada um para um dos links acima. Depois, acesse a aba <span className="font-semibold text-slate-800">Leads e A/B</span> para descobrir qual converte e qualifica melhor.</p>
                  </div>
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

        {previewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60" onClick={() => setPreviewModalOpen(false)} />
            <div className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Editor visual A/B</p>
                  <p className="text-sm text-slate-600">Edite texto e perguntas no painel da direita e veja o preview atualizar na hora.</p>
                  <span className="mt-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                    Novo: edição dentro do modal ativa
                  </span>
                </div>
                <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>Fechar</Button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-5">
                <article className="rounded-2xl border border-slate-200 overflow-hidden min-h-[720px]" style={previewTheme}>
                  <div className="p-6 border-b border-slate-100" style={{ backgroundColor: "var(--brand-50)" }}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewVariant("A")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            previewVariant === "A" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Teste A
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewVariant("B")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            previewVariant === "B" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Teste B
                        </button>
                      </div>
                      <span className="text-xs text-slate-500">
                        {previewVariant === "A" ? "Controle" : "Rascunho atual"}
                      </span>
                    </div>

                    <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: "var(--brand-100)", color: "var(--brand-900)" }}>
                      {previewTemplate.heroBadge}
                    </div>
                    <h3 className="mt-4 text-4xl font-black leading-tight text-slate-900 max-w-2xl">{renderHeroTitle(previewTemplate.heroTitle)}</h3>
                    <p className="mt-3 text-lg text-slate-600 max-w-2xl">{previewTemplate.heroSubtitle}</p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center px-6 py-3 rounded-xl text-base font-bold cursor-pointer"
                        style={{ backgroundColor: "var(--brand-solid)", color: "var(--brand-on-solid)" }}
                      >
                        Iniciar Analise
                      </button>
                      <span className="text-sm text-slate-500">Preview real da landing, com cor e contraste da marca.</span>
                    </div>
                  </div>

                  <div className="p-6 bg-white space-y-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Pergunta 1</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{previewTemplate.step1Question}</p>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600">
                        <p>• {previewTemplate.step1Option1}</p>
                        <p>• {previewTemplate.step1Option2}</p>
                        <p>• {previewTemplate.step1Option3}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Pergunta 2</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{previewTemplate.step2Question}</p>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600">
                        {previewTemplate.step2Options.map((opt, idx) => (
                          <p key={`step2-preview-${idx}`}>• {opt.label}</p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Pergunta 5</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{previewTemplate.step5Question}</p>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600">
                        {previewTemplate.step5Options.map((opt, idx) => (
                          <p key={`step5-preview-${idx}`}>• {opt.label}</p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">FAQ</p>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600">
                        {previewTemplate.faqItems.slice(0, 5).map((item, idx) => (
                          <p key={`faq-preview-${idx}`}>• {item.question}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>

<aside className="rounded-2xl border border-slate-200 bg-slate-50 flex flex-col lg:w-[420px] flex-shrink-0 overflow-hidden shadow-sm h-[80vh] md:max-h-[780px]">
  {/* Header Flutuante do Editor */}
  <div className="p-5 border-b border-slate-200 bg-white">
    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Editor Visual</p>
    <p className="text-sm text-slate-600 mt-1">Altere os dados da variante B e veja o preview atualizar em tempo real.</p>
    
    {parsedVariantDraft.error && (
      <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">{parsedVariantDraft.error}</p>
    )}
    
    <div className="flex bg-slate-100 p-1 mt-5 rounded-lg">
      <button type="button" onClick={() => setEditorTab("textos")} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${editorTab === 'textos' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>P�gina</button>
      <button type="button" onClick={() => setEditorTab("quiz")} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${editorTab === 'quiz' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Perguntas</button>
      <button type="button" onClick={() => setEditorTab("faq")} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${editorTab === 'faq' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>FAQ</button>
    </div>
  </div>

  {/* Corpo Rol�vel */}
  <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">
    {editorTab === "textos" && (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-500" />
          Textos do Banner
        </h3>
        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500 uppercase">Badge (Etiqueta superior)</Label>
            <Input value={editableTemplate.heroBadge || ""} onChange={(e) => setDraftText("heroBadge", e.target.value)} className="bg-slate-50 focus-visible:ring-indigo-500 shadow-inner" placeholder="Ex: Atendimento 24h" />
          </div>
          <div className="space-y-1 mt-3">
            <Label className="text-xs font-bold text-slate-500 uppercase">T�tulo Principal</Label>
            <textarea value={editableTemplate.heroTitle || ""} onChange={(e) => setDraftText("heroTitle", e.target.value)} placeholder="T�tulo da p�gina..." className="w-full min-h-[100px] rounded-lg border border-input bg-slate-50 p-3 text-sm text-slate-900 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none resize-y shadow-inner" />
          </div>
          <div className="space-y-1 mt-3">
            <Label className="text-xs font-bold text-slate-500 uppercase">Subt�tulo</Label>
            <textarea value={editableTemplate.heroSubtitle || ""} onChange={(e) => setDraftText("heroSubtitle", e.target.value)} placeholder="Breve explica��o..." className="w-full min-h-[80px] rounded-lg border border-input bg-slate-50 p-3 text-sm text-slate-900 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none resize-y shadow-inner" />
          </div>
        </div>
      </div>
    )}

    {editorTab === "quiz" && (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
          <MessageCircleQuestion className="w-5 h-5 text-blue-500" />
          Passos do Quiz
        </h3>
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <Label className="text-sm font-bold text-slate-800 block">1. Pergunta Inicial</Label>
            <textarea value={editableTemplate.step1Question || ""} onChange={(e) => setDraftText("step1Question", e.target.value)} className="w-full min-h-[70px] rounded-lg border border-input bg-slate-50 p-3 text-sm text-slate-900 font-medium focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none resize-y shadow-inner" />
            <div className="space-y-2 mt-3">
              {[0, 1, 2].map((idx) => (
                <div key={`step1-opt-${idx}`} className="flex items-center gap-2 relative group">
                  <Input
                    value={[editableTemplate.step1Option1, editableTemplate.step1Option2, editableTemplate.step1Option3][idx] || ""}
                    onChange={(e) => setDraftText(`step1Option${idx + 1}`, e.target.value)}
                    placeholder={`Op��o ${idx + 1}`}
                    className="h-9 text-sm bg-slate-50 font-medium shadow-inner"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setDraftText(`step1Option${idx + 1}`, "")} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 absolute right-1">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <Label className="text-sm font-bold text-slate-800 block">2. Benef�cios Secund�rios</Label>
            <textarea value={editableTemplate.step2Question || ""} onChange={(e) => setDraftText("step2Question", e.target.value)} className="w-full min-h-[70px] rounded-lg border border-input bg-slate-50 p-3 text-sm text-slate-900 font-medium focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none resize-y shadow-inner" />
            <div className="space-y-2 mt-3">
              {(editableTemplate.step2Options || []).map((opt, idx) => (
                <div key={`step2-opt-${idx}`} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 relative group">
                  <div className="flex-1 space-y-2">
                    <Input value={opt.label || ""} onChange={(e) => setDraftOption("step2Options", idx, "label", e.target.value)} placeholder="T�tulo da Op��o" className="h-9 text-sm bg-white font-medium shadow-sm border-slate-200 focus-visible:border-blue-400" />
                    <Input value={opt.sublabel || ""} onChange={(e) => setDraftOption("step2Options", idx, "sublabel", e.target.value)} placeholder="Descri��o da op��o" className="h-8 text-xs bg-white text-slate-600 shadow-sm border-slate-200 focus-visible:border-blue-400" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeDraftOption("step2Options", idx)} className="h-8 w-8 absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border shadow-sm text-red-500 hover:bg-red-50 rounded-full">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addDraftOption("step2Options")} className="w-full text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-700 border-dashed mt-2 h-9">
                <Plus className="w-4 h-4 mr-1" /> Nova Op��o
              </Button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <Label className="text-sm font-bold text-slate-800 block">5. Motiva��o Auxiliar</Label>
            <textarea value={editableTemplate.step5Question || ""} onChange={(e) => setDraftText("step5Question", e.target.value)} className="w-full min-h-[70px] rounded-lg border border-input bg-slate-50 p-3 text-sm text-slate-900 font-medium focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none resize-y shadow-inner" />
            <div className="space-y-2 mt-3">
              {(editableTemplate.step5Options || []).map((opt, idx) => (
                <div key={`step5-opt-${idx}`} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 relative group">
                  <div className="flex-1 space-y-2">
                    <Input value={opt.label || ""} onChange={(e) => setDraftOption("step5Options", idx, "label", e.target.value)} placeholder="T�tulo da Op��o" className="h-9 text-sm bg-white font-medium shadow-sm border-slate-200 focus-visible:border-blue-400" />
                    <Input value={opt.sublabel || ""} onChange={(e) => setDraftOption("step5Options", idx, "sublabel", e.target.value)} placeholder="Descri��o da op��o" className="h-8 text-xs bg-white text-slate-500 shadow-sm border-slate-200 focus-visible:border-blue-400" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeDraftOption("step5Options", idx)} className="h-8 w-8 absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border shadow-sm text-red-500 hover:bg-red-50 rounded-full">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addDraftOption("step5Options")} className="w-full text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-700 border-dashed mt-2 h-9">
                <Plus className="w-4 h-4 mr-1" /> Nova Op��o
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {editorTab === "faq" && (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
         <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            D�vidas Frequentes
         </h3>
         <div className="space-y-3">
          {(editableTemplate.faqItems || []).map((item, idx) => (
            <div key={`faq-opt-${idx}`} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 relative group">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">D�vida {idx + 1}</Label>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeDraftFaqItem(idx)} className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-50 rounded bg-white border shadow-sm absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Input
                value={item.question || ""}
                onChange={(e) => setDraftFaqItem(idx, "question", e.target.value)}
                placeholder="Ex: Qual a dura��o?"
                className="h-10 text-sm bg-slate-50 border-input font-medium text-slate-900 placeholder:text-slate-400 shadow-inner"
              />
              <textarea
                value={item.answer || ""}
                onChange={(e) => setDraftFaqItem(idx, "answer", e.target.value)}
                placeholder="Resposta direta"
                className="w-full min-h-[90px] rounded-lg border border-input bg-slate-50 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none resize-y shadow-inner"
              />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addDraftFaqItem} className="w-full bg-white text-indigo-600 border-indigo-200 border-dashed hover:bg-indigo-50 hover:text-indigo-700 shadow-sm mt-3 h-11">
            <Plus className="w-4 h-4 mr-1" /> Adicionar Nova D�vida
          </Button>
        </div>
      </div>
    )}
  </div>

  {/* Footer com A��es */}
  <div className="p-5 border-t border-slate-200 bg-white grid grid-cols-2 gap-3 shrink-0">
    <Button type="button" variant="outline" onClick={() => setVariantDraft("{}")} className="shadow-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-11 font-semibold">
      Descartar
    </Button>
    <Button type="button" variant="outline" onClick={handleSuggestVariant} disabled={variantSuggesting} className="shadow-sm text-indigo-700 border-indigo-200 hover:bg-indigo-50 h-11 font-semibold">
      {variantSuggesting ? "Gerando..." : "Gerar com IA"}
    </Button>
    <Button type="button" className="col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-sm text-base" onClick={handleSaveVariant} disabled={variantSaving}>
      <Save className="w-4 h-4 mr-2" />
      {variantSaving ? "Publicando Permanente..." : "Salvar Altera��es"}
    </Button>

    {variantStatus && (
      <p className="col-span-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center animate-in fade-in">{variantStatus}</p>
    )}
    {variantError && (
      <p className="col-span-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center animate-in fade-in">{variantError}</p>
    )}
  </div>
</aside>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
