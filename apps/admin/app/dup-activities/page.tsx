import { AccountActivitiesClient } from "@/components/account-activities-client";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { ActivityEvent, ActivityEventType } from "@runeprofile/runescape";

import {
  findAccountsWithDuplicateActivities,
  getAccountActivitiesForTypes,
  getAccountBasic,
} from "./actions";

// Using client component for optimistic updates.

export default async function DupActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    i?: string;
    types?: ActivityEvent["type"] | ActivityEvent["type"][];
    ids?: string;
    auto?: string;
  }>;
}) {
  const params = await searchParams;
  // Normalize selected types
  let selectedTypes: ActivityEvent["type"][] = [];
  if (params.types) {
    selectedTypes = (
      Array.isArray(params.types)
        ? params.types.flatMap((v) => v.split(","))
        : params.types.split(",")
    ) as ActivityEvent["type"][];
    selectedTypes = selectedTypes.filter(Boolean);
  }

  const allTypes = Object.values(ActivityEventType);
  const autoEnabled = params.auto === "1";

  if (!selectedTypes.length) {
    // Render selection form
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Duplicate Activities Tool
        </h1>
        <Card className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Select the activity types to scan for duplicate (type + data)
            entries. Typically you would choose level_up and xp_milestone.
          </p>
          <form method="get" action="/dup-activities" className="space-y-4">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {allTypes.map((t) => {
                const id = `type-${t}`;
                return (
                  <label
                    key={t}
                    htmlFor={id}
                    className="flex items-center gap-2 rounded-md border p-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Checkbox id={id} name="types" value={t} />
                    <span className="font-mono truncate" title={t}>
                      {t}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Start
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/dup-activities?types=level_up&types=xp_milestone">
                  Quick: Skill Types
                </a>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // If ids list provided, reuse it to avoid re-running heavy query.
  const list = params.ids
    ? params.ids.split(",").filter(Boolean)
    : await findAccountsWithDuplicateActivities(selectedTypes);
  const index = Number(params.i ?? 0);
  const accountId = list[index];
  const account = accountId ? await getAccountBasic(accountId) : null;
  // Always include 'maxed' for odd-case detection while keeping user-selected filters for duplicates logic.
  const fetchTypes = accountId
    ? Array.from(new Set([...selectedTypes, "maxed" as ActivityEvent["type"]]))
    : selectedTypes;
  const activitiesForAccount = accountId
    ? await getAccountActivitiesForTypes(accountId, fetchTypes)
    : [];
  const typesQuery = selectedTypes
    .map((t) => `types=${encodeURIComponent(t)}`)
    .join("&");
  const idsParam = `ids=${encodeURIComponent(list.join(","))}`;
  const autoQuery = autoEnabled ? "&auto=1" : "";
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Duplicate Skill Activities
      </h1>
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2 items-center text-xs">
          <span className="font-medium">Types:</span>
          {selectedTypes.map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded bg-muted font-mono">
              {t}
            </span>
          ))}
          <Button asChild variant="outline" size="sm">
            <a href="/dup-activities">Change</a>
          </Button>
        </div>
        <div className="text-sm flex items-center gap-2 flex-wrap">
          <span className="font-medium">Accounts:</span>
          {list.map((id, i) => (
            <a
              key={id}
              href={`?i=${i}&${typesQuery}&${idsParam}${autoQuery}`}
              className={`px-1.5 py-0.5 rounded border text-xs font-mono ${i === index ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
            >
              {i + 1}
            </a>
          ))}
          {!list.length && <span className="text-muted-foreground">None</span>}
        </div>
        {accountId ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">Account:</span>
              {account ? (
                <a
                  href={`https://runeprofile.com/${encodeURIComponent(account.username)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2"
                >
                  {account.username}
                </a>
              ) : (
                <span className="text-muted-foreground">(not found)</span>
              )}
              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded break-all">
                {accountId}
              </span>
              <CopyButton value={accountId} label="account id" />
            </div>
            <div className="pt-2">
              <h2 className="text-sm font-medium mb-2">
                Activities (Selected Types)
              </h2>
              <AccountActivitiesClient
                initial={activitiesForAccount}
                nextHref={
                  index < list.length - 1
                    ? `?i=${index + 1}&${typesQuery}&${idsParam}${autoQuery}`
                    : null
                }
                autoStart={autoEnabled}
              />
            </div>
            <div className="flex gap-2">
              {index > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`?i=${index - 1}&${typesQuery}&${idsParam}${autoQuery}`}
                  >
                    Prev
                  </a>
                </Button>
              )}
              {index < list.length - 1 && (
                <Button size="sm" asChild>
                  <a
                    href={`?i=${index + 1}&${typesQuery}&${idsParam}${autoQuery}`}
                  >
                    Next
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select an account to inspect duplicates.
          </p>
        )}
      </Card>
    </div>
  );
}
