import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Briefcase, LogOut, Settings } from 'lucide-react';

const Dashboard = () => {
  const { user, perfil, roles, empresasVinculadas, signOut, isSuperAdmin, isAdminCliente } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">CitiView</h1>
              <p className="text-xs text-muted-foreground">ERP O&M Infraestrutura</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{perfil?.nome_completo || user?.email}</p>
              <p className="text-xs text-muted-foreground">
                {roles.map(r => r.role).join(', ') || 'Sem papel definido'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo ao CitiView</h2>
          <p className="text-muted-foreground">
            Sistema de gestão para operação e manutenção de infraestrutura urbana.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Seu Perfil</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{perfil?.nome_completo || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">{perfil?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Status: <span className="text-primary">{perfil?.status || 'N/A'}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Empresas Vinculadas</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{empresasVinculadas.length}</div>
              <p className="text-xs text-muted-foreground">
                {empresasVinculadas.length === 0 
                  ? 'Nenhuma empresa vinculada'
                  : empresasVinculadas.length === 1 
                    ? '1 empresa disponível'
                    : `${empresasVinculadas.length} empresas disponíveis`
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Nível de Acesso</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isSuperAdmin() ? 'Super Admin' : isAdminCliente() ? 'Admin' : 'Usuário'}
              </div>
              <p className="text-xs text-muted-foreground">
                {roles.length} {roles.length === 1 ? 'papel atribuído' : 'papéis atribuídos'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Estrutura de Autenticação</CardTitle>
            <CardDescription>
              Sistema multi-tenant com isolamento por cliente e empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Fluxo de Login</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Usuário entra com email/senha</li>
                  <li>Supabase Auth valida credenciais</li>
                  <li>Sistema carrega perfil do usuário</li>
                  <li>Sistema carrega roles e empresas</li>
                  <li>Contexto fica disponível na aplicação</li>
                </ol>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Contexto do Usuário</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Perfil:</strong> Dados do usuário no domínio</li>
                  <li>• <strong>Roles:</strong> Papéis de acesso (RBAC)</li>
                  <li>• <strong>Empresas:</strong> Vínculos ativos</li>
                  <li>• <strong>Empresa Atual:</strong> Contexto selecionado</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
