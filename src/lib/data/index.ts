/**
 * Data Access Layer — central barrel export.
 *
 * Usage:
 *   import { portfolioService, marketService, tokenService, faucetService } from "@/lib/data";
 */
export * as portfolioService from "./portfolio.service";
export * as marketService from "./market.service";
export * as tokenService from "./token.service";
export * as faucetService from "./faucet.service";
export type * from "./types";
