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
  XCircle,
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <button
          onClick={() => router.push("/admin")}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-black text-slate-900">{tenant.nome}</span>
            <code className="ml-2 text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
              {tenant.slug}
            </code>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={getClientUrl(tenant.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Ver Landing Page
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda — edição do cliente */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-slate-900">Configurações</h2>
              <button
                onClick={() => set("ativo", !form.ativo)}
                className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                title={form.ativo ? "Desativar cliente" : "Ativar cliente"}
              >
                {form.ativo ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-emerald-500" />
                    <span className="text-emerald-600">Ativo</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-400">Inativo</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Nome
              </Label>
              <Input
                value={form.nome || ""}
                onChange={(e) => set("nome", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                WhatsApp
              </Label>
              <Input
                value={form.whatsapp || ""}
                onChange={(e) => set("whatsapp", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Área Jurídica
              </Label>
              <select
                value={form.area_juridica || ""}
                onChange={(e) => set("area_juridica", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-400"
              >
                {AREAS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
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
                placeholder="captura.drsouza.com.br"
                className="text-sm font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Deixe em branco se não tiver domínio próprio.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Cor da Marca
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.cor_primaria || "#2563eb"}
                  onChange={(e) => set("cor_primaria", e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer"
                />
                <Input
                  value={form.cor_primaria || ""}
                  onChange={(e) => set("cor_primaria", e.target.value)}
                  className="font-mono text-sm w-28"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
              >
                {salvo ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Salvo!
                  </span>
                ) : saving ? (
                  "Salvando..."
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Save className="w-4 h-4" /> Salvar Alterações
                  </span>
                )}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deletando}
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50 font-semibold text-sm"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {deletando ? "Excluindo..." : "Excluir Cliente"}
              </Button>
            </div>
          </div>

          {/* Guia de Configuração para o Cliente */}
          {(() => {
            const vercelApp = process.env.NEXT_PUBLIC_VERCEL_URL
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

            return (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-5 space-y-5 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg">
                    <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-white font-black text-sm tracking-tight">
                    Guia de Configuração
                  </h3>
                </div>

                {/* Landing Page */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <p className="text-blue-300 text-[11px] font-bold uppercase tracking-widest">
                      Página de Captação
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2.5 border border-slate-700">
                    <p className="text-emerald-400 text-xs font-mono flex-1 truncate">{landingUrl}</p>
                    <button
                      onClick={() => copyToClipboard(landingUrl, "landing")}
                      className="shrink-0 p-1 rounded hover:bg-slate-700 transition-colors"
                      title="Copiar link"
                    >
                      {copiedField === "landing"
                        ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                        : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                  <a
                    href={landingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Testar landing page
                  </a>
                </div>

                {/* CNAME */}
                <div className="space-y-2 bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-amber-300 text-[11px] font-bold uppercase tracking-widest">
                      Domínio Próprio (CNAME)
                    </p>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    O cliente deve criar esta entrada DNS no painel do provedor de domínio dele:
                  </p>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] space-y-1.5">
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 items-center">
                      <span className="text-slate-500">Tipo</span>
                      <span className="text-white">CNAME</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 items-center">
                      <span className="text-slate-500">Nome</span>
                      <span className="text-amber-300">captacao</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 items-center">
                      <span className="text-slate-500">Destino</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 break-all">{cnameTarget}</span>
                        <button
                          onClick={() => copyToClipboard(cnameTarget, "cname")}
                          className="shrink-0 p-1 rounded hover:bg-slate-700 transition-colors"
                        >
                          {copiedField === "cname"
                            ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                            : <Copy className="w-3 h-3 text-slate-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 bg-amber-500/10 rounded-lg px-2.5 py-2 border border-amber-500/20">
                    <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-300/80 text-[10px] leading-relaxed">
                      Após configurar o DNS, registre o domínio no campo &quot;Domínio Customizado&quot; acima e salve. O SSL é gerado automaticamente.
                    </p>
                  </div>
                </div>

                {/* Acesso CRM */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                    <p className="text-purple-300 text-[11px] font-bold uppercase tracking-widest">
                      Acesso ao CRM
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Link de Acesso</p>
                      <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2 border border-slate-700">
                        <p className="text-blue-400 text-xs font-mono flex-1 truncate">{crmUrl}</p>
                        <button
                          onClick={() => copyToClipboard(crmUrl, "crm")}
                          className="shrink-0 p-1 rounded hover:bg-slate-700 transition-colors"
                        >
                          {copiedField === "crm"
                            ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">E-mail</p>
                      <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2 border border-slate-700">
                        <p className="text-white text-xs font-mono flex-1 truncate">{tenant.email}</p>
                        <button
                          onClick={() => copyToClipboard(tenant.email, "email")}
                          className="shrink-0 p-1 rounded hover:bg-slate-700 transition-colors"
                        >
                          {copiedField === "email"
                            ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mensagem pronta para enviar */}
                <div className="space-y-1.5">
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">Mensagem Pronta para Enviar</p>
                  {(() => {
                    const msg = `Olá! Bem-vindo ao JurisLeads 🎉\n\nSua página de captação já está no ar:\n🔗 ${landingUrl}\n\nAcesso ao seu CRM:\n🖥️ ${crmUrl}\n📧 ${tenant.email}\n\nQualquer dúvida, estou à disposição!`;
                    return (
                      <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 relative">
                        <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line pr-6">{msg}</p>
                        <button
                          onClick={() => copyToClipboard(msg, "msg")}
                          className="absolute top-2 right-2 p-1 rounded hover:bg-slate-700 transition-colors"
                          title="Copiar mensagem"
                        >
                          {copiedField === "msg"
                            ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                            : <Copy className="w-4 h-4 text-slate-400" />}
                        </button>
                      </div>
                    );
                  })()}
                </div>

                <p className="text-slate-600 text-[10px]">
                  Cliente desde {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Coluna direita — leads */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-900">Leads</h2>
                <p className="text-xs text-slate-400 mt-0.5">{leads.length} lead{leads.length !== 1 ? "s" : ""} no total</p>
              </div>
            </div>

            {leads.length === 0 ? (
              <div className="py-16 text-center">
                <Bot className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Nenhum lead ainda</p>
                <p className="text-slate-300 text-sm mt-1">
                  Os leads aparecem aqui assim que chegarem
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {leads.map((lead) => {
                  const scoreStyle = SCORE_STYLES[lead.ia_score as string] || "bg-slate-100 text-slate-500";
                  const whatsappUrl = `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(`Olá ${lead.nome}, vi seu contato no nosso sistema.`)}`;

                  return (
                    <div key={lead.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
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
                            <p className="text-xs text-slate-500 mt-1.5 italic line-clamp-2">
                              &quot;{lead.resumo}&quot;
                            </p>
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
        </div>
      </main>
    </div>
  );
}
