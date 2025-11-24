import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PWD?.replace(/"/g, ''),
  database: process.env.DATABASE_NAME
};

// Construct DATABASE_URL for Prisma
const encodedPassword = encodeURIComponent(dbConfig.password);
process.env.DATABASE_URL = `postgresql://${dbConfig.user}:${encodedPassword}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
process.env.DIRECT_URL = process.env.DATABASE_URL;

export default dbConfig;