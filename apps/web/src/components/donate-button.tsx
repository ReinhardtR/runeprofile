import { KofiIcon } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { KOFI_LINK } from "~/lib/constants";

export function DonateButton() {
  return (
    <Button className="mt-4 w-52" size="lg" variant="secondary" asChild>
      <a
        href={KOFI_LINK}
        target="_blank"
        rel="noreferrer"
        className="no-underline"
      >
        <KofiIcon className="size-5 mr-2" />
        Donate on Ko-fi
      </a>
    </Button>
  );
}
