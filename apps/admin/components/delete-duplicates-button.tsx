"use client";

import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

export function DeleteDuplicatesButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="destructive"
      size="sm"
      type="submit"
      disabled={pending}
      className={pending ? "cursor-wait opacity-80" : "cursor-pointer"}
    >
      {pending ? "Deleting…" : `Delete ${count} duplicates`}
    </Button>
  );
}
