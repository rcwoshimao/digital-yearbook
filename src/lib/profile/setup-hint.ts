const NEW_PROFILE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const PROFILE_SETUP_HINT_STORAGE_KEY_PREFIX = "yearbook-profile-setup-hint-dismissed";

export function profileSetupHintStorageKey(userId: string): string {
  return `${PROFILE_SETUP_HINT_STORAGE_KEY_PREFIX}:${userId}`;
}

export function isProfileSchoolIncomplete(
  university: string | null | undefined,
  graduationClass: string | null | undefined,
): boolean {
  const school = university?.trim() ?? "";
  const gradClass = graduationClass?.trim() ?? "";
  return !school || !gradClass;
}

export function isRecentProfile(
  createdAt: string | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (!createdAt) {
    return false;
  }
  const createdMs = Date.parse(createdAt);
  if (Number.isNaN(createdMs)) {
    return false;
  }
  return nowMs - createdMs <= NEW_PROFILE_WINDOW_MS;
}

export function shouldPromptProfileSetup(profile: {
  university: string | null | undefined;
  graduation_class: string | null | undefined;
  created_at: string | null | undefined;
}): boolean {
  return (
    isProfileSchoolIncomplete(profile.university, profile.graduation_class) ||
    isRecentProfile(profile.created_at)
  );
}
