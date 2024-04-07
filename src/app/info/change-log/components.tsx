import { isChangeLogNew } from "~/config/change-log";
import { getDateString } from "~/lib/utils/time";

export function Title(props: { title: string; date: string }) {
  const date = new Date(props.date);

  return (
    <>
      <h1 className="!mb-0 [&:not(:first-child)]:mt-52">{props.title}</h1>
      <p className="flex space-x-2 text-muted-foreground">
        {isChangeLogNew(date) && (
          <>
            <span className="text-secondary">NEW</span>
            <span className="text-primary-foreground">•</span>
          </>
        )}
        <span>{getDateString(date)}</span>
      </p>
    </>
  );
}
