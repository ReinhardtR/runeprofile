import { Pencil2Icon } from "@radix-ui/react-icons";

import { Button } from "~/components/ui/button";

export function QuickFeedbackButton() {
  return (
    <Button className="mt-4" size="lg" variant="outline" asChild>
      <a
        href="https://discord.com/users/476302464493158400"
        target="_blank"
        rel="noreferrer"
        className="no-underline"
      >
        <Pencil2Icon className="mr-2 h-5 w-5" />
        Quick Feedback
      </a>
    </Button>
  );
}
