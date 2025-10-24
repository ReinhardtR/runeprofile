"use client";

import { deleteAccount } from "@/app/accounts/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

export function DeleteDialog({
  id,
  username,
}: {
  id: string;
  username: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="destructive">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            To confirm deletion, type{" "}
            <span className="font-mono font-bold">{username}</span> below. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async () => {
            if (confirmInput === username) {
              await deleteAccount(id);
              setOpen(false);
              setConfirmInput("");
            }
          }}
        >
          <Input
            type="text"
            autoFocus
            placeholder={`Type '${username}' to confirm`}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            aria-label="Confirm username"
          />
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            size="sm"
            variant="destructive"
            disabled={confirmInput !== username || isLoading}
            form={undefined}
            onClick={async (e) => {
              e.preventDefault();
              if (confirmInput === username) {
                setIsLoading(true);
                try {
                  await deleteAccount(id);
                  setOpen(false);
                  setConfirmInput("");
                } finally {
                  setIsLoading(false);
                }
              }
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="animate-spin h-4 w-4" />
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
