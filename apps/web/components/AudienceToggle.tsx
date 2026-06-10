import React from 'react';

interface AudienceToggleProps {
  mode: 'human' | 'developer';
  onChange: (mode: 'human' | 'developer') => void;
}

export default function AudienceToggle({ mode, onChange }: AudienceToggleProps) {
  return (
    <div className="relative flex w-fit select-none rounded-full border border-ink/10 bg-paper-warm p-1">
      <span
        className={`absolute bottom-1 top-1 rounded-full bg-ink transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mode === 'human' ? 'left-1 w-[110px]' : 'left-[114px] w-[120px]'
        }`}
      />
      <button
        onClick={() => onChange('human')}
        className={`relative z-10 w-[110px] rounded-full py-2 text-center text-xs font-semibold tracking-tight transition-colors ${
          mode === 'human' ? 'text-paper' : 'text-ink-soft hover:text-ink'
        }`}
      >
        Plain English
      </button>
      <button
        onClick={() => onChange('developer')}
        className={`relative z-10 w-[120px] rounded-full py-2 text-center text-xs font-semibold tracking-tight transition-colors ${
          mode === 'developer' ? 'text-paper' : 'text-ink-soft hover:text-ink'
        }`}
      >
        Developer
      </button>
    </div>
  );
}
