-- Add submitted_at column to applications table if it doesn't exist
-- This handles the case where the table was created without this column

DO $$ 
BEGIN
    -- Check if submitted_at column doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'applications' 
        AND column_name = 'submitted_at'
    ) THEN
        -- Add the column
        ALTER TABLE public.applications 
        ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        
        -- If created_at exists, copy its values to submitted_at
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'applications' 
            AND column_name = 'created_at'
        ) THEN
            UPDATE public.applications 
            SET submitted_at = created_at 
            WHERE submitted_at IS NULL;
        END IF;
        
        RAISE NOTICE 'Column submitted_at added to applications table';
    ELSE
        RAISE NOTICE 'Column submitted_at already exists in applications table';
    END IF;
END $$;
