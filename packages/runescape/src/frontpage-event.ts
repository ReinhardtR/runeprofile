export type FrontpageEvent = {
  name: string;
  // The raid's unique drops, in display order. Both leaderboards rank by
  // these: the race to collect every one, and the most collected in total.
  // While empty the event runs in teaser mode, so filling them in at launch
  // is what flips it live.
  purpleItemIds: number[];
  // ISO timestamp for the teaser countdown; null hides it.
  launchesAt: string | null;
  // Linked from the hero's "Watch the trailer" button.
  trailerUrl: string | null;
};

// The themed event the frontpage hero shows, or null for the default hero.
export const FRONTPAGE_EVENT: FrontpageEvent | null = {
  name: "The Fractured Archive",
  purpleItemIds: [],
  // Assumes the usual 11:30 UK game update time (BST, so 10:30 UTC).
  launchesAt: "2026-10-20T10:30:00Z",
  trailerUrl: "https://www.youtube.com/watch?v=loH7UPjhWyw",
};

export function isFrontpageEventLive(event: FrontpageEvent): boolean {
  return event.purpleItemIds.length > 0;
}
