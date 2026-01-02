import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface PerfilUsuario {
  id: string;
  user_id: string;
  cliente_id: string;
  empresa_id: string | null;
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
  empresa_id: string;
  cliente_id: string;
  is_empresa_padrao: boolean;
  ativo: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  perfil: PerfilUsuario | null;
  roles: UserRole[];
  empresasVinculadas: EmpresaVinculo[];
  empresaAtual: string | null;
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
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [empresasVinculadas, setEmpresasVinculadas] = useState<EmpresaVinculo[]>([]);
  const [empresaAtual, setEmpresaAtualState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserContext = async (userId: string) => {
    try {
      // Buscar perfil do usuário
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis_usuarios')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (perfilError) {
        console.error('Erro ao buscar perfil:', perfilError);
        return;
      }

      setPerfil(perfilData as PerfilUsuario);

      // Buscar roles do usuário
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Erro ao buscar roles:', rolesError);
      } else {
        setRoles(rolesData as UserRole[]);
      }

      // Buscar empresas vinculadas
      if (perfilData?.id) {
        const { data: empresasData, error: empresasError } = await supabase
          .from('usuarios_empresas')
          .select('*')
          .eq('usuario_id', perfilData.id)
          .eq('ativo', true);

        if (empresasError) {
          console.error('Erro ao buscar empresas:', empresasError);
        } else {
          setEmpresasVinculadas(empresasData as EmpresaVinculo[]);
          
          // Definir empresa padrão
          const empresaPadrao = empresasData?.find((e: EmpresaVinculo) => e.is_empresa_padrao);
          if (empresaPadrao) {
            setEmpresaAtualState(empresaPadrao.empresa_id);
          } else if (empresasData && empresasData.length > 0) {
            setEmpresaAtualState(empresasData[0].empresa_id);
          }
        }
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
          setPerfil(null);
          setRoles([]);
          setEmpresasVinculadas([]);
          setEmpresaAtualState(null);
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
    setPerfil(null);
    setRoles([]);
    setEmpresasVinculadas([]);
    setEmpresaAtualState(null);
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
        perfil,
        roles,
        empresasVinculadas,
        empresaAtual,
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
