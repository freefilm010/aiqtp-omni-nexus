// =============================================================================
// AIQTP sovereign edge-function router.
// Runs inside supabase/edge-runtime on YOUR VPS and serves every function in
// supabase/functions/ at /<function-name>, matching the hosted behaviour
// exactly — so the app needs no code change when you cut over.
// =============================================================================
import { STATUS_CODE } from "https://deno.land/std@0.208.0/http/status.ts";

const FUNCTIONS_ROOT = "/home/deno/functions";
const JWT_SECRET = Deno.env.get("JWT_SECRET");
const VERIFY_JWT = Deno.env.get("VERIFY_JWT") !== "false";

// Functions intentionally reachable without a user JWT (webhooks / public reads).
const PUBLIC_FUNCTIONS = new Set([
  "payments-webhook",
  "onramp-webhook",
  "get-market-prices",
  "binance-prices",
  "stock-market-data",
]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const name = url.pathname.replace(/^\/+/, "").split("/")[0];

  if (!name || name === "health") {
    return json({ status: "ok", runtime: "aiqtp-sovereign-edge" });
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    return json({ error: "Invalid function name" }, STATUS_CODE.BadRequest);
  }

  const servicePath = `${FUNCTIONS_ROOT}/${name}`;
  try {
    await Deno.stat(`${servicePath}/index.ts`);
  } catch {
    return json({ error: `Function not found: ${name}` }, STATUS_CODE.NotFound);
  }

  if (VERIFY_JWT && !PUBLIC_FUNCTIONS.has(name)) {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return json({ error: "Missing authorization header" }, STATUS_CODE.Unauthorized);
    }
  }

  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime;
  try {
    const worker = await runtime.userWorkers.create({
      servicePath,
      memoryLimitMb: 256,
      workerTimeoutMs: 300_000,
      noModuleCache: false,
      envVars: Object.entries(Deno.env.toObject()),
      forceCreate: false,
      cpuTimeSoftLimitMs: 60_000,
      cpuTimeHardLimitMs: 120_000,
      jwtSecret: JWT_SECRET,
    });
    return await worker.fetch(req);
  } catch (error) {
    console.error(`[${name}]`, error);
    return json(
      { error: error instanceof Error ? error.message : "Function boot failed" },
      STATUS_CODE.InternalServerError,
    );
  }
});
