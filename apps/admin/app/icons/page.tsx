import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileIcon, ImageIcon } from "lucide-react";
import Link from "next/link";

import manifest from "@/lib/generated/game-assets-manifest.json";

export default async function IconsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Icon Management</h1>
        <p className="text-muted-foreground">
          View and download icons from JSON files in the assets folder.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {manifest.map((file) => (
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
                    {(file.bytes / 1024).toFixed(1)}KB
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {manifest.length === 0 && (
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
