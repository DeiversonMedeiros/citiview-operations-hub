import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Briefcase, LogOut, Settings } from 'lucide-react';
import EmpresaSelector from '@/components/EmpresaSelector';

const Dashboard = () => {
  const { 
    user, 
    usuario, 
    roles, 
    empresasVinculadas, 
    empresaAtual,
    signOut, 
    isSuperAdmin, 
    isAdminCliente 
  } = useAuth();

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

          {/* Seletor de Empresa */}
          <div className="flex-1 flex justify-center px-8">
            <EmpresaSelector />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{usuario?.nome_completo || user?.email}</p>
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
              <div className="text-2xl font-bold">{usuario?.nome_completo || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">{usuario?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Status: <span className="text-primary">{usuario?.status || 'N/A'}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Empresa Ativa</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {empresaAtual ? (
                  <span className="text-primary">Selecionada</span>
                ) : (
                  <span className="text-muted-foreground">Nenhuma</span>
                )}
              </div>
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
            <CardTitle>Contexto Ativo</CardTitle>
            <CardDescription>
              Todas as operações respeitam a empresa selecionada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Fluxo de Empresa Ativa</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Login realizado com sucesso</li>
                  <li>Sistema carrega empresas vinculadas</li>
                  <li>Empresa padrão ou última ativa é selecionada</li>
                  <li>Troca de empresa atualiza todos os dados</li>
                  <li>Seleção persiste na sessão do navegador</li>
                </ol>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Segurança Multi-Tenant</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Cliente:</strong> Isolamento total por cliente_id</li>
                  <li>• <strong>Empresa:</strong> Filtro por empresa_id</li>
                  <li>• <strong>RLS:</strong> Políticas no banco garantem segurança</li>
                  <li>• <strong>Frontend:</strong> Contexto global sincronizado</li>
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
