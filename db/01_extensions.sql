-- Enable UUID generation and PostGIS for geographical operations
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
-- CREATE EXTENSION IF NOT EXISTS "pg_cron";  -- Required for scheduled MV refresh (Not available in this image)