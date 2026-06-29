import { Select } from "@base-ui/react/select";

import ArrowDown from "~/core/assets/scrollbar/arrow_down.png";
import { RuneScapeScrollArea } from "~/features/profile/components/scroll-area";
import { cn } from "~/shared/utils";

type OsrsSelectProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  className?: string;
};

export function OsrsSelect<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: OsrsSelectProps<T>) {
  return (
    <Select.Root
      value={value}
      onValueChange={(val) => {
        if (val !== null) onValueChange(val);
      }}
      items={options}
    >
      <Select.Trigger
        className={cn(
          "flex w-full items-center cursor-pointer",
          "runescape-select-trigger",
          "font-runescape text-osrs-orange text-[17px] leading-none [text-shadow:none]",
          "hover:brightness-125",
          "outline-none",
          className,
        )}
      >
        <Select.Value className="flex-1 text-center truncate self-center" />
        <Select.Icon className="runescape-select-chevron w-[22px] shrink-0">
          <img
            src={ArrowDown}
            alt=""
            className="w-full h-full"
            style={{ imageRendering: "pixelated" }}
          />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner
          alignItemWithTrigger={false}
          side="bottom"
          sideOffset={1}
          className="z-50"
          style={{ width: "var(--anchor-width)" }}
        >
          <Select.Popup className="runescape-select-trigger font-runescape text-[17px] !p-0 !border-t-0">
            <RuneScapeScrollArea
              className="max-h-[200px]"
              contentClassName="flex flex-col"
            >
              <Select.List>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      "flex items-center w-full px-2 py-[3px] cursor-pointer outline-none text-left",
                      "text-osrs-orange leading-tight",
                      "hover:bg-white/15 data-[highlighted]:bg-white/15",
                    )}
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </RuneScapeScrollArea>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
