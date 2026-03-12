import * as React from "react";

/**
 * Minimal internal Slot component for spike.land.
 * Merges props and refs from the Slot to its first child.
 * Used for the "asChild" pattern in UI components.
 */

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>((props, forwardedRef) => {
  const { children, ...slotProps } = props;

  if (React.isValidElement<Record<string, unknown>>(children)) {
    const childProps = children.props as Record<string, unknown>;
    const childRef = childProps["ref"] as React.Ref<HTMLElement> | undefined;
    const mergedRef = childRef ? mergeRefs(forwardedRef, childRef) : forwardedRef;
    return React.cloneElement(children, {
      ...slotProps,
      ...childProps,
      ref: mergedRef,
    });
  }

  return React.Children.count(children) > 1 ? React.Children.only(null) : null;
});

Slot.displayName = "Slot";

function mergeRefs<T>(...refs: Array<React.ForwardedRef<T> | React.Ref<T>>) {
  return (node: T) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object") {
        (ref as React.MutableRefObject<T>).current = node;
      }
    }
  };
}
