-- Expor tabelas do schema core na API via views públicas
-- Isso permite que o cliente Supabase acesse os dados mantendo a organização

-- View para perfis de usuários
CREATE OR REPLACE VIEW public.perfis_usuarios AS
SELECT * FROM core.perfis_usuarios;

-- View para empresas
CREATE OR REPLACE VIEW public.empresas AS
SELECT * FROM core.empresas;

-- View para clientes
CREATE OR REPLACE VIEW public.clientes AS
SELECT * FROM core.clientes;

-- View para vínculos usuário-empresa
CREATE OR REPLACE VIEW public.usuarios_empresas AS
SELECT * FROM core.usuarios_empresas;

-- Habilitar RLS nas views (herdam as políticas das tabelas base)
ALTER VIEW public.perfis_usuarios SET (security_invoker = on);
ALTER VIEW public.empresas SET (security_invoker = on);
ALTER VIEW public.clientes SET (security_invoker = on);
ALTER VIEW public.usuarios_empresas SET (security_invoker = on);

-- Grants para acesso autenticado
GRANT SELECT ON public.perfis_usuarios TO authenticated;
GRANT SELECT ON public.empresas TO authenticated;
GRANT SELECT ON public.clientes TO authenticated;
GRANT SELECT ON public.usuarios_empresas TO authenticated;