"use client";

import { use, useState, useEffect, useMemo, useRef, type SVGProps } from "react";
import { getAreaTemplate, getAreaTestimonials, type LegalAreaType, type Testimonial } from "@/lib/legal-area-templates";
import { buildBrandThemeVars } from "@/lib/brand-theme";
import { renderHeroTitle } from "@/lib/render-hero-title";
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
  MessageSquare,
  FileSearch,
  Gavel,
  Lock,
  ChevronDown
} from "lucide-react";

const STEPS = 6;

type OptionCardProps = {
  label: string;
  sublabel?: string;
  badge?: string;
  selected: boolean;
  onClick: () => void;
};

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

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function BotIcon({ className = "" }: { className?: string }) {
  return <div className={className}>🤖</div>;
}

function TestimonialsCarousel({ testimonials, specialization }: { testimonials: Testimonial[]; specialization: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const allCards = [...testimonials, ...testimonials];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const tick = () => {
      if (!pausedRef.current && el) {
        el.scrollLeft += 1;
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
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between mb-10 px-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GoogleIcon className="w-8 h-8" />
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 fill-amber-500 text-amber-500" />)}
            </div>
          </div>
          <h3 className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">Avaliações de Clientes no Google</h3>
          <p className="text-lg md:text-xl text-slate-500 mt-2 font-medium">Veja o que dizem nossos clientes em {specialization}.</p>
        </div>
      </div>

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

export default function LandingPageDinamica({ 
  params 
}: { 
  params: Promise<{ slug: string; domain: string }> 
}) {
  const resolvedParams = use(params);
  const { slug, domain } = resolvedParams;

  const [tenant, setTenant] = useState<{
    slug: string; 
    nome: string; 
    whatsapp: string; 
    cor_primaria: string; 
    area_juridica: string;
  } | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTenant() {
      setTenantLoading(true);
      setTenantError(null);

      try {
        const res = await fetch(`/api/public/tenant?slug=${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        const payload = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setTenant(null);
          setTenantError(payload?.error || "Não foi possível carregar esta landing page.");
          return;
        }

        setTenant(payload);
      } catch {
        if (!cancelled) {
          setTenant(null);
          setTenantError("Não foi possível carregar esta landing page.");
        }
      } finally {
        if (!cancelled) {
          setTenantLoading(false);
        }
      }
    }

    loadTenant();

    return () => {
      cancelled = true;
    };
  }, [slug, domain]);

  const nomeDisplay = tenant?.nome ?? "Escritório de Advocacia";
  const whatsappTenant = tenant?.whatsapp ?? "5511999999999";
  const areaJuridica = tenant?.area_juridica as LegalAreaType || "trabalhista";
  const template = getAreaTemplate(areaJuridica);
  const brandThemeVars = useMemo(() => buildBrandThemeVars(tenant?.cor_primaria), [tenant?.cor_primaria]);

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  
  const [situacao, setSituacao] = useState("");
  const [motivo, setMotivo] = useState("");
  const [tempo, setTempo] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [provas, setProvas] = useState<string[]>([]);
  const [duvida, setDuvida] = useState("");
  const [dynamicFaqItems, setDynamicFaqItems] = useState<Array<{ question: string; answer: string }> | null>(null);
  const [resultadoIA, setResultadoIA] = useState<{
    ia_score: string; 
    resumo: string; 
    chance_exito: string; 
    valor_estimado: string; 
    pontos_fortes: string[];
  } | null>(null);
  const [abVariant, setAbVariant] = useState<"A" | "B">("A");
  const [abSessionId, setAbSessionId] = useState("");
  const startedTrackedRef = useRef(false);
  const trackedStepsRef = useRef<Set<number>>(new Set());

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = `ab:${slug}:${domain}`;
    const existingVariant = window.localStorage.getItem(`${storageKey}:variant`) as "A" | "B" | null;
    const existingSession = window.localStorage.getItem(`${storageKey}:session`);

    const variant = existingVariant === "A" || existingVariant === "B"
      ? existingVariant
      : (Math.random() < 0.5 ? "A" : "B");
    const sessionId = existingSession || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    window.localStorage.setItem(`${storageKey}:variant`, variant);
    window.localStorage.setItem(`${storageKey}:session`, sessionId);

    setAbVariant(variant);
    setAbSessionId(sessionId);
  }, [slug, domain]);

  const trackAbEvent = async (eventName: string, stepValue?: number) => {
    if (!abSessionId) return;
    try {
      await fetch("/api/ab/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: tenant?.slug || slug,
          session_id: abSessionId,
          variant: abVariant,
          event_name: eventName,
          step: stepValue ?? null,
        }),
        keepalive: true,
      });
    } catch {
      // Telemetria não deve quebrar fluxo.
    }
  };

  useEffect(() => {
    if (!started || !abSessionId || startedTrackedRef.current) return;
    startedTrackedRef.current = true;
    void trackAbEvent("started", 1);
  }, [started, abSessionId]);

  useEffect(() => {
    if (!started || !abSessionId) return;
    if (trackedStepsRef.current.has(step)) return;
    trackedStepsRef.current.add(step);
    void trackAbEvent("step_view", step);
  }, [step, started, abSessionId]);

  useEffect(() => {
    if (started) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, started]);

  useEffect(() => {
    if (!tenant?.slug || !tenant?.area_juridica) return;

    const loadDynamicFaq = async () => {
      try {
        const res = await fetch(
          `/api/faq/top?legal_area=${encodeURIComponent(tenant.area_juridica)}&domain=${encodeURIComponent(tenant.slug)}`
        );
        const data = await res.json();
        if (Array.isArray(data?.faqItems) && data.faqItems.length > 0) {
          setDynamicFaqItems(data.faqItems);
        }
      } catch {
        // Em caso de erro, mantém FAQ padrão do template.
      }
    };

    void loadDynamicFaq();
  }, [tenant?.slug, tenant?.area_juridica]);

  if (tenantLoading) {
    return (
      <div className="brand-theme w-full min-h-screen bg-white flex items-center justify-center" style={brandThemeVars}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 font-medium">Carregando landing page...</p>
        </div>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="brand-theme w-full min-h-screen bg-white flex items-center justify-center px-6" style={brandThemeVars}>
        <div className="max-w-lg text-center space-y-4">
          <h1 className="text-3xl font-black text-slate-900">Landing page indisponível</h1>
          <p className="text-slate-500 font-medium">
            {tenantError ?? "Não encontramos uma landing page ativa para este endereço."}
          </p>
        </div>
      </div>
    );
  }

  const handleSelectSituacao = (val: string) => { setSituacao(val); setTimeout(next, 350); };
  const handleSelectMotivo = (val: string) => { setMotivo(val); setTimeout(next, 350); };
  const handleSelectTempo = (val: string) => { setTempo(val); setTimeout(next, 350); };
  const handleSelectPrioridade = (val: string) => { setPrioridade(val); setTimeout(next, 350); };

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
      alert("Selecione o principal problema ocorrido.");
      return;
    }

    if (!tempo) {
      setStep(3);
      alert("Informe o tempo de vínculo.");
      return;
    }

    if (!prioridade) {
      setStep(5);
      alert("Selecione sua prioridade para continuarmos a análise.");
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
          slug: tenant?.slug || slug,
          nome: nomeNormalizado,
          telefone: telefoneNormalizado,
          situacao,
          motivo,
          tempo,
            contexto_adicional: `${template.step5Question}: ${prioridade}`.slice(0, 180),
            mensagem_lead: duvida.trim().slice(0, 800),
          provas: provas.join(", "),
          ab_variant: abVariant,
          ab_session_id: abSessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Erro ao salvar: " + (data.error ?? "tente novamente"));
        setLoading(false);
        return;
      }

      if (duvida.trim()) {
        await fetch("/api/faq/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: tenant?.slug || slug,
            legal_area: tenant?.area_juridica || areaJuridica,
            question: duvida.trim(),
            lead_id: data.id,
          }),
        });
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
      pontos_fortes: ["Caso encaminhado para análise especializada"],
    };
    return (
      <div className="brand-theme min-h-screen bg-slate-50 flex items-start justify-center p-4 pt-8 md:items-center font-sans border-t-8 border-blue-600" style={brandThemeVars}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-500">
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
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Avaliação</p>
                <p className="text-2xl font-black text-white">{resultado.ia_score}</p>
              </div>
              <div className="rounded-2xl p-4" style={{background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)'}}>
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Chance de Êxito</p>
                <p className="text-xl font-black text-white leading-snug">{resultado.chance_exito}%</p>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-5">
            {resultado.pontos_fortes.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Pontos</p>
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

  if (!started) {
    return (
      <div className="brand-theme w-full min-h-screen bg-white font-sans selection:bg-blue-100 relative overflow-x-hidden pb-16 md:pb-0" style={brandThemeVars}>
        
        <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 animate-in slide-in-from-bottom-5 shadow-2xl">
           <Button onClick={() => setStarted(true)} className="w-full h-16 text-lg font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
             Iniciar Análise Gratuita
           </Button>
        </div>

        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/80 via-white to-white pointer-events-none -z-10"></div>
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-blue-400/10 rounded-full blur-4xl pointer-events-none -z-10"></div>
        
        <header className="max-w-6xl mx-auto px-6 h-24 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-xl md:text-2xl leading-none capitalize tracking-tight">{nomeDisplay}</p>
              <p className="text-slate-500 text-[11px] md:text-xs font-bold tracking-widest uppercase mt-1">{template.specialization}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-blue-800 bg-blue-50 px-5 py-2.5 rounded-full border border-blue-200">
            <Lock className="w-4 h-4" /> 100% Seguro (LGPD e OAB)
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 pt-12 pb-24 md:pt-24 md:pb-36 text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-amber-200/50 bg-amber-50/80 text-amber-900 text-sm font-bold mb-10 shadow-sm">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {template.heroBadge}
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-black text-slate-900 tracking-tighter leading-[1.05] mb-8">
            {renderHeroTitle(template.heroTitle)}
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            {template.heroSubtitle}
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

        <section className="bg-slate-50 border-y border-slate-100 py-24 relative z-10 box-border">
          <div className="max-w-6xl mx-auto px-6">
            
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">{template.benefitsSectionTitle}</h2>
              <p className="text-slate-600 text-xl font-medium max-w-2xl mx-auto">{template.benefitsSectionSubtitle}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10 text-left">
              <div className="bg-white p-10 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8"><FileSearch className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{template.benefit1Title}</h3>
                <p className="text-slate-600 text-lg font-medium leading-relaxed">{template.benefit1Text}</p>
              </div>
              <div className="bg-white p-10 rounded-[2rem] border-2 border-blue-600 shadow-xl relative hover:-translate-y-1 transition-transform">
                <span className="absolute -top-4 -right-4 bg-indigo-600 text-white text-sm font-black px-4 py-2 rounded-full shadow-lg border-2 border-white">Tecnologia</span>
                <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center mb-8"><BotIcon className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{template.benefit2Title}</h3>
                <p className="text-slate-600 text-lg font-medium leading-relaxed">{template.benefit2Text}</p>
              </div>
              <div className="bg-white p-10 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8"><Gavel className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{template.benefit3Title}</h3>
                <p className="text-slate-600 text-lg font-medium leading-relaxed">{template.benefit3Text}</p>
              </div>
            </div>
            
          </div>
        </section>

        <TestimonialsCarousel
          testimonials={getAreaTestimonials(areaJuridica)}
          specialization={template.specialization}
        />

        <section className="py-24 relative z-10 bg-white">
          <div className="max-w-4xl mx-auto px-6">
             <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-12 text-center tracking-tight">Dúvidas Frequentes</h2>
             <div className="space-y-5">
                {(dynamicFaqItems || template.faqItems).slice(0, 6).map((item, idx) => (
                  <FaqItem key={idx} question={item.question} answer={item.answer} />
                ))}
             </div>
          </div>
        </section>

        <footer className="bg-slate-900 text-slate-400 py-16 text-center text-base lg:text-lg relative z-10">
          <div className="max-w-6xl mx-auto px-6">
             <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/50 mx-auto mb-8">
               <Scale className="w-8 h-8 text-slate-500" />
             </div>
             <p className="font-black text-2xl text-white mb-4">{nomeDisplay}</p>
             <p className="mb-10 max-w-2xl mx-auto font-medium leading-relaxed">Protegendo seus direitos com excelência profissional e dignidade.</p>
             
             <div className="flex flex-wrap items-center justify-center gap-8 mt-10 pt-10 border-t border-slate-800 font-bold">
               <span className="flex items-center gap-2"><Lock className="w-5 h-5 text-white"/> 100% LGPD Compliant</span>
               <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-white"/> Sigilo Absoluto OAB</span>
             </div>
          </div>
        </footer>
      </div>
    );
  }

  const progressPercent = loading ? 100 : ((step - 1) / STEPS) * 100;

  return (
    <div className="brand-theme min-h-screen bg-white font-sans selection:bg-blue-100 flex flex-col" style={brandThemeVars}>
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

      <div className="w-full h-1.5 md:h-2 bg-slate-100 shrink-0">
         <div 
           className="h-full bg-blue-600 transition-all duration-700 ease-out" 
           style={{ width: `${progressPercent}%` }}
         />
      </div>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-10 md:py-16 animate-in fade-in zoom-in-95 duration-500 relative flex flex-col justify-center">
         
         <div className="w-full relative">
            
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
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">{template.step1Question}</h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium">Selecione a opção que melhor descreve seu caso.</p>
                  </>
               )}
               {step === 2 && (
                  <>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">{template.step2Question}</h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium">Escolha a principal situação.</p>
                  </>
               )}
               {step === 3 && (
                  <>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">{template.step3Question}</h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium">O tempo afeta diretamente seus direitos.</p>
                  </>
               )}
               {step === 4 && (
                  <>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">{template.step4Question}</h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium">Selecione tudo que se aplica.</p>
                  </>
               )}
               {step === 5 && (
                  <>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">{template.step5Question}</h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium">Essa resposta ajuda a priorizar seu atendimento.</p>
                  </>
               )}
               {step === 6 && (
                  <>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">Falta pouco!</h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium">Informe seus contatos para nossa equipe jurídica.</p>
                  </>
               )}
            </div>

            <div className="w-full">
               
               {step === 1 && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <OptionCard 
                      label={template.step1Option1} 
                      selected={situacao === template.step1Option1} 
                      onClick={() => handleSelectSituacao(template.step1Option1)} 
                    />
                    <OptionCard 
                      label={template.step1Option2} 
                      selected={situacao === template.step1Option2} 
                      onClick={() => handleSelectSituacao(template.step1Option2)} 
                    />
                    <OptionCard 
                      label={template.step1Option3} 
                      selected={situacao === template.step1Option3} 
                      onClick={() => handleSelectSituacao(template.step1Option3)} 
                    />
                 </div>
               )}

               {step === 2 && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {template.step2Options.map((opt, idx) => (
                      <OptionCard 
                        key={idx}
                        label={opt.label}
                        sublabel={opt.sublabel}
                        selected={motivo === opt.label}
                        onClick={() => handleSelectMotivo(opt.label)}
                      />
                    ))}
                 </div>
               )}

               {step === 3 && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {template.step3Options.map((opt, idx) => (
                      <OptionCard 
                        key={idx}
                        label={opt.label}
                        sublabel={opt.sublabel}
                        selected={tempo === opt.label}
                        onClick={() => handleSelectTempo(opt.label)}
                      />
                    ))}
                 </div>
               )}

               {step === 4 && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <OptionCard 
                      label="Documentos relacionados ao caso" 
                      selected={provas.includes("Documentos relacionados ao caso")} 
                      onClick={() => setProvas(p => p.includes("Documentos relacionados ao caso") ? p.filter(x => x !== "Documentos relacionados ao caso") : [...p, "Documentos relacionados ao caso"])} 
                    />
                    <OptionCard 
                      label="Mensagens (WhatsApp, SMS, e-mail)" 
                      selected={provas.includes("Mensagens (WhatsApp, SMS, e-mail)")} 
                      onClick={() => setProvas(p => p.includes("Mensagens (WhatsApp, SMS, e-mail)") ? p.filter(x => x !== "Mensagens (WhatsApp, SMS, e-mail)") : [...p, "Mensagens (WhatsApp, SMS, e-mail)"])} 
                    />
                    <OptionCard 
                      label="Fotos, vídeos ou áudios" 
                      selected={provas.includes("Fotos, vídeos ou áudios")} 
                      onClick={() => setProvas(p => p.includes("Fotos, vídeos ou áudios") ? p.filter(x => x !== "Fotos, vídeos ou áudios") : [...p, "Fotos, vídeos ou áudios"])} 
                    />
                    <OptionCard 
                      label="Testemunhas" 
                      selected={provas.includes("Testemunhas")} 
                      onClick={() => setProvas(p => p.includes("Testemunhas") ? p.filter(x => x !== "Testemunhas") : [...p, "Testemunhas"])} 
                    />
                    <Button onClick={next} className="w-full mt-6 h-16 text-lg font-extrabold bg-blue-600 hover:bg-blue-700">
                      Continuar
                    </Button>
                 </div>
               )}

               {step === 5 && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {template.step5Options.map((opt, idx) => (
                      <OptionCard 
                        key={idx}
                        label={opt.label}
                        sublabel={opt.sublabel}
                        selected={prioridade === opt.label}
                        onClick={() => handleSelectPrioridade(opt.label)}
                      />
                    ))}
                 </div>
               )}

               {step === 6 && (
                 <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                        <User className="w-3.5 h-3.5" /> Seu Nome *
                      </Label>
                      <Input 
                        value={nome} 
                        onChange={(e) => setNome(e.target.value)} 
                        placeholder="João Silva" 
                        required 
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                        <Phone className="w-3.5 h-3.5" /> WhatsApp com DDD *
                      </Label>
                      <Input 
                        value={telefone} 
                        onChange={(e) => setTelefone(e.target.value)} 
                        placeholder="11 99999-9999" 
                        required 
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                        <MessageSquare className="w-3.5 h-3.5" /> Tem alguma dúvida específica? (opcional)
                      </Label>
                      <textarea
                        value={duvida}
                        onChange={(e) => setDuvida(e.target.value)}
                        placeholder="Ex: Minha empresa não passou as horas extras corretamente..."
                        className="w-full min-h-[96px] rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-slate-500 mt-2">Suas dúvidas ajudam a melhorar o atendimento.</p>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full mt-8 h-16 text-lg font-extrabold bg-blue-600 hover:bg-blue-700">
                      {loading ? "Analisando..." : "Obter Análise Gratuita"}
                    </Button>
                 </form>
               )}
            </div>
         </div>
      </main>
    </div>
  );
}
