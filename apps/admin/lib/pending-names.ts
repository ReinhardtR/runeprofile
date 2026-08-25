// Client-safe half of the pending-names helpers; DB access lives in
// `pending-names.server.ts`.

/** Days without a sync after which a name holder counts as inactive. */
export const STALE_HOLDER_DAYS = 30;

export type PendingNameRow = {
  id: string;
  username: string;
  pendingUsername: string;
  updatedAt: string;
  holderUsername: string | null;
  holderUpdatedAt: string | null;
};

export function isStaleHolder(holderUpdatedAt: string | null): boolean {
  if (!holderUpdatedAt) return false;
  return (
    Date.now() - new Date(holderUpdatedAt).getTime() >=
    STALE_HOLDER_DAYS * 86400000
  );
}
