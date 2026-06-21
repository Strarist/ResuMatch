import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    /**
     * Badge type determines preset colors and icon.
     * If provided, overrides `variant` styling.
     */
    type?: 'high' | 'medium' | 'low' | 'live' | 'demo' | 'archived';
  }

import { CheckCircle, AlertTriangle, Ban, CircleDot, Archive } from 'lucide-react';

function Badge({ className, variant, type, children, ...props }: BadgeProps) {
  const typeMap: Record<'high' | 'medium' | 'low' | 'live' | 'demo' | 'archived', { className: string; Icon: typeof CheckCircle }> = {
    high: { className: 'bg-primary text-primary-foreground', Icon: CheckCircle },
    medium: { className: 'bg-amber text-amber-foreground', Icon: AlertTriangle },
    low: { className: 'bg-gray text-gray-foreground', Icon: Ban },
    live: { className: 'bg-primary text-primary-foreground', Icon: CheckCircle },
    demo: { className: 'bg-gray text-gray-foreground', Icon: CircleDot },
    archived: { className: 'bg-orange text-orange-foreground', Icon: Archive },
  };

  const typeConfig = type ? typeMap[type] : null;
  const finalClass = cn(
    typeConfig ? typeConfig.className : badgeVariants({ variant }),
    className
  );

  const Icon = typeConfig?.Icon;
  return (
    <div className={cn('inline-flex items-center gap-1', finalClass)} {...props}>
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </div>
  );
}


export { Badge, badgeVariants }
