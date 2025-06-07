-- Add missing follow_up_date column to leads table
DO $$
BEGIN
    BEGIN
        ALTER TABLE leads ADD COLUMN follow_up_date TIMESTAMP;
        RAISE NOTICE 'Added follow_up_date column to leads table';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'follow_up_date column already exists in leads table';
    END;

    BEGIN
        ALTER TABLE estimates ADD COLUMN lead_id INTEGER REFERENCES leads(id);
        RAISE NOTICE 'Added lead_id column to estimates table';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'lead_id column already exists in estimates table';
    END;
END
$$;