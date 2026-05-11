"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import {
  Scale, ArrowLeft, Bell, Send, Mail, Check, Eye, EyeOff,
  Loader2, ChevronDown, ChevronUp, ExternalLink, Smartphone
} from "lucide-react";

function Passo({ n, texto, destaque }: { n: number; texto: string; destaque?: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <p className="text-sm text-slate-700 font-medium leading-relaxed">
        {texto}{destaque && <> <code className="bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded-md text-xs font-mono">{destaque}</code></>}
      </p>
    </div>
  );
}

function Tutorial({ title, children }: { title: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className={`rounded-2xl border-2 transition-colors ${aberto ? 'border-blue-200 bg-blue-50/40' : 'border-slate-100 bg-slate-50/60'}`}>
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="text-sm font-black text-slate-700">{title}</span>
        {aberto ? <ChevronUp className="w-4 h-4 text-blue-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {aberto && (
        <div className="px-4 pb-5 space-y-3 border-t border-blue-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Telegram
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramAtivo, setTelegramAtivo] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Email
  const [resendKey, setResendKey] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [emailAtivo, setEmailAtivo] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);

  const [testando, setTestando] = useState<"telegram" | "email" | null>(null);
  const [testMsg, setTestMsg] = useState<{ canal: string; ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUserId(session.user.id);

      const { data } = await supabase
        .from("notificacoes_config")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (data) {
        setTelegramToken(data.telegram_token ?? "");
        setTelegramChatId(data.telegram_chat_id ?? "");
        setTelegramAtivo(data.telegram_ativo ?? false);
        setResendKey(data.resend_api_key ?? "");
        setResendEmail(data.resend_email ?? "");
        setEmailAtivo(data.email_ativo ?? false);
      }
      setLoading(false);
    };
    load();
  }, []);

  const salvar = async () => {
    if (!userId) return;
    setSalvando(true);
    const payload = {
      user_id: userId,
      telegram_token: telegramToken.trim(),
      telegram_chat_id: telegramChatId.trim(),
      telegram_ativo: telegramAtivo,
      resend_api_key: resendKey.trim(),
      resend_email: resendEmail.trim(),
      email_ativo: emailAtivo,
    };
    await supabase.from("notificacoes_config").upsert(payload, { onConflict: "user_id" });
    setSalvando(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
  };

  const testar = async (canal: "telegram" | "email") => {
    setTestando(canal);
    setTestMsg(null);
    try {
      const res = await fetch("/api/notify-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "teste",
          canal,
          config: {
            telegram_token: telegramToken.trim(),
            telegram_chat_id: telegramChatId.trim(),
            resend_api_key: resendKey.trim(),
            resend_email: resendEmail.trim(),
          },
        }),
      });
      const json = await res.json();
      setTestMsg({ canal, ok: res.ok, msg: json.message ?? (res.ok ? "Enviado com sucesso!" : "Erro ao enviar.") });
    } catch {
      setTestMsg({ canal, ok: false, msg: "Erro de conexão." });
    }
    setTestando(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 md:px-10 h-20 flex items-center gap-4 shadow-sm">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="w-px h-6 bg-slate-200"></div>
        <Scale className="w-6 h-6 text-blue-600" />
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Configurações de Notificações</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/20">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black mb-1">Fique sabendo na hora que chegar um lead!</h2>
              <p className="text-blue-100 text-sm leading-relaxed font-medium">
                Configure abaixo para receber uma mensagem automática no seu celular toda vez que um
                potencial cliente preencher o formulário — mesmo que você esteja fora do escritório.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-200" />
              <span className="text-xs font-bold text-white">Funciona no celular</span>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-200" />
              <span className="text-xs font-bold text-white">100% gratuito</span>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-blue-200" />
              <span className="text-xs font-bold text-white">Instantâneo</span>
            </div>
          </div>
        </div>

        {/* Telegram */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 flex items-center justify-center">
                <Send className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">Telegram</h2>
                  <span className="text-[10px] uppercase tracking-widest font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Recomendado</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Mensagem no celular • Grátis • Instantâneo</p>
              </div>
            </div>
            <button
              onClick={() => setTelegramAtivo(!telegramAtivo)}
              className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${telegramAtivo ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${telegramAtivo ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <Tutorial title="📖 Como configurar o Telegram? (passo a passo para iniciantes)">
              <Passo n={1} texto="Instale o Telegram no seu celular (disponível na App Store e Google Play) ou acesse telegram.org no computador." />
              <Passo n={2} texto="Dentro do Telegram, na barra de pesquisa, procure por" destaque="@BotFather" />
              <Passo n={3} texto="Abra a conversa com o BotFather e clique em Iniciar (ou envie" destaque="/start" />
              <Passo n={4} texto="Envie o comando" destaque="/newbot" />
              <Passo n={5} texto='O BotFather vai pedir um nome para o bot. Digite algo como: "Alertas JurisLeads" e pressione Enter.' />
              <Passo n={6} texto='Agora ele vai pedir um username (apelido técnico). Deve terminar com "bot". Ex:' destaque="alertas_jurisleads_bot" />
              <Passo n={7} texto="Pronto! O BotFather vai te enviar um Token parecido com este — copie e cole no campo abaixo:" destaque="110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw" />
              <Passo n={8} texto="Agora pesquise pelo nome do bot que você criou no Telegram e envie qualquer mensagem para ele (ex: oi)." />
              <Passo n={9} texto="Para pegar o Chat ID, abra este endereço no navegador (substituindo TOKEN pelo token copiado):" destaque="https://api.telegram.org/botTOKEN/getUpdates" />
              <Passo n={10} texto='Na página que abrir, procure o número que aparece em "id": dentro de "chat": — esse é o seu Chat ID. Cole no campo abaixo.' />
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs text-blue-700 font-medium leading-relaxed">💡 <strong>Dica final:</strong> Após preencher os dois campos, clique em &quot;Enviar mensagem de teste&quot;. Se chegar uma mensagem no Telegram, está tudo certo!</p>
              </div>
              <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-bold text-sky-600 hover:underline">
                <ExternalLink className="w-4 h-4" /> Abrir @BotFather no Telegram
              </a>
            </Tutorial>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Token do Bot <span className="text-slate-300 normal-case tracking-normal font-medium">(obtido no passo 7)</span></label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    placeholder="110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
                    value={telegramToken}
                    onChange={e => setTelegramToken(e.target.value)}
                    className="w-full pr-10 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Chat ID <span className="text-slate-300 normal-case tracking-normal font-medium">(obtido no passo 10)</span></label>
                <input
                  type="text"
                  placeholder="123456789"
                  value={telegramChatId}
                  onChange={e => setTelegramChatId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              onClick={() => testar("telegram")}
              disabled={!telegramToken || !telegramChatId || testando === "telegram"}
              className="flex items-center gap-2 text-sm font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border-2 border-sky-100 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testando === "telegram" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar mensagem de teste
            </button>
            {testMsg?.canal === "telegram" && (
              <p className={`text-sm font-bold flex items-center gap-2 ${testMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                {testMsg.ok && <Check className="w-4 h-4" />} {testMsg.msg}
              </p>
            )}
          </div>
        </div>

        {/* Email via Resend */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">E-mail</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Alerta no e-mail • Grátis até 100/dia</p>
              </div>
            </div>
            <button
              onClick={() => setEmailAtivo(!emailAtivo)}
              className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${emailAtivo ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${emailAtivo ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <Tutorial title="📖 Como configurar o e-mail? (passo a passo para iniciantes)">
              <Passo n={1} texto='Acesse o site resend.com e clique em "Sign Up" para criar uma conta gratuita. Você pode entrar com o Google.' />
              <Passo n={2} texto='Após entrar no painel, clique em "API Keys" no menu lateral esquerdo.' />
              <Passo n={3} texto='Clique no botão "Create API Key", escolha um nome qualquer (ex: "JurisLeads") e clique em Add.' />
              <Passo n={4} texto="Uma chave vai aparecer na tela — copie ela agora, pois ela só aparece uma vez. Ela começa com" destaque="re_" />
              <Passo n={5} texto="Cole essa chave no campo abaixo. No segundo campo, coloque o endereço de e-mail onde quer receber os alertas (pode ser Gmail, Outlook etc)." />
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium leading-relaxed">⚠️ <strong>Atenção:</strong> No plano gratuito do Resend, os e-mails chegam com remetente <code className="bg-amber-100 px-1 rounded text-xs">onboarding@resend.dev</code>. Isso é normal e não impede o recebimento.</p>
              </div>
              <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-bold text-violet-600 hover:underline">
                <ExternalLink className="w-4 h-4" /> Criar conta gratuita no Resend
              </a>
            </Tutorial>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Resend API Key <span className="text-slate-300 normal-case tracking-normal font-medium">(obtida no passo 4)</span></label>
                <div className="relative">
                  <input
                    type={showResendKey ? "text" : "password"}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                    value={resendKey}
                    onChange={e => setResendKey(e.target.value)}
                    className="w-full pr-10 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  <button type="button" onClick={() => setShowResendKey(!showResendKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showResendKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">E-mail para receber os alertas</label>
                <input
                  type="email"
                  placeholder="advogado@email.com"
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              onClick={() => testar("email")}
              disabled={!resendKey || !resendEmail || testando === "email"}
              className="flex items-center gap-2 text-sm font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 border-2 border-violet-100 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testando === "email" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Enviar e-mail de teste
            </button>
            {testMsg?.canal === "email" && (
              <p className={`text-sm font-bold flex items-center gap-2 ${testMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                {testMsg.ok && <Check className="w-4 h-4" />} {testMsg.msg}
              </p>
            )}
          </div>
        </div>

        {/* Botão Salvar */}
        <button
          onClick={salvar}
          disabled={salvando}
          className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-3xl shadow-lg shadow-blue-600/20 transition-colors disabled:opacity-60"
        >
          {salvando ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
          ) : savedOk ? (
            <><Check className="w-5 h-5" /> Configurações salvas!</>
          ) : (
            <><Bell className="w-5 h-5" /> Salvar Configurações</>
          )}
        </button>

        <p className="text-center text-xs text-slate-400 font-medium pb-6">
          🔒 Suas chaves de API são armazenadas com segurança e nunca são compartilhadas.
        </p>
      </div>
    </div>
  );
}
