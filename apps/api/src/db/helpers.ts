import { SQL, getTableColumns, sql } from "drizzle-orm";
import { BatchItem } from "drizzle-orm/batch";
import { RunnableQuery } from "drizzle-orm/runnable-query";
import { AnySQLiteColumn, SQLiteTable, text } from "drizzle-orm/sqlite-core";

export function lower(value: AnySQLiteColumn): SQL {
  return sql`lower(${value})`;
}

export const createdAt = text()
  .notNull()
  .default(sql`(CURRENT_TIMESTAMP)`);

export const updatedAt = text()
  .notNull()
  .default(sql`(CURRENT_TIMESTAMP)`)
  .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`);

export const buildConflictUpdateColumns = <
  T extends SQLiteTable,
  Q extends keyof T["_"]["columns"],
>(
  table: T,
  columns: Q[],
) => {
  const cls = getTableColumns(table);
  return columns.reduce(
    (acc, column) => {
      const colName = cls[column]?.name;
      if (!colName) {
        throw new Error(
          `Column ${column.toString()} not found in table ${table._.name}`,
        );
      }
      const snakeColName = colName.replace(/([A-Z])/g, "_$1").toLowerCase();
      acc[column] = sql.raw(`excluded.${snakeColName}`);
      return acc;
    },
    {} as Record<Q, SQL>,
  );
};

// Cloudflare D1 supports max 100 parameters in a query
const D1_MAX_PARAMETERS = 100;
export const autochunk = <
  T extends Record<string, unknown> | string | number,
  U,
>(
  {
    items,
    otherParametersCount = 0,
  }: {
    items: T[];
    otherParametersCount?: number;
  },
  cb: (chunk: T[]) => RunnableQuery<U, "sqlite">,
): [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]] => {
  const chunks: T[][] = [];

  let chunk: T[] = [];
  let chunkParameters = 0;

  if (otherParametersCount > D1_MAX_PARAMETERS) {
    throw new Error(
      `otherParametersCount cannot be more than ${D1_MAX_PARAMETERS}`,
    );
  }

  for (const item of items) {
    const itemParameters =
      typeof item === "object" ? Object.keys(item).length : 1;

    if (itemParameters > D1_MAX_PARAMETERS) {
      throw new Error(`Item has too many parameters (${itemParameters})`);
    }

    if (
      chunkParameters + itemParameters + otherParametersCount >
      D1_MAX_PARAMETERS
    ) {
      chunks.push(chunk);
      chunkParameters = itemParameters;
      chunk = [item];

      continue;
    }

    chunk.push(item);
    chunkParameters += itemParameters;
  }

  if (chunk.length) {
    chunks.push(chunk);
  }

  // @ts-expect-error
  const results: [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    results.push(cb(chunk));
  }

  return results;
};
