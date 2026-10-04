export const H20_CORE_DISCLOSURE = `H20 is a serial-numbered, indivisible blockchain asset intended for use within the H20 Global Drinking Water Protection ecosystem. Acquisition or ownership of H20 does not by itself represent ownership of physical water, water rights, equity in AIQTP.com, debt, or a guaranteed financial return. Market value, market availability, resale opportunities, and liquidity may change or may be unavailable.

A designated portion of qualifying primary-sale proceeds is intended for the published H20 Water-Impact Program. The legal, tax, accounting, and organizational characterization of individual distributions depends on the applicable recipient, transaction, agreement, and jurisdiction.

No representation should be understood as a guarantee of profit, liquidity, tax treatment, project outcome, or regulatory status.`;

export const H20_LIQUIDITY_DISCLOSURE =
  "The matching and initial liquidity-support reserve is limited to available funds and does not guarantee token price, trading volume, market liquidity, redemption, resale, or withdrawal.";

export const H20_TAX_DISCLOSURE =
  "An H20 purchase is an exchange for a blockchain asset, not a gift. A separate transfer is recorded as a gift only when the transferor receives less than full consideration in money or money's worth. No tax benefit, exempt status, or IRS approval is represented. Gift-tax filing responsibility and all other tax treatment depend on the facts, parties, and applicable jurisdiction; consult a qualified tax adviser.";

export const H20_ALLOCATIONS = [
  { code: "WATER_IMPACT_ALLOCATION", label: "Water-Impact Program Allocation", percent: 90 },
  { code: "ADMINISTRATIVE_ALLOCATION", label: "AIQTP.com Administrative Allocation", percent: 5 },
  { code: "MATCHING_LIQUIDITY_ALLOCATION", label: "Matching/Liquidity-Support Allocation", percent: 5 },
] as const;

export const H20_VERIFICATION_STATUSES = [
  "NOT_VERIFIED",
  "PENDING_VERIFICATION",
  "UNDER_REVIEW",
  "VERIFIED",
  "VERIFICATION_EXPIRED",
  "VERIFICATION_FAILED",
] as const;

export const H20_APPROVAL_STATUSES = [
  "PENDING_REVIEW",
  "ADMIN_APPROVED",
  "PROFESSIONAL_REVIEW_COMPLETED",
  "EXTERNAL_CERTIFICATION_RECEIVED",
  "REGULATORY_STATUS_NOT_DETERMINED",
  "REJECTED",
  "RETRACTED",
] as const;

export const H20_CLAIM_CATEGORIES = [
  "LEGAL_STATUS",
  "RECIPIENT_STATUS",
  "MAINNET_STATUS",
  "AUDIT_STATUS",
  "COMPLIANCE_STATUS",
  "FUND_AMOUNT",
  "DISTRIBUTION_TOTAL",
  "ROYALTY_TOTAL",
  "SUPPLY_INFORMATION",
  "WATER_PROJECT_RESULT",
  "PUBLIC_DISCLOSURE",
] as const;

export const H20_RECIPIENT_CLASSIFICATIONS = [
  "WATER_IMPACT_RECIPIENT",
  "GOVERNMENT_ENTITY",
  "SERVICE_PROVIDER",
  "OTHER_APPROVED_WATER_IMPACT_ENTITY",
] as const;

export const H20_DISTRIBUTION_TYPES = [
  "GRANT",
  "PROJECT_PAYMENT",
  "SERVICE_PAYMENT",
  "INFRASTRUCTURE_FUNDING",
  "REIMBURSEMENT",
  "OTHER_APPROVED_DISTRIBUTION",
] as const;

export function formatH20Code(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
