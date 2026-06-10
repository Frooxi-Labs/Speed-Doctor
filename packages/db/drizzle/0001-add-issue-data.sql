ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS issue_data text NOT NULL DEFAULT '{}';

TRUNCATE TABLE recommendations, issues CASCADE;
