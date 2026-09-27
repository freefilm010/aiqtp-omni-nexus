export const H20_CORE_DISCLOSURE = `H20 is a serial-numbered, indivisible blockchain asset intended for use within the H20 Global Water Reserve ecosystem. Acquisition or ownership of H20 does not by itself represent ownership of physical water, water rights, equity in AIQTP.com, debt, or a guaranteed financial return. Market value, market availability, resale opportunities, and liquidity may change or may be unavailable.

A designated portion of qualifying primary-sale proceeds is intended for the published H20 Water-Impact Program. The legal, tax, accounting, and organizational characterization of individual distributions depends on the applicable recipient, transaction, agreement, and jurisdiction.

No representation should be understood as a guarantee of profit, liquidity, tax treatment, project outcome, regulatory status, or deductibility.`;

export const H20_LIQUIDITY_DISCLOSURE =
  "The matching and initial liquidity-support reserve is limited to available funds and does not guarantee token price, trading volume, market liquidity, redemption, resale, or withdrawal.";

export const H20_TAX_DISCLOSURE =
  "Tax treatment depends on the nature of the transaction, the recipient, the purchaser or seller, and the applicable jurisdiction.";

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
  "NONPROFIT_ORGANIZATION",
  "CHARITABLE_ORGANIZATION",
  "PUBLIC_BENEFIT_ORGANIZATION",
  "COMMUNITY_ORGANIZATION",
  "WATER_INFRASTRUCTURE_PROJECT",
  "WATER_TESTING_PROJECT",
  "WATER_TREATMENT_PROJECT",
  "RESTORATION_PROJECT",
  "OTHER_APPROVED_WATER_IMPACT_ENTITY",
] as const;

export const H20_DISTRIBUTION_TYPES = [
  "DONATION",
  "GRANT",
  "PROJECT_PAYMENT",
  "SERVICE_PAYMENT",
  "INFRASTRUCTURE_FUNDING",
  "REIMBURSEMENT",
  "OTHER_APPROVED_DISTRIBUTION",
] as const;

export function formatH20Code(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
