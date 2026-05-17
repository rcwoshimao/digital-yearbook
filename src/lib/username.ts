const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeUsername(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(value);
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function parseWriteLinkSlug(value: string) {
  const trimmed = value.trim();
  const pathMatch = trimmed.match(/\/write\/([^/?#]+)/i);

  if (pathMatch?.[1]) {
    return normalizeUsername(pathMatch[1]);
  }

  if (/^@?[a-z0-9_]{3,30}$/i.test(trimmed)) {
    return normalizeUsername(trimmed);
  }

  if (isUuid(trimmed)) {
    return trimmed;
  }

  return null;
}
