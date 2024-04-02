import { eq } from "drizzle-orm";
import { db } from "~/db";
import { clogPages } from "~/db/schema";

export const getAvailableCollectionLogPages = async () => {
  const pages = await db.query.clogPages.findMany({
    columns: {
      tab: true,
      name: true,
      orderIdx: true,
    },
    where: eq(clogPages.metaApproved, true),
    orderBy: (page, { asc }) => [asc(page.orderIdx)],
    with: {
      pageKcs: {
        columns: {
          orderIdx: true,
          metaApproved: true,
        },
        orderBy: (kc, { asc }) => [asc(kc.orderIdx)],
        with: {
          kc: {
            columns: {
              label: true,
              metaApproved: true,
            },
          },
        },
      },
    },
  });

  return pages.map((page) => {
    const kcs = page.pageKcs
      .filter((pageKc) => pageKc.metaApproved && pageKc.kc.metaApproved)
      .map((pageKc) => {
        return {
          label: pageKc.kc.label,
          orderIdx: pageKc.orderIdx,
        };
      });

    return {
      tab: page.tab,
      name: page.name,
      orderIdx: page.orderIdx,
      kcs,
    };
  });
};
