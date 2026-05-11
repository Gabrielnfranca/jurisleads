"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Shield,
  Phone,
  MessageCircle,
  Bot,
  Flame,
  Clock,
  CheckCircle,
  Trash2,
  Save,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Copy,
  Globe,
  Link2,
  KeyRound,
  LayoutDashboard,
  Info,
  Settings,
  Users,
  Send,
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

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em Análise",
  atendimento: "Em Atendimento",
  fechado: "Fechado",
};

const SCORE_STYLES: Record<string, string> = {
  Quente: "bg-red-100 text-red-700",
  Morno: "bg-amber-100 text-amber-700",
  Frio: "bg-blue-100 text-blue-600",
};

const AREAS = [
  { value: "trabalhista", label: "Trabalhista" },
  { value: "previdenciario", label: "Previdenciário" },
  { value: "consumidor", label: "Consumidor" },
  { value: "familia", label: "Família" },
  { value: "criminal", label: "Criminal" },
  { value: "tributario", label: "Tributário" },
  { value: "imobiliario", label: "Imobiliário" },
  { value: "civil", label: "Civil Geral" },
];

export default function ClienteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const id = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [form, setForm] = useState<Partial<Tenant>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"configuracoes" | "onboarding" | "leads">("configuracoes");

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
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
      setTenant(data.tenant);
      setForm({
        nome: data.tenant.nome,
        whatsapp: data.tenant.whatsapp,
        area_juridica: data.tenant.area_juridica,
        cor_primaria: data.tenant.cor_primaria,
        ativo: data.tenant.ativo,
        dominio_customizado: data.tenant.dominio_customizado || "",
      });
      setLeads(data.leads);
      setLoading(false);
    };

    load();
  }, [id, router]);

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/admin/login");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/admin/tenants/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir o cliente "${tenant?.nome}" e todos os seus dados? Esta ação é irreversível.`)) return;

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

  const getClientUrl = (slug: string) => {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (rootDomain) return `https://${slug}.${rootDomain}`;
    return `${window.location.origin}/${slug}`;
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  if (!tenant) return null;

  const vercelApp =
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : typeof window !== "undefined"
      ? window.location.origin
      : "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const landingUrl = tenant.dominio_customizado
    ? `https://${tenant.dominio_customizado}`
    : rootDomain
    ? `https://${tenant.slug}.${rootDomain}`
    : `${vercelApp}/${tenant.slug}`;
  const crmUrl = `${vercelApp}/login`;
  const cnameTarget = rootDomain || vercelApp.replace("https://", "");
  const msgOnboarding = `Olá! Bem-vindo ao JurisLeads 🎉\n\nSua página de captação já está no ar:\n🔗 ${landingUrl}\n\nAcesso ao seu CRM:\n🖥️ ${crmUrl}\n📧 ${tenant.email}\n\nQualquer dúvida, estou à disposição!`;

  const TABS = [
    { id: "configuracoes" as const, label: "Configurações", icon: Settings },
    { id: "onboarding" as const, label: "Guia de Entrega", icon: Send },
    { id: "leads" as const, label: `Leads`, badge: leads.length, icon: Users },
  ];

  return (
    <div className="flex h-full bg-slate-50 font-sans overflow-hidden">
      
      {/* ── Sidebar (Admin Navigation) ── */}
      <aside className="w-64 bg-slate-800 text-slate-200 flex flex-col hidden md:flex shrink-0 border-r border-slate-700">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-black text-lg">
            <Shield className="w-5 h-5 text-cyan-300" /> JurisLeads Admin
          </div>
        </div>

        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 px-6 py-4 border-b border-slate-700 text-sm font-semibold hover:text-white hover:bg-slate-700 transition-colors text-left"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" /> Voltar para Clientes
        </button>
        
        <div className="p-6 pb-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Gerenciar {tenant.nome}</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? "bg-slate-700 text-white border border-slate-600"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-cyan-200" : "text-slate-400"}`} />
                <span className="flex-1 text-left">{tab.label}</span>
                {"badge" in tab && (tab.badge ?? 0) > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    active ? "bg-slate-100 text-slate-700" : "bg-slate-700 text-slate-300"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* ── Mobile Header & Topbar ── */}
        <header className="bg-white border-b border-slate-100 px-4 sm:px-6 h-16 flex items-center gap-3 shadow-sm shrink-0">
          <button
            onClick={() => router.push("/admin")}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden md:flex p-2 bg-blue-50/50 rounded-xl border border-blue-100">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <span className="font-black text-slate-900 truncate block text-lg">{tenant.nome}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${form.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {form.ativo ? "Ativo" : "Inativo"}
                </span>
                <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                  {tenant.slug}
                </code>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <a
              href={landingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Ver Landing Page</span>
            </a>
          </div>
        </header>

        {/* ── Mobile Tabs ── */}
        <div className="md:hidden bg-white border-b border-slate-100 px-2 flex overflow-x-auto shrink-0 shadow-sm" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-3 text-sm font-semibold border-b-2 whitespace-nowrap ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Content ── */}
        <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8">

        {/* ═══ ABA: CONFIGURAÇÕES ═══ */}
        {activeTab === "configuracoes" && (
          <div className="max-w-xl space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-slate-900 text-lg">Dados do Cliente</h2>
                <button
                  onClick={() => set("ativo", !form.ativo)}
                  className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                  title={form.ativo ? "Desativar cliente" : "Ativar cliente"}
                >
                  {form.ativo ? (
                    <>
                      <ToggleRight className="w-6 h-6 text-emerald-500" />
                      <span className="text-emerald-600">Ativo</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                      <span className="text-slate-400">Inativo</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome</Label>
                  <Input value={form.nome || ""} onChange={(e) => set("nome", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">WhatsApp</Label>
                  <Input value={form.whatsapp || ""} onChange={(e) => set("whatsapp", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Área Jurídica</Label>
                <select
                  value={form.area_juridica || ""}
                  onChange={(e) => set("area_juridica", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-400"
                >
                  {AREAS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Domínio Customizado (CNAME)
                </Label>
                <Input
                  value={form.dominio_customizado || ""}
                  onChange={(e) => set("dominio_customizado", e.target.value)}
                  placeholder="captura.escritoriodacarol.com.br"
                  className="font-mono"
                />
                <p className="text-[11px] text-slate-400">Deixe em branco se não tiver domínio próprio.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cor da Marca</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.cor_primaria || "#2563eb"}
                    onChange={(e) => set("cor_primaria", e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <Input
                    value={form.cor_primaria || ""}
                    onChange={(e) => set("cor_primaria", e.target.value)}
                    className="font-mono w-32"
                  />
                  <div
                    className="w-10 h-10 rounded-xl border border-slate-200 shrink-0"
                    style={{ backgroundColor: form.cor_primaria || "#2563eb" }}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {salvo ? (
                    <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Salvo!</span>
                  ) : saving ? "Salvando..." : (
                    <span className="flex items-center gap-1.5"><Save className="w-4 h-4" /> Salvar</span>
                  )}
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deletando}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 font-semibold"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  {deletando ? "Excluindo..." : "Excluir"}
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-400">
              Cliente desde {new Date(tenant.created_at).toLocaleDateString("pt-BR")} · E-mail: <span className="font-mono text-slate-600">{tenant.email}</span>
            </div>
          </div>
        )}

        {/* ═══ ABA: GUIA DE ENTREGA ═══ */}
        {activeTab === "onboarding" && (
          <div className="max-w-2xl space-y-4">

            {/* Card: Landing Page */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-xl"><Globe className="w-4 h-4 text-blue-600" /></div>
                <div>
                  <h3 className="font-black text-slate-900">Página de Captação</h3>
                  <p className="text-xs text-slate-400">Link da landing page do cliente</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <p className="text-blue-600 text-sm font-mono flex-1 truncate">{landingUrl}</p>
                <button onClick={() => copyToClipboard(landingUrl, "landing")} className="shrink-0 p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                  {copiedField === "landing" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
              <a href={landingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold">
                <ExternalLink className="w-3.5 h-3.5" /> Abrir e testar
              </a>
            </div>

            {/* Card: CNAME */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl"><Link2 className="w-4 h-4 text-amber-600" /></div>
                <div>
                  <h3 className="font-black text-slate-900">Configuração CNAME</h3>
                  <p className="text-xs text-slate-400">Para o cliente usar o próprio domínio</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">O cliente deve adicionar esta entrada no painel de DNS do provedor de domínio dele:</p>
              <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs uppercase tracking-wider w-16">Tipo</span>
                  <span className="text-white flex-1">CNAME</span>
                </div>
                <div className="border-t border-slate-800" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs uppercase tracking-wider w-16">Nome</span>
                  <span className="text-amber-300 flex-1">captacao</span>
                </div>
                <div className="border-t border-slate-800" />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 text-xs uppercase tracking-wider w-16">Destino</span>
                  <span className="text-emerald-400 flex-1 break-all">{cnameTarget}</span>
                  <button onClick={() => copyToClipboard(cnameTarget, "cname")} className="shrink-0 p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                    {copiedField === "cname" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-700 text-xs leading-relaxed">
                  Após o cliente configurar o DNS, registre o domínio no campo <strong>Domínio Customizado</strong> na aba Configurações e salve. O certificado SSL é gerado automaticamente.
                </p>
              </div>
            </div>

            {/* Card: Acesso CRM */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 rounded-xl"><KeyRound className="w-4 h-4 text-purple-600" /></div>
                <div>
                  <h3 className="font-black text-slate-900">Acesso ao CRM</h3>
                  <p className="text-xs text-slate-400">Credenciais para o cliente entrar no painel</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Link de Acesso</p>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
                    <p className="text-purple-600 text-xs font-mono flex-1 truncate">{crmUrl}</p>
                    <button onClick={() => copyToClipboard(crmUrl, "crm")} className="shrink-0 p-1 rounded-lg hover:bg-slate-200 transition-colors">
                      {copiedField === "crm" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">E-mail</p>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
                    <p className="text-slate-700 text-xs font-mono flex-1 truncate">{tenant.email}</p>
                    <button onClick={() => copyToClipboard(tenant.email, "email")} className="shrink-0 p-1 rounded-lg hover:bg-slate-200 transition-colors">
                      {copiedField === "email" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Mensagem pronta */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 rounded-xl"><MessageCircle className="w-4 h-4 text-emerald-600" /></div>
                  <div>
                    <h3 className="font-black text-slate-900">Mensagem Pronta</h3>
                    <p className="text-xs text-slate-400">Copie e envie para o cliente via WhatsApp</p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(msgOnboarding, "msg")}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors border ${
                    copiedField === "msg"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {copiedField === "msg" ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === "msg" ? "Copiado!" : "Copiar tudo"}
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{msgOnboarding}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ABA: LEADS ═══ */}
        {activeTab === "leads" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-900">Leads</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {leads.length} lead{leads.length !== 1 ? "s" : ""} no total
                </p>
              </div>
            </div>

            {leads.length === 0 ? (
              <div className="py-20 text-center">
                <Bot className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">Nenhum lead ainda</p>
                <p className="text-slate-300 text-sm mt-1">Os leads aparecem aqui assim que chegarem</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {leads.map((lead) => {
                  const scoreStyle = SCORE_STYLES[lead.ia_score as string] || "bg-slate-100 text-slate-500";
                  const whatsappUrl = `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(`Olá ${lead.nome}, vi seu contato no nosso sistema.`)}`;
                  return (
                    <div key={lead.id} className="px-6 py-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${scoreStyle}`}>
                              {lead.ia_score === "Quente" && <Flame className="w-3 h-3" />}
                              {lead.ia_score}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              {STATUS_LABELS[lead.status] || lead.status}
                            </span>
                          </div>
                          <p className="font-black text-slate-900 text-sm">{lead.nome}</p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {lead.telefone}
                          </p>
                          {lead.resumo && (
                            <p className="text-xs text-slate-500 mt-1.5 italic line-clamp-2">&quot;{lead.resumo}&quot;</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(lead.created_at)}
                          </span>
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-100"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
