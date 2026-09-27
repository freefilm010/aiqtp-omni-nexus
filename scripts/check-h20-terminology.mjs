import { execFileSync } from "node:child_process";

const prohibited = [
  "guaranteed return", "guaranteed profit", "guaranteed income", "risk-free",
  "guaranteed liquidity", "guaranteed redemption", "guaranteed withdrawal",
  "ownership of water", "water-backed token", "government approved",
  "legally approved", "tax deductible", "tax free", "registered charity",
  "charitable donation", "security-approved", "insured investment", "guaranteed royalty",
];
let output = "";
try {
  output = execFileSync("rg", ["-n", "-i", "--glob", "!terminology.ts", "--glob", "!*.test.*", prohibited.join("|"), "src/pages/H20ReservePage.tsx", "src/components/admin/H20Governance.tsx"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
} catch (error) {
  if (error?.status !== 1) throw error;
}
if (output.trim()) {
  console.error("Unsupported H20 terminology found:\n" + output);
  process.exit(1);
}
