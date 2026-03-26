import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";

import AccountTypeIcons from "~/core/assets/account-type-icons.json";
import ClanRankIcons from "~/core/assets/clan-rank-icons.json";
import { clanQueryOptions } from "~/features/clan/queries";
import { GameIcon } from "~/shared/components/icons";
import { Button } from "~/shared/components/ui/button";

import { MembersListSkeleton } from "./members-list-skeleton";

export function MembersList() {
  const params = useParams({ from: "/clan/$name" });
  const search = useSearch({ from: "/clan/$name" });
  const navigate = useNavigate();

  const page = search.membersPage ?? (search.membersCursor ? 2 : 1);

  const { data: clan, isFetching } = useQuery({
    ...clanQueryOptions({
      name: params.name,
      cursor: search.membersCursor,
      direction: search.membersDir,
    }),
    placeholderData: keepPreviousData,
  });

  if (!clan) {
    return <MembersListSkeleton />;
  }

  const showPagination = clan.hasMore || clan.hasPrev;

  return (
    <div className="relative flex flex-col">
      <p className="text-primary font-semibold">Members</p>
      <div>
        {clan.members.map((member) => {
          const accountTypeIcon =
            AccountTypeIcons[
              member.accountType.key as keyof typeof AccountTypeIcons
            ];

          return (
            <Link
              to="/$username"
              params={{ username: member.username }}
              key={member.username}
              className="pt-3 overflow-hidden flex flex-row relative group"
            >
              <div className="bg-card border rounded-md px-4 h-16 flex flex-row items-center gap-x-2 flex-1 group-hover:border-primary">
                <GameIcon
                  src={
                    ClanRankIcons[
                      String(member.clan.icon) as keyof typeof ClanRankIcons
                    ]
                  }
                  alt="Clan rank"
                  size={16}
                  className="drop-shadow-solid-sm"
                />
                {!!accountTypeIcon && (
                  <GameIcon
                    src={accountTypeIcon}
                    alt={member.accountType.name}
                    size={18}
                    className="drop-shadow-solid text-xs"
                  />
                )}
                <span className="font-bold text-xl font-runescape solid-text-shadow">
                  {member.username}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {showPagination && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-x-2">
            <p className="text-xs text-muted-foreground">Page {page}</p>
            {isFetching && (
              <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex justify-end gap-x-2">
            <Button
              variant="outline"
              disabled={!clan.hasPrev}
              onClick={() => {
                const nextPage = Math.max(1, page - 1);
                const isFirstPage = nextPage === 1;

                navigate({
                  to: "/clan/$name",
                  params: { name: params.name },
                  search: (prev) => ({
                    ...prev,
                    membersPage: nextPage,
                    membersCursor: isFirstPage
                      ? undefined
                      : (clan.prevCursor ?? undefined),
                    membersDir: isFirstPage ? undefined : ("prev" as const),
                  }),
                  resetScroll: false,
                });
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!clan.hasMore}
              onClick={() => {
                navigate({
                  to: "/clan/$name",
                  params: { name: params.name },
                  search: (prev) => ({
                    ...prev,
                    membersPage: page + 1,
                    membersCursor: clan.nextCursor ?? undefined,
                    membersDir: undefined,
                  }),
                  resetScroll: false,
                });
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
