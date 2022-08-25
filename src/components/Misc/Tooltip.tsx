import { cloneElement, useMemo, useState } from "react";
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

type TooltipProps = {
  content: JSX.Element;
  children: JSX.Element;
  placement: Placement;
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement,
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
    useHover(context, { restMs: 30 }),
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
    <>
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
          {content}
        </div>
      )}
    </>
  );
};
