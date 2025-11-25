-- Create user if not exists
DO
$do$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'daymark') THEN
    CREATE USER daymark WITH PASSWORD 'DaymarkSecure2024!@#';
  END IF;
END
$do$;

-- Grant privileges
ALTER USER daymark CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE daymark TO daymark;