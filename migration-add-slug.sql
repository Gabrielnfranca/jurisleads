-- Adicionar coluna 'slug' na tabela 'tenants'
ALTER TABLE tenants
ADD COLUMN slug TEXT UNIQUE DEFAULT 'captacao';

-- Se algum cliente já existe, deixar slug como 'captacao' (padrão já aplicado)
-- Para customizar depois, use o painel admin

-- Criar índice para melhorar performance
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Validação: slug não pode ser vazio
ALTER TABLE tenants
ADD CONSTRAINT slug_not_empty CHECK (slug IS NOT NULL AND slug != '');
