import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";

import AccountTypeIcons from "~/core/assets/account-type-icons.json";
import ClanRankIcons from "~/core/assets/clan-rank-icons.json";
import { clanQueryOptions } from "~/features/clan/queries";
import { BasicPagination } from "~/shared/components/BasicPagination";
import { GameIcon } from "~/shared/components/icons";

export function MembersList() {
  const params = useParams({ from: "/clan/$name" });
  const search = useSearch({ from: "/clan/$name" });
  const navigate = useNavigate();

  const { data: clan } = useSuspenseQuery(
    clanQueryOptions({
      name: params.name,
      page: search.membersPage,
    }),
  );

  const pageCount = Math.ceil(clan.total / clan.pageSize);

  const showPagination = pageCount > 1 || search.membersPage !== undefined;

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
        <BasicPagination
          className="justify-end mt-6"
          totalItems={clan.total}
          pageSize={clan.pageSize}
          currentPage={clan.page}
          onPageChange={(page) => {
            navigate({
              to: "/clan/$name",
              params: { name: params.name },
              search: (prev) => ({ ...prev, membersPage: page }),
              resetScroll: false,
            });
          }}
        />
      )}
    </div>
  );
}
