import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Empresa {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  status: string;
}

export const EmpresaSelector = () => {
  const { empresasVinculadas, empresaAtual, setEmpresaAtual, clienteId } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmpresas = async () => {
      if (!clienteId || empresasVinculadas.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Buscar detalhes das empresas vinculadas
        const empresaIds = empresasVinculadas.map(e => e.empresa_id);
        
        const { data, error } = await supabase.rpc('get_entity_data', {
          schema_name: 'core',
          table_name: 'empresas',
          filters: { status: 'ativo' },
          limit_param: 100,
          offset_param: 0,
        });

        if (error) {
          console.error('Erro ao buscar empresas:', error);
          return;
        }

        if (data) {
          const empresasList = data
            .map((e: { data: unknown }) => e.data as Empresa)
            .filter((e: Empresa) => empresaIds.includes(e.id));
          setEmpresas(empresasList);
        }
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresas();
  }, [clienteId, empresasVinculadas]);

  const handleEmpresaChange = (empresaId: string) => {
    setEmpresaAtual(empresaId);
  };

  const empresaAtualInfo = empresas.find(e => e.id === empresaAtual);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-[200px]" />
      </div>
    );
  }

  if (empresas.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Building2 className="h-4 w-4" />
        <span>Nenhuma empresa</span>
      </div>
    );
  }

  if (empresas.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{empresas[0].nome_fantasia}</span>
      </div>
    );
  }

  return (
    <Select value={empresaAtual || undefined} onValueChange={handleEmpresaChange}>
      <SelectTrigger className="w-[220px] bg-muted/50 border-border">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <SelectValue placeholder="Selecione uma empresa">
            {empresaAtualInfo?.nome_fantasia || 'Selecione...'}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {empresas.map((empresa) => (
          <SelectItem 
            key={empresa.id} 
            value={empresa.id}
            className="cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{empresa.nome_fantasia}</span>
              <span className="text-xs text-muted-foreground">{empresa.cnpj}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EmpresaSelector;
