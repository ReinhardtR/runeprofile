import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import React from "react";

import { COLLECTION_LOG_TABS } from "@runeprofile/runescape";

import { Footer, Header } from "~/layouts";
import { Badge } from "~/shared/components/ui/badge";
import { Input } from "~/shared/components/ui/input";

export const Route = createFileRoute("/info/alias")({
  component: RouteComponent,
});

function RouteComponent() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // If no search query, return all data
    if (!query) {
      return COLLECTION_LOG_TABS;
    }

    return COLLECTION_LOG_TABS.map((tab) => {
      // Filter pages based on search query
      const filteredPages = tab.pages.filter((page) => {
        // Check if page name matches
        if (page.name.toLowerCase().includes(query)) {
          return true;
        }

        // Check if any alias matches
        return page.aliases?.some((alias) =>
          alias.toLowerCase().includes(query),
        );
      });

      return {
        ...tab,
        pages: filteredPages,
      };
    }).filter((tab) => {
      // Only include tabs that have matching pages
      return tab.pages.length > 0;
    });
  }, [searchQuery]);

  const totalResults = React.useMemo(() => {
    return filteredData.reduce((sum, tab) => sum + tab.pages.length, 0);
  }, [filteredData]);

  // Count pages with aliases
  const pagesWithAliases = React.useMemo(() => {
    return filteredData.reduce((sum, tab) => {
      return (
        sum +
        tab.pages.filter((page) => page.aliases && page.aliases.length > 0)
          .length
      );
    }, 0);
  }, [filteredData]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <>
      <Header />
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-6 text-center text-4xl font-extrabold tracking-tight text-muted-foreground">
            Collection Log Aliases
          </h1>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-md p-6 mb-8">
          <div className="relative mb-6">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search by page name or alias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            Found {totalResults} {totalResults === 1 ? "page" : "pages"}
            {pagesWithAliases > 0 && ` (${pagesWithAliases} with aliases)`}
          </div>

          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found</p>
            </div>
          ) : (
            filteredData.map((tab) => (
              <div key={tab.name} className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{tab.name}</h2>
                <div className="space-y-3">
                  {tab.pages.map((page) => (
                    <div
                      key={page.name}
                      className={`border border-border rounded-lg overflow-hidden p-4 ${
                        page.aliases && page.aliases.length > 0
                          ? "bg-muted"
                          : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium">{page.name}</h3>
                          {(!page.aliases || page.aliases.length === 0) && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (no aliases)
                            </span>
                          )}
                        </div>

                        {page.aliases && page.aliases.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {page.aliases.map((alias) => (
                              <Badge
                                key={alias}
                                variant={
                                  searchQuery &&
                                  alias
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase())
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {alias}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
