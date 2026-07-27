import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listStrategiesTool from "./tools/list-strategies";
import getPortfolioTool from "./tools/get-portfolio";

// Direct Supabase issuer is required (not the .lovable.cloud proxy).
// VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time so this stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "aiqtp-mcp",
  title: "AIQTP Omni-Nexus",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in AIQTP user. Use `whoami` to verify connectivity, `list_strategies` for the user's AI trading strategies, and `get_portfolio` for their holdings. All tools act as the signed-in user under RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listStrategiesTool, getPortfolioTool],
});