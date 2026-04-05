import { forwardRef, isValidElement, type ButtonHTMLAttributes } from "react";
import { cn } from "../../../styling/cn";
import { cva, type VariantProps } from "../../../../../core/shared-utils/styling/cva";
import { Slot } from "../../../../../core/shared-utils/ui/slot";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-medium tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_16px_rgba(99,102,241,0.18)] hover:bg-primary/90 hover:shadow-[0_2px_6px_rgba(0,0,0,0.1),0_8px_24px_rgba(99,102,241,0.22)]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_12px_rgba(239,68,68,0.18)] hover:bg-destructive/90",
        outline:
          "border-border bg-transparent text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
        secondary:
          "border-border bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:border-primary/25 hover:bg-secondary/80",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        link: "border-transparent bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-[0.95rem]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && !isValidElement(children)) {
      return (
        <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </button>
      );
    }

    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
