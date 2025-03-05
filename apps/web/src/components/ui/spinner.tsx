import { VariantProps, cva } from "class-variance-authority";
import React from "react";

import { cn } from "~/lib/utils";

const spinnerVariants = cva("animate-spin", {
  variants: {
    variant: {
      default: "text-primary-foreground",
    },
    size: {
      default: "h-4 w-4",
      sm: "h-3 w-3",
      lg: "h-5 w-5",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface SpinnerProps
  extends React.HTMLAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = ({ className, variant, size, ...props }: SpinnerProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className={cn(spinnerVariants({ variant, size, className }))}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
};
Spinner.displayName = "Spinner";

export { Spinner };
