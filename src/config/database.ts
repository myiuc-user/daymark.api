import { Client } from 'pg';

export async function createDatabaseIfNotExists() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  try {
    await client.connect();
    const dbName = process.env.DB_NAME || 'daymark';
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database ${dbName} created`);
    }
  } catch (error) {
    console.error('Error creating database:', error instanceof Error ? error.message : String(error));
  } finally {
    await client.end();
  }
}
