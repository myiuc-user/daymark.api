import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DATABASE_HOST || '157.180.12.145',
  port: parseInt(process.env.DATABASE_PORT || '5433'),
  user: process.env.DATABASE_USER || 'daymark',
  password: process.env.DATABASE_PWD?.replace(/"/g, '') || 'DaymarkSecure2024!@#',
  database: process.env.DATABASE_NAME || 'daymark'
};

// Construct DATABASE_URL for Prisma
const encodedPassword = encodeURIComponent(dbConfig.password);
process.env.DATABASE_URL = `postgresql://${dbConfig.user}:${encodedPassword}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
process.env.DIRECT_URL = process.env.DATABASE_URL;

export default dbConfig;