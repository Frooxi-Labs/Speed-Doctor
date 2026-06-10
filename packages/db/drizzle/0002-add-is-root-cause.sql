ALTER TABLE issues ADD COLUMN IF NOT EXISTS is_root_cause boolean NOT NULL DEFAULT false;
