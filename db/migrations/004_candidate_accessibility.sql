ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS accessibility jsonb
  CHECK (accessibility IS NULL OR jsonb_typeof(accessibility) = 'object');
