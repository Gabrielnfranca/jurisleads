"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle,
  LayoutDashboard,
  Shield,
  LogOut,
  Search,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase-client";

interface TenantItem {
  id: string;
  slug: string;
  nome: string;
  ativo: boolean;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTenants = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        if (!cancelled) {
          setTenants([]);
          setLoading(false);
        }
        return;
      }

      const res = await fetch("/api/admin/tenants", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        if (!cancelled) {
          setTenants([]);
          setLoading(false);
        }
        return;
      }

      const data = await res.json();
      if (!cancelled) {
        setTenants(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    };

    loadTenants();

    return () => {
      cancelled = true;
    };
  }, [pathname, supabase]);

  const filteredTenants = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tenants;
    return tenants.filter(
      (tenant) =>
        tenant.nome.toLowerCase().includes(term) || tenant.slug.toLowerCase().includes(term)
    );
  }, [search, tenants]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.href = "/admin/login";
  };

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/clientes/novo", icon: PlusCircle, label: "Novo Cliente" }
  ];

  if (pathname === "/admin/login") {
    return null; // Não exibe a sidebar no login
  }

  return (
    <aside className="w-20 md:w-80 bg-slate-100/95 text-slate-700 flex flex-col shrink-0 transition-all border-r border-slate-200 backdrop-blur">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-200 bg-white/70">
        <Link href="/admin" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600 shrink-0" />
          <span className="font-black text-lg hidden md:block text-slate-900">JurisLeads</span>
        </Link>
      </div>

      <nav className="py-4 px-3 flex flex-col gap-2 border-b border-slate-200">
        <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 hidden md:block">
          Painel
        </p>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
              title={item.label}
            >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span className="font-semibold text-sm hidden md:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 min-h-0 py-4 px-3">
        <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 hidden md:block">
          Clientes
        </p>

        <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 mb-3 shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="overflow-y-auto h-[calc(100%-5.2rem)] pr-1">
          {loading ? (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 px-3 py-2">
              <Users className="w-4 h-4" /> Carregando clientes...
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="hidden md:block text-xs text-slate-500 px-3 py-2">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTenants.map((tenant) => {
                const href = `/admin/clientes/${tenant.id}`;
                const isActive = pathname === href;
                return (
                  <Link
                    key={tenant.id}
                    href={href}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                    }`}
                    title={tenant.nome}
                  >
                    <div className="hidden md:block min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{tenant.nome}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">/{tenant.slug}</p>
                    </div>
                    <span className="hidden md:flex items-center">
                      {tenant.ativo ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                    </span>

                    <span className="md:hidden inline-flex w-10 h-10 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs font-black uppercase text-slate-700 shadow-sm">
                      {tenant.nome.slice(0, 2)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-white/60">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 w-full rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
          title="Sair"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm hidden md:block">Sair</span>
        </button>
      </div>
    </aside>
  );
}
