"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, ShieldHalf, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      {/* Coluna da Direita (Painel Institucional - Escondido no Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Efeito de brilho no fundo refinado */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.2),rgba(255,255,255,0))]"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tight">JurisLeads</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h1 className="text-5xl font-black leading-[1.1] tracking-tight">
            A nova era da captação jurídica.
          </h1>
          <p className="text-blue-100 text-xl font-medium leading-relaxed">
            Deixe nossa I.A. agir como filtro. Fale apenas com clientes altamente qualificados e feche mais contratos online.
          </p>
          <div className="flex gap-6 pt-6">
            <div className="flex items-center gap-2 text-base font-bold text-white bg-blue-500/50 px-4 py-2 rounded-full border border-blue-400">
              <ShieldHalf className="w-5 h-5 text-white" />
              Privacidade Absoluta
            </div>
            <div className="flex items-center gap-2 text-base font-bold text-white bg-blue-500/50 px-4 py-2 rounded-full border border-blue-400">
              <Sparkles className="w-5 h-5 text-white" />
              IA Integrada
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm font-medium text-blue-200">
          © {new Date().getFullYear()} JurisLeads. Todos os direitos reservados.
        </div>
      </div>

      {/* Coluna da Esquerda (Formulário de Login) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Logo Mobile */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">JurisLeads</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Bem-vindo de volta</h2>
            <p className="text-slate-500 text-lg font-medium mt-2">Acesse seu painel exclusivo de leads.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-bold text-slate-800">E-mail corporativo</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="dr.carlos@escritorio.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-16 bg-slate-50 border-2 border-slate-200 text-lg px-5 rounded-2xl focus-visible:ring-4 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 transition-all font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-base font-bold text-slate-800">Senha</Label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-bold transition-colors">Esqueceu a senha?</a>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-16 bg-slate-50 border-2 border-slate-200 text-xl px-5 rounded-2xl focus-visible:ring-4 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 transition-all font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 shadow-sm tracking-widest"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-2">
                 <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-16 text-xl font-black bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] mt-6 gap-2" 
              disabled={loading}
            >
              {loading ? "Autenticando..." : "Acessar Sistema"}
            </Button>
          </form>

          <p className="text-center text-sm font-bold text-slate-400 mt-10 lg:hidden">
            © {new Date().getFullYear()} JurisLeads
          </p>
        </div>
      </div>
    </div>
  );
}
