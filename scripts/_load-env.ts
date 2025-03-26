#!/usr/bin/env tsx

import { loadEnvConfig } from '@next/env'
const projectDir = process.cwd()
const { combinedEnv } = loadEnvConfig(projectDir)

for (const [key, value] of Object.entries(combinedEnv)) {
    console.log(`export ${key}="${(value ?? "").replace(/"/g, '\\"')}"`)
}