"use client";

import { updateAccount } from "@/app/accounts/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Account {
  id: string;
  username: string;
  banned: boolean;
  clanName: string | null;
  clanRank: number | null;
  clanIcon: number | null;
  clanTitle: string | null;
}

export function EditAccountDialog({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [username, setUsername] = useState(account.username);
  const [banned, setBanned] = useState(account.banned);
  const [clanName, setClanName] = useState(account.clanName || "");
  const [clanRank, setClanRank] = useState(account.clanRank?.toString() || "");
  const [clanIcon, setClanIcon] = useState(account.clanIcon?.toString() || "");
  const [clanTitle, setClanTitle] = useState(account.clanTitle || "");

  const handleClose = () => {
    setOpen(false);
    setError("");
    // Reset form state
    setUsername(account.username);
    setBanned(account.banned);
    setClanName(account.clanName || "");
    setClanRank(account.clanRank?.toString() || "");
    setClanIcon(account.clanIcon?.toString() || "");
    setClanTitle(account.clanTitle || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const updates: Parameters<typeof updateAccount>[1] = {};

      // Only include changed fields
      if (username.trim() !== account.username) {
        updates.username = username.trim();
      }

      if (banned !== account.banned) {
        updates.banned = banned;
      }

      const newClanName = clanName.trim() || null;
      if (newClanName !== account.clanName) {
        updates.clanName = newClanName;
      }

      const newClanRank = clanRank.trim() ? parseInt(clanRank.trim()) : null;
      if (newClanRank !== account.clanRank) {
        updates.clanRank = newClanRank;
      }

      const newClanIcon = clanIcon.trim() ? parseInt(clanIcon.trim()) : null;
      if (newClanIcon !== account.clanIcon) {
        updates.clanIcon = newClanIcon;
      }

      const newClanTitle = clanTitle.trim() || null;
      if (newClanTitle !== account.clanTitle) {
        updates.clanTitle = newClanTitle;
      }

      // Only make the update if there are actual changes
      if (Object.keys(updates).length > 0) {
        await updateAccount(account.id, updates);
        handleClose();
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account");
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
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Edit account details for{" "}
            <span className="font-mono font-bold">{account.username}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Clan Information</h4>

            <div className="space-y-2">
              <Label htmlFor="clan-name">Clan Name</Label>
              <Input
                id="clan-name"
                type="text"
                placeholder="Enter clan name"
                value={clanName}
                onChange={(e) => setClanName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clan-rank">Clan Rank</Label>
                <Input
                  id="clan-rank"
                  type="number"
                  placeholder="0-127"
                  min="0"
                  max="127"
                  value={clanRank}
                  onChange={(e) => setClanRank(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clan-icon">Clan Icon</Label>
                <Input
                  id="clan-icon"
                  type="number"
                  placeholder="Icon ID"
                  min="0"
                  value={clanIcon}
                  onChange={(e) => setClanIcon(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clan-title">Clan Title</Label>
              <Input
                id="clan-title"
                type="text"
                placeholder="Enter clan title"
                value={clanTitle}
                onChange={(e) => setClanTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Account Status</h4>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="banned"
                checked={banned}
                onCheckedChange={(checked) => setBanned(!!checked)}
                disabled={isLoading}
              />
              <Label htmlFor="banned" className="text-sm">
                Account is banned
              </Label>
            </div>
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
            disabled={!username.trim() || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="animate-spin h-4 w-4" />
                Updating...
              </span>
            ) : (
              "Update Account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
