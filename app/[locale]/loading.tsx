///////////////////////////////////////////////////////////////////////
///////////// Loading State for Home Page /////////////////////////////
///////////////////////////////////////////////////////////////////////

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-sand">
      <main className="animate-pulse">
        {/* Hero Skeleton */}
        <section className="h-[70vh] bg-charcoal/5 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-2xl px-6">
              <div className="h-6 w-32 bg-charcoal/10 rounded-full mx-auto" />
              <div className="h-12 w-full bg-charcoal/10 rounded-lg" />
              <div className="h-12 w-3/4 bg-charcoal/10 rounded-lg mx-auto" />
              <div className="h-4 w-full bg-charcoal/10 rounded mx-auto" />
              <div className="h-4 w-2/3 bg-charcoal/10 rounded mx-auto" />
              <div className="flex gap-4 justify-center pt-4">
                <div className="h-12 w-32 bg-green/20 rounded-xl" />
                <div className="h-12 w-32 bg-charcoal/10 rounded-xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Skeleton */}
        <section className="py-20 bg-surface">
          <div className="w-[min(1200px,100%-48px)] mx-auto">
            <div className="text-center mb-12">
              <div className="h-6 w-24 bg-charcoal/10 rounded-full mx-auto mb-4" />
              <div className="h-10 w-64 bg-charcoal/10 rounded-lg mx-auto mb-3" />
              <div className="h-4 w-96 bg-charcoal/10 rounded mx-auto" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center space-y-3">
                  <div className="h-10 w-10 bg-charcoal/10 rounded-xl mx-auto" />
                  <div className="h-8 w-16 bg-charcoal/10 rounded mx-auto" />
                  <div className="h-4 w-24 bg-charcoal/10 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Skeleton */}
        <section className="py-20 bg-sand">
          <div className="w-[min(1200px,100%-48px)] mx-auto">
            <div className="text-center mb-12">
              <div className="h-6 w-20 bg-charcoal/10 rounded-full mx-auto mb-4" />
              <div className="h-10 w-72 bg-charcoal/10 rounded-lg mx-auto mb-3" />
              <div className="h-4 w-80 bg-charcoal/10 rounded mx-auto" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-2xl p-6 space-y-4"
                >
                  <div className="h-10 w-10 bg-charcoal/10 rounded-xl" />
                  <div className="h-6 w-3/4 bg-charcoal/10 rounded" />
                  <div className="h-4 w-full bg-charcoal/10 rounded" />
                  <div className="h-4 w-2/3 bg-charcoal/10 rounded" />
                  <div className="h-10 w-28 bg-charcoal/10 rounded-xl mt-4" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Countries Skeleton */}
        <section className="py-20 bg-surface">
          <div className="w-[min(1200px,100%-48px)] mx-auto">
            <div className="text-center mb-12">
              <div className="h-6 w-28 bg-charcoal/10 rounded-full mx-auto mb-4" />
              <div className="h-10 w-64 bg-charcoal/10 rounded-lg mx-auto mb-3" />
              <div className="h-4 w-96 bg-charcoal/10 rounded mx-auto" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-bg border border-border rounded-xl p-4 text-center space-y-3"
                >
                  <div className="h-8 w-8 bg-charcoal/10 rounded-full mx-auto" />
                  <div className="h-5 w-20 bg-charcoal/10 rounded mx-auto" />
                  <div className="h-4 w-24 bg-charcoal/10 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Skeleton */}
        <section className="py-20 bg-sand">
          <div className="w-[min(1200px,100%-48px)] mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="h-6 w-24 bg-charcoal/10 rounded-full" />
                <div className="h-10 w-64 bg-charcoal/10 rounded-lg" />
                <div className="h-4 w-80 bg-charcoal/10 rounded" />
                <div className="space-y-3 pt-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-charcoal/10 rounded-xl" />
                      <div className="h-4 w-32 bg-charcoal/10 rounded" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                <div className="h-10 w-full bg-charcoal/10 rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 w-full bg-charcoal/10 rounded-xl" />
                  <div className="h-10 w-full bg-charcoal/10 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 w-full bg-charcoal/10 rounded-xl" />
                  <div className="h-10 w-full bg-charcoal/10 rounded-xl" />
                </div>
                <div className="h-20 w-full bg-charcoal/10 rounded-xl" />
                <div className="h-12 w-full bg-green/20 rounded-xl" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
