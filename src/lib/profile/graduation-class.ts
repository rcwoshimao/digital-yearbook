const YEAR_PATTERN = /^\d{4}$/;

export function parseGraduationClass(raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  return YEAR_PATTERN.test(value) ? value : null;
}

export function graduationClassValidationError(raw: string): string | null {
  const value = raw.trim();
  if (!value || YEAR_PATTERN.test(value)) {
    return null;
  }
  return "Graduation class must be a 4-digit year (e.g. 2026).";
}
