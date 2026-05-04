#!/usr/bin/env node
/**
 * apply-migrations.js
 * Applies all pending SQL migrations to Supabase using the service role key.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/apply-migrations.js
 *
 * Or with access token (PAT from supabase.com/dashboard/account/tokens):
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-migrations.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'rueaxiyvseaxkysnoock';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SERVICE_ROLE_KEY && !ACCESS_TOKEN) {
  console.error('Error: set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

const MIGRATION_FILES = [
  '20260504120000_revenue_infrastructure.sql',
  '20260504130000_staking_schema.sql',
  '20260504140000_performance_indexes.sql',
  '20260504150000_faucet_rate_limit.sql',
  '20260504160000_token_approval_and_distribution.sql',
  '20260504170000_automation_crons.sql',
];

async function runSQL(sql) {
  if (ACCESS_TOKEN) {
    // Use Management API (requires personal access token)
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      }
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Management API error ${res.status}: ${body}`);
    }
    return res.json();
  } else {
    // Use REST API rpc (requires service role key)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    });
    if (!res.ok) {
      // Fallback: try pg REST
      const body = await res.text();
      throw new Error(`REST API error ${res.status}: ${body}`);
    }
    return res.json();
  }
}

async function main() {
  console.log('Applying migrations to', SUPABASE_URL);
  for (const file of MIGRATION_FILES) {
    const path = join(__dirname, '..', 'supabase', 'migrations', file);
    let sql;
    try {
      sql = readFileSync(path, 'utf-8');
    } catch {
      console.warn(`  SKIP  ${file} (file not found)`);
      continue;
    }
    process.stdout.write(`  Applying ${file}... `);
    try {
      await runSQL(sql);
      console.log('OK');
    } catch (err) {
      console.log('FAILED');
      console.error('  ', err.message);
    }
  }
  console.log('Done.');
}

main().catch(console.error);
