"use client";

import { Component, ErrorInfo, ReactNode } from "react";

///////////////////////////////////////////////////////////////////////
///////////// Global Error Boundary — catches render errors ///////////
///////////////////////////////////////////////////////////////////////

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center bg-sand">
          <div className="text-center px-6">
            <h2 className="text-xl font-bold text-charcoal mb-2">
              Something went wrong
            </h2>
            <p className="text-muted text-sm mb-4">
              Please refresh the page or try again later.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-green text-white text-sm font-bold py-2.5 px-5 rounded-xl transition-all duration-300 hover:bg-green-dark"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
