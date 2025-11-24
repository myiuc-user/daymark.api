import { Client } from 'pg';

export async function createDatabaseIfNotExists() {
  const dbName = process.env.DATABASE_NAME || 'daymark';
  
  // Connect to postgres database to create our target database
  const adminClient = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PWD?.replace(/"/g, ''),
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await adminClient.connect();
    
    // Check if database exists
    const result = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    
    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully`);
    } else {
      console.log(`✅ Database "${dbName}" already exists`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await adminClient.end();
  }
}