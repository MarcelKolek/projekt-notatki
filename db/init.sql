CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    owner_id VARCHAR(100) NOT NULL
);

-- Możesz zainstalować rozszerzenie uuid-ossp lub pgcrypto w Postgresie,
-- aby gen_random_uuid() działało. Jednak w Postgres 13+ pgcrypto jest dostępne:
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";
