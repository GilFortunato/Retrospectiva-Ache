CREATE TABLE portal_users (
  email text PRIMARY KEY CHECK (email = lower(email)),
  password_hash text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  credential_version integer NOT NULL DEFAULT 1,
  attempts integer NOT NULL DEFAULT 0,
  attempts_until timestamptz NOT NULL DEFAULT '-infinity'
);

CREATE TABLE portal_sessions (
  token_hash text PRIMARY KEY,
  email text NOT NULL REFERENCES portal_users(email) ON DELETE CASCADE,
  credential_version integer NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX portal_sessions_email_idx ON portal_sessions (email);
