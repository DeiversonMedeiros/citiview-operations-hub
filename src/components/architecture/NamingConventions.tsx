import { FileCode, Table, Key, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const conventions = [
  {
    icon: Table,
    title: "Tabelas",
    examples: [
      { pattern: "plural_snake_case", example: "clientes, empresas, usuarios" },
      { pattern: "schema.tabela", example: "core.clientes, rh.funcionarios" },
    ],
  },
  {
    icon: Key,
    title: "Chaves",
    examples: [
      { pattern: "id (PK)", example: "UUID v4 gerado automaticamente" },
      { pattern: "entidade_id (FK)", example: "cliente_id, empresa_id" },
    ],
  },
  {
    icon: Clock,
    title: "Auditoria",
    examples: [
      { pattern: "criado_em", example: "TIMESTAMPTZ NOT NULL DEFAULT NOW()" },
      { pattern: "atualizado_em", example: "TIMESTAMPTZ com trigger" },
      { pattern: "criado_por", example: "UUID FK → auth.users" },
    ],
  },
  {
    icon: FileCode,
    title: "Status",
    examples: [
      { pattern: "ativo", example: "BOOLEAN DEFAULT TRUE" },
      { pattern: "status", example: "ENUM quando múltiplos estados" },
    ],
  },
];

export const NamingConventions = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        <div className="mb-8">
          <Badge variant="schema" className="mb-2">CONVENÇÕES</Badge>
          <h3 className="text-2xl font-bold text-foreground">
            Nomenclatura Global
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {conventions.map((conv, idx) => (
            <Card key={idx} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <conv.icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">{conv.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {conv.examples.map((ex, i) => (
                    <li key={i} className="text-sm">
                      <code className="block px-2 py-1 rounded bg-muted text-xs font-mono text-foreground mb-1">
                        {ex.pattern}
                      </code>
                      <span className="text-muted-foreground text-xs">
                        {ex.example}
                      </span>
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
