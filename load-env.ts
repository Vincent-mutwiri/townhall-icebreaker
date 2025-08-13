import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
}

export const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}
