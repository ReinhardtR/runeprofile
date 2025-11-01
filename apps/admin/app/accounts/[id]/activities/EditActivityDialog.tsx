"use client";

import { updateActivity } from "@/app/accounts/[id]/activities/actions";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Edit } from "lucide-react";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

import { ActivityEvent } from "@runeprofile/runescape";
import { DynamicActivityForm } from "./DynamicActivityForm";

interface EditActivityDialogProps {
  accountId: string;
  activity: {
    id: string;
    type: ActivityEvent["type"];
    data: ActivityEvent["data"];
    createdAt: string;
  };
}

export function EditActivityDialog({
  accountId,
  activity,
}: EditActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [createdAt, setCreatedAt] = useState<Date>(
    new Date(activity.createdAt)
  );
  const [time, setTime] = useState(
    new Date(activity.createdAt).toTimeString().slice(0, 5)
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setCreatedAt(new Date(activity.createdAt));
    setTime(new Date(activity.createdAt).toTimeString().slice(0, 5));
  };

  const handleSubmit = async (activityData: ActivityEvent) => {
    setIsLoading(true);

    try {
      // Create UTC date by using the Date constructor with individual components
      const [hours, minutes] = time.split(":").map(Number);
      const combinedDateTime = new Date(Date.UTC(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        createdAt.getDate(),
        hours,
        minutes,
        0,
        0
      ));

      await updateActivity(
        accountId,
        activity.id,
        activityData,
        combinedDateTime.toISOString()
      );

      toast.success("Activity updated successfully");
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update activity"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const initialData = {
    type: activity.type,
    data: activity.data,
  } as ActivityEvent;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
          <DialogDescription>
            Update the activity details and timestamp.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {createdAt ? format(createdAt, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={createdAt}
                    onSelect={(date) => date && setCreatedAt(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <DynamicActivityForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitText="Update Activity"
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
