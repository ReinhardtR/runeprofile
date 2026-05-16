import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/shared/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4.5 pt-3.5 pb-6 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-1 items-start [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current shadow-xl",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "border-destructive/50 text-destructive bg-destructive/10 [&>svg]:text-destructive",
        warning:
          "border-amber-500/50 text-amber-600 bg-amber-500/10 dark:text-amber-500 [&>svg]:text-amber-500",
        info: "border-border bg-card text-card-foreground [&>svg]:text-primary",
        success:
          "border-green-500/50 text-green-600 bg-green-500/10 dark:text-green-400 [&>svg]:text-green-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 min-h-4 font-bold tracking-tight text-base text-secondary-foreground",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
