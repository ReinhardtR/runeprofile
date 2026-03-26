import { Button } from "~/shared/components/ui/button";
import { Skeleton } from "~/shared/components/ui/skeleton";

export function ActivitiesListSkeleton() {
  return (
    <div className="relative flex flex-col">
      <p className="text-primary font-semibold">Activities</p>
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="pt-3 overflow-hidden flex flex-row">
          <div className="bg-card border rounded-md min-h-16 lg:h-16 px-4 py-2 lg:py-0 flex flex-row items-center gap-x-2 flex-1">
            <Skeleton className="size-9 rounded-sm shrink-0" />
            <div className="flex flex-col lg:flex-row lg:items-center flex-1 gap-x-1 gap-y-1">
              <Skeleton className="h-5 w-48 lg:w-64" />
              <Skeleton className="h-3 w-20 lg:ml-auto" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between mt-6">
        <Skeleton className="h-3 w-12" />
        <div className="flex justify-end gap-x-2">
          <Button variant="outline" disabled>
            Previous
          </Button>
          <Button variant="outline" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
