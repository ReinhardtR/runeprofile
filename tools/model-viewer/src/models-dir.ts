export type ModelFile = {
  name: string;
  bytes: number;
  /** Epoch milliseconds, newest first in {@link listModels}. */
  modified: number;
};

export type ModelListing = {
  /** The directory the server actually resolved, useful when none was given. */
  dir: string;
  files: ModelFile[];
};

const STORAGE_KEY = "runeprofile-models-dir";

/** The directory last used, or empty to let the server pick its default. */
export function storedDir(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    // Private browsing and similar can refuse storage; not worth failing over.
    return "";
  }
}

export function storeDir(dir: string): void {
  try {
    if (dir) {
      localStorage.setItem(STORAGE_KEY, dir);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Reads the timestamp out of a dump's name, which ::rpmodel writes as
 * {@code player-yyyyMMdd-HHmmss.glb}. Preferred over the file's own mtime
 * because it is what the command reported in game, so the two line up when
 * several dumps were taken in quick succession.
 */
function stampOf(name: string): Date | null {
  const match = /-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\./.exec(name);
  if (!match) {
    return null;
  }
  const [, year, month, day, hour, minute, second] = match.map(Number) as number[];
  const date = new Date(year!, month! - 1, day!, hour!, minute!, second!);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Time alone for today's dumps, date and time for older ones. */
export function formatStamp(name: string): string | null {
  const date = stampOf(name);
  if (!date) {
    return null;
  }
  const time = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  return sameDay
    ? time
    : `${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })} ${time}`;
}

export async function listModels(dir: string): Promise<ModelListing> {
  const response = await fetch(`/api/models?dir=${encodeURIComponent(dir)}`);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? `Could not list ${body.dir ?? dir}`);
  }
  return body as ModelListing;
}

/**
 * Fetches one model as a File, so it takes the same path through the loader as
 * a file picked by hand or dropped on the page.
 */
export async function fetchModel(dir: string, name: string): Promise<File> {
  const response = await fetch(
    `/api/model?dir=${encodeURIComponent(dir)}&file=${encodeURIComponent(name)}`,
  );
  if (!response.ok) {
    throw new Error(`Could not read ${name}`);
  }
  return new File([await response.arrayBuffer()], name);
}
