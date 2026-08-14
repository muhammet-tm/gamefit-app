import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// Renders Coach G's Markdown answers with the GameFit design system:
// real bold/headings/lists, scrollable tables, and native charts for
// ```chart fenced blocks ({"type":"bar"|"pie","title":...,"data":[{label,value}]}).

const CHART_COLORS = ['#F4B044', '#7FBBD4', '#F59E0B', '#E5614A', '#3B82F6', '#5FBF7C'];

const tooltipStyle = {
  backgroundColor: 'var(--gf-bg-surface)',
  border: '1px solid var(--gf-border)',
  borderRadius: 12,
  fontSize: 12,
  color: 'var(--gf-text-primary)',
};

function MiniChart({ raw }) {
  let spec = null;
  try {
    spec = JSON.parse(raw);
  } catch {
    spec = null;
  }
  const data = Array.isArray(spec?.data)
    ? spec.data
        .map(d => ({ label: String(d?.label ?? ''), value: Number(d?.value) }))
        .filter(d => d.label && Number.isFinite(d.value))
        .slice(0, 8)
    : [];

  // Malformed chart specs fall back to plain preformatted text, never lost
  if (!spec || data.length === 0) {
    return (
      <pre className="text-xs whitespace-pre-wrap rounded-xl p-3 my-2"
        style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)', color: 'var(--gf-text-secondary)' }}>
        {raw}
      </pre>
    );
  }

  return (
    <div className="rounded-xl p-3 my-2" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
      {spec.title && (
        <p className="font-body text-[11px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--gf-text-secondary)' }}>
          {spec.title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={180}>
        {spec.type === 'pie' ? (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={35} outerRadius={60} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'inherit' }} />
          </PieChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--gf-text-secondary)' }}
              axisLine={{ stroke: 'var(--gf-border)' }} tickLine={false} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--gf-text-secondary)' }}
              axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function CodeBlock({ className, children }) {
  const text = String(children ?? '').replace(/\n$/, '');
  if (/language-chart/.test(className || '')) return <MiniChart raw={text} />;
  if (className) {
    return (
      <pre className="text-xs whitespace-pre-wrap rounded-xl p-3 my-2 overflow-x-auto"
        style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)', color: 'var(--gf-text-primary)' }}>
        {text}
      </pre>
    );
  }
  return (
    <code className="px-1.5 py-0.5 rounded text-[0.85em]"
      style={{ backgroundColor: 'var(--gf-bg-surface)', color: 'var(--gf-gold-text)' }}>
      {text}
    </code>
  );
}

const components = {
  pre: ({ children }) => <>{children}</>, // block styling handled in CodeBlock
  code: CodeBlock,
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: 'var(--gf-text-primary)' }}>{children}</strong>
  ),
  h1: ({ children }) => (
    <h3 className="font-heading font-black text-base mt-3 mb-1.5" style={{ color: 'var(--gf-text-primary)' }}>{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="font-heading font-black text-base mt-3 mb-1.5" style={{ color: 'var(--gf-text-primary)' }}>{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="font-heading font-black text-sm mt-2.5 mb-1" style={{ color: 'var(--gf-text-primary)' }}>{children}</h4>
  ),
  ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--gf-gold-text)' }}>
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="pl-3 my-2" style={{ borderLeft: '3px solid var(--gf-green)', color: 'var(--gf-text-secondary)' }}>
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3" style={{ borderColor: 'var(--gf-border)' }} />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2 rounded-xl" style={{ border: '1px solid var(--gf-border)' }}>
      <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-left font-body font-semibold uppercase tracking-wide px-3 py-2 text-[10px] whitespace-nowrap"
      style={{ color: 'var(--gf-text-secondary)', backgroundColor: 'var(--gf-bg-surface)', borderBottom: '1px solid var(--gf-border)' }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 align-top" style={{ borderBottom: '1px solid var(--gf-border)' }}>{children}</td>
  ),
};

export default function CoachMarkdown({ text }) {
  return (
    <div className="font-body text-sm leading-relaxed" style={{ color: 'var(--gf-text-primary)' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text || ''}
      </ReactMarkdown>
    </div>
  );
}
