"use client";

import { Pencil2Icon } from "@radix-ui/react-icons";
import { useSetAtom } from "jotai";

import { Button } from "~/components/ui/button";
import { isQuickFeedbackDialogOpenAtom } from "~/components/quick-feedback-dialog";

export function QuickFeedbackButton() {
  const setIsOpen = useSetAtom(isQuickFeedbackDialogOpenAtom);

  return (
    <Button
      className="mt-4"
      size="lg"
      variant="outline"
      onClick={() => setIsOpen((open) => !open)}
    >
      <Pencil2Icon className="mr-2 h-5 w-5" />
      Quick Feedback
    </Button>
  );
}
