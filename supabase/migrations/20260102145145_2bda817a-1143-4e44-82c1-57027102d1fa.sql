-- Criar tabela de vínculo usuário-empresa no schema core
CREATE TABLE core.usuarios_empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES core.perfis_usuarios(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES core.empresas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES core.clientes(id) ON DELETE CASCADE,
    is_empresa_padrao BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    criado_por UUID REFERENCES auth.users(id),
    UNIQUE(usuario_id, empresa_id)
);

-- Índices para performance
CREATE INDEX idx_usuarios_empresas_usuario ON core.usuarios_empresas(usuario_id);
CREATE INDEX idx_usuarios_empresas_empresa ON core.usuarios_empresas(empresa_id);
CREATE INDEX idx_usuarios_empresas_cliente ON core.usuarios_empresas(cliente_id);

-- Trigger para atualizar timestamp
CREATE TRIGGER update_usuarios_empresas_updated_at
    BEFORE UPDATE ON core.usuarios_empresas
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at();

-- Habilitar RLS
ALTER TABLE core.usuarios_empresas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuarios_empresas
CREATE POLICY "Super admins podem gerenciar vínculos"
ON core.usuarios_empresas
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Admin cliente pode gerenciar vínculos do seu cliente"
ON core.usuarios_empresas
FOR ALL
USING (
    public.is_admin_cliente() 
    AND cliente_id = public.get_user_cliente_id()
);

CREATE POLICY "Usuários podem ver seus próprios vínculos"
ON core.usuarios_empresas
FOR SELECT
USING (usuario_id IN (
    SELECT id FROM core.perfis_usuarios WHERE user_id = auth.uid()
));

-- Função para obter empresas do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_empresas()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, core
AS $$
    SELECT ue.empresa_id 
    FROM core.usuarios_empresas ue
    INNER JOIN core.perfis_usuarios pu ON pu.id = ue.usuario_id
    WHERE pu.user_id = auth.uid() AND ue.ativo = true
$$;

-- Função para verificar acesso a empresa específica
CREATE OR REPLACE FUNCTION public.has_empresa_access(p_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, core
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM core.usuarios_empresas ue
        INNER JOIN core.perfis_usuarios pu ON pu.id = ue.usuario_id
        WHERE pu.user_id = auth.uid() 
        AND ue.empresa_id = p_empresa_id 
        AND ue.ativo = true
    )
$$;

-- Trigger para criar perfil automaticamente quando usuário é criado no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
DECLARE
    v_cliente_id UUID;
    v_empresa_id UUID;
BEGIN
    -- Obter cliente_id e empresa_id dos metadados do usuário
    v_cliente_id := (NEW.raw_user_meta_data ->> 'cliente_id')::UUID;
    v_empresa_id := (NEW.raw_user_meta_data ->> 'empresa_id')::UUID;
    
    -- Criar perfil do usuário
    INSERT INTO core.perfis_usuarios (
        user_id,
        cliente_id,
        empresa_id,
        nome_completo,
        email,
        status
    ) VALUES (
        NEW.id,
        v_cliente_id,
        v_empresa_id,
        COALESCE(NEW.raw_user_meta_data ->> 'nome_completo', NEW.email),
        NEW.email,
        'ativo'
    );
    
    RETURN NEW;
END;
$$;

-- Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();