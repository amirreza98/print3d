import Link from 'next/link';
import { api } from '@/lib/api';

export default async function StorefrontPage() {
  const products = await api.listProducts();

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 h-14 border-b border-line">
        <span className="font-medium tracking-tight">
          Fabrica<span className="text-filament">.</span>
        </span>
        <span className="eyebrow">3D print · on demand</span>
      </header>

      {/* hero — the thesis: describe it, watch it build */}
      <section className="blueprint-grid border-b border-line">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <p className="eyebrow mb-4">AI-configured additive manufacturing</p>
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight leading-[1.05] max-w-2xl">
            Describe what you need.
            <br />
            Watch an agent{' '}
            <span className="text-filament">configure, validate, and price</span>{' '}
            it in real time.
          </h1>
          <p className="mt-5 text-ink-soft max-w-xl leading-relaxed">
            No CAD, no guesswork. Tell Fabrica what you want printed in plain
            words. A team of agents picks the model, checks it can actually be
            printed, and quotes it — every step visible as it happens.
          </p>
        </div>
      </section>

      {/* catalog */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-lg font-medium">Start from a template</h2>
          <span className="measure text-xs text-ink-muted">
            {products.length} products
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/configure/${p.id}`}
              className="card p-5 group hover:border-line-strong transition-colors"
            >
              <div className="aspect-[4/3] rounded bg-paper-sunk blueprint-grid mb-4 flex items-center justify-center">
                <span className="measure text-xs text-blueprint/50 group-hover:text-filament transition-colors">
                  3D preview
                </span>
              </div>
              <h3 className="font-medium">{p.name}</h3>
              <p className="text-sm text-ink-muted mt-1 leading-snug">
                {p.description}
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="measure text-xs text-ink-soft">
                  {p.availableMaterials.join(' · ')}
                </span>
                <span className="measure text-sm">from €{p.basePrice.toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
