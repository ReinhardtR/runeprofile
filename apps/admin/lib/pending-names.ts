// Client-safe half of the pending-names helpers; DB access lives in
// `pending-names.server.ts`.
export { STALE_HOLDER_DAYS, isStaleHolder } from "@runeprofile/runescape";

export type PendingNameRow = {
  id: string;
  username: string;
  pendingUsername: string;
  updatedAt: string;
  holderUsername: string | null;
  holderUpdatedAt: string | null;
};
