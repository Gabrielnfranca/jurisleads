"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Shield,
  User,
  Mail,
  Lock,
  Phone,
  Link,
  Shuffle,
  Eye,
  EyeOff,
  CheckCircle,
  Globe,
} from "lucide-react";

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

function gerarSenha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NovoClientePage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    nome: "",
    slug: "",
    email: "",
    senha: gerarSenha(),
    whatsapp: "",
    area_juridica: "trabalhista",
    cor_primaria: "#2563eb",
    dominio_customizado: "",
  });
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [avisoVercel, setAvisoVercel] = useState<string | null>(null);
  const [createdTenant, setCreatedTenant] = useState<{ id: string; slug: string } | null>(null);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://jurisleads.vercel.app";

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleNomeChange = (nome: string) => {
    setForm((prev) => ({
      ...prev,
      nome,
      slug: prev.slug === slugify(prev.nome) || prev.slug === "" ? slugify(nome) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    let accessToken = session?.access_token || "";

    if (!accessToken) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      accessToken = refreshed.session?.access_token || "";
    }

    if (!accessToken) {
      setErro("Sessão expirada. Faça login novamente.");
      setLoading(false);
      router.push("/admin/login");
      return;
    }

    let res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(form),
    });

    if (res.status === 401) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      const refreshedToken = refreshed.session?.access_token || "";

      if (!refreshedToken) {
        setErro("Sua sessão de administrador expirou. Faça login novamente.");
        setLoading(false);
        router.push("/admin/login");
        return;
      }

      res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshedToken}`,
        },
        body: JSON.stringify(form),
      });

      accessToken = refreshedToken;
    }

    const data = await res.json();

    if (!res.ok) {
      const rawError = String(data.error || "");
      if (res.status === 401) {
        setErro("Sua sessão de administrador expirou. Faça login novamente.");
        setLoading(false);
        router.push("/admin/login");
        return;
      }

      const friendlyError = rawError.includes("tenants_slug_key") || rawError.includes("Slug duplicado")
        ? "Slug já em uso. Tente outro slug para esse cliente."
        : (data.error || "Erro ao criar cliente.");
      setErro(friendlyError);
      setLoading(false);
      return;
    }

    // Se tem domínio customizado, registra na Vercel
    if (form.dominio_customizado && data.id) {
      const domRes = await fetch("/api/admin/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ tenantId: data.id, dominio: form.dominio_customizado }),
      });
      const domData = await domRes.json();
      if (domData.warning) setAvisoVercel(domData.warning);
    }

    setCreatedTenant({ id: String(data.id), slug: String(data.slug || form.slug) });
    setSucesso(true);
    setTimeout(() => router.push(`/admin/clientes/${data.id}`), avisoVercel ? 2800 : 1600);
  };

  if (sucesso) {
    const createdSlug = createdTenant?.slug || form.slug;
    const landingUrl = `${baseUrl}/${createdSlug}`;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-5">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900">Cliente criado!</p>
          <p className="text-slate-500 text-sm mt-2">
            Link da landing criado com slug final: <span className="font-mono text-slate-700">/{createdSlug}</span>
          </p>
          <a
            href={landingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex mt-3 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg"
          >
            Abrir landing agora
          </a>
          {avisoVercel ? (
            <p className="text-amber-600 text-sm mt-1 max-w-xs">
              ⚠️ {avisoVercel} Configure o VERCEL_TOKEN para registro automático.
            </p>
          ) : (
            <p className="text-slate-400 text-sm mt-2">Redirecionando para o painel do cliente...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 font-sans pb-10">
      <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-black text-slate-900 text-lg">Novo Cliente</h1>
          <p className="text-xs font-medium text-slate-500">Preencha os dados para provisionar o ambiente</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6 items-start">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-6">
              <div>
                <h2 className="font-black text-slate-900">Dados do Escritório</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Informações públicas da landing e identidade visual do cliente.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Nome do Escritório *
                </Label>
                <Input
                  value={form.nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  placeholder="Dr. João Silva Advocacia"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5" /> Slug (URL) *
                </Label>
                <div className="relative">
                  <Input
                    value={form.slug}
                    onChange={(e) => set("slug", slugify(e.target.value))}
                    placeholder="drjoaosilva"
                    required
                    className="pr-28"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                    /{form.slug || "slug"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Apenas letras minúsculas, números e hífens. Ex: &quot;drjoao&quot;
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> WhatsApp *
                  </Label>
                  <Input
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)}
                    placeholder="5511999998888"
                    required
                  />
                  <p className="text-xs text-slate-400">
                    Com DDI e DDD, sem espaços ou símbolos.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Área Jurídica</Label>
                  <select
                    value={form.area_juridica}
                    onChange={(e) => set("area_juridica", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-400"
                  >
                    {AREAS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Domínio de Captação (CNAME)
                </Label>
                <Input
                  value={form.dominio_customizado}
                  onChange={(e) => set("dominio_customizado", e.target.value.toLowerCase().trim())}
                  placeholder="captura.escritoriodosouza.com.br"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-400">
                  Opcional. O cliente cria um CNAME apontando para o seu servidor e você registra aqui.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Cor da Marca</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.cor_primaria}
                    onChange={(e) => set("cor_primaria", e.target.value)}
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <Input
                    value={form.cor_primaria}
                    onChange={(e) => set("cor_primaria", e.target.value)}
                    className="font-mono text-sm w-36"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-5">
              <div>
                <h2 className="font-black text-slate-900">Credenciais de Acesso ao CRM</h2>
                <p className="text-sm text-slate-500 mt-1">
                  O advogado usará essas credenciais para acessar o painel de leads.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email de Acesso *
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="contato@escritorio.com.br"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Senha *
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showSenha ? "text" : "password"}
                      value={form.senha}
                      onChange={(e) => set("senha", e.target.value)}
                      required
                      className="pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => set("senha", gerarSenha())}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Gerar senha aleatória"
                  >
                    <Shuffle className="w-4 h-4" /> Gerar
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Anote essa senha e compartilhe com o cliente de forma segura.
                </p>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-slate-900">Resumo do cliente</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Nome</p>
                  <p className="font-semibold text-slate-800 truncate">{form.nome || "A definir"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">URL da landing</p>
                  <p className="font-mono text-xs text-slate-700 break-all">/{form.slug || "slug"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Área jurídica</p>
                  <p className="font-semibold text-slate-800 capitalize">{form.area_juridica}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Cor principal</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-200"
                      style={{ backgroundColor: form.cor_primaria }}
                    />
                    <p className="font-mono text-xs text-slate-700">{form.cor_primaria}</p>
                  </div>
                </div>
              </div>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
                {erro}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {loading ? "Criando..." : "Criar Cliente"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
