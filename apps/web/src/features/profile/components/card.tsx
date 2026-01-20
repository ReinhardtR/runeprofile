import { VariantProps, cva } from "class-variance-authority";

import { cn } from "~/shared/utils";

const cardVariants = cva(
  "runescape-panel runescape-scrollbar relative h-[353px] p-2 shadow-md",
  {
    variants: {
      size: {
        default: "w-[260px]",
        auto: "w-auto",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

type CardProps = React.HTMLProps<HTMLDivElement> & {
  icon?: string;
  children?: React.ReactNode;
} & VariantProps<typeof cardVariants>;

export const Card: React.FC<CardProps> = ({
  children,
  className,
  icon,
  size,
  ...props
}) => {
  return (
    <div className={cn(cardVariants({ size }), className)} {...props}>
      {icon && (
        <div className="absolute inset-x-0 -top-[14px] drop-shadow-solid">
          <img src={icon} width={28} height={28} alt="" className="mx-auto" />
        </div>
      )}

      {children}
    </div>
  );
};
