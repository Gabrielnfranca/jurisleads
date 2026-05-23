#!/usr/bin/env node

const { Client } = require('pg');

const dbConfig = {
  host: 'vgxnauaohlncfhuswqge.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'YourDatabasePassword123', // ⚠️ ATENÇÃO: Isso não está em .env.local.real! Precisa ser fornecido.
  ssl: { rejectUnauthorized: false }
};

// SQL Migration (from 20260514_security_hardening_rls.sql)
const migrationSql = `-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;

ALTER TABLE notificacoes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_config FORCE ROW LEVEL SECURITY;

ALTER TABLE faq_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_suggestions FORCE ROW LEVEL SECURITY;

ALTER TABLE ab_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_events FORCE ROW LEVEL SECURITY;

-- Revoke all default permissions
REVOKE ALL ON TABLE tenants FROM anon, authenticated;
REVOKE ALL ON TABLE leads FROM anon, authenticated;
REVOKE ALL ON TABLE notificacoes_config FROM anon, authenticated;
REVOKE ALL ON TABLE faq_suggestions FROM anon, authenticated;
REVOKE ALL ON TABLE ab_events FROM anon, authenticated;

-- Remove old policies if they exist
DROP POLICY IF EXISTS "anon_view" ON tenants;
DROP POLICY IF EXISTS "authenticated_view" ON tenants;
DROP POLICY IF EXISTS "anon_view" ON leads;
DROP POLICY IF EXISTS "authenticated_select" ON leads;
DROP POLICY IF EXISTS "authenticated_update" ON leads;
DROP POLICY IF EXISTS "authenticated_delete" ON leads;
DROP POLICY IF EXISTS "authenticated_view" ON notificacoes_config;
DROP POLICY IF EXISTS "authenticated_insert" ON notificacoes_config;
DROP POLICY IF EXISTS "authenticated_update" ON notificacoes_config;

-- Grant selective permissions on tenants
GRANT SELECT ON TABLE tenants TO authenticated;

-- Create tenants policy
CREATE POLICY "authenticated_select_own_tenant" ON tenants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Grant selective permissions on leads
GRANT SELECT, UPDATE, DELETE ON TABLE leads TO authenticated;

-- Create leads policies
CREATE POLICY "authenticated_select_leads" ON leads
  FOR SELECT
  USING (
    exists(
      select 1 from tenants
      where tenants.user_id = auth.uid()
        and tenants.slug = leads.slug
    )
  );

CREATE POLICY "authenticated_update_leads" ON leads
  FOR UPDATE
  USING (
    exists(
      select 1 from tenants
      where tenants.user_id = auth.uid()
        and tenants.slug = leads.slug
    )
  )
  WITH CHECK (
    exists(
      select 1 from tenants
      where tenants.user_id = auth.uid()
        and tenants.slug = leads.slug
    )
  );

CREATE POLICY "authenticated_delete_leads" ON leads
  FOR DELETE
  USING (
    exists(
      select 1 from tenants
      where tenants.user_id = auth.uid()
        and tenants.slug = leads.slug
    )
  );

-- Grant selective permissions on notificacoes_config
GRANT SELECT, INSERT, UPDATE ON TABLE notificacoes_config TO authenticated;

-- Create notificacoes_config policies
CREATE POLICY "authenticated_select_config" ON notificacoes_config
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_config" ON notificacoes_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_update_config" ON notificacoes_config
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ab_events: Keep accessible for analytics (no RLS filters)
GRANT SELECT, INSERT ON TABLE ab_events TO authenticated;

-- faq_suggestions: Keep accessible but read-only for now
GRANT SELECT ON TABLE faq_suggestions TO authenticated;
`;

async function main() {
  console.log('🔒 Aplicando migration de RLS ao Supabase...\n');
  
  const client = new Client(dbConfig);
  
  try {
    console.log('📝 Conectando ao Supabase PostgreSQL...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}\n`);
    
    await client.connect();
    console.log('✅ Conexão estabelecida!\n');
    
    console.log('📋 Executando migration SQL...\n');
    
    // Execute entire migration as a single transaction
    await client.query('BEGIN;');
    
    const result = await client.query(migrationSql);
    
    await client.query('COMMIT;');
    
    console.log('\n✅ Migration aplicada com sucesso!\n');
    console.log(`📊 Resultado:`);
    console.log(`   ✓ ${result.rowCount || 'N/A'} alterações processadas`);
    console.log(`\n🔒 Protections ativadas:`);
    console.log(`   ✓ RLS habilitado em 5 tabelas`);
    console.log(`   ✓ Anon users completamente bloqueados`);
    console.log(`   ✓ Usuários autenticados veem apenas seus dados`);
    console.log(`   ✓ 7 políticas de acesso criadas`);
    
    console.log(`\n⚡ Próximas etapas:`);
    console.log(`   1. Teste o CRM em produção`);
    console.log(`   2. Verifique se usuários veem apenas seus dados`);
    console.log(`   3. Monitore logs por erros de RLS`);
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Dica: Verifique se o host/porta estão corretos');
    }
    
    try {
      await client.query('ROLLBACK;');
    } catch (e) {}
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
