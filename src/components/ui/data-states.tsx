/**
 * Phase 5: Reusable data state components — loading, empty, error.
 * Use these across ALL data-driven views for consistent UX.
 */
import { AlertTriangle, RefreshCw, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Loading Skeleton ── */
interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-3 w-[40%]" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/* ── Empty State ── */
interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  title = "No data yet",
  description = "There's nothing here yet.",
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-3 text-muted-foreground">
          {icon ?? <Inbox className="h-10 w-10" />}
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">{description}</p>
        {action && (
          <Button size="sm" variant="outline" className="mt-4" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Error State ── */
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <h3 className="text-sm font-semibold">Error</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[300px]">{message}</p>
        {onRetry && (
          <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={onRetry}>
            <RefreshCw className="h-3 w-3" /> Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
