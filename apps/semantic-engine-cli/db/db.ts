import { drizzle } from 'drizzle-orm/libsql';

export const db = drizzle(`file:${process.env.DATASET_ID}.sqlite`!);