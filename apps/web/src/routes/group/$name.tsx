import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ErrorComponentProps,
  Link,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import React from "react";
import { z } from "zod";

import { COLLECTION_LOG_TABS } from "@runeprofile/runescape";

import { RuneProfileApiError, getBatchHiscores, getGroup } from "~/core/api";
import AccountTypeIcons from "~/core/assets/account-type-icons.json";
import { GroupActivitiesList, groupActivitiesQueryOptions } from "~/features/group";
import { GroupCharacters } from "~/features/profile/components/character";
import { CollectionLog } from "~/features/profile/components/collection-log";
import {
  aggregateGroupHiscores,
  getMostCommonClogPage,
  mergeGroupItems,
} from "~/features/profile/utils/group-aggregation";
import { Footer, Header } from "~/layouts";
import { GameIcon } from "~/shared/components/icons";
import { Button } from "~/shared/components/ui/button";
import { Separator } from "~/shared/components/ui/separator";

const groupSearchSchema = z.object({
  page: z.string().optional().catch(undefined),
  activityPage: z.coerce.number().gt(0).optional().catch(undefined),
});

function groupQueryOptions(params: { name: string }) {
  return queryOptions({
    queryKey: ["group", params.name],
    queryFn: () => getGroup({ name: params.name }),
  });
}

function groupHiscoresQueryOptions(params: { usernames: string[] }) {
  return queryOptions({
    queryKey: ["batch-hiscores", params.usernames],
    queryFn: () =>
      getBatchHiscores({
        usernames: params.usernames,
        leaderboard: "normal",
      }),
    enabled: params.usernames.length > 0,
  });
}

export const Route = createFileRoute("/group/$name")({
  component: RouteComponent,
  errorComponent: ErrorComponent,
  validateSearch: zodValidator(groupSearchSchema),  loaderDeps: ({ search: { activityPage } }) => ({
    activityPage,
  }),  loader: async ({ params, context, deps }) => {
    // Fetch group data first
    const group = await context.queryClient.fetchQuery(
      groupQueryOptions({ name: params.name }),
    );

    // Then fetch batch hiscores for all members and activities
    const usernames = group.members.map(
      (m: { username: string }) => m.username,
    );
    await Promise.all([
      context.queryClient.fetchQuery(
        groupHiscoresQueryOptions({ usernames }),
      ),
      context.queryClient.fetchQuery(
        groupActivitiesQueryOptions({
          name: params.name,
          page: deps.activityPage,
        }),
      ),
    ]);

    return group;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData.groupName} (Group) | RuneProfile`,
      },
    ],
  }),
});

function RouteComponent() {
  const params = Route.useParams();
  const search = Route.useSearch();

  const { data: group } = useSuspenseQuery(
    groupQueryOptions({ name: params.name }),
  );

  const usernames = group.members.map((m) => m.username);
  const { data: hiscoresData } = useSuspenseQuery(
    groupHiscoresQueryOptions({ usernames }),
  );

  // Determine most common account type
  const mostCommonAccountType = React.useMemo(() => {
    const typeCounts = new Map<string, number>();
    let maxCount = 0;
    let mostCommon = group.members[0]?.accountType;

    group.members.forEach((member) => {
      const key = member.accountType.key;
      const count = (typeCounts.get(key) || 0) + 1;
      typeCounts.set(key, count);

      if (count > maxCount) {
        maxCount = count;
        mostCommon = member.accountType;
      }
    });

    return mostCommon;
  }, [group.members]);

  const accountTypeIcon = mostCommonAccountType
    ? AccountTypeIcons[
        mostCommonAccountType.key as keyof typeof AccountTypeIcons
      ]
    : null;

  // Determine default collection log page
  const defaultPage =
    getMostCommonClogPage(group.members) ||
    COLLECTION_LOG_TABS[0].pages[0].name;

  const [currentPage, setCurrentPage] = React.useState(
    search.page || defaultPage,
  );

  // Merge items across all members
  const { items: mergedItems, distribution: itemDistribution } =
    mergeGroupItems(group.members);

  // Get the current page object for hiscores aggregation
  const currentPageObj = React.useMemo(() => {
    for (const tab of COLLECTION_LOG_TABS) {
      const page = tab.pages.find(
        (p) => p.name.toLowerCase() === currentPage.toLowerCase(),
      );
      if (page) return page;
    }
    return COLLECTION_LOG_TABS[0].pages[0];
  }, [currentPage]);

  // Aggregate hiscores for current page
  const { distribution: killCountDistribution } = React.useMemo(
    () => aggregateGroupHiscores(hiscoresData, currentPageObj),
    [hiscoresData, currentPageObj],
  );

  return (
    <>
      <Header />
      <div className="container max-w-7xl mx-auto py-8 px-4 relative min-h-screen flex flex-col">
        <div className="flex flex-col items-start gap-y-2">
          <div className="flex items-center gap-x-2">
            {!!accountTypeIcon && (
              <GameIcon
                src={accountTypeIcon}
                alt={mostCommonAccountType.name}
                size={32}
                className="drop-shadow-solid"
              />
            )}
            <h1 className="text-4xl font-bold text-secondary-foreground">
              {group.groupName}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Group · {group.members.length} member
            {group.members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Separator className="my-4" />

        <div className="flex flex-col gap-y-8">
          {/* 3D Character Models */}
          <div className="w-full h-[400px] bg-card rounded-lg border border-border overflow-hidden">
            <GroupCharacters members={group.members} />
          </div>

          {/* Collection Log and Activities */}
          <div className="flex flex-col lg:flex-row gap-y-8 gap-x-8">
            {/* Collection Log */}
            <div className="w-full lg:max-w-[680px]">
              <CollectionLog
                page={currentPage}
                onPageChange={setCurrentPage}
                data={mergedItems}
                mode="group"
                itemDistribution={itemDistribution}
                killCountDistribution={killCountDistribution}
              />
            </div>

            {/* Activities */}
            <div className="flex-1 lg:min-w-[400px]">
              <GroupActivitiesList />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function ErrorComponent({ error }: ErrorComponentProps) {
  const navigate = useNavigate();

  const isGroupNotFound =
    error instanceof RuneProfileApiError && error.code === "AccountNotFound";

  return (
    <div className="flex flex-col gap-y-4 items-center justify-center min-h-screen">
      <p className="text-2xl text-primary-foreground">
        {isGroupNotFound ? "Group not found" : error.message}
      </p>
      {isGroupNotFound && (
        <p className="text-muted-foreground text-center">
          This group does not exist or has no members.
          <br />
          Make sure group members have updated their profiles using the plugin.
          <br />
          If needed you can follow the guide{" "}
          <Link
            to="/info/guide"
            className="text-secondary-foreground underline"
          >
            here
          </Link>
          .
        </p>
      )}
      <Button onClick={() => navigate({ to: "/" })}>Home Teleport</Button>
      <Button variant="ghost" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  );
}
