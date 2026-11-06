CREATE TABLE candidate_profiles (
  class_id text NOT NULL CHECK (class_id IN ('A', 'B', 'C')),
  candidate_key text NOT NULL CHECK (candidate_key <> ''),
  profile jsonb NOT NULL CHECK (jsonb_typeof(profile) = 'object'),
  final_grade double precision CHECK (final_grade BETWEEN 0 AND 10),
  teacher_highlights text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (class_id, candidate_key)
);
