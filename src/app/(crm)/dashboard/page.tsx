"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Settings, 
  Search, 
  Bell, 
  Scale,
  MessageCircle,
  Flame,
  Clock,
  Briefcase,
  AlertOctagon,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Trash2,
  X,
  Phone,
  Calendar,
  Bot,
  FileText,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { Lead } from "@/types";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [novosIds, setNovosIds] = useState<Set<string>>(new Set());
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Lead['status'] | null>(null);
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [permNotificacao, setPermNotificacao] = useState<NotificationPermission>('default');
  const [toastLead, setToastLead] = useState<Lead | null>(null);
  const [slugTenant, setSlugTenant] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let currentSlug: string | null = null;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      // Busca o slug do tenant deste usuário
      const { data: tenant } = await supabase
        .from('tenants')
        .select('slug')
        .eq('user_id', session.user.id)
        .single();

      const slugFiltro = tenant?.slug ?? null;
      currentSlug = slugFiltro;
      setSlugTenant(slugFiltro);

      if (!slugFiltro) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('slug', slugFiltro)
        .order('created_at', { ascending: false });

      setLeads(data ?? []);
      setLoading(false);

      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermNotificacao(Notification.permission);
      }
    };
    init();

    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        const novoLead = payload.new as Lead;
        if (!currentSlug || novoLead.slug !== currentSlug) return;
        setLeads(prev => [novoLead, ...prev]);
        setNovosIds(prev => new Set(prev).add(novoLead.id));
        tocarSom();
        mostrarNotificacaoBrowser(novoLead);
        setToastLead(novoLead);
        setTimeout(() => setToastLead(null), 8000);
        setTimeout(() => {
          setNovosIds(prev => { const s = new Set(prev); s.delete(novoLead.id); return s; });
        }, 5000);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, (payload) => {
        const atualizado = payload.new as Lead;
        setLeads(prev => prev.map(l => l.id === atualizado.id ? atualizado : l));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, (payload) => {
        setLeads(prev => prev.filter(l => l.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const tocarSom = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const tocar = (freq: number, start: number, duracao: number, volume = 0.35) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duracao);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duracao);
      };
      tocar(880, 0, 0.25);
      tocar(1100, 0.2, 0.35);
    } catch { /* silencia erros de autoplay */ }
  };

  const mostrarNotificacaoBrowser = (lead: Lead) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const n = new Notification('\uD83D\uDD14 Novo lead chegou!', {
      body: `${lead.nome} \u2022 ${lead.telefone}${lead.ia_score ? ` \u2022 Score IA: ${lead.ia_score}` : ''}`,
      icon: '/favicon.ico',
      tag: 'novo-lead-jurisleads',
      requireInteraction: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
  };

  const pedirPermissaoNotificacao = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const resultado = await Notification.requestPermission();
    setPermNotificacao(resultado);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const moverLead = async (id: string, novoStatus: Lead['status']) => {
    if (!slugTenant) return;
    await supabase.from('leads').update({ status: novoStatus }).eq('id', id).eq('slug', slugTenant);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: novoStatus } : l));
  };

  const deletarLead = async (id: string) => {
    if (!slugTenant) return;
    await supabase.from('leads').delete().eq('id', id).eq('slug', slugTenant);
    setLeads(prev => prev.filter(l => l.id !== id));
    if (leadSelecionado?.id === id) setLeadSelecionado(null);
  };

  const handleDrop = (status: Lead['status']) => {
    if (dragLeadId) moverLead(dragLeadId, status);
    setDragLeadId(null);
    setDragOverCol(null);
  };

  const colDropProps = (status: Lead['status']) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOverCol(status); },
    onDragLeave: () => setDragOverCol(null),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); handleDrop(status); },
  });

  const leadsNovos = leads.filter(l => l.status === 'novo');
  const leadsAnalise = leads.filter(l => l.status === 'em_analise');
  const leadsAtendimento = leads.filter(l => l.status === 'atendimento');
  const leadsFechados = leads.filter(l => l.status === 'fechado');
  const leadsQuentes = leads.filter(l => l.ia_score === 'Quente');

  const mesAtual = new Date().getMonth();
  const totalMes = leads.filter(l => new Date(l.created_at).getMonth() === mesAtual).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar recolhível */}
      <aside className={`${sidebarAberta ? 'w-64' : 'w-16'} bg-white text-slate-600 hidden md:flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 border-r border-slate-100 transition-all duration-300 overflow-hidden`}>
        {/* Logo */}
        <div className="h-20 flex items-center px-4 flex-shrink-0 bg-white border-b border-slate-100 overflow-hidden">
          <Scale className="w-8 h-8 text-blue-600 shrink-0" />
          {sidebarAberta && <h1 className="text-2xl font-black text-slate-900 tracking-tight ml-3 whitespace-nowrap">Juris<span className="text-blue-600">Leads</span></h1>}
        </div>

        <nav className="flex-1 px-2 py-6 space-y-1 overflow-y-auto overflow-x-hidden">
          {sidebarAberta && <p className="px-3 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Menu Principal</p>}
          <a href="#" title="Dashboard" className={`flex items-center py-3 rounded-xl font-black text-sm border-2 border-blue-100 bg-blue-50/80 text-blue-700 ${sidebarAberta ? 'px-4' : 'px-0 justify-center'}`}>
            <LayoutDashboard className="w-5 h-5 shrink-0 text-blue-600" />
            {sidebarAberta && <span className="ml-3 whitespace-nowrap">Dashboard</span>}
          </a>
          <a href="#" title="Clientes" className={`flex items-center py-3 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all font-bold text-sm text-slate-500 ${sidebarAberta ? 'px-4' : 'px-0 justify-center'}`}>
            <Users className="w-5 h-5 shrink-0 text-slate-400" />
            {sidebarAberta && <span className="ml-3 whitespace-nowrap">Clientes</span>}
          </a>
          <a href="/configuracoes" title="Configurações" className={`flex items-center py-3 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all font-bold text-sm text-slate-500 ${sidebarAberta ? 'px-4' : 'px-0 justify-center'}`}>
            <Settings className="w-5 h-5 shrink-0 text-slate-400" />
            {sidebarAberta && <span className="ml-3 whitespace-nowrap">Configurações</span>}
          </a>
        </nav>

        {/* Toggle */}
        <div className="px-2 py-2 border-t border-slate-100">
          <button
            onClick={() => setSidebarAberta(!sidebarAberta)}
            className={`md:flex hidden items-center py-2.5 w-full rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors ${sidebarAberta ? 'px-4 gap-3' : 'justify-center'}`}
            title={sidebarAberta ? 'Recolher menu' : 'Expandir menu'}
          >
            {sidebarAberta ? <><ChevronLeft className="w-5 h-5 shrink-0" /><span className="text-sm font-bold whitespace-nowrap">Recolher</span></> : <ChevronRight className="w-5 h-5 shrink-0" />}
          </button>
        </div>

        {/* Rodapé do usuário */}
        <div className="p-3 bg-slate-50 border-t border-slate-100">
          <div className={`flex items-center gap-3 p-2.5 rounded-xl bg-white border-2 border-slate-100 shadow-sm ${!sidebarAberta ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-black text-blue-700 uppercase shrink-0">
              {user?.email?.substring(0,2) || 'AD'}
            </div>
            {sidebarAberta && (
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 font-bold truncate">{user?.email}</p>
                <p className="text-[11px] text-slate-500 font-medium">Advogado Associado</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Sair do Sistema"
            className={`flex items-center mt-2 w-full bg-white border-2 border-slate-100 hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-slate-500 font-bold h-9 text-sm rounded-xl transition-colors ${sidebarAberta ? 'px-3 gap-2' : 'justify-center'}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarAberta && <span className="whitespace-nowrap">Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative bg-slate-50 w-full">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-0">
           <div className="flex items-center gap-3">
             <button onClick={() => setSidebarAberta(!sidebarAberta)} className="md:hidden p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 rounded-xl">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
             </button>
             <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Negócios</h2>
           </div>
           <div className="flex items-center justify-end gap-3 md:gap-6 flex-1">
              <div className="relative w-full max-w-[200px] md:max-w-[320px] hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar cliente..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-slate-800"/>
              </div>
              {permNotificacao === 'default' && (
                <button
                  onClick={pedirPermissaoNotificacao}
                  title="Ativar alertas sonoros e notificações do navegador"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 text-blue-600 rounded-lg md:rounded-xl text-xs font-black transition-colors animate-pulse"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Ativar alertas</span>
                </button>
              )}
              {permNotificacao === 'granted' && (
                <div title="Alertas ativados — você será notificado ao receber novos leads" className="p-2 text-emerald-500 bg-emerald-50 border-2 border-emerald-100 rounded-lg md:rounded-xl relative cursor-default">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                </div>
              )}
              {permNotificacao === 'denied' && (
                <div title="Notificações bloqueadas pelo navegador" className="p-2 text-slate-300 border-2 border-slate-100 rounded-lg md:rounded-xl relative cursor-default">
                  <Bell className="w-5 h-5" />
                </div>
              )}
           </div>
        </header>

        <div className="flex-1 overflow-auto flex flex-col px-4 md:px-8 py-4 md:py-6">
           {/* Top Stats Bar */}
           <div className="bg-white border text-center md:text-left border-slate-200 rounded-2xl px-4 py-4 md:px-6 md:py-5 mb-6 md:mb-8 flex flex-col md:flex-row gap-4 md:gap-8 shrink-0 shadow-sm relative overflow-hidden">
        <div className="flex flex-col mb-4 md:mb-0">
           <span className="text-[10px] md:text-xs uppercase font-black tracking-widest text-slate-400 mb-1">Total de Leads do Mês</span>
           <span className="text-2xl md:text-3xl font-black text-slate-900">{totalMes}</span>
        </div>
        <div className="hidden md:block w-px h-auto bg-slate-200"></div>
        <div className="flex flex-col relative z-10">
           <span className="text-[10px] md:text-xs uppercase font-black tracking-widest text-blue-500 mb-1">Leads I.A. Quentes</span>
           <span className="text-2xl md:text-3xl font-black text-slate-900 flex items-center justify-center md:justify-start gap-2">
              {leadsQuentes.length} <Flame className="w-5 h-5 md:w-6 md:h-6 text-orange-500 fill-orange-500/20" />
           </span>
        </div>
        <div className="absolute -right-4 -top-4 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full blur-3xl opacity-50 z-0"></div>
     </div>

           {/* Kanban Board */}
           <div className="flex-1 overflow-x-auto pb-4 flex gap-4 md:gap-6 items-start hide-scrollbar snap-x snap-mandatory md:snap-none" style={{ scrollBehavior: 'smooth' }}>
              
              {/* Coluna 1: Novo */}
              <div className="w-[85vw] md:w-[320px] min-w-[85vw] md:min-w-[320px] flex flex-col snap-center">
                 <div className="flex items-center justify-between mb-4 group px-1">
                    <div className="flex items-center gap-2">
                       <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Novos Leads</h3>
                       <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{leadsNovos.length}</span>
                    </div>
                 </div>
                 <div {...colDropProps('novo')} className={`rounded-2xl md:rounded-3xl p-2 md:p-3 flex flex-col gap-2 md:gap-3 min-h-[150px] transition-colors border-2 ${dragOverCol === 'novo' ? 'bg-blue-50/70 border-blue-300' : 'bg-slate-100/50 border-slate-200 border-dashed'}`}>
                    <div className="h-1.5 w-16 bg-blue-500 rounded-full mb-2"></div>
                    {leadsNovos.map(lead => <LeadCard key={lead.id} lead={lead} onMover={moverLead} onDelete={deletarLead} onOpen={setLeadSelecionado} onDragStart={setDragLeadId} isNovo={novosIds.has(lead.id)} />)}
                 </div>
              </div>

              {/* Coluna 2: Em Análise */}
              <div className="w-[85vw] md:w-[320px] min-w-[85vw] md:min-w-[320px] flex flex-col snap-center">
                 <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                       <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Em Análise</h3>
                       <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{leadsAnalise.length}</span>
                    </div>
                 </div>
                 <div {...colDropProps('em_analise')} className={`rounded-2xl md:rounded-3xl p-2 md:p-3 flex flex-col gap-2 md:gap-3 min-h-[150px] transition-colors border-2 ${dragOverCol === 'em_analise' ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-100/50 border-slate-200 border-dashed'}`}>
                    <div className="h-1.5 w-16 bg-amber-500 rounded-full mb-2"></div>
                   {leadsAnalise.map(lead => <LeadCard key={lead.id} lead={lead} onMover={moverLead} onDelete={deletarLead} onOpen={setLeadSelecionado} onDragStart={setDragLeadId} isNovo={novosIds.has(lead.id)} />)}
                 </div>
              </div>

              {/* Coluna 3: Atendimento */}
              <div className="w-[85vw] md:w-[320px] min-w-[85vw] md:min-w-[320px] flex flex-col snap-center">
                 <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                       <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Atendimento</h3>
                       <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{leadsAtendimento.length}</span>
                    </div>
                 </div>
                 <div {...colDropProps('atendimento')} className={`rounded-2xl md:rounded-3xl p-2 md:p-3 flex flex-col gap-2 md:gap-3 min-h-[150px] transition-colors border-2 ${dragOverCol === 'atendimento' ? 'bg-purple-50/70 border-purple-300' : 'bg-slate-100/50 border-slate-200 border-dashed'}`}>
                    <div className="h-1.5 w-16 bg-purple-500 rounded-full mb-2"></div>
                   {leadsAtendimento.map(lead => <LeadCard key={lead.id} lead={lead} onMover={moverLead} onDelete={deletarLead} onOpen={setLeadSelecionado} onDragStart={setDragLeadId} isNovo={novosIds.has(lead.id)} />)}
                 </div>
              </div>

              {/* Coluna 4: Fechado */}
              <div className="w-[85vw] md:w-[320px] min-w-[85vw] md:min-w-[320px] flex flex-col snap-center">
                 <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                       <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Contrato Fechado</h3>
                       <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{leadsFechados.length}</span>
                    </div>
                 </div>
                 <div {...colDropProps('fechado')} className={`rounded-2xl md:rounded-3xl p-2 md:p-3 flex flex-col gap-2 md:gap-3 min-h-[150px] opacity-80 hover:opacity-100 transition-all border-2 ${dragOverCol === 'fechado' ? 'bg-emerald-50/70 border-emerald-400 opacity-100' : 'bg-slate-100/50 border-slate-200 border-dashed'}`}>
                    <div className="h-1.5 w-16 bg-emerald-500 rounded-full mb-2"></div>
                    {leadsFechados.map(lead => <LeadCard key={lead.id} lead={lead} onMover={moverLead} onDelete={deletarLead} onOpen={setLeadSelecionado} onDragStart={setDragLeadId} isNovo={novosIds.has(lead.id)} />)}
                    {leadsFechados.length === 0 && (
                      <div className="flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-100 mt-2">
                        <Briefcase className="w-8 h-8 text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-400">Arraste os negócios ganhos para cá.</p>
                      </div>
                    )}
                 </div>
              </div>

           </div>
        </div>
      </main>

      {/* Modal de detalhes */}
      {leadSelecionado && (
        <LeadModal lead={leadSelecionado} onClose={() => setLeadSelecionado(null)} onDelete={deletarLead} onMover={moverLead} />
      )}

      {/* Toast — novo lead */}
      {toastLead && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-sm w-full">
          <div className="bg-white border-2 border-blue-100 rounded-3xl shadow-2xl shadow-blue-600/15 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <div className="p-4 flex gap-4 items-start">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                {toastLead.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">🔔 Novo lead!</span>
                  {toastLead.ia_score && (
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                      toastLead.ia_score === 'Quente' ? 'bg-red-100 text-red-700' :
                      toastLead.ia_score === 'Morno' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-200 text-slate-600'
                    }`}>{toastLead.ia_score}</span>
                  )}
                </div>
                <p className="font-black text-slate-900 text-sm truncate">{toastLead.nome}</p>
                <p className="text-xs text-slate-500 font-medium">{toastLead.telefone}</p>
              </div>
              <button
                onClick={() => { setLeadSelecionado(toastLead); setToastLead(null); }}
                className="text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 px-3 py-1.5 rounded-xl transition-colors shrink-0"
              >
                Ver
              </button>
            </div>
            <div className="px-4 pb-3">
              <div className="w-full bg-slate-100 rounded-full h-1">
                <div className="bg-blue-500 h-1 rounded-full animate-[shrink_8s_linear_forwards]"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_ORDER: Lead['status'][] = ['novo', 'em_analise', 'atendimento', 'fechado'];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function LeadCard({ lead, onMover, onDelete, onOpen, onDragStart, isNovo }: {
  lead: Lead;
  onMover: (id: string, status: Lead['status']) => void;
  onDelete: (id: string) => void;
  onOpen: (lead: Lead) => void;
  onDragStart: (id: string) => void;
  isNovo?: boolean;
}) {
  const isDragging = { current: false };
  const isToday = new Date(lead.created_at).toDateString() === new Date().toDateString();
  const dataFormatada = new Date(lead.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', hour: isToday ? '2-digit' : undefined, minute: isToday ? '2-digit' : undefined
  });

  const idxAtual = STATUS_ORDER.indexOf(lead.status);
  const proximoStatus = STATUS_ORDER[idxAtual + 1] as Lead['status'] | undefined;

  const scoreColors: Record<string, string> = {
    'Quente': 'text-red-700 bg-red-100',
    'Morno': 'text-amber-700 bg-amber-100',
    'Frio': 'text-slate-600 bg-slate-200'
  };
  const scoreColor = scoreColors[lead.ia_score] ?? scoreColors['Frio'];

  const telefoneNumerico = lead.telefone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${telefoneNumerico}`;

  return (
    <div
      draggable
      onDragStart={(e) => { isDragging.current = true; e.dataTransfer.effectAllowed = 'move'; onDragStart(lead.id); }}
      onDragEnd={() => { setTimeout(() => { isDragging.current = false; }, 50); }}
      onClick={() => { if (!isDragging.current) onOpen(lead); }}
      className={`bg-white rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:shadow-md group relative ${
        isNovo ? 'ring-2 ring-blue-400 border-blue-200' : 'border-slate-200 hover:border-blue-300'
      }`}
    >
      {isNovo && (
        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-800 text-sm leading-tight truncate group-hover:text-blue-600 transition-colors" title={lead.nome}>{lead.nome}</h4>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{lead.telefone}</p>
          </div>
          <div className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 flex items-center gap-1 ${scoreColor}`}>
            {lead.ia_score === 'Quente' && <Flame className="w-3 h-3" />}
            {lead.ia_score}
          </div>
        </div>
        {lead.resumo && (
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
            {lead.resumo}
          </p>
        )}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
              title="WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {proximoStatus && (
            <button
              onClick={(e) => { e.stopPropagation(); onMover(lead.id, proximoStatus); }}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 px-2 py-1 rounded-lg transition-colors border border-slate-200 hover:border-blue-300"
            >
              Próximo <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Detalhes ───────────────────────────────────────────────────────
const STATUS_LABELS: Record<Lead['status'], string> = {
  novo: 'Novo Lead',
  em_analise: 'Em Análise',
  atendimento: 'Em Atendimento',
  fechado: 'Contrato Fechado',
};

function LeadModal({
  lead,
  onClose,
  onDelete,
  onMover,
}: {
  lead: Lead;
  onClose: () => void;
  onDelete: (id: string) => void;
  onMover: (id: string, status: Lead['status']) => void;
}) {
  const idxAtual = STATUS_ORDER.indexOf(lead.status);
  const proximoStatus = STATUS_ORDER[idxAtual + 1] as Lead['status'] | undefined;
  const statusAnterior = STATUS_ORDER[idxAtual - 1] as Lead['status'] | undefined;

  const telefoneNumerico = lead.telefone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${telefoneNumerico}`;

  let pontosFortesParsed: string[] = [];
  try { if (lead.pontos_fortes) pontosFortesParsed = JSON.parse(lead.pontos_fortes); } catch { /* noop */ }
  const chanceNum = parseInt(lead.chance_exito ?? '0') || 0;

  const scoreColors: Record<string, string> = {
    'Quente': 'text-orange-700 bg-orange-100 border-orange-200',
    'Morno': 'text-amber-700 bg-amber-100 border-amber-200',
    'Frio': 'text-slate-600 bg-slate-100 border-slate-200',
  };
  const scoreColor = scoreColors[lead.ia_score] ?? scoreColors['Frio'];

  const dataFormatada = new Date(lead.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-blue-600/20 shrink-0">
              {getInitials(lead.nome)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{lead.nome}</h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5"><Phone className="w-4 h-4"/> {lead.telefone}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:block"></span>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border flex items-center gap-1 ${scoreColor}`}>
                  {lead.ia_score === 'Quente' && <Flame className="w-3 h-3" />}
                  Lead {lead.ia_score}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:block"></span>
                <span className="text-xs font-black uppercase tracking-widest text-blue-700 bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg">
                   {STATUS_LABELS[lead.status]}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -mt-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Corpo Modal */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          {/* Stats IA: Chance + Valor */}
          {(lead.chance_exito || lead.valor_estimado) && (
            <div className="grid grid-cols-2 gap-3">
              {lead.chance_exito && (
                <div className={`rounded-2xl p-4 border-2 ${
                  chanceNum >= 70 ? 'bg-green-50 border-green-200' :
                  chanceNum >= 50 ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Chance de Êxito</p>
                  </div>
                  <p className={`text-3xl font-black ${
                    chanceNum >= 70 ? 'text-green-600' : chanceNum >= 50 ? 'text-amber-600' : 'text-red-500'
                  }`}>{lead.chance_exito}%</p>
                </div>
              )}
              {lead.valor_estimado && (
                <div className="rounded-2xl p-4 border-2 bg-blue-50 border-blue-100">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Valor Estimado</p>
                  <p className="text-base font-black text-blue-700 leading-snug">{lead.valor_estimado}</p>
                </div>
              )}
            </div>
          )}

          {/* Pontos fortes */}
          {pontosFortesParsed.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Pontos Fortes</p>
              <div className="space-y-1.5">
                {pontosFortesParsed.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 bg-green-50/80 border border-green-100 rounded-xl p-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-slate-700">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo da IA */}
          {lead.resumo && (
            <div className="bg-blue-50/50 rounded-3xl p-5 border-2 border-blue-100/50">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-black uppercase tracking-widest text-blue-600">Resumo da Inteligência Artificial</span>
              </div>
              <p className="text-base text-slate-700 font-medium leading-relaxed">{lead.resumo}</p>
            </div>
          )}

          {/* Detalhes grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5" /> Situação
              </p>
              <p className="text-sm font-bold text-slate-800">{lead.situacao || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Tempo do Emprego
              </p>
              <p className="text-sm font-bold text-slate-800">{lead.tempo || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 col-span-2">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Motivo Principal
              </p>
              <p className="text-sm font-bold text-slate-800">{lead.motivo || '—'}</p>
            </div>
            {lead.provas && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 col-span-2">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Provas Disponíveis
                </p>
                <p className="text-sm font-bold text-slate-800">{lead.provas}</p>
              </div>
            )}
          </div>

          {/* Data */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 w-fit px-3 py-2 rounded-xl">
            <Calendar className="w-4 h-4" />
            Cadastrado em {dataFormatada}
          </div>
        </div>

        {/* Rodapé com ações */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 md:p-8 border-t border-slate-100 bg-slate-50 shrink-0">
          <div className="flex gap-3 w-full sm:w-auto">
            {statusAnterior && (
              <button
                onClick={() => { onMover(lead.id, statusAnterior); onClose(); }}
                className="flex-1 sm:flex-none text-sm px-4 py-3 border-2 border-slate-200 text-slate-600 hover:border-slate-400 font-bold rounded-xl transition-colors text-center"
              >
                ← Voltar
              </button>
            )}
            {proximoStatus && (
              <button
                onClick={() => { onMover(lead.id, proximoStatus); onClose(); }}
                className="flex-1 sm:flex-none text-sm px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20 text-center"
              >
                Avançar →
              </button>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => { onDelete(lead.id); onClose(); }}
              className="flex items-center justify-center gap-2 text-sm px-4 py-3 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 font-bold rounded-xl transition-colors w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm px-4 py-3 bg-emerald-500 text-white hover:bg-emerald-600 font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
            >
              <MessageCircle className="w-4 h-4 text-white fill-white/20" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}