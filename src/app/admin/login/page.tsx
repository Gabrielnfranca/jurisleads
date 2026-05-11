"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    const accessToken = data.session?.access_token;
    if (!accessToken) {
      setError("Sessão não foi criada. Tente novamente.");
      setLoading(false);
      return;
    }

    const adminCheck = await fetch("/api/admin/tenants", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (adminCheck.status === 401) {
      await supabase.auth.signOut();
      setError("Seu usuário autenticou, mas não tem permissão de administrador.");
      setLoading(false);
      return;
    }

    if (!adminCheck.ok) {
      setError("Falha ao validar acesso ao painel. Tente novamente.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/40">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-xl tracking-tight">JurisLeads</p>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
              Painel Admin
            </p>
          </div>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm font-semibold">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              placeholder="admin@email.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm font-semibold">Senha</Label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white pr-10 focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/50 border border-red-900 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold mt-2"
          >
            {loading ? "Entrando..." : "Acessar Painel"}
          </Button>
        </form>
      </div>
    </div>
  );
}
