import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const dbConfig = {
  host: process.env.DATABASE_HOST || '157.180.12.145',
  port: parseInt(process.env.DATABASE_PORT || '5433'),
  user: process.env.DATABASE_USER || 'daymark',
  password: process.env.DATABASE_PWD?.replace(/"/g, '') || 'DaymarkSecure2024Abc9',
  database: process.env.DATABASE_NAME || 'daymark'
};

// Construct DATABASE_URL for Prisma
const encodedPassword = encodeURIComponent(dbConfig.password);
process.env.DATABASE_URL = `postgresql://${dbConfig.user}:${encodedPassword}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
process.env.DIRECT_URL = process.env.DATABASE_URL;

export async function createDatabaseIfNotExists() {
  const adminClient = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    const result = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbConfig.database]
    );
    
    if (result.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`✅ Database "${dbConfig.database}" created successfully`);
    } else {
      console.log(`✅ Database "${dbConfig.database}" already exists`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await adminClient.end();
  }
}

export default dbConfig;
