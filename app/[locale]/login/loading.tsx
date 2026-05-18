///////////////////////////////////////////////////////////////////////
/////////////// Login Loading Skeleton ////////////////////////////////
///////////////////////////////////////////////////////////////////////

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left skeleton */}
      <div className="flex min-h-[40vh] w-full items-center justify-center bg-green-deep lg:min-h-screen lg:w-1/2">
        <div className="animate-pulse space-y-6 text-center lg:text-left">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-white/10 lg:mx-0" />
          <div className="mx-auto h-8 w-64 rounded-lg bg-white/10 lg:mx-0" />
          <div className="mx-auto h-5 w-40 rounded-lg bg-gold/20 lg:mx-0" />
          <div className="mx-auto h-0.5 w-16 bg-white/10 lg:mx-0" />
          <div className="mx-auto h-4 w-56 rounded-lg bg-white/5 lg:mx-0" />
        </div>
      </div>

      {/* Right skeleton */}
      <div className="flex w-full items-center justify-center bg-bg px-6 lg:w-1/2">
        <div className="w-full max-w-md animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-lg bg-gray-200" />
          <div className="h-4 w-72 rounded-lg bg-gray-100" />
          <div className="mt-8 space-y-4">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-12 w-full rounded-xl bg-gray-100" />
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-12 w-full rounded-xl bg-gray-100" />
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-12 w-full rounded-xl bg-green/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
