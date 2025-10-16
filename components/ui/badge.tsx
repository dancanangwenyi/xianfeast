import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-red-600 text-white [a&]:hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
        secondary:
          'border-transparent bg-slate-100 text-slate-900 [a&]:hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
        destructive:
          'border-transparent bg-red-600 text-white [a&]:hover:bg-red-700 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 dark:bg-red-500 dark:hover:bg-red-600',
        outline:
          'text-slate-700 border-slate-200 bg-white [a&]:hover:bg-slate-50 [a&]:hover:text-slate-900 dark:text-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700',
        success:
          'border-transparent bg-green-600 text-white [a&]:hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
        warning:
          'border-transparent bg-orange-600 text-white [a&]:hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600',
        info:
          'border-transparent bg-blue-600 text-white [a&]:hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
