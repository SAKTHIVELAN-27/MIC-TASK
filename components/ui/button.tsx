import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20',
        destructive: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30',
        outline: 'border border-white/10 bg-transparent hover:bg-white/5 text-white',
        secondary: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
        ghost: 'hover:bg-white/5 text-gray-400 hover:text-white',
        link: 'text-cyan-400 underline-offset-4 hover:underline',
        glow: 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
