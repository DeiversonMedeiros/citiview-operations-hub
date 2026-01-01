import { Badge } from "@/components/ui/badge";
import { Monitor, Cpu, Database } from "lucide-react";

const layers = [
  {
    name: "UI Layer",
    icon: Monitor,
    tech: "React + TypeScript + Tailwind",
    items: [
      "Componentes reutilizáveis",
      "Páginas por módulo",
      "Hooks customizados",
      "Estado local (React Query)",
    ],
    color: "border-l-primary",
    bgColor: "bg-primary/5",
  },
  {
    name: "Domain Layer",
    icon: Cpu,
    tech: "Edge Functions + Validações",
    items: [
      "Lógica de negócio",
      "Validações com Zod",
      "Regras de autorização",
      "Transformação de dados",
    ],
    color: "border-l-citview-navy",
    bgColor: "bg-secondary/5",
  },
  {
    name: "Data Layer",
    icon: Database,
    tech: "Supabase + PostgreSQL",
    items: [
      "Schemas por módulo",
      "RLS policies",
      "Triggers de auditoria",
      "Funções SQL",
    ],
    color: "border-l-emerald-500",
    bgColor: "bg-emerald-500/5",
  },
];

export const LayerOrganization = () => {
  return (
    <section className="py-12">
      <div className="container">
        <div className="mb-8">
          <Badge variant="module" className="mb-2">CAMADAS</Badge>
          <h3 className="text-2xl font-bold text-foreground">
            Organização de Camadas
          </h3>
        </div>

        <div className="relative">
          {/* Connection lines */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-citview-navy to-emerald-500 hidden lg:block" />
          
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
            {layers.map((layer, idx) => (
              <div 
                key={idx}
                className={`relative p-6 rounded-xl border-l-4 ${layer.color} ${layer.bgColor} border border-border/50`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card shadow-sm">
                    <layer.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{layer.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{layer.tech}</p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {layer.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-foreground/30" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
