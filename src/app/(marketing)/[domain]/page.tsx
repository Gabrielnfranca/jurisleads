"use client";

import { use, useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Scale, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft, 
  Shield, 
  Clock, 
  Phone, 
  User, 
  Info,
  Star,
  MessageCircle,
  FileSearch,
  Gavel,
  Lock,
  ChevronDown
} from "lucide-react";

const STEPS = 5;

const DEPOIMENTOS = [
  { nome: "Rafael Costa", cargo: "Motorista de App", texto: "Achei que tinham pagado tudo certo. Faltava muito sobre hora extra." },
  { nome: "Juliana Miranda", cargo: "Atendente", texto: "Super profissionais! O advogado me chamou no WhatsApp. Meu FGTS não estava sendo depositado." },
  { nome: "Marcos Silva", cargo: "Vendedor", texto: "Sem burocracia nenhuma. Descobri R$ 4.500 atrasados." },
  { nome: "Ana Beatriz", cargo: "Enfermeira", texto: "A inteligência artificial acertou em cheio as minhas dúvidas, muito prático." },
  { nome: "Carlos Eduardo", cargo: "Operador de Máquinas", texto: "Excelente! Não precisei pisar em escritório de advocacia." },
  { nome: "Patricia Leite", cargo: "Recepcionista", texto: "Achei que processar me daria dor de cabeça, mas foi super amigável e rápido." },
  { nome: "Lucas Mendes", cargo: "Analista", texto: "Fui mandado embora na pandemia e achei que tinha perdido os prazos." },
  { nome: "Renata Nunes", cargo: "Gerente", texto: "Fazia papel de liderança e constataram adicional de cargo de confiança que nunca recebi." },
  { nome: "Felipe Dias", cargo: "Ajudante Geral", texto: "Meu patrão nunca pagou periculosidade. Já assinei a procuração pelo celular mesmo." },
  { nome: "Fernanda Lima", cargo: "Caixa", texto: "Trabalhava 10 horas por dia e pagavam só 8. Resolveram." },
  { nome: "Roberto Alves", cargo: "Logística", texto: "Cálculo muito detalhado na hora de me explicarem por áudio no whats." },
  { nome: "Camila Rodrigues", cargo: "Telemarketing", texto: "Não cobraram nada antecipado. Melhor experiência jurídica que já tive." }
];

type OptionCardProps = {
  label: string;
  sublabel?: string;
  badge?: string;
  selected: boolean;
  onClick: () => void;
};

// Componente para Opções do Quiz
function OptionCard({ label, sublabel, badge, selected, onClick }: OptionCardProps) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex flex-col p-5 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden group ${
        selected 
          ? "border-blue-600 bg-blue-50/80 shadow-sm transform scale-[1.01]" 
          : "border-slate-200 bg-white hover:border-blue-400 hover:shadow hover:-translate-y-0.5"
      }`}>
      
      {selected && (
         <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 rounded-l-xl"></div>
      )}

      <div className="flex items-center justify-between w-full">
         <span className={`font-bold text-lg md:text-xl pr-4 ${selected ? "text-blue-900" : "text-slate-800"}`}>
            {label}
         </span>
         <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
            selected ? "border-blue-600 bg-blue-600" : "border-slate-300 group-hover:border-blue-400"
         }`}>
            {selected && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
         </div>
      </div>
      
      {sublabel && <p className="text-sm text-slate-500 mt-1.5 font-medium">{sublabel}</p>}
      
      {badge && (
        <span className="inline-flex mt-3 text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full uppercase tracking-wider self-start">
          {badge}
        </span>
      )}
    </button>
  );
}

