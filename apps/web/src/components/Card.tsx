import { twMerge } from "tailwind-merge";

type CardProps = React.HTMLProps<HTMLDivElement> & {
  children?: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  ...restProps
}) => {
  return (
    <div
      className={twMerge("runescape-panel h-[353px] p-2 shadow-lg", className)}
      {...restProps}
    >
      {children}
    </div>
  );
};
