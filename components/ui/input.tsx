import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-slate-900 placeholder:text-slate-500 selection:bg-red-600 selection:text-white dark:bg-slate-800 border-slate-200 h-9 w-full min-w-0 rounded-md border bg-white px-3 py-1 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-slate-900',
        'focus-visible:border-red-300 focus-visible:ring-red-200 focus-visible:ring-[3px]',
        'aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
