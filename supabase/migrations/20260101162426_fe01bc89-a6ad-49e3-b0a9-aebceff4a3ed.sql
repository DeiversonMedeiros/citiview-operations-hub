-- Criar schema core para tabelas fundamentais
CREATE SCHEMA IF NOT EXISTS core;

-- Criar enum para status
CREATE TYPE core.status_registro AS ENUM ('ativo', 'inativo', 'suspenso');

-- Criar enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin_cliente', 'gestor', 'operador', 'visualizador');

-- Tabela de Clientes (Tenants - quem paga pelo ERP)
CREATE TABLE core.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco_logradouro VARCHAR(255),
    endereco_numero VARCHAR(20),
    endereco_complemento VARCHAR(100),
    endereco_bairro VARCHAR(100),
    endereco_cidade VARCHAR(100),
    endereco_uf CHAR(2),
    endereco_cep VARCHAR(10),
    status core.status_registro NOT NULL DEFAULT 'ativo',
    data_contrato DATE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    criado_por UUID
);

-- Tabela de Empresas (Entidades operacionais do cliente)
CREATE TABLE core.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES core.clientes(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(18),
    inscricao_estadual VARCHAR(20),
    inscricao_municipal VARCHAR(20),
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco_logradouro VARCHAR(255),
    endereco_numero VARCHAR(20),
    endereco_complemento VARCHAR(100),
    endereco_bairro VARCHAR(100),
    endereco_cidade VARCHAR(100),
    endereco_uf CHAR(2),
    endereco_cep VARCHAR(10),
    status core.status_registro NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    criado_por UUID,
    UNIQUE(cliente_id, codigo)
);

-- Tabela de Perfis de Usuário (vincula auth.users ao tenant/empresa)
CREATE TABLE core.perfis_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    cliente_id UUID NOT NULL REFERENCES core.clientes(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES core.empresas(id) ON DELETE SET NULL,
    nome_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cargo VARCHAR(100),
    avatar_url TEXT,
    status core.status_registro NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    criado_por UUID
);

-- Tabela de Roles de Usuário (separada para segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    cliente_id UUID NOT NULL REFERENCES core.clientes(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES core.empresas(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    criado_por UUID,
    UNIQUE(user_id, role, cliente_id, empresa_id)
);

-- Índices para performance
CREATE INDEX idx_empresas_cliente_id ON core.empresas(cliente_id);
CREATE INDEX idx_perfis_usuarios_user_id ON core.perfis_usuarios(user_id);
CREATE INDEX idx_perfis_usuarios_cliente_id ON core.perfis_usuarios(cliente_id);
CREATE INDEX idx_perfis_usuarios_empresa_id ON core.perfis_usuarios(empresa_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_cliente_id ON public.user_roles(cliente_id);

-- Habilitar RLS
ALTER TABLE core.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.perfis_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para obter cliente_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_cliente_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, core
AS $$
    SELECT cliente_id FROM core.perfis_usuarios WHERE user_id = auth.uid()
$$;

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Função para verificar se usuário é super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
$$;

-- Função para verificar se usuário é admin do cliente
CREATE OR REPLACE FUNCTION public.is_admin_cliente()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin_cliente')
    )
$$;

-- Policies para core.clientes
CREATE POLICY "Super admins podem ver todos os clientes"
ON core.clientes FOR SELECT
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Usuários podem ver seu próprio cliente"
ON core.clientes FOR SELECT
TO authenticated
USING (id = public.get_user_cliente_id());

CREATE POLICY "Super admins podem inserir clientes"
ON core.clientes FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins podem atualizar clientes"
ON core.clientes FOR UPDATE
TO authenticated
USING (public.is_super_admin());

-- Policies para core.empresas
CREATE POLICY "Usuários podem ver empresas do seu cliente"
ON core.empresas FOR SELECT
TO authenticated
USING (cliente_id = public.get_user_cliente_id());

CREATE POLICY "Admins podem inserir empresas"
ON core.empresas FOR INSERT
TO authenticated
WITH CHECK (cliente_id = public.get_user_cliente_id() AND public.is_admin_cliente());

CREATE POLICY "Admins podem atualizar empresas"
ON core.empresas FOR UPDATE
TO authenticated
USING (cliente_id = public.get_user_cliente_id() AND public.is_admin_cliente());

-- Policies para core.perfis_usuarios
CREATE POLICY "Usuários podem ver perfis do seu cliente"
ON core.perfis_usuarios FOR SELECT
TO authenticated
USING (cliente_id = public.get_user_cliente_id());

CREATE POLICY "Usuários podem ver seu próprio perfil"
ON core.perfis_usuarios FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON core.perfis_usuarios FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Policies para user_roles
CREATE POLICY "Usuários podem ver seus próprios roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins podem gerenciar roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_super_admin());

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION core.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON core.clientes
    FOR EACH ROW EXECUTE FUNCTION core.update_updated_at();

CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON core.empresas
    FOR EACH ROW EXECUTE FUNCTION core.update_updated_at();

CREATE TRIGGER update_perfis_usuarios_updated_at
    BEFORE UPDATE ON core.perfis_usuarios
    FOR EACH ROW EXECUTE FUNCTION core.update_updated_at();