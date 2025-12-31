import { SQL, getTableColumns, sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";
import { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";

export function lower(value: AnyPgColumn): SQL {
  return sql`lower(${value})`;
}

export const createdAt = timestamp({ mode: "string" }).notNull().defaultNow();

export const updatedAt = timestamp({ mode: "string" })
  .notNull()
  .defaultNow()
  .$onUpdate(() => sql`now()`);

export const buildConflictUpdateColumns = <
  T extends PgTable,
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

export const withValues = async <T>(
  values: T,
  fn: (params: T) => Promise<any>,
) => {
  if (
    !values ||
    (Array.isArray(values) && values.length === 0) ||
    (typeof values === "object" && Object.keys(values).length === 0)
  ) {
    return;
  }
  await fn(values);
};
