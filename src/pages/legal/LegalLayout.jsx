import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function LegalLayout({ title, updated, children }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3"
        style={{ backgroundColor: 'var(--gf-bg-surface)', borderBottom: '1px solid var(--gf-border)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
          <ArrowLeft size={16} color="var(--gf-text-secondary)" />
        </button>
        <div>
          <h1 className="font-heading font-black text-xl" style={{ color: 'var(--gf-text-primary)' }}>{title}</h1>
          <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>Last updated: {updated}</p>
        </div>
      </div>

      <div className="px-5 pt-4 max-w-2xl mx-auto">
        <div className="mb-4 px-4 py-3 rounded-xl font-body text-xs"
          style={{ backgroundColor: 'rgba(255,184,0,0.08)', color: 'var(--gf-amber)', border: '1px solid rgba(255,184,0,0.3)' }}>
          DRAFT — pending legal review. Contact: support@gamefit.online
        </div>
        <div className="legal-content font-body text-sm leading-relaxed space-y-4"
          style={{ color: 'var(--gf-text-primary)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function H({ children }) {
  return <h2 className="font-heading font-black text-lg pt-2" style={{ color: 'var(--gf-text-primary)' }}>{children}</h2>;
}

export function P({ children }) {
  return <p style={{ color: 'var(--gf-text-secondary)' }}>{children}</p>;
}

export function LI({ children }) {
  return <li className="ml-4 list-disc" style={{ color: 'var(--gf-text-secondary)' }}>{children}</li>;
}
