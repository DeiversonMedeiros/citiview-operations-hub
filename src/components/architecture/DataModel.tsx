import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, ArrowRight, Key, Calendar, User } from "lucide-react";

const tables = [
  {
    schema: "core",
    name: "clientes",
    description: "Representa quem paga pelo ERP (tenant)",
    icon: Building,
    fields: [
      { name: "id", type: "UUID", pk: true, desc: "Identificador único" },
      { name: "nome", type: "VARCHAR(255)", desc: "Razão social" },
      { name: "nome_fantasia", type: "VARCHAR(255)", desc: "Nome fantasia" },
      { name: "documento", type: "VARCHAR(20)", desc: "CNPJ/CPF" },
      { name: "email", type: "VARCHAR(255)", desc: "E-mail principal" },
      { name: "telefone", type: "VARCHAR(20)", desc: "Telefone" },
      { name: "ativo", type: "BOOLEAN", desc: "Status ativo/inativo" },
      { name: "criado_em", type: "TIMESTAMPTZ", desc: "Data de criação" },
      { name: "atualizado_em", type: "TIMESTAMPTZ", desc: "Última atualização" },
      { name: "criado_por", type: "UUID", fk: "auth.users", desc: "Usuário criador" },
    ],
  },
  {
    schema: "core",
    name: "empresas",
    description: "Entidade operacional pertencente a um cliente",
    icon: Users,
    fields: [
      { name: "id", type: "UUID", pk: true, desc: "Identificador único" },
      { name: "cliente_id", type: "UUID", fk: "core.clientes", desc: "Tenant owner" },
      { name: "nome", type: "VARCHAR(255)", desc: "Razão social" },
      { name: "nome_fantasia", type: "VARCHAR(255)", desc: "Nome fantasia" },
      { name: "documento", type: "VARCHAR(20)", desc: "CNPJ" },
      { name: "email", type: "VARCHAR(255)", desc: "E-mail principal" },
      { name: "telefone", type: "VARCHAR(20)", desc: "Telefone" },
      { name: "endereco", type: "JSONB", desc: "Dados de endereço" },
      { name: "ativo", type: "BOOLEAN", desc: "Status ativo/inativo" },
      { name: "criado_em", type: "TIMESTAMPTZ", desc: "Data de criação" },
      { name: "atualizado_em", type: "TIMESTAMPTZ", desc: "Última atualização" },
      { name: "criado_por", type: "UUID", fk: "auth.users", desc: "Usuário criador" },
    ],
  },
];

const FieldIcon = ({ pk, fk }: { pk?: boolean; fk?: string }) => {
  if (pk) return <Key className="h-3 w-3 text-primary" />;
  if (fk) return <ArrowRight className="h-3 w-3 text-muted-foreground" />;
  return null;
};

export const DataModel = () => {
  return (
    <section className="py-12">
      <div className="container">
        <div className="mb-8">
          <Badge variant="module" className="mb-2">MODELO DE DADOS</Badge>
          <h3 className="text-2xl font-bold text-foreground">
            Entidades Obrigatórias
          </h3>
          <p className="text-muted-foreground mt-2">
            Estrutura base para multi-tenant com multi-empresa
          </p>
        </div>

        {/* Relationship Diagram */}
        <Card className="mb-8 overflow-hidden border-primary/20">
          <CardHeader className="bg-secondary/5 border-b border-border/50">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Relacionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-citview-navy text-sidebar-foreground">
                <Building className="h-5 w-5" />
                <div>
                  <p className="font-semibold text-sm">Cliente</p>
                  <p className="text-xs opacity-70">1 tenant</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-px w-8 bg-border" />
                <span className="text-xs font-mono">1:N</span>
                <span className="h-px w-8 bg-border" />
                <ArrowRight className="h-4 w-4" />
              </div>
              
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-primary-foreground">
                <Users className="h-5 w-5" />
                <div>
                  <p className="font-semibold text-sm">Empresas</p>
                  <p className="text-xs opacity-80">N por cliente</p>
                </div>
              </div>
            </div>
            
            <p className="text-center text-sm text-muted-foreground mt-4">
              Um cliente (tenant) pode ter múltiplas empresas. Uma empresa pertence a apenas um cliente.
            </p>
          </CardContent>
        </Card>

        {/* Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {tables.map((table, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <table.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-mono">
                        {table.schema}.{table.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {table.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="schema">{table.schema}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {table.fields.map((field, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-5 flex justify-center">
                        <FieldIcon pk={field.pk} fk={field.fk} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-medium text-foreground">
                            {field.name}
                          </code>
                          {field.pk && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">PK</Badge>
                          )}
                          {field.fk && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">FK</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {field.desc}
                          {field.fk && <span className="ml-1">→ {field.fk}</span>}
                        </p>
                      </div>
                      <code className="text-xs font-mono text-muted-foreground shrink-0">
                        {field.type}
                      </code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
