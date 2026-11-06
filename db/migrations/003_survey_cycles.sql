CREATE TABLE survey_cycles (
  cycle smallint PRIMARY KEY CHECK (cycle BETWEEN 1 AND 6),
  summary jsonb NOT NULL CHECK (jsonb_typeof(summary) = 'object'),
  comment_groups jsonb NOT NULL CHECK (jsonb_typeof(comment_groups) = 'array')
);
