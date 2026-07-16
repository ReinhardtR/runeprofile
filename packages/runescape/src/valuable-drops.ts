/**
 * Items that RuneProfile always records as valuable drops, using a fixed value
 * in place of the live Grand Exchange price.
 *
 * Many of these are untradeable or have a low/no GE price, so relying on the GE
 * price alone would let them slip under the valuable-drop threshold and go
 * untracked. The assigned value mirrors the item's in-game clan broadcast worth,
 * which keeps them above the threshold and gives a sensible number to display.
 *
 * This list is served to the plugin through the manifest, so new items can be
 * added here and picked up without shipping a plugin update.
 */
export type SpecialValuableDrop = {
  itemId: number;
  /** Fixed value in gp used instead of the GE price. */
  value: number;
  /** Item name — for readability here only, not sent to the plugin. */
  name: string;
};

export const SPECIAL_VALUABLE_DROPS: SpecialValuableDrop[] = [
  // Desert Treasure II vestiges
  { itemId: 28279, value: 5_000_000, name: "Bellator vestige" },
  { itemId: 28281, value: 5_000_000, name: "Magus vestige" },
  { itemId: 28283, value: 5_000_000, name: "Venator vestige" },
  { itemId: 28285, value: 5_000_000, name: "Ultor vestige" },

  // Araxxor
  { itemId: 29790, value: 10_000_000, name: "Noxious point" },
  { itemId: 29792, value: 10_000_000, name: "Noxious blade" },
  { itemId: 29794, value: 10_000_000, name: "Noxious pommel" },
  { itemId: 29799, value: 50_000_000, name: "Araxyte fang" },

  // Doom of Mokhaiotl
  { itemId: 31109, value: 75_000_000, name: "Mokhaiotl cloth" },

  // Maggot King
  { itemId: 33634, value: 50_000_000, name: "Elder venator fang" },
];
