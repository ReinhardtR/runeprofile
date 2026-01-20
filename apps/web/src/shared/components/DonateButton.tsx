import { KOFI_LINK } from "~/core/constants";
import { KofiIcon } from "~/shared/components/icons";
import { Button } from "~/shared/components/ui/button";

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
