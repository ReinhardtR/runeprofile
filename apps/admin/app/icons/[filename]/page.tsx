import fs from "fs";
import { notFound } from "next/navigation";
import path from "path";

import IconViewerClient from "./IconViewerClient";

interface PageProps {
  params: {
    filename: string;
  };
}

async function getIconFile(
  filename: string,
): Promise<Record<string, string> | null> {
  try {
    const decodedFilename = decodeURIComponent(filename);
    const assetsPath = path.join(process.cwd(), "../web/src/assets");
    const filePath = path.join(assetsPath, decodedFilename);

    // Security check - ensure file is within assets directory
    const resolvedPath = path.resolve(filePath);
    const resolvedAssetsPath = path.resolve(assetsPath);

    if (!resolvedPath.startsWith(resolvedAssetsPath)) {
      return null;
    }

    if (!fs.existsSync(filePath) || !decodedFilename.endsWith(".json")) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent) as Record<string, string>;
  } catch (error) {
    console.error(`Failed to load icon file ${filename}:`, error);
    return null;
  }
}

export default async function IconViewerPage({ params }: PageProps) {
  const icons = await getIconFile(params.filename);

  if (!icons) {
    notFound();
  }

  return (
    <IconViewerClient
      fileName={decodeURIComponent(params.filename)}
      icons={icons}
    />
  );
}
