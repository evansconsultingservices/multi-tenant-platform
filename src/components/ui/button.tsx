import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary/80 text-primary-foreground backdrop-blur-md border border-primary/20 shadow-lg hover:bg-primary/90 hover:shadow-xl hover:border-primary/30",
        destructive:
          "bg-destructive/80 text-destructive-foreground backdrop-blur-md border border-destructive/20 shadow-lg hover:bg-destructive/90 hover:shadow-xl hover:border-destructive/30",
        outline:
          "border border-input bg-background/50 backdrop-blur-sm shadow-sm hover:bg-accent/80 hover:text-accent-foreground hover:shadow-md",
        secondary:
          "bg-secondary/80 text-secondary-foreground backdrop-blur-sm border border-secondary/20 shadow-md hover:bg-secondary/90 hover:shadow-lg",
        ghost: "hover:bg-accent/80 hover:text-accent-foreground backdrop-blur-sm hover:shadow-sm",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
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
