"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import {
  Shield,
  LogOut,
  Users,
  TrendingUp,
  BarChart3,
  Activity,
  Plus,
  ChevronRight,
  Copy,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
} from "lucide-react";

interface Tenant {
  id: string;
  slug: string;
  nome: string;
  email: string;
  whatsapp: string;
  area_juridica: string;
  ativo: boolean;
  leads_total: number;
  leads_hoje: number;
  created_at: string;
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [search, setSearch] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin/login");
        return;
      }
      setUserEmail(session.user.email || "");

      const res = await fetch("/api/admin/tenants", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const getClientUrl = (slug: string) => {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (rootDomain) return `https://${slug}.${rootDomain}`;
    return `${window.location.origin}/${slug}`;
  };

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(getClientUrl(slug));
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const filtrados = tenants.filter(
    (t) =>
      t.nome.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalLeads = tenants.reduce((a, t) => a + t.leads_total, 0);
  const leadsHoje = tenants.reduce((a, t) => a + t.leads_hoje, 0);
  const ativos = tenants.filter((t) => t.ativo).length;

  return (
    <div className="min-h-full bg-slate-50 font-sans pb-10">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Visão Geral</h1>
            <p className="text-sm text-slate-500 font-medium">Acompanhe as métricas e gerencie as contas.</p>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-sm text-slate-400 font-medium">{userEmail}</span>
             <button
              onClick={() => router.push("/admin/clientes/novo")}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-blue-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Novo Cliente
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Clientes Ativos",
              value: ativos,
              icon: Users,
              bg: "bg-blue-50",
              color: "text-blue-600",
            },
            {
              label: "Total de Clientes",
              value: tenants.length,
              icon: BarChart3,
              bg: "bg-slate-100",
              color: "text-slate-600",
            },
            {
              label: "Leads Hoje",
              value: leadsHoje,
              icon: Activity,
              bg: "bg-amber-50",
              color: "text-amber-600",
            },
            {
              label: "Total de Leads",
              value: totalLeads,
              icon: TrendingUp,
              bg: "bg-emerald-50",
              color: "text-emerald-600",
            },
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {loading ? <span className="text-slate-300">—</span> : value}
              </p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabela de clientes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-900 text-lg">Clientes</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors w-48"
                />
              </div>
              <button
                onClick={() => router.push("/admin/clientes/novo")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Novo Cliente
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">
                {search ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
              </p>
              {!search && (
                <p className="text-slate-300 text-sm mt-1">
                  Clique em &quot;Novo Cliente&quot; para começar
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-6 py-3">
                      Cliente
                    </th>
                    <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3">
                      Slug
                    </th>
                    <th className="text-center text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3">
                      Leads
                    </th>
                    <th className="text-center text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3">
                      Hoje
                    </th>
                    <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3">
                      Status
                    </th>
                    <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3">
                      Link de Captação
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtrados.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-900 text-sm">{tenant.nome}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{tenant.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded-lg text-slate-600">
                          {tenant.slug}
                        </code>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-black text-slate-900">
                          {tenant.leads_total}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`text-sm font-black ${
                            tenant.leads_hoje > 0 ? "text-amber-600" : "text-slate-300"
                          }`}
                        >
                          {tenant.leads_hoje > 0 ? `+${tenant.leads_hoje}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {tenant.ativo ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                            <XCircle className="w-3.5 h-3.5" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400 font-mono">
                            /{tenant.slug}
                          </span>
                          <button
                            onClick={() => copyUrl(tenant.slug)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Copiar link"
                          >
                            {copiedSlug === tenant.slug ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={getClientUrl(tenant.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Abrir landing page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => router.push(`/admin/clientes/${tenant.id}`)}
                          className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          Abrir <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
