import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

/**
 * The 404 page.
 *
 * Replaces a redirect to "/" that returned HTTP 200 for every unknown path.
 * Silently sending a mistyped URL to the home page hides the mistake from the
 * person who made it and tells a search engine that every wrong address is a
 * real page, which is how duplicate-content penalties start.
 *
 * The <h1> matters too: this used to be one of the routes with no heading at
 * all.
 */
export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--gf-bg-primary)' }}
    >
      <div className="w-full max-w-sm text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6"
          style={{ backgroundColor: 'var(--gf-bg-elevated)' }}
        >
          <Compass size={28} color="var(--gf-gold)" aria-hidden="true" />
        </div>

        <p
          className="font-mono text-sm tracking-widest mb-2"
          style={{ color: 'var(--gf-gold-text)' }}
        >
          404
        </p>

        <h1
          className="font-heading font-black text-2xl mb-3"
          style={{ color: 'var(--gf-text-primary)' }}
        >
          Off the map
        </h1>

        <p
          className="font-body text-sm leading-relaxed mb-8"
          style={{ color: 'var(--gf-text-secondary)' }}
        >
          There is nothing at{' '}
          <span className="font-mono" style={{ color: 'var(--gf-text-primary)' }}>
            {pathname}
          </span>
          . It may have moved, or the link that brought you here may be wrong.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/dashboard"
            className="w-full h-12 rounded-xl flex items-center justify-center font-heading font-black text-sm"
            style={{ backgroundColor: 'var(--gf-gold)', color: '#0B1A24' }}
          >
            Go to dashboard
          </Link>
          <Link
            to="/"
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-body text-sm"
            style={{
              backgroundColor: 'var(--gf-bg-surface)',
              color: 'var(--gf-text-secondary)',
              border: '1px solid var(--gf-border)',
            }}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to start
          </Link>
        </div>
      </div>
    </div>
  );
}
