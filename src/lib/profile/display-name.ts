const MIN_DISPLAY_NAME_LENGTH = 1;
const MAX_DISPLAY_NAME_LENGTH = 80;

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidDisplayName(value: string): boolean {
  const normalized = normalizeDisplayName(value);
  return (
    normalized.length >= MIN_DISPLAY_NAME_LENGTH &&
    normalized.length <= MAX_DISPLAY_NAME_LENGTH
  );
}

export function displayNameValidationMessage(): string {
  return `Names must be ${MIN_DISPLAY_NAME_LENGTH}–${MAX_DISPLAY_NAME_LENGTH} characters.`;
}
