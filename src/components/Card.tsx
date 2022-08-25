import Image from "next/future/image";
import { twMerge } from "tailwind-merge";

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
      className={twMerge(
        "runescape-panel h-[353px] p-2 shadow-lg relative",
        className
      )}
      {...restProps}
    >
      {iconPath && (
        <div className="absolute w-7 h-7 mx-auto inset-x-0 -top-[14px] drop-shadow-solid">
          <Image src={iconPath} fill />
        </div>
      )}

      {children}
    </div>
  );
};
