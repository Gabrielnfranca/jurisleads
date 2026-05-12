// Templates dinâmicos por área jurídica
export type LegalAreaType = 
  | "trabalhista"
  | "previdenciario"
  | "consumidor"
  | "familia"
  | "criminal"
  | "tributario"
  | "imobiliario"
  | "civil";

export interface Testimonial {
  nome: string;
  cargo: string;
  texto: string;
}

export interface AreaTemplate {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  benefitsSectionTitle: string;
  benefitsSectionSubtitle: string;
  specialization: string;
  benefit1Title: string;
  benefit1Text: string;
  benefit2Title: string;
  benefit2Text: string;
  benefit3Title: string;
  benefit3Text: string;
  step1Question: string;
  step1Option1: string;
  step1Option2: string;
  step1Option3: string;
  step2Question: string;
  step2Options: Array<{ label: string; sublabel: string }>;
  step3Question: string;
  step3Options: Array<{ label: string; sublabel: string }>;
  step4Question: string;
  faqItems: Array<{ question: string; answer: string }>;
}

export const AREA_TEMPLATES: Record<LegalAreaType, AreaTemplate> = {
  trabalhista: {
    heroBadge: "Já recuperamos direitos de mais de 500 trabalhadores.",
    heroTitle: "Você pode ter <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500\">dinheiro oculto</span> na sua rescisão de trabalho.",
    heroSubtitle: "Milhares de empresas erram (ou escondem) o cálculo real de verbas rescisórias, horas extras e FGTS. Responda a 4 perguntas simples e descubra agora se você deixou dinheiro para trás.",
    benefitsSectionTitle: "Traga a verdade à tona.",
    benefitsSectionSubtitle: "Um método validado legalmente, estritamente online e focado em fazer você recuperar o que é seu por suor.",
    specialization: "Especialistas em Direitos do Trabalhador",
    benefit1Title: "1. Descubra de Casa",
    benefit1Text: "Você não precisa vir a um escritório. Diagnosticamos abusos diretamente através das suas respostas online.",
    benefit2Title: "2. Cálculo Inteligente",
    benefit2Text: "Nossa ferramenta localiza com precisão cirúrgica dados onde faltaram horas extras e reflexos no seu FGTS.",
    benefit3Title: "3. Ação Direta",
    benefit3Text: "Avaliamos o contrato remotamente, assinamos pelo WhatsApp e cobramos tudo judicialmente para você.",
    step1Question: "Qual é a sua relação atual com a empresa?",
    step1Option1: "Fui Demitido(a) Sem Justa Causa",
    step1Option2: "Eu Pedi Demissão",
    step1Option3: "Ainda trabalho lá",
    step2Question: "O que aconteceu de irregular?",
    step2Options: [
      { label: "Não recebi todas as verbas", sublabel: "Faltaram horas extras ou reflexos" },
      { label: "Hora extra não paga", sublabel: "Trabalhei além das 8 horas sem receber" },
      { label: "FGTS retido ou errado", sublabel: "Empresa não depositou corretamente" },
      { label: "Vale e benefícios indevidos", sublabel: "Descontos que não deveriam haver" },
      { label: "Assédio ou ambiente tóxico", sublabel: "Sofri pressão ou constrangimento" },
    ],
    step3Question: "Quanto tempo durou este emprego?",
    step3Options: [
      { label: "Menos de 3 meses", sublabel: "Contato recente" },
      { label: "3 meses a 1 ano", sublabel: "Vínculo curto" },
      { label: "1 a 5 anos", sublabel: "Vínculo regular" },
      { label: "Mais de 5 anos", sublabel: "Vínculo longo" },
    ],
    step4Question: "Você tem alguma prova do ocorrido?",
    faqItems: [
      { question: "Vou ter que pagar para fazer a análise do meu caso?", answer: "De maneira nenhuma! A análise inicial via nossa tecnologia e a consulta com o advogado especialista são 100% gratuitas." },
      { question: "Estou em outro estado, preciso ir a um escritório físico?", answer: "Não, nosso atendimento é totalmente online perante todos os tribunais do Brasil (TRT). Você tira dúvidas, assina procurações e envia documentos, tudo pelo seu próprio celular com segurança." },
      { question: "Meus dados estão protegidos de verdade?", answer: "Completamente. Operamos em estrita concordância com a Lei Geral de Proteção de Dados (LGPD) e com o código rigoroso da OAB. Toda informação trafegada é criptografada." },
    ],
  },

  previdenciario: {
    heroBadge: "Já ajudamos mais de 500 brasileiros a conquistar sua aposentadoria.",
    heroTitle: "Seu direito à aposentadoria pode ter sido <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500\">negado injustamente</span>",
    heroSubtitle: "Muitos brasileiros têm o direito de se aposentar mas recebem negativas do INSS. Descubra em 4 passos se você pode conseguir sua aposentadoria agora.",
    benefitsSectionTitle: "Garanta o que você merece.",
    benefitsSectionSubtitle: "Uma solução digital completa para conquistar sua aposentadoria e benefícios do INSS sem burocracia.",
    specialization: "Especialistas em Direito Previdenciário",
    benefit1Title: "1. Análise Gratuita",
    benefit1Text: "Verificamos seu histórico contributivo sem compromisso de contratação.",
    benefit2Title: "2. Cálculo Preciso",
    benefit2Text: "Identificamos períodos de contribuição esquecidos e vínculos não reconhecidos.",
    benefit3Title: "3. Ação Judicial",
    benefit3Text: "Se necessário, entramos na justiça para reverter negativas do INSS.",
    step1Question: "Qual é sua situação atual?",
    step1Option1: "Meu pedido foi negado pelo INSS",
    step1Option2: "Nunca entrei com o pedido",
    step1Option3: "Estou na justiça e preciso de ajuda",
    step2Question: "Qual é o motivo da negativa?",
    step2Options: [
      { label: "Faltam contribuições", sublabel: "Tempo de contribuição insuficiente" },
      { label: "Vínculos não reconhecidos", sublabel: "Trabalhos não aparecem no histórico" },
      { label: "Períodos de afastamento", sublabel: "Licenças ou desemprego não contabilizados" },
      { label: "Não sei exatamente", sublabel: "Preciso entender melhor" },
    ],
    step3Question: "Há quanto tempo tenta a aposentadoria?",
    step3Options: [
      { label: "Menos de 1 ano", sublabel: "Solicitação recente" },
      { label: "1 a 3 anos", sublabel: "Tentativa de tempo médio" },
      { label: "3 a 5 anos", sublabel: "Luta prolongada" },
      { label: "Mais de 5 anos", sublabel: "Luta muito prolongada" },
    ],
    step4Question: "Você possui documentação?",
    faqItems: [
      { question: "Qual é o prazo para conseguir a aposentadoria?", answer: "Depende da sua situação. Podem ser meses ou poucos anos, dependendo se é administrativo ou judicial. Vamos te dar prazos realistas após análise." },
      { question: "Posso estar trabalhando e processar aposentadoria?", answer: "Sim! Você pode estar trabalhando normalmente. O processo segue em paralelo sem interferências." },
      { question: "Quanto custa manter uma ação previdenciária?", answer: "Cobramos apenas se ganharmos. Você só paga quando recebe as parcelas atrasadas." },
    ],
  },

  consumidor: {
    heroBadge: "Já recuperamos o dinheiro de mais de 500 consumidores lesados.",
    heroTitle: "Você foi <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500\">enganado por uma empresa</span>? Pode recuperar seu dinheiro.",
    heroSubtitle: "Produtos com defeito, serviços não prestados, cobranças indevidas. Descubra se você tem direito a indenização e devolução do valor.",
    benefitsSectionTitle: "Seus direitos valem mais.",
    benefitsSectionSubtitle: "Resolução ágil online para cobrar das empresas o que prometeram e não cumpriram.",
    specialization: "Especialistas em Direito do Consumidor",
    benefit1Title: "1. Avaliação Segura",
    benefit1Text: "Analisamos seu caso sem exposição. Tudo é confidencial.",
    benefit2Title: "2. Cálculo de Indenização",
    benefit2Text: "Determinamos exatamente quanto você deve receber além da devolução.",
    benefit3Title: "3. Cobrança Efetiva",
    benefit3Text: "Cobramos judicialmente da empresa até que paguem com juros.",
    step1Question: "Que tipo de problema teve?",
    step1Option1: "Produto ou serviço com defeito",
    step1Option2: "Cobrança indevida ou abusiva",
    step1Option3: "Publicidade enganosa",
    step2Question: "Qual é o principal dano?",
    step2Options: [
      { label: "Perdi dinheiro", sublabel: "Cobranças injustas" },
      { label: "Produto danificado", sublabel: "Chegou com defeito" },
      { label: "Serviço não foi prestado", sublabel: "Não cumpriram o compromisso" },
      { label: "Propaganda mentirosa", sublabel: "Ofereceram coisa diferente" },
    ],
    step3Question: "Quando ocorreu o problema?",
    step3Options: [
      { label: "Recentemente (menos de 30 dias)", sublabel: "Problema fresco" },
      { label: "Há poucos meses", sublabel: "Dentro do prazo" },
      { label: "Há mais de 1 ano", sublabel: "Prazo maior" },
      { label: "Há vários anos", sublabel: "Muito tempo atrás" },
    ],
    step4Question: "Tem comprovante?",
    faqItems: [
      { question: "Preciso guardar a nota fiscal?", answer: "Sim, ajuda bastante. Mas mesmo sem ela, temos outras formas de provar a compra." },
      { question: "Quanto tempo leva uma ação de consumidor?", answer: "Varia, mas costuma ser mais rápida que outras ações. Podem ser meses a alguns anos dependendo da complexidade." },
      { question: "A empresa não vai retaliar?", answer: "Não pode. Retaliar quem exerce direito é crime. Você está protegido legalmente." },
    ],
  },

  familia: {
    heroBadge: "Já protegemos mais de 500 famílias brasileiras.",
    heroTitle: "Questões familiares não precisam ser tão <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500\">complicadas e dolorosas</span>",
    heroSubtitle: "Pensão alimentícia, guarda, separação, herança. Temos soluções ágeis que protegem você e seus filhos.",
    benefitsSectionTitle: "Proteja sua família com suporte.",
    benefitsSectionSubtitle: "Assessoria jurídica empática para resolver questões familiares sem desgastes desnecessários.",
    specialization: "Especialistas em Direito de Família",
    benefit1Title: "1. Suporte Humano",
    benefit1Text: "Entendemos a sensibilidade. Você terá atendimento empático e profissional.",
    benefit2Title: "2. Soluções Protegidas",
    benefit2Text: "Defendemos seus interesses e os de seus filhos em primeiro lugar.",
    benefit3Title: "3. Acordo ou Ação",
    benefit3Text: "Buscamos acordo amigável, mas estamos prontos para litigar se necessário.",
    step1Question: "Qual é sua situação?",
    step1Option1: "Preciso garantir pensão alimentícia",
    step1Option2: "Queremos ajustar guarda ou visitação",
    step1Option3: "Estou em processo de separação",
    step2Question: "Qual é o principal desafio?",
    step2Options: [
      { label: "Ex não paga pensão", sublabel: "Alimentar os filhos está difícil" },
      { label: "Disputa de guarda", sublabel: "Conflito sobre com quem ficam" },
      { label: "Divisão de bens", sublabel: "Falta de acordo nos bens comuns" },
      { label: "Herança em disputa", sublabel: "Conflito entre herdeiros" },
    ],
    step3Question: "Há filhos menores envolvidos?",
    step3Options: [
      { label: "Sim, um filho", sublabel: "Uma criança" },
      { label: "Sim, vários filhos", sublabel: "Mais de uma criança" },
      { label: "Não há filhos", sublabel: "Apenas questão patrimonial" },
      { label: "Filhos maiores", sublabel: "Maioria de idade" },
    ],
    step4Question: "Já existe ação judicial?",
    faqItems: [
      { question: "Posso conseguir guarda compartilhada?", answer: "Em muitos casos, sim. A lei favorece o contato de ambos os pais com os filhos. Podemos estruturar um acordo que funcione." },
      { question: "Quanto tempo leva uma separação?", answer: "Se for consensual (acordo), pode ser feito em semanas. Se litigioso, leva mais tempo, mas lutamos para agilizar." },
      { question: "Como funciona se o ex-cônjuge está em outro estado?", answer: "Funciona normalmente. Temos parcerias em todo Brasil e atuamos remotamente sem problema." },
    ],
  },

  criminal: {
    heroBadge: "Defendemos mais de 500 clientes em situações críticas.",
    heroTitle: "Você foi acusado injustamente? Vamos <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500\">defender sua liberdade</span>",
    heroSubtitle: "Seja para se defender de acusações, garantir direitos na prisão ou buscar liberdade provisória. Você não está sozinho.",
    benefitsSectionTitle: "Sua defesa começa agora.",
    benefitsSectionSubtitle: "Defesa imediata e estratégica para proteger sua liberdade e seus direitos constitucionais.",
    specialization: "Especialistas em Direito Criminal",
    benefit1Title: "1. Defesa Ativa",
    benefit1Text: "Atuamos imediatamente para proteger seus direitos constitucionais.",
    benefit2Title: "2. Liberdade Provisória",
    benefit2Text: "Buscamos sua soltura ou relaxamento da prisão preventiva quando cabível.",
    benefit3Title: "3. Redução de Pena",
    benefit3Text: "Negociamos as melhores condições possíveis para sua situação.",
    step1Question: "Qual é sua situação?",
    step1Option1: "Fui preso e preciso de liberdade",
    step1Option2: "Estou sendo investigado",
    step1Option3: "Já estou em julgamento",
    step2Question: "Qual é o tipo de acusação?",
    step2Options: [
      { label: "Acusação leve", sublabel: "Contravenção" },
      { label: "Crime comum", sublabel: "Roubo, agressão, etc" },
      { label: "Crime hediondo", sublabel: "Delito grave" },
      { label: "Não tenho certeza", sublabel: "Preciso esclarecer" },
    ],
    step3Question: "Há quanto tempo está nessa situação?",
    step3Options: [
      { label: "Preso agora", sublabel: "Situação urgente" },
      { label: "Nas últimas horas", sublabel: "Muito recente" },
      { label: "Nos últimos dias", sublabel: "Recente" },
      { label: "Já faz tempo", sublabel: "Processo adiantado" },
    ],
    step4Question: "Você tem comprovantes?",
    faqItems: [
      { question: "Qual é meu direito à defesa?", answer: "Direito absoluto. Mesmo sem poder pagar, tem direito à defensor público ou podemos atuar mediante programa de assistência." },
      { question: "Quanto tempo demora para sair da cadeia?", answer: "Pode ser horas, dias ou semanas, dependendo da urgência. Peticionamos imediatamente após contratação." },
      { question: "Posso trabalhar durante o processo criminal?", answer: "Depende. Se tiver liberdade, pode trabalhar. Se preso, podemos negociar regime aberto ou semi-aberto." },
    ],
  },

  tributario: {
    heroBadge: "Já economizamos impostos de mais de 500 empresas e pessoas físicas.",
    heroTitle: "O fisco pode estar cobrando mais <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500\">do que você deve</span>",
    heroSubtitle: "Multas abusivas, juros indevidos, autuações erradas. Descubra se você tem direito a restituição ou anulação de débitos.",
    benefitsSectionTitle: "Economize no que é seu por direito.",
    benefitsSectionSubtitle: "Revisão especializada para eliminar cobranças indevidas e reduzir sua carga tributária.",
    specialization: "Especialistas em Direito Tributário",
    benefit1Title: "1. Auditoria Fiscal",
    benefit1Text: "Revisamos seus processos para encontrar erros da administração.",
    benefit2Title: "2. Defesa Administrativa",
    benefit2Text: "Contestamos multas e juros indevidos antes da justiça.",
    benefit3Title: "3. Ação Judicial",
    benefit3Text: "Se necessário, levamos para os tribunais para anular débitos.",
    step1Question: "Qual é seu problema?",
    step1Option1: "Recebi multa do fisco",
    step1Option2: "Imposto retido incorretamente",
    step1Option3: "Débito com a Receita Federal",
    step2Question: "Qual é o tipo de imposto?",
    step2Options: [
      { label: "Imposto de Renda", sublabel: "IR" },
      { label: "ICMS ou ISS", sublabel: "Imposto estadual/municipal" },
      { label: "Contribuições", sublabel: "INSS, PIS/COFINS" },
      { label: "Outros", sublabel: "Outro tipo de tributo" },
    ],
    step3Question: "Há quanto tempo existe essa dívida?",
    step3Options: [
      { label: "Menos de 1 ano", sublabel: "Recente" },
      { label: "1 a 3 anos", sublabel: "Médio prazo" },
      { label: "3 a 5 anos", sublabel: "Longo prazo" },
      { label: "Mais de 5 anos", sublabel: "Muitos anos" },
    ],
    step4Question: "Você tem documentação?",
    faqItems: [
      { question: "Preciso pagar enquanto disputo a dívida?", answer: "Normalmente não. Podemos requerer liminar para suspender a cobrança durante o processo." },
      { question: "Quanto tempo leva um processo tributário?", answer: "Varia muito, mas geralmente entre 1 e 3 anos em primeira instância. Estamos prontos para recorrer em instâncias superiores." },
      { question: "Quanto a Receita Federal pode cobrar de multa?", answer: "Há limites legais. Multas abusivas são passíveis de contestação e redução judicial." },
    ],
  },

  imobiliario: {
    heroBadge: "Já resolvemos mais de 500 casos de problemas imobiliários.",
    heroTitle: "Seu imóvel ou sua <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-500\">segurança habitacional</span> precisam de proteção",
    heroSubtitle: "Problemas com compra/venda, inquilinos inadimplentes, invasão ou despejo indevido. Temos soluções rápidas.",
    benefitsSectionTitle: "Seu imóvel, seus direitos.",
    benefitsSectionSubtitle: "Proteção jurídica completa para resolver questões de compra, venda, aluguel e construção.",
    specialization: "Especialistas em Direito Imobiliário",
    benefit1Title: "1. Análise de Contrato",
    benefit1Text: "Verificamos cláusulas abusivas e vícios em documentos antes de assinar.",
    benefit2Title: "2. Cobrança de Dívidas",
    benefit2Text: "Executamos aluguel ou financiamento em atraso com eficiência.",
    benefit3Title: "3. Ações Possessórias",
    benefit3Text: "Recuperamos seu imóvel em caso de invasão ou ocupação indevida.",
    step1Question: "Qual é seu tipo de problema?",
    step1Option1: "Problema com inquilino",
    step1Option2: "Problema com compra/venda",
    step1Option3: "Invasão ou ocupação",
    step2Question: "Qual é o principal desafio?",
    step2Options: [
      { label: "Inquilino não paga aluguel", sublabel: "Débito acumulado" },
      { label: "Contrato com vícios", sublabel: "Cláusulas abusivas" },
      { label: "Financiamento atrasado", sublabel: "Dívida com banco" },
      { label: "Ocupação indevida", sublabel: "Invasão do imóvel" },
    ],
    step3Question: "Há quanto tempo existe esse problema?",
    step3Options: [
      { label: "Recentemente", sublabel: "Começou agora" },
      { label: "Alguns meses", sublabel: "Médio prazo" },
      { label: "Mais de 1 ano", sublabel: "Já faz tempo" },
      { label: "Vários anos", sublabel: "Problema prolongado" },
    ],
    step4Question: "Você tem documentação?",
    faqItems: [
      { question: "Quanto tempo leva para despejar um inquilino?", answer: "Pode variar de 2 meses a 1 ano dependendo se é por falta de pagamento ou término de contrato. Aceleramos o máximo possível." },
      { question: "Posso cortar água/luz para obrigar pagamento?", answer: "Não! Isso é crime. Devemos agir judicialmente. Deixe conosco." },
      { question: "O inquilino tem direito de permanecer se pagar depois?", answer: "Depende. Se está muito atrasado, podemos buscar despejo mesmo com pagamento posterior. Analisamos caso a caso." },
    ],
  },

  civil: {
    heroBadge: "Já representamos mais de 500 clientes em ações cíveis.",
    heroTitle: "Questões civis complexas merecem uma <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-500\">solução especializada</span>",
    heroSubtitle: "Contratos, indenizações, responsabilidade civil. Descubra como proteger seus direitos e interesses.",
    benefitsSectionTitle: "Resolva seus conflitos com eficiência.",
    benefitsSectionSubtitle: "Representação ágil e efetiva para resolver qualquer disputa civil ou patrimonial.",
    specialization: "Especialistas em Direito Civil Geral",
    benefit1Title: "1. Análise de Contratos",
    benefit1Text: "Revisamos documento antes de assinar para evitar ciladas.",
    benefit2Title: "2. Reparação de Danos",
    benefit2Text: "Calculamos indenizações devidas por negligência ou dolo.",
    benefit3Title: "3. Execução de Dívidas",
    benefit3Text: "Cobramos judicialmente até recuperar o valor devido.",
    step1Question: "Qual é seu tipo de problema?",
    step1Option1: "Problema contratual",
    step1Option2: "Dano moral ou material",
    step1Option3: "Dívida com terceiros",
    step2Question: "Qual é a natureza do conflito?",
    step2Options: [
      { label: "Contrato desrespeitado", sublabel: "Falta de cumprimento" },
      { label: "Negligência causou dano", sublabel: "Responsabilidade civil" },
      { label: "Dívida pessoal", sublabel: "Empréstimo ou venda" },
      { label: "Acidente ou lesão", sublabel: "Prejuízo físico" },
    ],
    step3Question: "Há quanto tempo existe esse problema?",
    step3Options: [
      { label: "Recentemente", sublabel: "Começou agora" },
      { label: "Alguns meses", sublabel: "Médio prazo" },
      { label: "Mais de 1 ano", sublabel: "Já faz tempo" },
      { label: "Vários anos", sublabel: "Problema prolongado" },
    ],
    step4Question: "Você tem comprovantes?",
    faqItems: [
      { question: "Preciso de um contrato por escrito?", answer: "Idealmente sim. Mas mesmo verbais são válidos. Precisamos provar, mas é possível." },
      { question: "Quanto tempo leva uma ação civil?", answer: "Varia bastante. Pode ser meses em caso de acordo, ou anos se for litigioso até última instância." },
      { question: "Quanto custa uma ação civil?", answer: "Depende da complexidade. Oferecemos consultoria para entender os custos antes de agir." },
    ],
  },
};

