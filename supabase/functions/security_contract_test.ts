import { assertEquals, assertFalse } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("financial edge functions fail closed on missing verification", async () => {
  const zbd = await Deno.readTextFile(new URL("./zbd-wallet/index.ts", import.meta.url));
  assertFalse(zbd.includes("if (zbdWebhookSecret &&"));
  assertEquals(zbd.includes("if (!zbdWebhookSecret || !zbdApiKey)"), true);
  assertEquals(zbd.includes("/charges/${encodeURIComponent(charge.id)}"), true);
});

Deno.test("CCXT browser endpoint rejects private credentials", async () => {
  const ccxt = await Deno.readTextFile(new URL("./ccxt-trading/index.ts", import.meta.url));
  assertFalse(ccxt.includes("apiKey?: string"));
  assertFalse(ccxt.includes("secret?: string"));
  assertEquals(ccxt.includes("Private exchange operations are disabled"), true);
});

Deno.test("QTC explorer exposes only public transaction metadata", async () => {
  const qtc = await Deno.readTextFile(new URL("./qtc-network/index.ts", import.meta.url));
  assertFalse(qtc.includes(".from('qtc_transactions')\n          .select('*')"));
  assertEquals(qtc.includes("function publicTransaction"), true);
});