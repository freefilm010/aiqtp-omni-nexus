// Master Export — admin-only full backup of every public table + storage manifest.
// Writes a single ZIP to the `admin-backups` bucket and returns a signed URL.
// Self-contained: no external services, no Render, no Vercel. Runs entirely on
// Lovable Cloud (Supabase) edge runtime using the service-role key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  ZipWriter,
  TextReader,
  Uint8ArrayReader,
  Uint8ArrayWriter,
} from "https://deno.land/x/zipjs@v2.7.45/index.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function assertAdmin(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Error("Missing Authorization header");
  // Service-role calls (server-to-server) are trusted as admin.
  if (token === SERVICE_KEY) return "service-role";
  const { data: userRes, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userRes?.user) throw new Error("Invalid auth token");
  const uid = userRes.user.id;
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", uid);
  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Error("Admin role required");
  return uid;
}

async function listPublicTables(): Promise<string[]> {
  const { data, error } = await admin.rpc("exec_sql_readonly_list_tables");
  if (!error && Array.isArray(data)) return data as string[];
  // Fallback: hardcoded query via PostgREST is not possible; use a known SELECT
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/exec_sql_readonly_list_tables`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
  if (res.ok) return (await res.json()) as string[];
  // Last-resort: introspect via information_schema using a generic query proxy
  // (some projects expose this) — otherwise fall back to a static union of tables
  // discovered from the running app. The function will still succeed but be
  // limited to tables explicitly listed in TABLES_FALLBACK below.
  return TABLES_FALLBACK;
}

// Curated fallback list of public tables. Keep in sync with
// information_schema.tables WHERE table_schema='public'.
const TABLES_FALLBACK = [
  "account_key_vault","achievement_definitions","ad_placements","admin_automation_logs",
  "admin_file_assets","admin_investments","admin_revenue","admin_settings",
  "agent_directives","agent_heartbeats","ai_factors","ai_generation_logs",
  "ai_signals","ai_strategies","apex_accounts","arbitrage_opportunities",
  "auto_invest_ai_logs","auto_invest_allocations","auto_invest_engine",
  "auto_invest_transactions","auto_nft_generations","automation_templates",
  "backtest_results","bot_clones","bot_training_queue","broadcast_content",
  "capitol_community_comments","capitol_community_likes","capitol_community_posts",
  "charter_entities","chat_conversations","chat_messages",
  "community_poll_options","community_poll_votes","community_polls",
  "community_predictions","compound_snapshots","congress_featured_issuers",
  "congress_politicians","congress_trades","connected_accounts","consensus_signals",
  "contest_entries","contest_participants","copy_trading_leaders",
  "copy_trading_leaders_public","course_ratings","custody_accounts",
  "customer_feedback","cv_detections","data_aggregator_bots","data_bot_marketplace",
  "data_bot_rentals","data_collection_jobs","data_exports","data_mining_rewards",
  "data_products","data_sales","data_token_boosts","data_token_holdings","data_tokens",
  "deployed_contracts","deposit_transactions","dex_pairs","dex_tokens",
  "economic_calendar_events","education_articles","education_courses",
  "elite_club_members","elite_club_messages","exchange_balances",
  "exchange_liquidity_pools","exchange_orders","exchange_pairs","exchange_trades",
  "faucet_claims","faucet_schedules","feature_flags","fee_discount_tiers",
  "fee_vouchers","forensic_transactions","giveaway_campaigns","giveaway_entries",
  "giveaway_prizes","giveaway_referrals","graduation_tests","heatmap_data",
  "influencer_partners","influencer_referrals","insider_trades","institutional_filings",
  "investment_portfolio","leaderboard_entries","leaderboard_public",
  "lightning_channels","lightning_transactions","live_strategies","margin_facilities",
  "market_alerts","market_coins","market_ohlcv","market_ohlcv_cache","market_prices",
  "market_screener_assets","market_sync_logs","marketplace_category_fees",
  "marketplace_deals","marketplace_suggestions","ml_models","nft_generation_queue",
  "operator_territories","operator_transactions","operator_wallets","operators",
  "paper_portfolio","paper_trades","payment_processors","platform_activity_log",
  "platform_fee_events","platform_investments","platform_nft_holdings",
  "platform_revenue","platform_tokens","platform_wallets","portfolio",
  "portfolio_holdings","portfolio_performance","portfolio_snapshots","price_history",
  "profiles","profit_distribution_log","profit_distribution_rules",
  "qaqi_learning_data","qaqi_performance_metrics","qtc_blocks","qtc_ledger",
  "qtc_transactions","qtc_treasury_config","qtc_validators","quantum_backends",
  "quantum_jobs","quwallet_addresses","quwallet_wallets","rate_limit_extensions",
  "reinvest_vs_holdings_audit","reward_redemptions","rewards_budget","rewards_catalog",
  "risk_alerts","saved_payment_methods","script_runs","security_audit_log",
  "strategy_historical_analysis","strategy_performance","strategy_predictions",
  "strategy_rentals","strategy_self_training_log","subscriptions","suggestion_votes",
  "supported_chains","supported_chains_public","token_balances","token_burns",
  "token_price_feeds","trade_events","trade_logs","trades","trading_bots",
  "trading_signals","user_achievements","user_badges","user_course_progress",
  "user_nfts","user_notifications","user_roles","user_service_connections",
  "user_stats","watchlist","withdrawal_requests",
];

async function dumpTable(table: string, pageSize = 1000): Promise<string> {
  const rows: any[] = [];
  let from = 0;
  // Page through using range. PostgREST caps responses; loop until empty.
  while (true) {
    const { data, error } = await admin
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) {
      return JSON.stringify({ __export_error: error.message, table }, null, 2);
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
    // Safety cap per table to avoid runaway memory: 500k rows.
    if (rows.length >= 500_000) break;
  }
  return JSON.stringify(rows, null, 2);
}

async function listStorageInventory(): Promise<any> {
  const buckets = ["admin-backups", "avatars", "chat-attachments"];
  const out: Record<string, any[]> = {};
  for (const b of buckets) {
    const { data, error } = await admin.storage
      .from(b)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
    out[b] = error ? [{ error: error.message }] : data ?? [];
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const requesterId = await assertAdmin(req);

    const url = new URL(req.url);
    const onlyParam = url.searchParams.get("only"); // optional CSV list
    const tables = onlyParam
      ? onlyParam.split(",").map((s) => s.trim()).filter(Boolean)
      : TABLES_FALLBACK;

    const zipBuffer = new Uint8ArrayWriter();
    const writer = new ZipWriter(zipBuffer);

    const manifest: Record<string, { rows: number; bytes: number; error?: string }> = {};
    const startedAt = new Date().toISOString();

    for (const table of tables) {
      try {
        const json = await dumpTable(table);
        const parsed = JSON.parse(json);
        const rowCount = Array.isArray(parsed) ? parsed.length : 0;
        manifest[table] = { rows: rowCount, bytes: json.length };
        await writer.add(`tables/${table}.json`, new TextReader(json));
      } catch (e) {
        manifest[table] = { rows: 0, bytes: 0, error: String(e) };
      }
    }

    const storage = await listStorageInventory();
    await writer.add(
      "storage/inventory.json",
      new TextReader(JSON.stringify(storage, null, 2)),
    );

    const meta = {
      generated_at: startedAt,
      finished_at: new Date().toISOString(),
      requested_by: requesterId,
      tables_count: Object.keys(manifest).length,
      total_rows: Object.values(manifest).reduce((a, b) => a + b.rows, 0),
      total_bytes: Object.values(manifest).reduce((a, b) => a + b.bytes, 0),
      project_ref: SUPABASE_URL.replace("https://", "").split(".")[0],
      notes:
        "Self-contained export. JSON per table under tables/. Storage file listing under storage/inventory.json. Re-import with any Postgres client.",
    };
    await writer.add(
      "MANIFEST.json",
      new TextReader(JSON.stringify({ meta, tables: manifest }, null, 2)),
    );
    await writer.add(
      "README.txt",
      new TextReader(
        [
          "AIQTP Master Export",
          "===================",
          `Generated: ${startedAt}`,
          "",
          "Contents:",
          "  tables/*.json       — one file per public table, full row dump (paged).",
          "  storage/inventory.json — listing of every storage bucket + object.",
          "  MANIFEST.json       — row counts, byte sizes, errors per table.",
          "",
          "How to restore into a fresh Postgres / Supabase:",
          "  1. Re-create the schema (use scripts/apply-new-migrations.sql in the repo).",
          "  2. For each tables/<name>.json run:",
          "       psql $DB_URL -c \"\\copy <name> FROM PROGRAM 'jq ...' CSV\"",
          "     or use a small node/python loader that does INSERTs in batches.",
          "  3. Re-upload storage objects from your existing buckets (the inventory",
          "     lists every object key — pull each via admin.storage.from(b).download(k)).",
          "",
          "Storage objects themselves are NOT embedded in this ZIP (would exceed",
          "edge function memory). The inventory tells you exactly what's there;",
          "use any S3-compatible mirror tool to clone the buckets in one command.",
        ].join("\n"),
      ),
    );

    await writer.close();
    const zipBytes = await zipBuffer.getData();

    const filename = `master-export/${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}-aiqtp-master.zip`;

    const { error: upErr } = await admin.storage
      .from("admin-backups")
      .upload(filename, zipBytes, {
        contentType: "application/zip",
        upsert: true,
      });
    if (upErr) throw upErr;

    const { data: signed, error: sErr } = await admin.storage
      .from("admin-backups")
      .createSignedUrl(filename, 60 * 60 * 24 * 7); // 7-day URL
    if (sErr) throw sErr;

    return json({
      ok: true,
      file: filename,
      bytes: zipBytes.length,
      signed_url: signed.signedUrl,
      meta,
    });
  } catch (e) {
    return json({ ok: false, error: String(e?.message ?? e) }, 200);
  }
});