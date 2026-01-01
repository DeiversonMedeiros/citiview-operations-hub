import { Layers, Database, Shield, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const patterns = [
  {
    icon: Layers,
    title: "Arquitetura em Camadas",
    description: "Separação clara entre UI, Domínio e Dados",
    items: [
      { label: "UI Layer", desc: "React + Componentes" },
      { label: "Domain Layer", desc: "Lógica de Negócio" },
      { label: "Data Layer", desc: "Supabase + RLS" },
    ],
  },
  {
    icon: Database,
    title: "Multi-Tenant Lógico",
    description: "Isolamento por cliente_id em todas as tabelas",
    items: [
      { label: "Single DB", desc: "PostgreSQL único" },
      { label: "RLS Policies", desc: "Segurança por linha" },
      { label: "Schema por Módulo", desc: "Organização modular" },
    ],
  },
  {
    icon: Shield,
    title: "Row Level Security",
    description: "Políticas RLS garantem isolamento de dados",
    items: [
      { label: "Tenant Filter", desc: "cliente_id obrigatório" },
      { label: "Company Filter", desc: "empresa_id operacional" },
      { label: "Auth Integration", desc: "Supabase Auth + JWT" },
    ],
  },
  {
    icon: GitBranch,
    title: "Modularização",
    description: "Schemas independentes por domínio funcional",
    items: [
      { label: "Core", desc: "Entidades base" },
      { label: "Módulos", desc: "Funcionalidades isoladas" },
      { label: "Extensível", desc: "Novos schemas sem refactor" },
    ],
  },
];

export const ArchitecturePattern = () => {
  return (
    <section className="py-12">
      <div className="container">
        <div className="mb-8">
          <Badge variant="module" className="mb-2">PADRÃO ARQUITETURAL</Badge>
          <h3 className="text-2xl font-bold text-foreground">
            Arquitetura Adotada
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {patterns.map((pattern, idx) => (
            <Card 
              key={idx} 
              className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <pattern.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{pattern.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {pattern.description}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {pattern.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">{item.label}</span>
                        <span className="text-muted-foreground"> — {item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
