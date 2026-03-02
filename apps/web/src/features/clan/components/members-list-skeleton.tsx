import { Button } from "~/shared/components/ui/button";
import { Skeleton } from "~/shared/components/ui/skeleton";

export function MembersListSkeleton() {
  return (
    <div className="relative flex flex-col">
      <p className="text-primary font-semibold">Members</p>
      <div>
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="pt-3 overflow-hidden flex flex-row">
            <div className="bg-card border rounded-md px-4 h-16 flex flex-row items-center gap-x-2 flex-1">
              <Skeleton className="w-4 h-4 rounded-sm" />
              <Skeleton className="w-4 h-4 rounded-sm" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        ))}
      </div>
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
