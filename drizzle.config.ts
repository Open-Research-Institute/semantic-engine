import './scripts/_load-env';

import { defineConfig } from 'drizzle-kit';
export default defineConfig({
    out: './drizzle',
    schema: './db/schema.ts',
    dialect: 'sqlite',
    dbCredentials: {
        url: process.env.DB_URL!,
    },
});