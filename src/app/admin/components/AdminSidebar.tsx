"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { PlusCircle, LayoutDashboard, Shield, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

export function AdminSidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  if (pathname === "/admin/login") {
    return null; // Não exibe a sidebar no login
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/clientes/novo", icon: PlusCircle, label: "Novo Cliente" }
  ];

  return (
    <aside className="w-20 md:w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 transition-all border-r border-slate-800">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyan-300 shrink-0" />
          <span className="font-black text-lg hidden md:block">JurisLeads</span>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
        <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 hidden md:block">
          Menu Principal
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
                  ? "bg-slate-700 text-white border border-slate-600"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-cyan-200" : "text-slate-400"}`} />
              <span className="font-semibold text-sm hidden md:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 w-full rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Sair"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm hidden md:block">Sair</span>
        </button>
      </div>
    </aside>
  );
}
