"use client";

import { useState } from "react";
import { atom, useAtom } from "jotai";

import { sendFeedbackAction } from "~/lib/data/feedback";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";

export const isQuickFeedbackDialogOpenAtom = atom(false);

export function QuickFeedbackDialog() {
  const [isOpen, setIsOpen] = useAtom(isQuickFeedbackDialogOpenAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quick Feedback</DialogTitle>
          <DialogDescription>
            <p>
              Optionally provide your OSRS username if feedback is specific to
              your account.
            </p>
            <p>
              Optionally provide your Discord username if you would like a
              response.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={5}
            className="col-span-3"
          />
        </div>
        <DialogFooter>
          {error && <p className="text-destructive">{error}</p>}
          <Button
            size="lg"
            type="submit"
            disabled={message.length < 1 || isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);

              try {
                await sendFeedbackAction(message);
                setIsOpen(false);
              } catch (e) {
                setError("Failed to submit feedback. Please try again.");
              }

              setIsSubmitting(false);
            }}
          >
            {isSubmitting && <Spinner className="mr-2" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
