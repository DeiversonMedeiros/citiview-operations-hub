import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Usuario {
  id: string;
  user_id: string;
  cliente_id: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  cargo: string | null;
  avatar_url: string | null;
  status: string;
}

interface UserRole {
  id: string;
  role: 'super_admin' | 'admin_cliente' | 'gestor' | 'operador' | 'visualizador';
  cliente_id: string;
  empresa_id: string | null;
}

interface EmpresaVinculo {
  id: string;
  usuario_id: string;
  empresa_id: string;
  cliente_id: string;
  perfil_acesso_id: string | null;
  is_empresa_padrao: boolean;
  ativo: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  usuario: Usuario | null;
  roles: UserRole[];
  empresasVinculadas: EmpresaVinculo[];
  empresaAtual: string | null;
  clienteId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setEmpresaAtual: (empresaId: string) => void;
  hasRole: (role: string) => boolean;
  isSuperAdmin: () => boolean;
  isAdminCliente: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [empresasVinculadas, setEmpresasVinculadas] = useState<EmpresaVinculo[]>([]);
  const [empresaAtual, setEmpresaAtualState] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserContext = async (userId: string) => {
    try {
      // Buscar usuario via RPC get_entity_data
      const { data: usuarioData, error: usuarioError } = await supabase.rpc(
        'get_entity_data',
        {
          schema_name: 'core',
          table_name: 'usuarios',
          filters: { user_id: userId },
          limit_param: 1,
          offset_param: 0
        }
      );

      if (usuarioError) {
        console.error('Erro ao buscar usuário:', usuarioError);
        return;
      }

      if (usuarioData && usuarioData.length > 0) {
        const usuarioInfo = usuarioData[0].data as unknown as Usuario;
        setUsuario(usuarioInfo);
        setClienteId(usuarioInfo.cliente_id);

        // Buscar empresas vinculadas via RPC
        const { data: empresasData, error: empresasError } = await supabase.rpc(
          'get_entity_data',
          {
            schema_name: 'core',
            table_name: 'usuarios_empresas',
            filters: { usuario_id: usuarioInfo.id, ativo: true },
            limit_param: 100,
            offset_param: 0
          }
        );

        if (empresasError) {
          console.error('Erro ao buscar empresas:', empresasError);
        } else if (empresasData) {
          const empresas = empresasData.map((e: any) => e.data) as unknown as EmpresaVinculo[];
          setEmpresasVinculadas(empresas);
          
          // Definir empresa padrão
          const empresaPadrao = empresas?.find((e) => e.is_empresa_padrao);
          if (empresaPadrao) {
            setEmpresaAtualState(empresaPadrao.empresa_id);
          } else if (empresas && empresas.length > 0) {
            setEmpresaAtualState(empresas[0].empresa_id);
          }
        }
      }

      // Buscar roles do usuário (tabela public.user_roles ainda é acessível diretamente)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Erro ao buscar roles:', rolesError);
      } else {
        setRoles(rolesData as unknown as UserRole[]);
      }
    } catch (error) {
      console.error('Erro ao carregar contexto do usuário:', error);
    }
  };

  useEffect(() => {
    // Configurar listener de auth state PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Buscar contexto do usuário de forma assíncrona
        if (session?.user) {
          setTimeout(() => {
            fetchUserContext(session.user.id);
          }, 0);
        } else {
          setUsuario(null);
          setRoles([]);
          setEmpresasVinculadas([]);
          setEmpresaAtualState(null);
          setClienteId(null);
        }
        
        setLoading(false);
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserContext(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setRoles([]);
    setEmpresasVinculadas([]);
    setEmpresaAtualState(null);
    setClienteId(null);
  };

  const setEmpresaAtual = (empresaId: string) => {
    const temAcesso = empresasVinculadas.some(e => e.empresa_id === empresaId);
    if (temAcesso) {
      setEmpresaAtualState(empresaId);
    }
  };

  const hasRole = (role: string) => {
    return roles.some(r => r.role === role);
  };

  const isSuperAdmin = () => hasRole('super_admin');
  
  const isAdminCliente = () => hasRole('super_admin') || hasRole('admin_cliente');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        usuario,
        roles,
        empresasVinculadas,
        empresaAtual,
        clienteId,
        loading,
        signIn,
        signOut,
        setEmpresaAtual,
        hasRole,
        isSuperAdmin,
        isAdminCliente,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
