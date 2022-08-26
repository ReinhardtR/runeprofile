import { cloneElement, Fragment, useMemo, useState } from "react";
import {
  Placement,
  offset,
  flip,
  shift,
  autoUpdate,
  useFloating,
  useInteractions,
  useHover,
  useFocus,
  useRole,
  useDismiss,
} from "@floating-ui/react-dom-interactions";
import { mergeRefs } from "react-merge-refs";
import clsx from "clsx";

type TooltipProps = {
  content: JSX.Element;
  children: JSX.Element;
  placement: Placement;
  delay?: number;
  transparent?: boolean;
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement,
  delay = 30,
  transparent = true,
}) => {
  const [open, setOpen] = useState(false);

  const { x, y, reference, floating, strategy, context } = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    middleware: [offset(5), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { restMs: delay }),
    useFocus(context),
    useRole(context, { role: "tooltip" }),
    useDismiss(context),
  ]);

  // Preserve the consumer's ref
  const ref = useMemo(
    () => mergeRefs([reference, (children as any).ref]),
    [reference, children]
  );

  return (
    <Fragment>
      {cloneElement(children, getReferenceProps({ ref, ...children.props }))}

      {open && (
        <div
          {...getFloatingProps({
            ref: floating,
            style: {
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
            },
          })}
        >
          <div
            className={clsx(
              "relative p-2 border border-white/25 rounded-sm z-40",
              transparent ? "bg-black/70" : "bg-black"
            )}
          >
            {content}
          </div>
        </div>
      )}
    </Fragment>
  );
};
