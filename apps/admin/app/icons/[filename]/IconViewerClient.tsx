"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import JSZip from "jszip";
import {
  ArrowLeft,
  Download,
  DownloadIcon,
  ImageIcon,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface IconViewerClientProps {
  fileName: string;
  icons: Record<string, string>;
}

export default function IconViewerClient({
  fileName,
  icons,
}: IconViewerClientProps) {
  const router = useRouter();
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [iconScale, setIconScale] = useState(100); // Scale percentage (25-200%)

  const base64ToBlob = (
    base64: string,
    mimeType: string = "image/png",
  ): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Create a pixelated version of an icon at a specific scale
  const createPixelatedIcon = (
    iconData: string,
    scale: number = 200,
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        // Set canvas size to scaled dimensions
        const scaledWidth = img.width * (scale / 100);
        const scaledHeight = img.height * (scale / 100);
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        // Enable pixelated rendering
        ctx.imageSmoothingEnabled = false;

        // Draw the scaled image
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

        // Convert to blob
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, "image/png");
      };
      img.src = `data:image/png;base64,${iconData}`;
    });
  };

  const downloadSingleIcon = (iconName: string, iconData: string) => {
    const blob = base64ToBlob(iconData);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${iconName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPixelatedIcon = async (
    iconName: string,
    iconData: string,
    scale: number = 200,
  ) => {
    const blob = await createPixelatedIcon(iconData, scale);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${iconName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllIcons = async () => {
    const zip = new JSZip();
    const folderName = fileName.replace(".json", "");
    const folder = zip.folder(folderName);

    if (!folder) return;

    Object.entries(icons).forEach(([iconName, iconData]) => {
      const blob = base64ToBlob(iconData);
      folder.file(`${iconName}.png`, blob);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${folderName}_icons.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllIconsPixelated = async (scale: number = 200) => {
    const zip = new JSZip();
    const folderName = fileName.replace(".json", "") + `_pixelated_${scale}%`;
    const folder = zip.folder(folderName);

    if (!folder) return;

    // Process icons in parallel but limit concurrency to avoid overwhelming the browser
    const entries = Object.entries(icons);
    const chunkSize = 5; // Process 5 icons at a time

    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async ([iconName, iconData]) => {
          const blob = await createPixelatedIcon(iconData, scale);
          folder.file(`${iconName}.png`, blob);
        }),
      );
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${folderName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadSelectedIcons = async () => {
    if (selectedIcons.size === 0) return;

    const zip = new JSZip();
    const folderName = fileName.replace(".json", "") + "_selected";
    const folder = zip.folder(folderName);

    if (!folder) return;

    selectedIcons.forEach((iconName) => {
      const iconData = icons[iconName];
      if (iconData) {
        const blob = base64ToBlob(iconData);
        folder.file(`${iconName}.png`, blob);
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${folderName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleIconSelection = (iconName: string) => {
    const newSelected = new Set(selectedIcons);
    if (newSelected.has(iconName)) {
      newSelected.delete(iconName);
    } else {
      newSelected.add(iconName);
    }
    setSelectedIcons(newSelected);
  };

  const selectAllIcons = () => {
    setSelectedIcons(new Set(Object.keys(icons)));
  };

  const clearSelection = () => {
    setSelectedIcons(new Set());
  };

  const iconCount = Object.keys(icons).length;

  // Calculate responsive grid columns based on scale
  const getGridCols = () => {
    if (iconScale <= 50)
      return "grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 xl:grid-cols-20";
    if (iconScale <= 75)
      return "grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16";
    if (iconScale <= 100)
      return "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12";
    if (iconScale <= 150)
      return "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8";
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Icons
        </Button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{fileName}</h1>
            <p className="text-muted-foreground">{iconCount} icons available</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={
                selectedIcons.size === iconCount
                  ? clearSelection
                  : selectAllIcons
              }
            >
              {selectedIcons.size === iconCount
                ? "Clear Selection"
                : "Select All"}
            </Button>

            {selectedIcons.size > 0 && (
              <Button onClick={downloadSelectedIcons}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download Selected ({selectedIcons.size})
              </Button>
            )}

            <Button onClick={downloadAllIcons}>
              <Download className="h-4 w-4 mr-2" />
              Download All (Original)
            </Button>

            <Button
              onClick={() => downloadAllIconsPixelated(200)}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All (Pixelated 2x)
            </Button>

            <Button
              onClick={() => downloadAllIconsPixelated(400)}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All (Pixelated 4x)
            </Button>
          </div>
        </div>

        {/* Scale Control */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <Label
            htmlFor="icon-scale"
            className="text-sm font-medium whitespace-nowrap"
          >
            Icon Size:
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIconScale(Math.max(25, iconScale - 25))}
            disabled={iconScale <= 25}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="flex-1 max-w-xs">
            <Slider
              id="icon-scale"
              min={25}
              max={200}
              step={25}
              value={[iconScale]}
              onValueChange={(value) => setIconScale(value[0])}
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIconScale(Math.min(200, iconScale + 25))}
            disabled={iconScale >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[3rem]">
            {iconScale}%
          </span>
        </div>
      </div>

      <div className={`grid gap-4 ${getGridCols()}`}>
        {Object.entries(icons).map(([iconName, iconData]) => {
          const isSelected = selectedIcons.has(iconName);
          const iconSize = Math.max(32, (64 * iconScale) / 100); // Min 32px, scales with percentage

          return (
            <Card
              key={iconName}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
              }`}
              onClick={() => toggleIconSelection(iconName)}
            >
              <CardHeader className="p-3">
                <div
                  className="aspect-square flex items-center justify-center rounded-md mb-2"
                  style={{
                    width: `${iconSize}px`,
                    height: `${iconSize}px`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${iconData}`}
                    alt={iconName}
                    className="object-contain"
                    style={{
                      width: `${iconSize}px`,
                      height: `${iconSize}px`,
                      imageRendering: iconScale > 100 ? "pixelated" : "auto",
                    }}
                  />
                </div>
                <CardTitle
                  className="text-xs text-center truncate"
                  title={iconName}
                >
                  {iconName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0 space-y-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSingleIcon(iconName, iconData);
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Original PNG
                </Button>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPixelatedIcon(iconName, iconData, 200);
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    2x
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPixelatedIcon(iconName, iconData, 400);
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    4x
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {iconCount === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No icons found</h3>
          <p className="text-muted-foreground">
            This file doesn&apos;t contain any icons.
          </p>
        </div>
      )}
    </div>
  );
}
