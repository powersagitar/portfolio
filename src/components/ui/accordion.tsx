'use client';

import * as React from 'react';

import { Accordion as AccordionPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

// Restyled to the design: `.idx` rows with a plus that rotates,
// and `.panel` grid-rows reveal. Styles live in globals.css.

function Accordion(
  props: React.ComponentProps<typeof AccordionPrimitive.Root>,
) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem(
  props: React.ComponentProps<typeof AccordionPrimitive.Item>,
) {
  return <AccordionPrimitive.Item data-slot="accordion-item" {...props} />;
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn('row', className)}
      {...props}
    >
      {children}
      <svg
        className="i"
        viewBox="0 0 28 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M14 4v20M4 14h20" />
      </svg>
    </AccordionPrimitive.Trigger>
  );
}

// The `.panel` grid sits outside Radix's Content node: Radix zeroes the
// Content's transition-duration while it measures, which would skip the
// grid-rows animation. Content itself carries `data-state`, and closed
// content is `visibility: hidden` (out of the tab order) once the close
// animation ends.
function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <div className="panel">
      <AccordionPrimitive.Content
        data-slot="accordion-content"
        className={className}
        {...props}
      >
        {children}
      </AccordionPrimitive.Content>
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
