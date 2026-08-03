/**
 * Where a player's models live in R2.
 *
 * The same contract the API writes with (apps/api/src/lib/models/keys.ts). Kept
 * in one place here because admin reads, renames and deletes these objects, and
 * three inlined copies of a key scheme is how a rename silently orphans a file.
 */
export const createPlayerModelKey = (username: string) =>
  username.toLowerCase();

export const createPetModelKey = (username: string) =>
  `${username.toLowerCase()}-pet`;
