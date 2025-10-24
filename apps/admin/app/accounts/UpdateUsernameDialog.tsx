"use client";

import { updateUsername } from "@/app/accounts/actions";
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
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

export function UpdateUsernameDialog({
  id,
  username,
}: {
  id: string;
  username: string;
}) {
  const [open, setOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setOpen(false);
    setNewUsername("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUsername.trim()) {
      setError("Username cannot be empty");
      return;
    }

    if (newUsername.trim() === username) {
      setError("New username must be different from current username");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await updateUsername(id, newUsername.trim());
      handleClose();
      // Refresh the page to show updated data
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update username",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Username</DialogTitle>
          <DialogDescription>
            Change the username for account{" "}
            <span className="font-mono font-bold">{username}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-username">Current Username</Label>
            <Input
              id="current-username"
              type="text"
              value={username}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-username">New Username</Label>
            <Input
              id="new-username"
              type="text"
              autoFocus
              placeholder="Enter new username"
              value={newUsername}
              onChange={(e) => {
                setNewUsername(e.target.value);
                setError("");
              }}
              aria-label="New username"
              disabled={isLoading}
            />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            size="sm"
            disabled={
              !newUsername.trim() ||
              newUsername.trim() === username ||
              isLoading
            }
            onClick={handleSubmit}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="animate-spin h-4 w-4" />
                Updating...
              </span>
            ) : (
              "Update Username"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