const TESTIMONIALS_BY_AREA: Record<LegalAreaType, Testimonial[]> = {
  trabalhista: [
    { nome: "Rafael Costa", cargo: "Motorista de App", texto: "Achei que tinham pagado tudo certo. Faltava muito sobre hora extra." },
    { nome: "Juliana Miranda", cargo: "Atendente", texto: "Meu FGTS não estava sendo depositado e eu nem sabia. Resolveram tudo rápido." },
    { nome: "Marcos Silva", cargo: "Vendedor", texto: "Descobri valores atrasados na rescisão e recuperei o que era meu." },
    { nome: "Ana Beatriz", cargo: "Enfermeira", texto: "O escritório explicou meus direitos trabalhistas de forma simples e clara." },
    { nome: "Carlos Eduardo", cargo: "Operador de Máquinas", texto: "Consegui cobrar adicional que a empresa nunca pagava." },
    { nome: "Patricia Leite", cargo: "Recepcionista", texto: "Não precisei ir ao escritório. Fiz tudo online e recebi orientação excelente." },
  ],
  previdenciario: [
    { nome: "João Batista", cargo: "Aposentando", texto: "O INSS tinha negado meu pedido e eles conseguiram reverter." },
    { nome: "Maria Helena", cargo: "Auxiliar de Serviços", texto: "Reconheceram vínculos antigos e consegui aumentar o tempo de contribuição." },
    { nome: "Paulo Mendes", cargo: "Vigilante", texto: "Consegui aposentadoria especial depois de anos tentando sozinho." },
    { nome: "Sueli Nunes", cargo: "Costureira", texto: "Recebi orientação certa sobre documentos e o benefício saiu." },
    { nome: "Claudio Ferreira", cargo: "Pedreiro", texto: "Eles acharam períodos que não estavam no CNIS e isso mudou tudo." },
    { nome: "Eliane Rocha", cargo: "Cuidadora", texto: "Consegui benefício por incapacidade com atendimento humano e rápido." },
  ],
  consumidor: [
    { nome: "Bruna Oliveira", cargo: "Compradora Online", texto: "Comprei um produto com defeito e não queriam devolver. Recebi meu dinheiro de volta." },
    { nome: "Ricardo Prado", cargo: "Autônomo", texto: "Cancelaram serviço sem aviso e ainda cobraram multa. Ganhei indenização." },
    { nome: "Larissa Souza", cargo: "Estudante", texto: "Fui cobrada duas vezes no cartão. Resolveram rápido e com juros." },
    { nome: "Daniel Alves", cargo: "Analista", texto: "A empresa não cumpriu a oferta e tive meu direito reconhecido." },
    { nome: "Camila Brito", cargo: "Microempreendedora", texto: "Recuperei valores de cobrança indevida que já tinha dado como perdidos." },
    { nome: "Fernando Lima", cargo: "Professor", texto: "Atendimento prático. Consegui acordo justo com a operadora." },
  ],
  familia: [
    { nome: "Renata Campos", cargo: "Mãe", texto: "Regularizei pensão dos meus filhos com segurança e sem desgaste excessivo." },
    { nome: "Gustavo Pereira", cargo: "Pai", texto: "Conseguimos guarda compartilhada com um acordo equilibrado." },
    { nome: "Fabiana Moraes", cargo: "Administradora", texto: "Minha separação foi conduzida com respeito e clareza em cada etapa." },
    { nome: "Leandro Siqueira", cargo: "Comerciante", texto: "Resolveram conflito de herança que travava a família havia anos." },
    { nome: "Priscila Torres", cargo: "Servidora", texto: "Fui orientada sobre visitas e alimentos de forma muito humana." },
    { nome: "Eduardo Gonçalves", cargo: "Empresário", texto: "Consegui acordo rápido de partilha sem transformar tudo em guerra." },
  ],
  criminal: [
    { nome: "Thiago Ramos", cargo: "Representante Comercial", texto: "Atuaram com urgência e garantiram minha defesa desde o primeiro dia." },
    { nome: "Igor Martins", cargo: "Motorista", texto: "Consegui liberdade provisória com estratégia rápida e eficiente." },
    { nome: "Vanessa Almeida", cargo: "Comerciante", texto: "Explicaram todo o processo criminal com transparência e firmeza." },
    { nome: "Rodrigo Teixeira", cargo: "Autônomo", texto: "Me senti protegido durante a investigação e tive o caso bem conduzido." },
    { nome: "Carolina Farias", cargo: "Estudante", texto: "Equipe muito técnica. Defenderam meus direitos em cada audiência." },
    { nome: "Mateus Barros", cargo: "Técnico", texto: "Conseguimos um resultado muito melhor do que eu imaginava." },
  ],
  tributario: [
    { nome: "Marcelo Vieira", cargo: "Empresário", texto: "Reduzimos cobrança indevida e regularizamos pendências fiscais." },
    { nome: "Aline Rezende", cargo: "Contadora", texto: "Contestaram multa abusiva e a empresa economizou bastante." },
    { nome: "Roberto Pacheco", cargo: "MEI", texto: "Eu pagava imposto errado há meses. Ajustaram tudo e recuperamos valores." },
    { nome: "Viviane Duarte", cargo: "Gestora Financeira", texto: "Resolveram autuação complexa com estratégia técnica excelente." },
    { nome: "Felipe Araujo", cargo: "Comerciante", texto: "Conseguimos suspender cobrança enquanto o processo corria." },
    { nome: "Livia Cardoso", cargo: "Profissional Liberal", texto: "Atendimento objetivo e economia real na revisão tributária." },
  ],
  imobiliario: [
    { nome: "Andressa Mota", cargo: "Proprietária", texto: "Consegui resolver inadimplência de aluguel com apoio jurídico completo." },
    { nome: "Carlos Henrique", cargo: "Corretor", texto: "Revisaram contrato com cláusulas abusivas e evitamos grande prejuízo." },
    { nome: "Mirela Santos", cargo: "Investidora", texto: "Tive suporte total em disputa de compra e venda de imóvel." },
    { nome: "João Victor", cargo: "Locador", texto: "Processo de despejo foi conduzido com segurança e dentro da lei." },
    { nome: "Natália Pires", cargo: "Arquiteta", texto: "Resolveram problema com construtora e recebi a indenização correta." },
    { nome: "Rogério Silva", cargo: "Síndico", texto: "Equipe ágil para tratar conflitos condominiais e cobranças." },
  ],
  civil: [
    { nome: "Beatriz Freitas", cargo: "Empreendedora", texto: "Quebra de contrato me causou prejuízo e consegui reparação." },
    { nome: "Henrique Lopes", cargo: "Consultor", texto: "Ganhei ação de cobrança com orientação clara desde o início." },
    { nome: "Tatiane Dias", cargo: "Professora", texto: "Resolveram meu caso de dano moral com condução muito profissional." },
    { nome: "Rafael Nogueira", cargo: "Comerciante", texto: "Fizeram uma estratégia eficiente para execução de dívida antiga." },
    { nome: "Juliana Prado", cargo: "Designer", texto: "Consegui acordo justo sem prolongar o conflito civil." },
    { nome: "Caio Mendes", cargo: "Analista", texto: "Atendimento ágil e técnico para revisão contratual complexa." },
  ],
};

function normalizeTestimonials(items: Testimonial[], count = 12): Testimonial[] {
  if (!items.length) return [];
  return Array.from({ length: count }, (_, index) => items[index % items.length]);
}

export function getAreaTestimonials(area: string | undefined, count = 12): Testimonial[] {
  const normalized = (area?.toLowerCase() || "trabalhista") as LegalAreaType;
  const testimonials = TESTIMONIALS_BY_AREA[normalized] || TESTIMONIALS_BY_AREA.trabalhista;
  return normalizeTestimonials(testimonials, count);
}

export function getAreaTemplate(area: string | undefined): AreaTemplate {
  const normalized = (area?.toLowerCase() || "trabalhista") as LegalAreaType;
  return AREA_TEMPLATES[normalized] || AREA_TEMPLATES.trabalhista;
}
