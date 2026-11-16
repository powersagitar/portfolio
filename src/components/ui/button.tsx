import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva('', {
  variants: {
    variant: {
      // .btn in the design
      pill: 'box-border inline-flex min-h-11 items-center gap-2 rounded-full border border-[#48484a] px-5 text-[15px] font-medium text-[#f5f5f7] no-underline transition-[background,color,border-color] duration-200 ease-[ease] hover:border-[#f5f5f7] hover:bg-[#f5f5f7] hover:text-black',
      // .htb-pill (globals.css); `on` is the filled pill
      htb: 'htb-pill',
    },
    on: { true: 'on', false: '' },
  },
  defaultVariants: { variant: 'pill', on: false },
});

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({
  className,
  variant,
  on,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, on }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
