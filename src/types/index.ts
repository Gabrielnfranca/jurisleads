export type IaScore = 'Quente' | 'Morno' | 'Frio';
export type LeadStatus = 'novo' | 'em_analise' | 'atendimento' | 'fechado';

export interface Lead {
  id: string;
  slug: string;
  nome: string;
  telefone: string;
  situacao: string;
  motivo: string;
  tempo: string;
  provas?: string;
  ia_score: IaScore;
  resumo: string;
  chance_exito?: string;
  valor_estimado?: string;
  pontos_fortes?: string;
  status: LeadStatus;
  created_at: string;
}
