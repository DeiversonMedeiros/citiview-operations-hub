import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EntityFilters {
  [key: string]: string | boolean | number | null;
}

interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

interface EntityResult<T> {
  data: T[];
  totalCount: number;
}

export function useEntityData<T = any>() {
  const { empresaAtual } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEntities = useCallback(async (
    schemaName: string,
    tableName: string,
    filters?: EntityFilters,
    options?: PaginationOptions
  ): Promise<EntityResult<T>> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_entity_data', {
        schema_name: schemaName,
        table_name: tableName,
        empresa_id_param: empresaAtual || null,
        filters: filters ? JSON.stringify(filters) : null,
        order_by: options?.orderBy || 'criado_em',
        order_direction: options?.orderDirection || 'DESC',
        limit_param: options?.limit || 50,
        offset_param: options?.offset || 0,
      });

      if (rpcError) {
        setError(rpcError.message);
        return { data: [], totalCount: 0 };
      }

      const entities = (data || []).map((row: any) => row.data as T);
      const totalCount = data?.[0]?.total_count || 0;

      return { data: entities, totalCount };
    } catch (err: any) {
      setError(err.message);
      return { data: [], totalCount: 0 };
    } finally {
      setLoading(false);
    }
  }, [empresaAtual]);

  const createEntity = useCallback(async (
    schemaName: string,
    tableName: string,
    entityData: Record<string, unknown>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('create_entity_data', {
        schema_name: schemaName,
        table_name: tableName,
        empresa_id_param: empresaAtual || null,
        data_param: entityData as any,
      });

      if (rpcError) {
        setError(rpcError.message);
        return null;
      }

      return data as T;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [empresaAtual]);

  const updateEntity = useCallback(async (
    schemaName: string,
    tableName: string,
    id: string,
    entityData: Record<string, unknown>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('update_entity_data', {
        schema_name: schemaName,
        table_name: tableName,
        id_param: id,
        empresa_id_param: empresaAtual || null,
        data_param: entityData as any,
      });

      if (rpcError) {
        setError(rpcError.message);
        return null;
      }

      return data as T;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [empresaAtual]);

  const deleteEntity = useCallback(async (
    schemaName: string,
    tableName: string,
    id: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('delete_entity_data', {
        schema_name: schemaName,
        table_name: tableName,
        id_param: id,
        empresa_id_param: empresaAtual || null,
      });

      if (rpcError) {
        setError(rpcError.message);
        return false;
      }

      return data === true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [empresaAtual]);

  return {
    loading,
    error,
    getEntities,
    createEntity,
    updateEntity,
    deleteEntity,
  };
}
