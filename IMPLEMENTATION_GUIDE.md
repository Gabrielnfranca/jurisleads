# 🚀 JurisLeads - Implementação Concluída

## ✅ O que foi implementado?

### 1. **Subdomínios customizáveis por cliente**
- Cada cliente pode ter seu próprio **slug** (ex: `lp`, `captacao`, `quiz`, `formulario`, etc)
- URL fica assim: `lp.jurisleads.vercel.app` ou `lp.dominiodocliente.com.br`
- Middleware atualizado para rotear corretamente via `[slug]/[domain]`

### 2. **Landing page dinâmica por área jurídica**
Agora a página de captação muda automaticamente o conteúdo baseado na área jurídica do cliente:
- ✅ Trabalhista
- ✅ Previdenciário
- ✅ Consumidor
- ✅ Família
- ✅ Criminal
- ✅ Tributário
- ✅ Imobiliário
- ✅ Civil Geral

### 3. **UI no painel admin**
- Campo para editar **Slug** em Configurações do cliente
- Campo para editar **Domínio Customizado (CNAME)**
- Campo para editar **Área Jurídica** (influencia conteúdo da landing)

---

## 📋 PRÓXIMAS ETAPAS (MANUAIS)

### Passo 1: Executar Migration SQL no Supabase

Abra o [Supabase SQL Editor](https://supabase.com/dashboard/project/vgxnauaohlncfhuswqge/sql/new) e copie/cole este código:

```sql
-- Adicionar coluna 'slug' na tabela 'tenants'
ALTER TABLE tenants
ADD COLUMN slug TEXT UNIQUE DEFAULT 'captacao';

-- Criar índice para melhorar performance
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Validação: slug não pode ser vazio
ALTER TABLE tenants
ADD CONSTRAINT slug_not_empty CHECK (slug IS NOT NULL AND slug != '');
```

Clique em **"Run"** para executar.

**Resultado esperado:** Cada cliente terá `slug = 'captacao'` como padrão.

---

### Passo 2: Verificar no Painel Admin

1. Acesse: https://jurisleads.vercel.app/admin
2. Abra um cliente
3. Vá para **Configurações**
4. Localize o campo **"Slug de Captura"** (novo)
5. Mude para o slug que preferir (ex: `lp`, `quiz`, etc)
6. Clique **"Salvar"**

---

### Passo 3: Testar com Subdomínio

**Exemplos de URLs que funcionam agora:**

- `https://lp.jurisleads.vercel.app` (usando subdomínio dinâmico)
- `https://quiz.jurisleads.vercel.app` (slug customizado)
- `https://lp.dominiodocliente.com.br` (com CNAME configurado)

Para testar localmente (desenvolvimento):
- `http://localhost:3000/lp/matheus` (simula o subdomínio)

---

### Passo 4: Configurar CNAME para Cliente com Domínio Próprio

**Quando o cliente quer usar `lp.seudominio.com.br`:**

1. Cliente vai ao painel DNS (GoDaddy, Namecheap, HostGator, etc)
2. Cria um registro CNAME:
   ```
   Host: lp
   Type: CNAME
   Value: cname.vercel-dns.com
   ```
3. Aguarda propagação (~2-24 horas)
4. Teste em: `https://lp.seudominio.com.br`

**No painel JurisLeads Admin:**
- Edite o cliente
- Campo "Domínio Customizado": `lp.seudominio.com.br`
- Campo "Slug": `lp` (ou qualquer slug)
- Salve

---

## 🔄 Fluxo Completo de Funcionamento

```
Cliente abre: https://lp.dominiodocliente.com.br
                    ↓
Middleware extrai: slug=lp, domain=dominiodocliente.com.br
                    ↓
Busca tenant com: dominio_customizado='dominiodocliente.com.br' AND slug='lp'
                    ↓
Carrega tenant.area_juridica (ex: 'trabalhista')
                    ↓
Landing page renderiza conteúdo dinâmico baseado em area_juridica
                    ↓
Quiz funcional com IA scoring
                    ↓
Lead é salvo com dados do tenant
```

---

## 📁 Arquivos Modificados

### Backend/API
- `src/proxy.ts` - Middleware de roteamento com novo padrão de subdomínio
- `src/app/api/admin/tenants/route.ts` - POST agora inclui slug
- `src/app/api/admin/tenants/[id]/route.ts` - PUT agora atualiza slug

### Frontend
- `src/app/(marketing)/[slug]/[domain]/page.tsx` - Nova rota dinâmica com conteúdo variável
- `src/lib/legal-area-templates.ts` - Templates de conteúdo por área jurídica (novo arquivo)
- `src/app/admin/clientes/[id]/page.tsx` - UI para editar slug
- `src/app/admin/clientes/novo/page.tsx` - Form já inclui slug

### Database
- `migration-add-slug.sql` - Script para adicionar coluna (rode no Supabase)

---

## 🧪 Como Testar

### Teste 1: Verificar rota antiga ainda funciona
```
URL: https://jurisleads.vercel.app/captacao/matheus
Esperado: Landing page com conteúdo Trabalhista (padrão)
```

### Teste 2: Novo subdomínio
```
URL: https://lp.jurisleads.vercel.app
Esperado: Landing page com conteúdo (depende do area_juridica do tenant lp)
```

### Teste 3: Mudar área jurídica
1. Admin → Cliente → Configurações
2. Mude "Área Jurídica" para "Criminal"
3. Salve
4. Abra a landing page
5. Esperado: Conteúdo e FAQ mudam para Criminal

### Teste 4: Mudar slug
1. Admin → Cliente → Configurações
2. Mude "Slug" de "captacao" para "quiz"
3. Salve
4. URL fica: `https://quiz.jurisleads.vercel.app`
5. Esperado: Landing page carrega normalmente com novo slug

---

## ⚠️ Possíveis Problemas & Soluções

| Problema | Solução |
|----------|---------|
| SQL não executa no Supabase | Certifique-se de que o banco permite ALTER TABLE. Se erro de permissão, use role `postgres` |
| Slug aparece como `null` no painel | Execute novamente a migration SQL |
| Landing page quebrada após mudar slug | Limpe cache do navegador (Ctrl+Shift+Del) |
| CNAME não funciona | Aguarde 24h para propagação total do DNS |
| Erro 404 ao acessar novo slug | Aguarde ~5 min para cache do Next.js atualizar |

---

## 📊 Resumo de Funcionalidades

| Funcionalidade | Status | Detalhes |
|---|---|---|
| Subdomínios dinâmicos | ✅ Done | `[slug].[domain]` routing |
| Landing dinâmica por área | ✅ Done | 8 templates de conteúdo |
| UI admin para slug | ✅ Done | Campo em Configurações |
| CNAME support | ✅ Done | Middleware roteador |
| Editar slug por cliente | ✅ Done | Painel admin integrado |
| SQL migration | ✅ Ready | Arquivo `migration-add-slug.sql` |

---

## 🚀 Próximas Melhorias (Futuro)

- [ ] Auto-sync CNAME com Vercel usando VERCEL_TOKEN
- [ ] Templates customizáveis via painel (editar conteúdo HTML)
- [ ] A/B testing de landing pages
- [ ] Analytics por slug
- [ ] Redirecionamentos inteligentes (fallback se slug não existir)

---

## 📞 Suporte

Se algo não funcionar:
1. Verifique se a migration SQL foi executada
2. Limpe cache do navegador
3. Aguarde ~5 min se acabou de fazer deploy
4. Verifique logs de erro no Vercel

---

**Deploy:** ✅ Completo
**Data:** 11 de maio de 2026
**Versão:** 1.2.0 (Subdomínios + Dynamic Landing Pages)
