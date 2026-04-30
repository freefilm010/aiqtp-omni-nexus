const NAME_PART_PATTERN = /^[A-Za-z][A-Za-z'\-]+$/;

interface SafePublicNameOptions {
  username?: string | null;
  displayName?: string | null;
  fallbackId?: string | null;
  fallbackRank?: number | null;
}

export function looksLikeRealName(value?: string | null): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;

  return parts.every((part) => NAME_PART_PATTERN.test(part));
}

export function toSafePublicName({
  username,
  displayName,
  fallbackId,
  fallbackRank,
}: SafePublicNameOptions): string {
  const safeUsername = username?.trim();
  if (safeUsername) return safeUsername;

  if (fallbackId) return `User ${fallbackId.slice(0, 6)}`;
  if (fallbackRank) return `Player #${fallbackRank}`;
  return "Platform User";
}