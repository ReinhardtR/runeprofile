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
