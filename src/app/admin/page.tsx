"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";

interface Tenant {
  id: string;
  slug: string;
  nome: string;
  ativo: boolean;
  leads_total: number;
  leads_hoje: number;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/admin/login");
        return;
      }

      if (!cancelled) {
        setUserEmail(session.user.email || "");
      }

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
      if (!cancelled) {
        setTenants(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const stats = useMemo(() => {
    const totalClientes = tenants.length;
    const clientesAtivos = tenants.filter((tenant) => tenant.ativo).length;
    const leadsHoje = tenants.reduce((acc, tenant) => acc + (tenant.leads_hoje || 0), 0);
    const leadsTotal = tenants.reduce((acc, tenant) => acc + (tenant.leads_total || 0), 0);

    return { totalClientes, clientesAtivos, leadsHoje, leadsTotal };
  }, [tenants]);

  const clienteSugerido = tenants[0];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Admin</p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Operacao simplificada
              </h1>
              <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                Agora os clientes ficam na barra lateral. Selecione um cliente para abrir os dados,
                acompanhar leads por periodo e analisar testes A/B sem excesso de cards.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs text-slate-400">Usuario atual</p>
                <p className="text-sm font-semibold text-slate-700">{userEmail || "-"}</p>
              </div>
              <button
                onClick={() => router.push("/admin/clientes/novo")}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Novo cliente
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Clientes ativos",
              value: stats.clientesAtivos,
              icon: Users,
              accent: "text-blue-600 bg-blue-50",
            },
            {
              label: "Total de clientes",
              value: stats.totalClientes,
              icon: BarChart3,
              accent: "text-slate-600 bg-slate-100",
            },
            {
              label: "Leads hoje",
              value: stats.leadsHoje,
              icon: Activity,
              accent: "text-amber-600 bg-amber-50",
            },
            {
              label: "Leads totais",
              value: stats.leadsTotal,
              icon: TrendingUp,
              accent: "text-emerald-600 bg-emerald-50",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-3">
                  {loading ? <span className="text-slate-300">-</span> : item.value}
                </p>
                <p className="text-xs font-semibold text-slate-400 mt-1">{item.label}</p>
              </article>
            );
          })}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Proximo passo recomendado</h2>
              <p className="text-sm text-slate-500 mt-1">
                Clique em um cliente na sidebar para abrir o painel detalhado com filtros de
                dia, semana e mes, alem da visao A/B e links.
              </p>
            </div>
            <CalendarClock className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
          </div>

          {clienteSugerido ? (
            <button
              onClick={() => router.push(`/admin/clientes/${clienteSugerido.id}`)}
              className="w-full sm:w-auto inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              Abrir {clienteSugerido.nome}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <p className="text-sm text-slate-400">
              Ainda nao ha clientes cadastrados. Use &quot;Novo cliente&quot; para comecar.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
