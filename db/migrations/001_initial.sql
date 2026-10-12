CREATE TABLE IF NOT EXISTS rides (
 id text PRIMARY KEY, host text NOT NULL, station text NOT NULL,
 departure bigint NOT NULL, place text NOT NULL, capacity integer NOT NULL CHECK (capacity = 4),
 fare integer, note text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'open', created bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rides_station_departure ON rides(station, departure);
CREATE INDEX IF NOT EXISTS idx_rides_host_created ON rides(host, created);
CREATE TABLE IF NOT EXISTS members (
 ride_id text NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
 user_id text NOT NULL, nickname text NOT NULL, joined bigint NOT NULL,
 PRIMARY KEY (ride_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
CREATE TABLE IF NOT EXISTS messages (
 id text PRIMARY KEY, ride_id text NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
 user_id text NOT NULL, nickname text NOT NULL, body text NOT NULL, created bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_ride_created ON messages(ride_id, created);
CREATE TABLE IF NOT EXISTS visitors (id text PRIMARY KEY, expires bigint NOT NULL);
CREATE TABLE IF NOT EXISTS accounts (
 id text PRIMARY KEY, username text NOT NULL UNIQUE, pin_hash text NOT NULL,
 salt text NOT NULL, created bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS account_sessions (
 token_hash text PRIMARY KEY, account_id text NOT NULL REFERENCES accounts(id), expires bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_account_sessions_account ON account_sessions(account_id);
CREATE TABLE IF NOT EXISTS auth_attempts (
 key text PRIMARY KEY, attempts integer NOT NULL, expires bigint NOT NULL
);
