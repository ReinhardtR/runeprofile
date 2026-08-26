// Archived/placeholder usernames, shared by the API's username resolution and
// the admin tools so the convention cannot drift.
//
// The suffix is random — never derived from the account id, which doubles as
// the profile's write credential and must not be exposed in a public username.
// At 16 characters the placeholder is longer than any real display name
// (max 12 chars), so it can never collide with or be claimed by one.
export function placeholderUsername(): string {
  return "archive_" + crypto.randomUUID().replaceAll("-", "").slice(0, 8);
}

export function isPlaceholderUsername(username: string): boolean {
  return username.startsWith("archive_");
}

// A row that has not synced for this long is treated as no longer owning its
// name: the plugin reports the actual in-game name, so a claimant reporting a
// held name proves the holder has either renamed or gone. This window only
// has to cover the lag between a holder renaming and their next login.
export const STALE_HOLDER_DAYS = 30;

export function isStaleHolder(
  lastSyncedAt: string | Date | null,
  now: number = Date.now(),
): boolean {
  if (!lastSyncedAt) return false;
  return now - new Date(lastSyncedAt).getTime() >= STALE_HOLDER_DAYS * 86400000;
}
