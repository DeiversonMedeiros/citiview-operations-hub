import { ArchitectureHeader } from "@/components/architecture/ArchitectureHeader";
import { ArchitecturePattern } from "@/components/architecture/ArchitecturePattern";
import { NamingConventions } from "@/components/architecture/NamingConventions";
import { DataModel } from "@/components/architecture/DataModel";
import { ModuleSchemas } from "@/components/architecture/ModuleSchemas";
import { LayerOrganization } from "@/components/architecture/LayerOrganization";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <ArchitectureHeader />
      <main>
        <ArchitecturePattern />
        <NamingConventions />
        <LayerOrganization />
        <DataModel />
        <ModuleSchemas />
      </main>
      
      <footer className="py-8 border-t border-border/50 bg-muted/30">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            CitiView ERP • Arquitetura Base v1.0
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
