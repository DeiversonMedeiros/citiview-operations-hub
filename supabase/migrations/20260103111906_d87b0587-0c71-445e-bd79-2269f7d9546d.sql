-- =============================================
-- FUNÇÕES DE ACESSO DINÂMICO AO ESQUEMA CORE
-- =============================================

-- Função auxiliar: verificar permissão de acesso
CREATE OR REPLACE FUNCTION public.check_access_permission(
    p_schema_name TEXT,
    p_table_name TEXT,
    p_operation TEXT DEFAULT 'read'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, core
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Super admin tem acesso total
    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Admin cliente tem acesso às operações do cliente
    IF public.is_admin_cliente() THEN
        RETURN TRUE;
    END IF;
    
    -- Usuários normais têm acesso de leitura às tabelas que possuem vínculo
    IF p_operation = 'read' THEN
        RETURN EXISTS (
            SELECT 1 FROM core.usuarios_empresas ue
            INNER JOIN core.usuarios u ON u.id = ue.usuario_id
            WHERE u.user_id = v_user_id AND ue.ativo = true
        );
    END IF;
    
    -- Para outras operações, verificar se é admin
    RETURN public.is_admin_cliente();
END;
$$;

-- =============================================
-- FUNÇÃO 1: GET_ENTITY_DATA (Busca com filtros)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_entity_data(
    schema_name TEXT,
    table_name TEXT,
    empresa_id_param TEXT DEFAULT NULL,
    filters JSONB DEFAULT NULL,
    order_by TEXT DEFAULT 'criado_em',
    order_direction TEXT DEFAULT 'DESC',
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id TEXT,
    data JSONB,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
DECLARE
    query_text TEXT;
    count_query TEXT;
    where_clause TEXT := '';
    order_clause TEXT;
    total_rows BIGINT;
    filter_key TEXT;
    filter_value TEXT;
    current_user_id UUID;
    user_empresas UUID[];
    user_cliente_id UUID;
    has_empresa_access BOOLEAN := FALSE;
    base_field TEXT;
    condition TEXT;
    has_empresa_id_column BOOLEAN := FALSE;
    has_cliente_id_column BOOLEAN := FALSE;
    column_exists BOOLEAN := FALSE;
    order_by_column_exists BOOLEAN := FALSE;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    IF NOT public.check_access_permission(schema_name, table_name, 'read') THEN
        RAISE EXCEPTION 'Acesso negado para %.%', schema_name, table_name;
    END IF;
    
    -- Verificar colunas existentes
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = schema_name
        AND c.table_name = get_entity_data.table_name
        AND c.column_name = 'empresa_id'
    ) INTO has_empresa_id_column;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = schema_name
        AND c.table_name = get_entity_data.table_name
        AND c.column_name = 'cliente_id'
    ) INTO has_cliente_id_column;
    
    -- Validar coluna de ordenação
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = schema_name
        AND c.table_name = get_entity_data.table_name
        AND c.column_name = order_by
    ) INTO order_by_column_exists;
    
    IF NOT order_by_column_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_schema = schema_name
            AND c.table_name = get_entity_data.table_name
            AND c.column_name = 'criado_em'
        ) INTO order_by_column_exists;
        
        IF order_by_column_exists THEN
            order_by := 'criado_em';
        ELSE
            order_by := 'id';
        END IF;
    END IF;
    
    -- Obter empresas do usuário
    SELECT ARRAY(
        SELECT ue.empresa_id 
        FROM core.usuarios_empresas ue 
        INNER JOIN core.usuarios u ON u.id = ue.usuario_id
        WHERE u.user_id = current_user_id 
        AND ue.ativo = true
    ) INTO user_empresas;
    
    -- Obter cliente_id do usuário
    SELECT public.get_user_cliente_id() INTO user_cliente_id;
    
    -- Verificar acesso
    IF public.is_super_admin() THEN
        has_empresa_access := TRUE;
    ELSE
        IF empresa_id_param IS NOT NULL THEN
            has_empresa_access := (empresa_id_param::uuid = ANY(user_empresas));
        ELSE
            has_empresa_access := (array_length(user_empresas, 1) > 0);
        END IF;
    END IF;
    
    IF NOT has_empresa_access THEN
        RAISE EXCEPTION 'Acesso negado para empresa %', COALESCE(empresa_id_param, 'não especificada');
    END IF;
    
    -- Construir WHERE
    where_clause := 'WHERE 1=1';
    
    -- Filtro por cliente (sempre aplicar se não for super_admin)
    IF has_cliente_id_column AND user_cliente_id IS NOT NULL AND NOT public.is_super_admin() THEN
        where_clause := where_clause || ' AND cliente_id = ''' || user_cliente_id || '''::uuid';
    END IF;
    
    -- Filtro por empresa específica
    IF empresa_id_param IS NOT NULL AND has_empresa_id_column THEN
        where_clause := where_clause || ' AND empresa_id = ''' || empresa_id_param || '''::uuid';
    ELSIF has_empresa_id_column AND NOT public.is_super_admin() AND NOT public.is_admin_cliente() THEN
        -- Filtrar por empresas do usuário
        where_clause := where_clause || ' AND empresa_id = ANY(ARRAY[' || 
            (SELECT string_agg('''' || e::text || '''::uuid', ',') FROM unnest(user_empresas) e) || '])';
    END IF;
    
    -- Processar filtros adicionais
    IF filters IS NOT NULL AND jsonb_typeof(filters) = 'object' THEN
        FOR filter_key, filter_value IN SELECT * FROM jsonb_each_text(filters)
        LOOP
            IF filter_value IS NOT NULL AND filter_value != '' AND filter_value != 'all' THEN
                condition := '';
                column_exists := FALSE;
                
                IF filter_key LIKE '%_gte' THEN
                    base_field := replace(filter_key, '_gte', '');
                ELSIF filter_key LIKE '%_lte' THEN
                    base_field := replace(filter_key, '_lte', '');
                ELSE
                    base_field := filter_key;
                END IF;
                
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns c
                    WHERE c.table_schema = schema_name
                    AND c.table_name = get_entity_data.table_name
                    AND c.column_name = base_field
                ) INTO column_exists;
                
                IF NOT column_exists THEN
                    CONTINUE;
                END IF;
                
                IF filter_key LIKE '%_id' THEN
                    condition := filter_key || ' = ''' || filter_value || '''::uuid';
                ELSIF filter_key LIKE '%_gte' THEN
                    condition := base_field || ' >= ''' || filter_value || '''::date';
                ELSIF filter_key LIKE '%_lte' THEN
                    condition := base_field || ' <= ''' || filter_value || '''::date';
                ELSIF filter_key LIKE '%_date' OR filter_key LIKE 'data_%' THEN
                    condition := filter_key || ' = ''' || filter_value || '''::date';
                ELSIF filter_value IN ('true', 'false') THEN
                    condition := filter_key || ' = ' || filter_value;
                ELSE
                    condition := filter_key || ' = ''' || filter_value || '''';
                END IF;
                
                IF condition != '' THEN
                    where_clause := where_clause || ' AND ' || condition;
                END IF;
            END IF;
        END LOOP;
    END IF;
    
    order_clause := 'ORDER BY ' || quote_ident(order_by) || ' ' || order_direction;
    
    count_query := format('SELECT COUNT(*) FROM %I.%I %s', schema_name, table_name, where_clause);
    EXECUTE count_query INTO total_rows;
    
    query_text := format('
        SELECT 
            t.id::text,
            to_jsonb(t.*) as data,
            %s::bigint as total_count
        FROM %I.%I t 
        %s 
        %s
        LIMIT %s OFFSET %s
    ', total_rows, schema_name, table_name, where_clause, order_clause, limit_param, offset_param);
    
    RETURN QUERY EXECUTE query_text;
END;
$$;

-- =============================================
-- FUNÇÃO 2: CREATE_ENTITY_DATA (Inserir dados)
-- =============================================
CREATE OR REPLACE FUNCTION public.create_entity_data(
    schema_name TEXT,
    table_name TEXT,
    empresa_id_param TEXT DEFAULT NULL,
    data_param JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
DECLARE
    v_result JSONB;
    v_insert_sql TEXT;
    v_key TEXT;
    v_value JSONB;
    v_value_str TEXT;
    v_has_empresa_id BOOLEAN;
    v_has_cliente_id BOOLEAN;
    v_columns_list TEXT := '';
    v_values_list TEXT := '';
    v_column_type TEXT;
    v_value_type TEXT;
    v_return_columns TEXT;
    v_all_columns TEXT[];
    v_jsonb_parts TEXT[];
    v_col_name TEXT;
    v_col_exists BOOLEAN;
    v_user_cliente_id UUID;
    v_criado_por UUID;
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables t
        WHERE t.table_schema = schema_name 
        AND t.table_name = create_entity_data.table_name
    ) THEN
        RAISE EXCEPTION 'Tabela %.% não existe', schema_name, table_name;
    END IF;
    
    -- Verificar permissão
    IF NOT public.check_access_permission(schema_name, table_name, 'write') THEN
        RAISE EXCEPTION 'Acesso negado para criar em %.%', schema_name, table_name;
    END IF;
    
    -- Obter cliente_id e usuario_id do usuário atual
    SELECT public.get_user_cliente_id() INTO v_user_cliente_id;
    SELECT id INTO v_criado_por FROM core.usuarios WHERE user_id = auth.uid();
    
    -- Verificar colunas existentes
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = schema_name
        AND col.table_name = create_entity_data.table_name
        AND col.column_name = 'empresa_id'
    ) INTO v_has_empresa_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = schema_name
        AND col.table_name = create_entity_data.table_name
        AND col.column_name = 'cliente_id'
    ) INTO v_has_cliente_id;
    
    -- Adicionar empresa_id se existir
    IF v_has_empresa_id AND empresa_id_param IS NOT NULL THEN
        v_columns_list := 'empresa_id';
        v_values_list := quote_literal(empresa_id_param) || '::uuid';
    END IF;
    
    -- Adicionar cliente_id se existir
    IF v_has_cliente_id AND v_user_cliente_id IS NOT NULL THEN
        IF v_columns_list != '' THEN
            v_columns_list := v_columns_list || ', ';
            v_values_list := v_values_list || ', ';
        END IF;
        v_columns_list := v_columns_list || 'cliente_id';
        v_values_list := v_values_list || quote_literal(v_user_cliente_id) || '::uuid';
    END IF;
    
    -- Adicionar criado_por se existir a coluna
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = schema_name
        AND col.table_name = create_entity_data.table_name
        AND col.column_name = 'criado_por'
    ) INTO v_col_exists;
    
    IF v_col_exists AND v_criado_por IS NOT NULL THEN
        IF v_columns_list != '' THEN
            v_columns_list := v_columns_list || ', ';
            v_values_list := v_values_list || ', ';
        END IF;
        v_columns_list := v_columns_list || 'criado_por';
        v_values_list := v_values_list || quote_literal(v_criado_por) || '::uuid';
    END IF;
    
    -- Processar campos do data_param
    FOR v_key, v_value IN SELECT * FROM jsonb_each(data_param) LOOP
        -- Pular campos já adicionados
        IF v_key IN ('empresa_id', 'cliente_id', 'criado_por', 'id') THEN
            CONTINUE;
        END IF;
        
        -- Verificar se a coluna existe
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns col
            WHERE col.table_schema = schema_name
            AND col.table_name = create_entity_data.table_name
            AND col.column_name = v_key
        ) INTO v_col_exists;
        
        IF NOT v_col_exists THEN
            CONTINUE;
        END IF;
        
        IF v_columns_list != '' THEN
            v_columns_list := v_columns_list || ', ';
            v_values_list := v_values_list || ', ';
        END IF;
        
        v_columns_list := v_columns_list || quote_ident(v_key);
        
        -- Obter tipo da coluna
        SELECT col.data_type INTO v_column_type
        FROM information_schema.columns col
        WHERE col.table_schema = schema_name
        AND col.table_name = create_entity_data.table_name
        AND col.column_name = v_key;
        
        v_value_type := jsonb_typeof(v_value);
        
        -- Tratar tipos
        IF v_value_type = 'null' THEN
            v_values_list := v_values_list || 'NULL';
        ELSIF v_value_type = 'boolean' THEN
            v_values_list := v_values_list || (v_value #>> '{}');
        ELSIF v_value_type = 'number' THEN
            v_values_list := v_values_list || (v_value #>> '{}');
        ELSIF v_value_type = 'object' THEN
            v_values_list := v_values_list || quote_literal(v_value::text) || '::jsonb';
        ELSIF v_value_type = 'array' THEN
            v_values_list := v_values_list || quote_literal(v_value::text) || '::jsonb';
        ELSE
            v_value_str := v_value #>> '{}';
            IF v_column_type = 'uuid' THEN
                v_values_list := v_values_list || quote_literal(v_value_str) || '::uuid';
            ELSIF v_column_type IN ('date', 'timestamp with time zone', 'timestamp without time zone') THEN
                IF v_value_str IS NULL OR v_value_str = '' THEN
                    v_values_list := v_values_list || 'NULL';
                ELSE
                    v_values_list := v_values_list || quote_literal(v_value_str);
                END IF;
            ELSE
                v_values_list := v_values_list || quote_literal(v_value_str);
            END IF;
        END IF;
    END LOOP;
    
    IF v_columns_list = '' THEN
        RAISE EXCEPTION 'Nenhuma coluna especificada para inserção';
    END IF;
    
    -- Buscar colunas para RETURNING
    SELECT array_agg(quote_ident(col.column_name) ORDER BY col.ordinal_position)
    INTO v_all_columns
    FROM information_schema.columns col
    WHERE col.table_schema = schema_name
    AND col.table_name = create_entity_data.table_name;
    
    v_return_columns := array_to_string(v_all_columns, ', ');
    
    -- Construir jsonb_build_object
    v_jsonb_parts := ARRAY[]::TEXT[];
    FOR v_col_name IN SELECT unnest(v_all_columns) LOOP
        v_col_name := trim(both '"' from v_col_name);
        v_jsonb_parts := v_jsonb_parts || format('%L, inserted_row.%I', v_col_name, v_col_name);
    END LOOP;
    
    v_insert_sql := format(
        'WITH inserted_row AS (
           INSERT INTO %I.%I (%s) 
           VALUES (%s) 
           RETURNING %s
         )
         SELECT jsonb_build_object(%s) FROM inserted_row',
        schema_name, table_name, v_columns_list, v_values_list, v_return_columns,
        array_to_string(v_jsonb_parts, ', ')
    );
    
    EXECUTE v_insert_sql INTO v_result;
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar dados: % (SQL: %)', SQLERRM, COALESCE(v_insert_sql, 'N/A');
END;
$$;

-- =============================================
-- FUNÇÃO 3: UPDATE_ENTITY_DATA (Atualizar dados)
-- =============================================
CREATE OR REPLACE FUNCTION public.update_entity_data(
    schema_name TEXT,
    table_name TEXT,
    id_param TEXT,
    empresa_id_param TEXT DEFAULT NULL,
    data_param JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
DECLARE
    v_result JSONB;
    v_sql_query TEXT;
    v_set_clauses TEXT := '';
    v_key TEXT;
    v_value JSONB;
    v_value_str TEXT;
    v_value_type TEXT;
    v_column_type TEXT;
    v_where_clause TEXT;
    v_has_empresa_id BOOLEAN;
    v_user_cliente_id UUID;
BEGIN
    -- Verificar permissão
    IF NOT public.check_access_permission(schema_name, table_name, 'write') THEN
        RAISE EXCEPTION 'Acesso negado para atualizar em %.%', schema_name, table_name;
    END IF;
    
    SELECT public.get_user_cliente_id() INTO v_user_cliente_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = schema_name
        AND col.table_name = update_entity_data.table_name
        AND col.column_name = 'empresa_id'
    ) INTO v_has_empresa_id;
    
    -- Construir SET clauses
    FOR v_key, v_value IN SELECT * FROM jsonb_each(data_param) LOOP
        -- Pular campos protegidos
        IF v_key IN ('id', 'empresa_id', 'cliente_id', 'criado_em', 'criado_por') THEN
            CONTINUE;
        END IF;
        
        -- Verificar se coluna existe
        SELECT col.data_type INTO v_column_type
        FROM information_schema.columns col
        WHERE col.table_schema = schema_name
        AND col.table_name = update_entity_data.table_name
        AND col.column_name = v_key;
        
        IF v_column_type IS NULL THEN
            CONTINUE;
        END IF;
        
        v_value_type := jsonb_typeof(v_value);
        
        IF v_set_clauses != '' THEN
            v_set_clauses := v_set_clauses || ', ';
        END IF;
        
        IF v_value_type = 'null' THEN
            v_set_clauses := v_set_clauses || quote_ident(v_key) || ' = NULL';
        ELSIF v_value_type = 'boolean' THEN
            v_set_clauses := v_set_clauses || quote_ident(v_key) || ' = ' || (v_value #>> '{}');
        ELSIF v_value_type = 'number' THEN
            v_set_clauses := v_set_clauses || quote_ident(v_key) || ' = ' || (v_value #>> '{}');
        ELSIF v_value_type = 'object' THEN
            v_set_clauses := v_set_clauses || quote_ident(v_key) || ' = ' || quote_literal(v_value::text) || '::jsonb';
        ELSIF v_value_type = 'array' THEN
            v_set_clauses := v_set_clauses || quote_ident(v_key) || ' = ' || quote_literal(v_value::text) || '::jsonb';
        ELSE
            v_value_str := v_value #>> '{}';
            IF v_column_type = 'uuid' THEN
                v_set_clauses := v_set_clauses || quote_ident(v_key) || ' = ' || quote_literal(v_value_str) || '::uuid';
            ELSIF v_column_type IN ('date', 'timestamp with time zone') THEN
                IF v_value_str IS NULL OR v_value_str = '' THEN
                    v_set_clauses := v_set_clauses || quote_ident(v_key) || ' = NULL';
                ELSE
                    v_set_clauses := v_set_clauses || quote_ident(v_key) || ' = ' || quote_literal(v_value_str);
                END IF;
            ELSE
                v_set_clauses := v_set_clauses || quote_ident(v_key) || ' = ' || quote_literal(v_value_str);
            END IF;
        END IF;
    END LOOP;
    
    IF v_set_clauses = '' THEN
        RAISE EXCEPTION 'Nenhum campo válido para atualizar';
    END IF;
    
    -- Adicionar atualizado_em
    v_set_clauses := v_set_clauses || ', atualizado_em = now()';
    
    -- Construir WHERE
    v_where_clause := 'WHERE id = ' || quote_literal(id_param) || '::uuid';
    
    IF v_has_empresa_id AND empresa_id_param IS NOT NULL THEN
        v_where_clause := v_where_clause || ' AND empresa_id = ' || quote_literal(empresa_id_param) || '::uuid';
    END IF;
    
    -- Filtro por cliente se não for super_admin
    IF NOT public.is_super_admin() AND v_user_cliente_id IS NOT NULL THEN
        v_where_clause := v_where_clause || ' AND cliente_id = ' || quote_literal(v_user_cliente_id) || '::uuid';
    END IF;
    
    v_sql_query := format(
        'WITH updated AS (
            UPDATE %I.%I SET %s %s RETURNING *
        )
        SELECT row_to_json(updated.*)::jsonb FROM updated',
        schema_name, table_name, v_set_clauses, v_where_clause
    );
    
    EXECUTE v_sql_query INTO v_result;
    
    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Registro não encontrado ou sem permissão para atualizar';
    END IF;
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao atualizar: %', SQLERRM;
END;
$$;

-- =============================================
-- FUNÇÃO 4: DELETE_ENTITY_DATA (Deletar dados)
-- =============================================
CREATE OR REPLACE FUNCTION public.delete_entity_data(
    schema_name TEXT,
    table_name TEXT,
    id_param TEXT,
    empresa_id_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
DECLARE
    v_affected_rows INTEGER;
    v_sql_query TEXT;
    v_has_empresa_id BOOLEAN;
    v_where_clause TEXT;
    v_user_cliente_id UUID;
BEGIN
    -- Verificar permissão
    IF NOT public.check_access_permission(schema_name, table_name, 'delete') THEN
        RAISE EXCEPTION 'Acesso negado para deletar em %.%', schema_name, table_name;
    END IF;
    
    SELECT public.get_user_cliente_id() INTO v_user_cliente_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = schema_name
        AND c.table_name = delete_entity_data.table_name
        AND c.column_name = 'empresa_id'
    ) INTO v_has_empresa_id;
    
    v_where_clause := 'WHERE id = ' || quote_literal(id_param) || '::uuid';
    
    IF v_has_empresa_id AND empresa_id_param IS NOT NULL THEN
        v_where_clause := v_where_clause || ' AND empresa_id = ' || quote_literal(empresa_id_param) || '::uuid';
    END IF;
    
    -- Filtro por cliente se não for super_admin
    IF NOT public.is_super_admin() AND v_user_cliente_id IS NOT NULL THEN
        v_where_clause := v_where_clause || ' AND cliente_id = ' || quote_literal(v_user_cliente_id) || '::uuid';
    END IF;
    
    v_sql_query := format('DELETE FROM %I.%I %s', schema_name, table_name, v_where_clause);
    
    EXECUTE v_sql_query;
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
    RETURN v_affected_rows > 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao deletar: %', SQLERRM;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.check_access_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_entity_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_entity_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_entity_data TO authenticated;