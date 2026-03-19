import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  /** Widget name shown in error state */
  name?: string;
  /** Optional compact mode for smaller widgets */
  compact?: boolean;
  /** Optional fallback UI */
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Per-widget error boundary.
 * 
 * Isolates crashes to individual dashboard widgets so a single component
 * failure doesn't take down the entire page.
 * 
 * Lessons from:
 * - Coinbase: Full dashboard crashes from single data feed failures
 * - Robinhood: Cascading UI failures during March 2020 outages  
 * - CME: Entire trading interface blank from one service dependency
 */
class WidgetErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[Widget:${this.props.name || 'unknown'}] crashed:`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      if (this.props.compact) {
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
            <span className="truncate">{this.props.name || "Widget"} unavailable</span>
            <Button variant="ghost" size="sm" onClick={this.handleRetry} className="ml-auto h-6 px-2 text-xs">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-destructive/30 bg-destructive/5 min-h-[120px]">
          <AlertTriangle className="h-8 w-8 text-destructive/70" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {this.props.name || "Widget"} encountered an error
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This section is temporarily unavailable. Other features continue to work normally.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleRetry} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WidgetErrorBoundary;
