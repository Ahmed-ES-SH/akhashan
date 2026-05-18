"use client";

import { useEffect } from "react";

///////////////////////////////////////////////////////////////////////
///////////// Error Boundary for Home Page ////////////////////////////
///////////////////////////////////////////////////////////////////////

interface HomeErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function HomeError({ error, reset }: HomeErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("[HomePage] Error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-sand">
      <div className="text-center px-6">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-charcoal mb-2">
          Something went wrong
        </h2>
        <p className="text-muted mb-6 max-w-md mx-auto">
          We couldn&apos;t load the page content. Please try refreshing or
          contact us if the problem persists.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-green text-white text-sm font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:bg-green-dark active:scale-[0.98]"
          >
            Try Again
          </button>
          <a
            href="mailto:info@ak-shr.com"
            className="border border-border text-charcoal text-sm font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:bg-bg active:scale-[0.98]"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
