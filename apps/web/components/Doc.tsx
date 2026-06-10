import React from 'react';
import SiteNav from './SiteNav';
import SiteFooter from './SiteFooter';
import DocsNav from './DocsNav';

export function DocLayout({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
     <div className="min-h-screen bg-paper flex flex-col">
       <SiteNav />
       <div className="flex flex-1 overflow-hidden">
         <DocsNav />
         <article className="flex-1 px-6 py-14 md:px-8 md:py-20 overflow-y-auto">
           <div className="mx-auto max-w-4xl">
             <header className="mb-12 max-w-3xl">
               <span className="font-mono text-[11px] uppercase tracking-widest text-coral-deep">{eyebrow}</span>
               <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink md:text-5xl">
                 {title}
               </h1>
               <p className="mt-5 text-lg leading-relaxed text-ink-soft">{intro}</p>
             </header>
             <div className="max-w-3xl space-y-12">{children}</div>
           </div>
         </article>
       </div>
       <SiteFooter />
     </div>
  );
}

export function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-ink-soft">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2 text-[15px] leading-relaxed text-ink-soft">{children}</ul>;
}

export function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
      <span>{children}</span>
    </li>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-ink/10 bg-paper-warm px-1.5 py-0.5 font-mono text-[13px] text-ink">
      {children}
    </code>
  );
}

export function Pre({ children, caption }: { children: React.ReactNode; caption?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10">
      {caption && (
        <div className="border-b border-ink/10 bg-paper-warm px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
          {caption}
        </div>
      )}
      <pre className="overflow-x-auto bg-ink p-4 font-mono text-[13px] leading-relaxed text-paper/90">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: 'note' | 'warning' | 'tip';
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    note: { bar: '#5E97A6', bg: 'rgba(94,151,166,0.08)', label: title ?? 'Note' },
    warning: { bar: '#D9655E', bg: 'rgba(217,101,94,0.08)', label: title ?? 'Important' },
    tip: { bar: '#3E9A87', bg: 'rgba(62,154,135,0.08)', label: title ?? 'Tip' },
  }[type];
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10" style={{ backgroundColor: styles.bg }}>
      <div className="flex">
        <div className="w-1.5 shrink-0" style={{ backgroundColor: styles.bar }} />
        <div className="p-4">
          <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: styles.bar }}>
            {styles.label}
          </span>
          <div className="mt-1.5 text-sm leading-relaxed text-ink">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Steps({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  return (
    <ol className="space-y-5">
      {items.map((child, i) => (
        <li key={i} className="flex gap-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-bold text-paper">
            {i + 1}
          </span>
          <div className="flex-1 space-y-2 pt-0.5">{child}</div>
        </li>
      ))}
    </ol>
  );
}
