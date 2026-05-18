"use client";

///////////////////////////////////////////////////////////////////////
/////////////// Login Error Boundary — friendly error + retry /////////
///////////////////////////////////////////////////////////////////////

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Message */}
        <h2 className="text-xl font-bold text-charcoal">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-muted">
          We couldn&apos;t load the login page. Please try again.
        </p>

        {/* Error detail (dev only) */}
        {process.env.NODE_ENV === "development" && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-left text-xs text-red-600">
            {error.message}
          </p>
        )}

        {/* Retry button */}
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-green px-8 py-3 text-sm font-bold text-white shadow-lg shadow-green/25 transition-all duration-300 hover:bg-green-deep hover:shadow-xl hover:shadow-green/30"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
