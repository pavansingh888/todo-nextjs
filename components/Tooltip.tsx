// /Users/pavan/Desktop/todo-nextjs/components/Tooltip.tsx
"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ReactNode } from "react";

export default function Tooltip({
  children,
  content,
  side = "top",
}: {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align="center"
            className="z-50 rounded-md px-2 py-1 text-xs bg-slate-900 text-white shadow-md"
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-slate-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
