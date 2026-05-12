type LeadInput = {
  nome?: string | null;
  situacao?: string | null;
  motivo?: string | null;
  tempo?: string | null;
};

function getPrimeiroNome(nome?: string | null) {
  const cleaned = String(nome ?? "").trim();
  if (!cleaned) return "tudo bem";
  return cleaned.split(/\s+/)[0];
}

function limparTexto(valor?: string | null, fallback = "não informado") {
  const cleaned = String(valor ?? "").trim();
  return cleaned || fallback;
}

export function gerarMensagemPrimeiroAtendimento(
  lead: LeadInput,
  nomeEscritorio = "nosso escritório"
) {
  const primeiroNome = getPrimeiroNome(lead.nome);
  const situacao = limparTexto(lead.situacao);
  const motivo = limparTexto(lead.motivo);
  const tempo = limparTexto(lead.tempo);

  return [
    `Oi, ${primeiroNome}! Eu sou a assistente virtual do ${nomeEscritorio}.`,
    "Recebemos sua solicitação e vou te ajudar com uma triagem rápida para adiantar seu atendimento.",
    "",
    `1) Sobre sua situação atual: ${situacao}. Está correto?`,
    `2) O principal problema é: ${motivo}. Quer complementar com mais algum detalhe importante?`,
    `3) Você informou tempo de vínculo de ${tempo}. Confirma essa informação?`,
    "",
    "Assim que você responder, eu priorizo seu caso para a equipe jurídica.",
  ].join("\n");
}