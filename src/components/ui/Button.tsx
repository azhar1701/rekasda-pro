import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0",
 {
 variants: {
 variant: {
 primary:
 "bg-pupr-blue text-white hover:bg-pupr-blue active:bg-pupr-blue",
      secondary:
        "border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100",
      ghost:
        "bg-transparent text-slate-800 dark:text-slate-400 hover:bg-slate-100 active:bg-slate-200",
      danger:
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
      outline:
        "border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200",
      default:
        "bg-pupr-blue text-white hover:bg-pupr-blue active:bg-pupr-blue",
 },
 size: {
 sm: "h-9 px-3 text-xs",
 default: "h-11 px-6 py-2.5",
 lg: "h-14 px-8 text-base",
 icon: "h-11 w-11",
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
