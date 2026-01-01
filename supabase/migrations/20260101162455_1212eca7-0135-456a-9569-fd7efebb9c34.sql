-- Corrigir função update_updated_at adicionando search_path
CREATE OR REPLACE FUNCTION core.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core
AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$;