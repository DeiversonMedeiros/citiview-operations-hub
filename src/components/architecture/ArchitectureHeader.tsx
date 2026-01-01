import { Building2 } from "lucide-react";

export const ArchitectureHeader = () => {
  return (
    <header className="relative overflow-hidden bg-gradient-navy py-16">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--citview-orange) / 0.3) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>
      
      <div className="container relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-sidebar-foreground">
              CitiView <span className="text-citview-orange">ERP</span>
            </h1>
            <p className="text-sm text-sidebar-foreground/70">
              Infraestrutura Urbana • O&M
            </p>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-sidebar-foreground mb-2">
          Arquitetura Base Multi-Tenant
        </h2>
        <p className="text-sidebar-foreground/80 max-w-2xl">
          Sistema ERP SaaS com código único e banco de dados único, 
          projetado para escalar módulos sem refatoração futura.
        </p>
      </div>
    </header>
  );
};
