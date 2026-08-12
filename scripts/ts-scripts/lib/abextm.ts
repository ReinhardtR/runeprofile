// abextm/osrs-cache (https://github.com/abextm/osrs-cache) is updated by a
// bot ("RuneLite Cache-Code Autoupdater") that fetches straight from
// Jagex's JS5 update servers the same way the game client does, landing a
// commit within minutes of an update. That's much faster than OpenRS2's
// public archive, whose crawl of a fresh cache can take hours to finish
// (see lib/openrs2.ts) - fine for icon rendering, which needs OpenRS2's
// full binary disk store, but an unnecessary delay for the clog/CA/quest
// checks, which only read a handful of cache tables and can do so lazily
// over HTTP against abextm's mirror via @abextm/cache2's FlatCacheProvider
// (see lib/cache.ts).

const REPO = "abextm/osrs-cache";
const BRANCH = "master";

export type AbextmCommit = {
  sha: string;
  message: string;
  date: string;
};

export async function resolveLatestCommit(): Promise<AbextmCommit> {
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/commits?sha=${BRANCH}&per_page=1`,
    {
      headers: process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {},
    },
  );
  if (!response.ok) {
    throw new Error(`GitHub commits API returned ${response.status}`);
  }
  const [commit] = (await response.json()) as Array<{
    sha: string;
    commit: { message: string; author: { date: string } };
  }>;
  if (!commit) {
    throw new Error(`No commits found on ${REPO}#${BRANCH}`);
  }
  return {
    sha: commit.sha,
    message: commit.commit.message,
    date: commit.commit.author.date,
  };
}
