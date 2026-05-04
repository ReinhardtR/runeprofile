"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyButton } from "@/components/copy-button";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createApiKey, deleteApiKey, toggleApiKeyActive } from "./actions";

type ApiKey = {
  id: string;
  name: string;
  tier: string;
  active: boolean;
  createdAt: string;
};

export function ApiKeysClient({ keys }: { keys: ApiKey[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<{
    id: string;
    rawKey: string;
  } | null>(null);
  const [name, setName] = useState("");
  const [tier, setTier] = useState("standard");
  const [creating, setCreating] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const result = await createApiKey(name.trim(), tier);
      setNewKeyResult(result);
      setName("");
      setTier("standard");
      router.refresh();
      toast.success("API key created");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create API key",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string) {
    setLoadingId(id);
    try {
      const result = await toggleApiKeyActive(id);
      router.refresh();
      toast.success(result.active ? "Key activated" : "Key deactivated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle key",
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this API key permanently?")) return;
    setLoadingId(id);
    try {
      await deleteApiKey(id);
      router.refresh();
      toast.success("API key deleted");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete key",
      );
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {keys.length} key{keys.length !== 1 ? "s" : ""}
        </p>
        <Dialog
          open={createOpen || !!newKeyResult}
          onOpenChange={(open) => {
            if (!open) {
              setCreateOpen(false);
              setNewKeyResult(null);
            } else {
              setCreateOpen(true);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {newKeyResult ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Copy this key now — it will not be shown again.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3 font-mono text-sm break-all">
                  <span className="flex-1">{newKeyResult.rawKey}</span>
                  <CopyButton value={newKeyResult.rawKey} label="API key" />
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setNewKeyResult(null);
                      setCreateOpen(false);
                    }}
                  >
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key for external access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="key-name"
                      className="text-sm font-medium"
                    >
                      Name
                    </label>
                    <Input
                      id="key-name"
                      placeholder="e.g. My App"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="key-tier"
                      className="text-sm font-medium"
                    >
                      Tier
                    </label>
                    <Select value={tier} onValueChange={setTier}>
                      <SelectTrigger id="key-tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !name.trim()}
                  >
                    {creating ? "Creating…" : "Create"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {keys.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          No API keys yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell>
                  <Badge variant={key.tier === "partner" ? "default" : "secondary"}>
                    {key.tier}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={key.active ? "default" : "outline"}>
                    {key.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(key.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingId === key.id}
                      onClick={() => handleToggle(key.id)}
                    >
                      {key.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={loadingId === key.id}
                      onClick={() => handleDelete(key.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
