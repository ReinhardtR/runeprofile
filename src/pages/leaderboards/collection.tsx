import { MainLayout } from "@/components/MainLayout";
import type { NextPage } from "next";
import { trpc } from "@/utils/trpc";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/outline";
import clsx from "clsx";
import Image from "next/future/image";
import { AccountType } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";
import Spinner from "@/components/Misc/Spinner";

const CollectionLogLeaderboard: NextPage = () => {
  const router = useRouter();
  const [page, setPage] = useState<number>();

  const { status, data, error, isPreviousData } =
    trpc.leaderboards.collection.useQuery(
      {
        page: page ?? 1,
      },
      { keepPreviousData: true, staleTime: Infinity, enabled: !!page }
    );

  useEffect(() => {
    const pageQuery = Number(router.query.page as string);
    setPage(isNaN(pageQuery) ? 1 : pageQuery);
  }, [router.query.page]);

  return (
    <MainLayout>
      <div className="flex justify-center p-4 min-h-screen py-16">
        <div className="p-8 py-6 container max-w-[800px] flex flex-col space-y-2">
          <div className="flex gap-20 text-light-gray/30 font-medium pt-2 px-4">
            <p>Rank</p>
            <p>Username</p>
            <p className="ml-auto">Items Obtained</p>
          </div>
          <div className="flex flex-col space-y-4">
            {status === "loading" ? (
              <div className="h-full mx-auto">
                <div className="w-32">
                  <Spinner />
                </div>
              </div>
            ) : status === "error" ? (
              <div className="h-full mx-auto">{error?.message}</div>
            ) : (
              data?.pageData.map((user, index) => {
                const rank = index + 1 + (page! - 1) * data.pageSize;

                return (
                  <Link
                    href={`/${user.account.username}`}
                    target="_blank"
                    rel="noreferrer"
                    key={user.account.username}
                  >
                    <div
                      className={clsx(
                        "flex gap-4 w-full bg-background-dark rounded-lg p-4 shadow hover:scale-[1.02] hover:cursor-pointer transition-all",
                        rank == 1 && "border-[2px] border-ranks-1st",
                        rank == 2 && "border-[2px] border-ranks-2nd",
                        rank == 3 && "border-[2px] border-ranks-3rd"
                      )}
                    >
                      <p
                        className={clsx(
                          "px-2 text-primary-light font-black w-[80px]",
                          rank == 1 && "text-ranks-1st",
                          rank == 2 && "text-ranks-2nd",
                          rank == 3 && "text-ranks-3rd"
                        )}
                      >
                        {rank}
                      </p>
                      <p className="flex space-x-2 justify-center items-center">
                        <div className="w-4 h-4">
                          {user.account.accountType != AccountType.NORMAL && (
                            <Image
                              src={`/assets/account-type/${user.account.accountType.toLowerCase()}.png`}
                              alt={user.account.accountType}
                              quality={100}
                              width={14}
                              height={12}
                              className="drop-shadow-solid"
                            />
                          )}
                        </div>
                        <span>{user.account.username}</span>
                      </p>
                      <p className="ml-auto">
                        {user.uniqueItemsObtained}{" "}
                        <span className="text-accent font-medium">/</span>{" "}
                        {user.uniqueItemsTotal}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          <div className="flex justify-between pt-2">
            <div className="text-light-gray/30 pl-2">
              Showing page {page} of {data?.totalPages}
            </div>
            <div className="flex space-x-2">
              <Link
                href={{
                  pathname: router.pathname,
                  query: {
                    page: page! - 1,
                  },
                }}
                passHref
                shallow
                replace
              >
                <button
                  disabled={page === 1}
                  className="p-2 bg-background-dark disabled:opacity-50 enabled:hover:bg-background-light rounded-md text-accent enabled:hover:cursor-pointer"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
              </Link>
              <Link
                href={{
                  pathname: router.pathname,
                  query: {
                    page: page! + 1,
                  },
                }}
                passHref
                shallow
                replace
              >
                <button
                  disabled={isPreviousData || !data?.hasNextPage}
                  className="p-2 bg-background-dark disabled:opacity-50 enabled:hover:bg-background-light rounded-md text-accent enabled:hover:cursor-pointer"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const LeaderboardCard = () => {
  const rank = 1;
  const username = "PGN";
  const obtained = 403;
  const total = 1403;

  return (
    <div className="flex space-x-2 bg-background-light p-4 rounded-md shadow">
      <p>{rank}</p>
      <p>{username}</p>
      <p>
        {obtained} / {total}
      </p>
    </div>
  );
};

export default CollectionLogLeaderboard;
