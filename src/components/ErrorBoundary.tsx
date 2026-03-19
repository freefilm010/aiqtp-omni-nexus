import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(222.2 84% 4.9%)", color: "hsl(210 40% 98%)" }}>
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
            <p className="mb-6 opacity-70 text-sm">
              The app encountered an unexpected error. Please try reloading.
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 rounded-lg font-medium"
              style={{ background: "hsl(217.2 91.2% 59.8%)", color: "#fff" }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
