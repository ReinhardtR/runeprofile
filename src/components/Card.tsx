import Image from "next/image";

import { cn } from "~/lib/utils/cn";

type CardProps = React.HTMLProps<HTMLDivElement> & {
  iconPath?: string;
  children?: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  iconPath,
  ...restProps
}) => {
  return (
    <div
      className={cn(
        "runescape-panel osrs-scrollbar relative h-[353px] p-2 shadow-md",
        className
      )}
      {...restProps}
    >
      {iconPath && (
        <div className="absolute inset-x-0 -top-[14px] drop-shadow-solid">
          <Image
            src={iconPath}
            width={28}
            height={28}
            alt=""
            className="mx-auto"
          />
        </div>
      )}

      {children}
    </div>
  );
};
