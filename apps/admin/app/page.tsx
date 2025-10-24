import { Card } from "@/components/ui/card";
import { ChevronRight, ImageIcon, Users } from "lucide-react";
import Link from "next/link";

type Tool = {
  name: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const tools: Tool[] = [
  {
    name: "Accounts",
    href: "/accounts",
    description: "Search accounts by username or id.",
    icon: Users,
  },
  {
    name: "Icons",
    href: "/icons",
    description:
      "View and download icons from JSON files in the assets folder.",
    icon: ImageIcon,
  },
];

export default function Index() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Internal utilities available in this admin interface.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group focus:outline-none"
          >
            <Card className="h-full p-4 flex flex-col justify-between gap-3 transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2">
              <div className="flex items-start gap-4">
                <div className="rounded-md border bg-background size-10 flex items-center justify-center shrink-0">
                  <tool.icon className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0 space-y-1 pr-6">
                  <h2 className="font-medium text-sm tracking-tight group-hover:text-primary transition-colors">
                    {tool.name}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>
                <ChevronRight
                  className="size-4 text-muted-foreground group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
