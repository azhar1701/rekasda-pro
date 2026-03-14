import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
 ({ className, type, ...props }, ref) => {
 return (
 <input
 type={type}
 className={cn(
 "flex h-11 w-full rounded-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-base transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pupr-blue disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
 className
 )}
 ref={ref}
 {...props}
 />
 )
 }
)
Input.displayName = "Input"

export { Input }
