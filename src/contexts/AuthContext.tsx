import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const EMPRESA_ATIVA_KEY = 'citview_empresa_ativa';

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
  refreshContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Persistência da empresa ativa
const getStoredEmpresaAtiva = (): string | null => {
  try {
    return sessionStorage.getItem(EMPRESA_ATIVA_KEY);
  } catch {
    return null;
  }
};

const setStoredEmpresaAtiva = (empresaId: string | null) => {
  try {
    if (empresaId) {
      sessionStorage.setItem(EMPRESA_ATIVA_KEY, empresaId);
    } else {
      sessionStorage.removeItem(EMPRESA_ATIVA_KEY);
    }
  } catch {
    // Silently fail if sessionStorage is unavailable
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [empresasVinculadas, setEmpresasVinculadas] = useState<EmpresaVinculo[]>([]);
  const [empresaAtual, setEmpresaAtualState] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserContext = useCallback(async (userId: string) => {
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
          const empresas = empresasData.map((e: { data: unknown }) => e.data as EmpresaVinculo);
          setEmpresasVinculadas(empresas);
          
          // Recuperar empresa ativa do sessionStorage ou usar padrão
          const storedEmpresa = getStoredEmpresaAtiva();
          const temAcessoStoredEmpresa = empresas.some(
            (e: EmpresaVinculo) => e.empresa_id === storedEmpresa
          );

          if (storedEmpresa && temAcessoStoredEmpresa) {
            setEmpresaAtualState(storedEmpresa);
          } else {
            // Definir empresa padrão
            const empresaPadrao = empresas.find((e: EmpresaVinculo) => e.is_empresa_padrao);
            const novaEmpresa = empresaPadrao?.empresa_id || empresas[0]?.empresa_id || null;
            setEmpresaAtualState(novaEmpresa);
            setStoredEmpresaAtiva(novaEmpresa);
          }
        }
      }

      // Buscar roles do usuário
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
  }, []);

  const refreshContext = useCallback(async () => {
    if (user?.id) {
      await fetchUserContext(user.id);
    }
  }, [user?.id, fetchUserContext]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchUserContext(session.user.id);
          }, 0);
        } else {
          // Limpar estado ao fazer logout
          setUsuario(null);
          setRoles([]);
          setEmpresasVinculadas([]);
          setEmpresaAtualState(null);
          setClienteId(null);
          setStoredEmpresaAtiva(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserContext(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserContext]);

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
    setStoredEmpresaAtiva(null);
  };

  const setEmpresaAtual = useCallback((empresaId: string) => {
    const temAcesso = empresasVinculadas.some(e => e.empresa_id === empresaId);
    if (temAcesso) {
      setEmpresaAtualState(empresaId);
      setStoredEmpresaAtiva(empresaId);
    }
  }, [empresasVinculadas]);

  const hasRole = useCallback((role: string) => {
    return roles.some(r => r.role === role);
  }, [roles]);

  const isSuperAdmin = useCallback(() => hasRole('super_admin'), [hasRole]);
  
  const isAdminCliente = useCallback(
    () => hasRole('super_admin') || hasRole('admin_cliente'),
    [hasRole]
  );

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
        refreshContext,
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
