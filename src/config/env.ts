import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'brothers_furniture',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',
  nodeEnv: process.env.NODE_ENV || 'development',
}
