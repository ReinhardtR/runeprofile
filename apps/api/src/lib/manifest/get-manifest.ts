import { COLLECTION_LOG_TABS } from "@runeprofile/runescape";

export type Manifest = {
  version: number;
  pages: Record<string, string[]>;
};

export function getManifest(): Manifest {
  const pages: Record<string, string[]> = {};

  for (const tab of COLLECTION_LOG_TABS) {
    for (const page of tab.pages) {
      pages[page.name] = page.aliases || [];
    }
  }

  return {
    version: 1,
    pages,
  };
}
