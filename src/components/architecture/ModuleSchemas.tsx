import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Settings, 
  Database, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Wrench, 
  Truck, 
  MapPin 
} from "lucide-react";

const schemas = [
  { name: "core", desc: "Entidades base do sistema", icon: Database, color: "bg-citview-navy" },
  { name: "administracao", desc: "Gestão administrativa", icon: Settings, color: "bg-slate-600" },
  { name: "rh", desc: "Recursos Humanos", icon: Users, color: "bg-emerald-600" },
  { name: "financeiro", desc: "Gestão Financeira", icon: DollarSign, color: "bg-amber-600" },
  { name: "compras", desc: "Gestão de Compras", icon: ShoppingCart, color: "bg-violet-600" },
  { name: "almoxarifado", desc: "Controle de Estoque", icon: Package, color: "bg-sky-600" },
  { name: "operacoes", desc: "Operações de Campo", icon: Wrench, color: "bg-primary" },
  { name: "frota", desc: "Gestão de Veículos", icon: Truck, color: "bg-rose-600" },
  { name: "logistica", desc: "Logística e Rotas", icon: MapPin, color: "bg-teal-600" },
];

export const ModuleSchemas = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        <div className="mb-8">
          <Badge variant="schema" className="mb-2">SCHEMAS</Badge>
          <h3 className="text-2xl font-bold text-foreground">
            Organização por Módulos
          </h3>
          <p className="text-muted-foreground mt-2">
            Cada módulo possui seu próprio schema no PostgreSQL, permitindo escalabilidade sem refatoração
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schemas.map((schema, idx) => (
            <Card 
              key={idx} 
              className="group hover:shadow-md transition-all duration-200 border-border/50 hover:border-primary/30"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${schema.color} text-white shrink-0`}>
                  <schema.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <code className="text-sm font-mono font-semibold text-foreground">
                    {schema.name}
                  </code>
                  <p className="text-xs text-muted-foreground truncate">
                    {schema.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-primary/20 bg-accent/50">
          <CardContent className="p-6">
            <h4 className="font-semibold text-foreground mb-3">
              Observações Importantes
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  <strong className="text-foreground">Não utilizamos o schema public</strong> — cada módulo tem seu próprio namespace
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  <strong className="text-foreground">Usuários autenticam via Supabase Auth</strong> — criação via Edge Functions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  <strong className="text-foreground">RLS em todas as tabelas</strong> — isolamento por cliente_id e empresa_id
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
