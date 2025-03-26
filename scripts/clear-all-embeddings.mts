#!/usr/bin/env tsx

import { db } from "@/db/db";
import { docsTable } from '@/db/schema';
import { isNotNull } from 'drizzle-orm';

const result = await db
    .update(docsTable)
    .set({
        embedding: null
    }).where(isNotNull(docsTable.embedding));

console.log(`Cleared ${result.rowsAffected} embeddings`);