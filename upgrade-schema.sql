-- Create function to get table columns
CREATE OR REPLACE FUNCTION get_columns(table_name text)
RETURNS TABLE (column_name text, data_type text) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    a.attname::text as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type
  FROM 
    pg_catalog.pg_attribute a
  WHERE 
    a.attnum > 0 
    AND NOT a.attisdropped
    AND a.attrelid = (SELECT oid FROM pg_catalog.pg_class WHERE relname = table_name);
END;
$$ LANGUAGE plpgsql;

-- Create function to add column if not exists
CREATE OR REPLACE FUNCTION alter_table_add_column(
  table_name text,
  column_name text,
  column_type text
) RETURNS void AS $$
DECLARE
  column_exists integer;
  alter_sql text;
BEGIN
  -- Check if column exists
  SELECT count(*) INTO column_exists
  FROM information_schema.columns 
  WHERE table_name = $1 AND column_name = $2;
  
  -- Add column if it doesn't exist
  IF column_exists = 0 THEN
    alter_sql := format('ALTER TABLE %I ADD COLUMN %I %s', $1, $2, $3);
    EXECUTE alter_sql;
  END IF;
END;
$$ LANGUAGE plpgsql;
