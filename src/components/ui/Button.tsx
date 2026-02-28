import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-pupr-blue text-white hover:bg-pupr-blue/90 active:bg-pupr-blue/80",
        secondary:
          "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100",
        ghost:
          "bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200",
        danger:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        outline:
          "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100",
        default:
          "bg-pupr-blue text-white hover:bg-pupr-blue/90 active:bg-pupr-blue/80",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2.5",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