// Sub-Componente FAQ Animado
function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 transition-colors">
       <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-6 text-left font-extrabold text-lg md:text-xl text-slate-800">
          <span>{question}</span>
          <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${open ? "rotate-180 text-blue-600" : ""}`} />
       </button>
       {open && (
         <div className="p-6 pt-0 text-slate-600 md:text-lg font-medium leading-relaxed animate-in fade-in slide-in-from-top-2">
            {answer}
         </div>
       )}
    </div>
  );
}

function GoogleIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function TestimonialsCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  // Duplica os cards para efeito infinito sem borda
  const allCards = [...DEPOIMENTOS, ...DEPOIMENTOS];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const tick = () => {
      if (!pausedRef.current && el) {
        el.scrollLeft += 1; // velocidade da rolagem
        // Quando chega na metade (cópia 2), volta ao início sem visualmente pular
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const onMouseEnter = () => { pausedRef.current = true; };
  const onMouseLeave = () => {
    pausedRef.current = false;
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };
  const onMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    startScrollLeft.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.8;
    containerRef.current.scrollLeft = startScrollLeft.current - walk;
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };

  return (
    <div className="relative max-w-full mx-auto pt-16 border-t border-slate-200 pb-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between mb-10 px-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GoogleIcon className="w-8 h-8" />
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 fill-amber-500 text-amber-500" />)}
            </div>
          </div>
          <h3 className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">Avaliações de Clientes no Google</h3>
          <p className="text-lg md:text-xl text-slate-500 mt-2 font-medium">Veja o que dizem os trabalhadores que ajudamos.</p>
        </div>
      </div>

      {/* Track com fade nas bordas */}
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div
          ref={containerRef}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          className="flex gap-5 overflow-x-auto pb-4 select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', cursor: 'grab' }}
        >
          {allCards.map((dep, idx) => (
            <div
              key={idx}
              className="bg-white p-7 rounded-3xl border border-slate-200 shrink-0 w-[290px] md:w-[340px] shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />)}
              </div>
              <p className="text-slate-700 text-base font-medium leading-relaxed italic flex-1 mb-5">&quot;{dep.texto}&quot;</p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="font-bold text-sm text-slate-900">{dep.nome}</p>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">{dep.cargo}</p>
                </div>
                <GoogleIcon className="w-5 h-5 opacity-70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPageCaptacao({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = use(params);
  const domainParam = resolvedParams.domain || "drcarlos";

  // Se o parâmetro contém ponto, é um domínio customizado via CNAME; caso contrário, é um slug direto
  const isCustomDomain = domainParam.includes(".");

  const [tenant, setTenant] = useState<{
    slug: string; nome: string; whatsapp: string; cor_primaria: string; area_juridica: string;
  } | null>(null);

  // slug real do tenant (pode diferir de domainParam quando é domínio customizado)
  const slug = tenant?.slug ?? (isCustomDomain ? "" : domainParam);

  // Carrega dados do tenant: por slug direto ou por dominio_customizado
  useEffect(() => {
    const supabase = createClient();
    const query = isCustomDomain
      ? supabase
          .from("tenants")
          .select("slug, nome, whatsapp, cor_primaria, area_juridica")
          .eq("dominio_customizado", domainParam)
          .eq("ativo", true)
          .single()
      : supabase
          .from("tenants")
          .select("slug, nome, whatsapp, cor_primaria, area_juridica")
          .eq("slug", domainParam)
          .eq("ativo", true)
          .single();
    query.then(({ data }) => { if (data) setTenant(data); });
  }, [domainParam, isCustomDomain]);

  const nomeDisplay = tenant?.nome ?? slug.replace(/^dr/i, "Dr. ").replace(/([a-z])([A-Z])/g, "$1 $2");
  const whatsappTenant = tenant?.whatsapp ?? "5511999999999";

  const [started, setStarted] = useState(false);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  
  const [situacao, setSituacao] = useState("");
  const [motivo, setMotivo] = useState("");
  const [tempo, setTempo] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [provas, setProvas] = useState<string[]>([]);
  const [resultadoIA, setResultadoIA] = useState<{
    ia_score: string; resumo: string; chance_exito: string; valor_estimado: string; pontos_fortes: string[];
  } | null>(null);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const handleSelectSituacao = (val: string) => { setSituacao(val); setTimeout(next, 350); };
  const handleSelectMotivo = (val: string) => { setMotivo(val); setTimeout(next, 350); };
  const handleSelectTempo = (val: string) => { setTempo(val); setTimeout(next, 350); };

  useEffect(() => {
    if (started) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, started]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nomeNormalizado = nome.trim();
    const telefoneNormalizado = telefone.trim();

    if (!situacao) {
      setStep(1);
      alert("Selecione sua relação com a empresa antes de continuar.");
      return;
    }

    if (!motivo) {
      setStep(2);
      alert("Selecione o principal problema ocorrido no trabalho.");
      return;
    }

    if (!tempo) {
      setStep(3);
      alert("Informe o tempo de vínculo com a empresa.");
      return;
    }

    if (!nomeNormalizado || !telefoneNormalizado) {
      alert("Preencha seu nome e telefone para concluir a análise.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/qualificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          nome: nomeNormalizado,
          telefone: telefoneNormalizado,
          situacao,
          motivo,
          tempo,
          provas: provas.join(", "),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Erro ao salvar: " + (data.error ?? "tente novamente"));
        setLoading(false);
        return;
      }
      setResultadoIA({
        ia_score: data.ia_score ?? "Morno",
        resumo: data.resumo ?? "",
        chance_exito: data.chance_exito ?? "65",
        valor_estimado: data.valor_estimado ?? "A calcular",
        pontos_fortes: Array.isArray(data.pontos_fortes) ? data.pontos_fortes : [],
      });
      setTimeout(() => {
         setLoading(false);
         setEnviado(true);
      }, 1500);
    } catch (err) {
      console.error("Erro:", err);
      alert("Erro de conexão.");
      setLoading(false);
    }
  };

  if (enviado) {
    const resultado = resultadoIA ?? {
      ia_score: "Morno",
      resumo: "Caso em análise. Nossa equipe entrará em contato em breve.",
      chance_exito: "65",
      valor_estimado: "A calcular",
      pontos_fortes: ["Irregularidades identificadas no seu relato", "Caso encaminhado para análise jurídica especializada"],
    };
    return (
      <div className="min-h-screen bg-slate-50 flex items-start justify-center p-4 pt-8 md:items-center font-sans border-t-8 border-blue-600">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-500">
          {/* Header gradiente */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-7 md:p-8 text-white">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <BotIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Análise Concluída!</h2>
                <p className="text-blue-200 text-sm font-medium mt-0.5">Relatório gerado por Inteligência Artificial</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4" style={{background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)'}}>
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Chance de Êxito</p>
                <p className="text-4xl font-black text-white">{resultado.chance_exito}%</p>
              </div>
              <div className="rounded-2xl p-4" style={{background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)'}}>
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Valor Estimado</p>
                <p className="text-xl font-black text-white leading-snug">{resultado.valor_estimado}</p>
              </div>
            </div>
          </div>
          {/* Body */}
          <div className="p-6 md:p-8 space-y-5">
            {resultado.pontos_fortes.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Pontos Fortes do Caso</p>
                <div className="space-y-2">
                  {resultado.pontos_fortes.map((ponto, i) => (
                    <div key={i} className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-slate-700">{ponto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {resultado.resumo && (
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Avaliação da I.A.</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{resultado.resumo}</p>
              </div>
            )}
            <div className="flex items-center gap-4 bg-slate-50 border-2 border-slate-200 rounded-2xl p-5">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 shrink-0">
                <MessageCircle className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Nossa equipe vai entrar em contato</p>
                <p className="text-sm text-slate-500 font-medium mt-0.5">Te chamaremos no WhatsApp em breve para detalhar o próximo passo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== PÁGINA DE VENDA / CAPTAÇÃO (LANDING PAGE) =====
  if (!started) {
    return (
      <div className="w-full min-h-screen bg-white font-sans selection:bg-blue-100 relative overflow-x-hidden pb-16 md:pb-0">
        
        {/* Mobile CTA (Sticky Footer) */}
        <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 animate-in slide-in-from-bottom-5 shadow-2xl">
           <Button onClick={() => setStarted(true)} className="w-full h-16 text-lg font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
             Iniciar Análise Gratuita
           </Button>
        </div>

        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/80 via-white to-white pointer-events-none -z-10"></div>
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-blue-400/10 rounded-full blur-4xl pointer-events-none -z-10"></div>
        
        {/* Header */}
        <header className="max-w-6xl mx-auto px-6 h-24 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-xl md:text-2xl leading-none capitalize tracking-tight">{nomeDisplay}</p>
              <p className="text-slate-500 text-[11px] md:text-xs font-bold tracking-widest uppercase mt-1">Especialistas em Direitos do Trabalhador</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-blue-800 bg-blue-50 px-5 py-2.5 rounded-full border border-blue-200">
            <Lock className="w-4 h-4" /> 100% Seguro (LGPD e OAB)
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-5xl mx-auto px-6 pt-12 pb-24 md:pt-24 md:pb-36 text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-amber-200/50 bg-amber-50/80 text-amber-900 text-sm font-bold mb-10 shadow-sm">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Já recuperamos direitos de mais de 500 trabalhadores.
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-black text-slate-900 tracking-tighter leading-[1.05] mb-8">
            Você pode ter <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">dinheiro oculto</span> na sua rescisão de trabalho.
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Milhares de empresas erram (ou escondem) o cálculo real de verbas rescisórias, horas extras e FGTS. Responda a 4 perguntas simples e descubra agora se você deixou dinheiro para trás.
          </p>

          <Button 
            onClick={() => setStarted(true)} 
            className="w-full md:w-auto h-20 px-12 text-xl md:text-2xl font-black bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 group"
          >
            Iniciar Análise I.A Gratuita 
            <ChevronRight className="w-7 h-7 ml-3 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-sm md:text-base text-slate-500 mt-6 flex items-center justify-center gap-2 font-bold">
            <Clock className="w-5 h-5 text-slate-400" /> Avaliação online rápida e sigilosa. Leva menos de 1 minuto.
          </p>
        </main>

        {/* Beneficios */}
        <section className="bg-slate-50 border-y border-slate-100 py-24 relative z-10 box-border">
          <div className="max-w-6xl mx-auto px-6">
            
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Traga a verdade à tona.</h2>
              <p className="text-slate-600 text-xl font-medium max-w-2xl mx-auto">Um método validado legalmente, estritamente online e focado em fazer você recuperar o que é seu por suor.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10 text-left">
              <div className="bg-white p-10 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8"><FileSearch className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">1. Descubra de Casa</h3>
                <p className="text-slate-600 text-lg font-medium leading-relaxed">Você não precisa vir a um escritório. Diagnosticamos abusos diretamente através das suas respostas online.</p>
              </div>
              <div className="bg-white p-10 rounded-[2rem] border-2 border-blue-600 shadow-xl relative hover:-translate-y-1 transition-transform">
                <span className="absolute -top-4 -right-4 bg-indigo-600 text-white text-sm font-black px-4 py-2 rounded-full shadow-lg border-2 border-white">Tecnologia</span>
                <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center mb-8"><BotIcon className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">2. Cálculo Inteligente</h3>
                <p className="text-slate-600 text-lg font-medium leading-relaxed">Nossa ferramenta localiza com precisão cirúrgica de dados onde faltaram horas extras e reflexos no seu FGTS.</p>
              </div>
              <div className="bg-white p-10 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8"><Gavel className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">3. Ação Direta</h3>
                <p className="text-slate-600 text-lg font-medium leading-relaxed">Avaliamos o contrato remotamente, assinamos pelo WhatsApp e cobramos tudo judicialmente para você.</p>
              </div>
            </div>
            
          </div>
        </section>

        {/* Carousel de Depoimentos com Google Auth */}
        <TestimonialsCarousel />

        {/* FAQ */}
        <section className="py-24 relative z-10 bg-white">
          <div className="max-w-4xl mx-auto px-6">
             <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-12 text-center tracking-tight">Dúvidas Frequentes</h2>
             <div className="space-y-5">
                <FaqItem question="Vou ter que pagar para fazer a análise do meu caso?" answer="De maneira nenhuma! A análise inicial via nossa tecnologia e a consulta com o advogado especialista são 100% gratuitas." />
                <FaqItem question="Estou em outro estado, preciso ir a um escritório físico?" answer="Não, nosso atendimento é totalmente online perante todos os tribunais do Brasil (TRT). Você tira dúvidas, assina procurações e envia documentos, tudo pelo seu próprio celular com segurança." />
                <FaqItem question="Meus dados estão protegidos de verdade?" answer="Completamente. Operamos em estrita concordância com a Lei Geral de Proteção de Dados (LGPD) e com o código rigoroso da OAB. Toda informação trafegada é criptografada e vista apenas por advogados credenciados." />
                <FaqItem question="Ouvi dizer que processar empresa &quot;suja o nome&quot; ou impede de arrumar trabalho. É verdade?" answer="Isso é uma grande mentira inventada para te dar medo. Não existe 'lista suja' no Brasil. Cobrar seus direitos é uma atitude honrada, e empresas sérias de verdade sequer perdem tempo checando isso em recrutamentos." />
             </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-16 text-center text-base lg:text-lg relative z-10">
          <div className="max-w-6xl mx-auto px-6">
             <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/50 mx-auto mb-8">
               <Scale className="w-8 h-8 text-slate-500" />
             </div>
             <p className="font-black text-2xl text-white mb-4">{nomeDisplay}</p>
             <p className="mb-10 max-w-2xl mx-auto font-medium leading-relaxed">Atuamos na esfera trabalhista focando em defender o capital e a honra de trabalhadores que tiveram seus direitos negligenciados, protegidos perante a OAB.</p>
             
             <div className="flex flex-wrap items-center justify-center gap-8 mt-10 pt-10 border-t border-slate-800 font-bold">
               <span className="flex items-center gap-2"><Lock className="w-5 h-5 text-white"/> 100% LGPD Compliant</span>
               <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-white"/> Sigilo Absoluto OAB</span>
             </div>
          </div>
        </footer>
      </div>
    );
  }

  // ===== QUIZ INTERATIVO (FORMULÁRIO TYPEFORM-STYLE) =====
  
  const progressPercent = loading ? 100 : ((step - 1) / STEPS) * 100;

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 flex flex-col">
      {/* Header Fixo como na Home */}
      <header className="max-w-6xl mx-auto w-full px-6 h-20 md:h-24 flex items-center justify-between border-b border-slate-100 relative z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Scale className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-lg md:text-2xl leading-none capitalize tracking-tight">{nomeDisplay}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm font-bold text-blue-800 bg-blue-50 px-4 md:px-5 py-2 md:py-2.5 rounded-full border border-blue-200">
            <Lock className="w-4 h-4" /> Seguro e Sigiloso
          </div>
      </header>

      {/* Barra de Progresso */}
      <div className="w-full h-1.5 md:h-2 bg-slate-100 shrink-0">
         <div 
           className="h-full bg-blue-600 transition-all duration-700 ease-out" 
           style={{ width: `${progressPercent}%` }}
         />
      </div>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-10 md:py-16 animate-in fade-in zoom-in-95 duration-500 relative flex flex-col justify-center">
         
         <div className="w-full relative">
            
            {/* Loading Overlay */}
            {loading && (
               <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300 rounded-[2rem]">
                  <BotIcon className="w-16 h-16 text-blue-600 mb-6 animate-bounce" />
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">Analisando respostas...</h2>
                  <p className="text-slate-500 text-base md:text-lg font-medium px-4 text-center">Nossa I.A. está avaliando seu caso.</p>
                  
                  <div className="w-64 h-2 bg-slate-100 rounded-full mt-8 overflow-hidden">
                     <div className="h-full bg-blue-600 w-1/2 animate-pulse rounded-full" style={{ animationDuration: '1.5s', width: '100%' }}></div>
                  </div>
               </div>
            )}

            {/* Header Módulo Quiz */}
            <div className="mb-10 text-center md:text-left">
               <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                 {step > 1 && (
                   <button onClick={back} className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase tracking-wider bg-slate-100 px-4 py-2 rounded-full md:bg-transparent md:px-0 md:py-0 w-fit mx-auto md:mx-0">
                     <ArrowLeft className="w-4 h-4" /> Voltar
                   </button>
                 )}

                 <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-black px-3 py-1 rounded-full tracking-wide w-fit mx-auto md:mx-0">
                   Passo {step} de {STEPS}
                 </span>
               </div>

               {step === 1 && (
                  <>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">Qual é a sua relação atual com a empresa?</h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium">Selecione a opção que melhor descreve seu caso.</p>
                  </>
               )}
               {step === 2 && (
                  <>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">O que aconteceu de irregular?</h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium">Escolha o principal motivo da sua insatisfação.</p>
                  </>
               )}
               {step === 3 && (
                  <>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">Quanto tempo durou este emprego?</h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium">O tempo afeta diretamente o cálculo de seus direitos.</p>
                  </>
               )}
               {step === 4 && (
                  <>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">Você tem alguma prova do ocorrido?</h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium">Selecione tudo que se aplica — isso aumenta sua chance de êxito.</p>
                  </>
               )}
               {step === 5 && (
                  <>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">Falta pouco!</h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium">Informe seus contatos para nossa equipe jurídica.</p>
                  </>
               )}
            </div>

            {/* Configs do Formulario */}
            <div className="w-full">
               
               {step === 1 && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <OptionCard label="Fui Demitido(a) Sem Justa Causa" sublabel="A empresa decidiu encerrar o contrato." selected={situacao === "Fui Demitido(a) Sem Justa Causa"} onClick={() => handleSelectSituacao("Fui Demitido(a) Sem Justa Causa")} />
                    <OptionCard label="Eu Pedi Demissão" sublabel="Tomei a decisão de sair do emprego." selected={situacao === "Pedi Demissão"} onClick={() => handleSelectSituacao("Pedi Demissão")} />
                    <OptionCard label="Ainda trabalho na empresa" sublabel="Continuo exercendo minhas funções lá." selected={situacao === "Ainda trabalho lá"} onClick={() => handleSelectSituacao("Ainda trabalho lá")} />
                 </div>
               )}

               {step === 2 && (
                 <div className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <OptionCard label="Falta de pagamento da Rescisão" selected={motivo === "Rescisão não paga ou paga incorretamente"} onClick={() => handleSelectMotivo("Rescisão não paga ou paga incorretamente")} />
                    <OptionCard label="Horas Extras Não Recebidas" selected={motivo === "Horas extras não recebidas"} onClick={() => handleSelectMotivo("Horas extras não recebidas")} />
                    <OptionCard label="Assédio Moral ou Humilhação" selected={motivo === "Assédio moral ou humilhação"} onClick={() => handleSelectMotivo("Assédio moral ou humilhação")} />
                    <OptionCard label="Acidente ou Doença Adquirida trabalhando" selected={motivo === "Acidente de trabalho"} onClick={() => handleSelectMotivo("Acidente de trabalho")} />
                    <OptionCard label="Outra coisa / Fiquei sem registro" selected={motivo === "Outro tipo de irregularidade"} onClick={() => handleSelectMotivo("Outro tipo de irregularidade")} />
                 </div>
               )}

               {step === 3 && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <OptionCard label="Menos de 1 ano" selected={tempo === "Menos de 1 ano"} onClick={() => handleSelectTempo("Menos de 1 ano")} />
                    <OptionCard label="De 1 a 3 anos" selected={tempo === "1 a 3 anos"} onClick={() => handleSelectTempo("1 a 3 anos")} />
                    <OptionCard label="De 3 a 5 anos" selected={tempo === "De 3 a 5 anos"} onClick={() => handleSelectTempo("De 3 a 5 anos")} />
                    <OptionCard label="Mais de 5 anos completos" selected={tempo === "Mais de 5 anos (Valor da causa maior)"} onClick={() => handleSelectTempo("Mais de 5 anos (Valor da causa maior)")} badge="Maior chance de recebimento" />
                 </div>
               )}

               {step === 4 && (
                 <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {[
                     { val: "Documentos (holerites, contrato, e-mails)", emoji: "📄" },
                     { val: "Mensagens salvas (WhatsApp, SMS)", emoji: "💬" },
                     { val: "Testemunhas que presenciaram", emoji: "👥" },
                     { val: "Ainda não tenho provas", emoji: "🔍" },
                   ].map(opt => {
                     const selecionado = provas.includes(opt.val);
                     return (
                       <button key={opt.val} type="button"
                         onClick={() => {
                           if (opt.val === "Ainda não tenho provas") {
                             setProvas(selecionado ? [] : [opt.val]);
                           } else {
                             setProvas(prev => {
                               const sem = prev.filter(v => v !== "Ainda não tenho provas");
                               return selecionado ? sem.filter(v => v !== opt.val) : [...sem, opt.val];
                             });
                           }
                         }}
                         className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 relative overflow-hidden ${
                           selecionado ? 'border-blue-600 bg-blue-50/80' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow'
                         }`}
                       >
                         {selecionado && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 rounded-l-xl"></div>}
                         <span className="text-2xl">{opt.emoji}</span>
                         <span className={`font-bold text-lg flex-1 ${selecionado ? 'text-blue-900' : 'text-slate-800'}`}>{opt.val}</span>
                         {selecionado && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
                       </button>
                     );
                   })}
                   <Button
                     onClick={next}
                     disabled={provas.length === 0}
                     className="w-full h-14 text-base font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed mt-2 transition-all"
                   >
                     Continuar <ChevronRight className="w-5 h-5 ml-2" />
                   </Button>
                 </div>
               )}

               {step === 5 && (
                 <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-5 flex items-start gap-4 mb-4">
                       <Info className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                       <p className="text-sm md:text-base text-amber-900 leading-relaxed font-bold">
                          100% de sigilo garantido. <strong>Sua empresa não ficará sabendo deste contato.</strong>
                       </p>
                    </div>

                    <div className="space-y-2">
                       <Label htmlFor="nome" className="text-base font-bold text-slate-800 flex items-center gap-2">
                         <User className="w-4 h-4 text-slate-400" /> Seu nome completo
                       </Label>
                       <Input id="nome" placeholder="Digite aqui..." required value={nome}
                         onChange={(e) => setNome(e.target.value)}
                         className="h-14 bg-white border-2 border-slate-200 text-lg px-5 rounded-xl focus-visible:ring-4 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 transition-all font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 shadow-sm" />
                    </div>

                    <div className="space-y-2">
                       <Label htmlFor="telefone" className="text-base font-bold text-slate-800 flex items-center gap-2">
                         <Phone className="w-4 h-4 text-slate-400" /> WhatsApp com DDD
                       </Label>
                       <Input id="telefone" placeholder="(11) 99999-9999" required value={telefone}
                         onChange={(e) => setTelefone(e.target.value.replace(/[^\d()\-\s]/g, ""))}
                         className="h-14 bg-white border-2 border-slate-200 text-lg px-5 rounded-xl focus-visible:ring-4 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 transition-all font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 shadow-sm" />
                    </div>

                    <Button type="submit" disabled={loading || !nome || !telefone}
                      className="w-full h-16 text-lg font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-[0.98] mt-4">
                      Ver meu Resultado Grátis
                    </Button>
                    
                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 mt-4 pb-10">
                      <Lock className="w-3 h-3" /> Protegido com Criptografia LGPD
                    </p>
                 </form>
               )}
            </div>
         </div>
      </main>
    </div>
  );
}

// Icone mockado pro bot
function BotIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="14" x="3" y="7" rx="3" />
      <path d="M12 3v4" /><path d="M8 3v4" /><path d="M16 3v4" />
      <circle cx="9" cy="13" r="1.5" /><circle cx="15" cy="13" r="1.5" />
      <path d="M10 17h4" />
    </svg>
  );
}