import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

const stage = process.env.STAGE || 'dev';

dotenv.config({
  path: path.resolve(process.cwd(), `.env.stage.${stage}`),
});

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});
