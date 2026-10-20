export type FrontpageEvent = {
  name: string;
  // What the Collection Log board races to complete, in display order.
  clogItemIds: number[];
  // The raid's unique drops, in display order. The Purples board ranks by
  // the total collected. While empty the event runs in teaser mode, so
  // filling them in at launch is what flips it live.
  purpleItemIds: number[];
  // ISO timestamp for the teaser countdown; null hides it.
  launchesAt: string | null;
  // Linked from the hero's "Watch the trailer" button.
  trailerUrl: string | null;
};

// The themed event the frontpage hero shows, or null for the default hero.
export const FRONTPAGE_EVENT: FrontpageEvent | null = {
  name: "The Fractured Archive",
  // Orion and the purples.
  clogItemIds: [34646, 34717, 34681, 34727, 34719, 34679],
  // Obligator, Ascension crossbows, Zorya's tome, Rondache, Horn of Bran.
  purpleItemIds: [34717, 34681, 34727, 34719, 34679],
  launchesAt: "2026-10-20T11:00:00Z",
  trailerUrl: "https://www.youtube.com/watch?v=loH7UPjhWyw",
};

export function isFrontpageEventLive(event: FrontpageEvent): boolean {
  return event.purpleItemIds.length > 0;
}
