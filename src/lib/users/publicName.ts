const REAL_NAME_PATTERN = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/;

interface SafePublicNameOptions {
  username?: string | null;
  displayName?: string | null;
  fallbackId?: string | null;
  fallbackRank?: number | null;
}

export function looksLikeRealName(value?: string | null): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return REAL_NAME_PATTERN.test(trimmed);
}

export function toSafePublicName({
  username,
  displayName,
  fallbackId,
  fallbackRank,
}: SafePublicNameOptions): string {
  const safeUsername = username?.trim();
  if (safeUsername) return safeUsername;

  const safeDisplayName = displayName?.trim();
  if (safeDisplayName && !looksLikeRealName(safeDisplayName)) {
    return safeDisplayName;
  }

  if (fallbackId) return `User ${fallbackId.slice(0, 6)}`;
  if (fallbackRank) return `Player #${fallbackRank}`;
  return "Platform User";
}