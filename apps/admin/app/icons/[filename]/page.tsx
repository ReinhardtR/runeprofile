import { getCloudflareContext } from "@opennextjs/cloudflare";
import { notFound } from "next/navigation";

import manifest from "@/lib/generated/game-assets-manifest.json";

import IconViewerClient from "./IconViewerClient";

interface PageProps {
  params: Promise<{
    filename: string;
  }>;
}

async function getIconFile(
  filename: string,
): Promise<Record<string, string> | null> {
  // Allowlist: only files the build-time copy script produced can be read.
  if (!manifest.some((file) => file.name === filename)) {
    return null;
  }

  try {
    if (process.env.NODE_ENV === "development") {
      // Local `next dev`: read the copied file from public/.
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const content = await fs.readFile(
        path.join(process.cwd(), "public/game-assets", filename),
        "utf-8",
      );
      return JSON.parse(content) as Record<string, string>;
    }

    // Deployed Worker: fetch from the static assets binding.
    const { env } = getCloudflareContext();
    if (!env.ASSETS) return null;
    const response = await env.ASSETS.fetch(
      `https://assets.local/game-assets/${encodeURIComponent(filename)}`,
    );
    if (!response.ok) return null;
    return (await response.json()) as Record<string, string>;
  } catch (error) {
    console.error(`Failed to load icon file ${filename}:`, error);
    return null;
  }
}

export default async function IconViewerPage({ params }: PageProps) {
  const { filename } = await params;
  const decodedFilename = decodeURIComponent(filename);
  const icons = await getIconFile(decodedFilename);

  if (!icons) {
    notFound();
  }

  return <IconViewerClient fileName={decodedFilename} icons={icons} />;
}
