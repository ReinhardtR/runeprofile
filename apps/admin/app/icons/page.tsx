import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import fs from "fs";
import { FileIcon, ImageIcon } from "lucide-react";
import Link from "next/link";
import path from "path";

interface IconFile {
  name: string;
  count: number;
  data: Record<string, string>;
}

async function getIconFiles(): Promise<IconFile[]> {
  const assetsPath = path.join(process.cwd(), "../web/src/assets");

  try {
    const files = fs.readdirSync(assetsPath);
    const iconFiles: IconFile[] = [];

    for (const fileName of files) {
      if (fileName.endsWith(".json")) {
        try {
          const filePath = path.join(assetsPath, fileName);
          const fileContent = fs.readFileSync(filePath, "utf-8");
          const data = JSON.parse(fileContent) as Record<string, string>;
          const count = Object.keys(data).length;

          iconFiles.push({
            name: fileName,
            count,
            data,
          });
        } catch (error) {
          console.warn(`Failed to load ${fileName}:`, error);
        }
      }
    }

    return iconFiles.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to read assets directory:", error);
    return [];
  }
}

export default async function IconsPage() {
  const iconFiles = await getIconFiles();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Icon Management</h1>
        <p className="text-muted-foreground">
          View and download icons from JSON files in the assets folder.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {iconFiles.map((file) => (
          <Link
            key={file.name}
            href={`/icons/${encodeURIComponent(file.name)}`}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileIcon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{file.name}</CardTitle>
                </div>
                <CardDescription>Icon collection file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">
                      {file.count} icons
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {((file.name.length * 50) / 1024).toFixed(1)}KB
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {iconFiles.length === 0 && (
        <div className="text-center py-12">
          <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No icon files found</h3>
          <p className="text-muted-foreground">
            No JSON icon files were found in the assets folder.
          </p>
        </div>
      )}
    </div>
  );
}
